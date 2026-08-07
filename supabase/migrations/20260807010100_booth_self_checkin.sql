-- ─────────────────────────────────────────────────────────────
-- Self-service booth queue join for the kiosk tablet.
--
-- The kiosk runs signed out, so it cannot call assign_booth (which
-- requires an authenticated volunteer). This takes the graduate's own
-- hub token as the credential — the same token already in their QR.
--
-- Token numbers are derived from the highest token actually issued for
-- that booth, not from max(position): seeded rows number tokens as
-- position+1, so a position-derived number collided with one already
-- in use. The insert also retries on unique_violation so two
-- simultaneous scans cannot both claim the same number.
-- ─────────────────────────────────────────────────────────────

create or replace function self_join_booth_queue(p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  s          public.students;
  existing   public.booth_queue;
  target     record;
  next_pos   int;
  next_num   int;
  new_token  text;
  attempts   int := 0;
begin
  select * into s from public.students where hub_token = p_token;
  if s.id is null then
    return jsonb_build_object('ok', false, 'error', 'PASS_NOT_RECOGNISED');
  end if;

  if not s.stage_done then
    return jsonb_build_object('ok', false, 'error', 'STAGE_NOT_DONE', 'name', s.name);
  end if;

  if s.booth_done then
    return jsonb_build_object('ok', false, 'error', 'ALREADY_DONE', 'name', s.name);
  end if;

  select * into existing
    from public.booth_queue
   where student_id = s.id and not served
   limit 1;

  if existing.id is not null then
    return jsonb_build_object(
      'ok', true, 'already', true,
      'name', s.name, 'reg_no', s.reg_no, 'hue', s.hue,
      'booth_id', existing.booth_id, 'token', existing.token,
      'ahead', (select count(*) from public.booth_queue q
                 where q.booth_id = existing.booth_id
                   and not q.served and q.position < existing.position),
      'est_wait', (select count(*) * max(b.avg_minutes)
                     from public.booth_queue q, public.booths b
                    where q.booth_id = existing.booth_id and b.id = existing.booth_id
                      and not q.served and q.position < existing.position));
  end if;

  select b.id, b.avg_minutes,
         count(q.id) filter (where not q.served) as waiting
    into target
    from public.booths b
    left join public.booth_queue q on q.booth_id = b.id
   where b.status = 'active'
   group by b.id, b.avg_minutes
   order by count(q.id) filter (where not q.served) * b.avg_minutes asc, b.id asc
   limit 1;

  if target.id is null then
    return jsonb_build_object('ok', false, 'error', 'NO_ACTIVE_BOOTH');
  end if;

  loop
    attempts := attempts + 1;

    select coalesce(max(position), 0) + 1 into next_pos
      from public.booth_queue where booth_queue.booth_id = target.id;

    select coalesce(max(nullif(regexp_replace(token, '^B\d+-', ''), '')::int), 0) + attempts
      into next_num
      from public.booth_queue where booth_queue.booth_id = target.id;

    new_token := 'B' || target.id || '-' || lpad(next_num::text, 3, '0');

    begin
      insert into public.booth_queue (booth_id, student_id, token, position)
      values (target.id, s.id, new_token, next_pos);
      exit;
    exception when unique_violation then
      if attempts >= 25 then
        return jsonb_build_object('ok', false, 'error', 'NO_ACTIVE_BOOTH');
      end if;
    end;
  end loop;

  insert into public.scans (student_id, kind, station, detail)
  values (s.id, 'booth-assign', 'Self-service kiosk', new_token);

  return jsonb_build_object(
    'ok', true, 'already', false,
    'name', s.name, 'reg_no', s.reg_no, 'hue', s.hue,
    'booth_id', target.id, 'token', new_token,
    'ahead', target.waiting,
    'est_wait', (target.waiting + 1) * target.avg_minutes);
end;
$$;

revoke execute on function public.self_join_booth_queue(uuid) from public;
grant execute on function public.self_join_booth_queue(uuid) to anon, authenticated;
