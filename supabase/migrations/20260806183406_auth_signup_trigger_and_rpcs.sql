-- ─────────────────────────────────────────────────────────────
-- Auth wiring + station RPCs
-- ─────────────────────────────────────────────────────────────

-- Every new auth user gets a volunteer profile automatically.
-- The first account to sign up becomes admin so the event can be
-- configured without touching SQL.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  assigned public.volunteer_role;
begin
  if (select count(*) from public.volunteers) = 0 then
    assigned := 'admin';
  else
    assigned := coalesce(
      (new.raw_user_meta_data ->> 'role')::public.volunteer_role,
      'viewer'
    );
  end if;

  insert into public.volunteers (id, name, email, role, station, hue)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.email,
    assigned,
    new.raw_user_meta_data ->> 'station',
    (abs(hashtext(new.email)) % 360)
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ── Station actions ──────────────────────────────────────────
-- Each RPC advances a graduate and writes the audit row in one
-- transaction, so the log can never drift from the record.

create or replace function check_in_student(p_student_id uuid, p_station text default null)
returns public.students
language plpgsql
security invoker
set search_path = ''
as $$
declare result public.students;
begin
  update public.students
     set attendance = true,
         checked_in_at = coalesce(checked_in_at, now()),
         stage = case when stage = 'registered' then 'checked-in' else stage end
   where id = p_student_id
   returning * into result;

  if result.id is null then
    raise exception 'Student not found';
  end if;

  insert into public.scans (student_id, volunteer_id, kind, station)
  values (p_student_id, auth.uid(), 'check-in', p_station);

  return result;
end;
$$;

create or replace function complete_stage(p_student_id uuid, p_photos int default 1)
returns public.students
language plpgsql
security invoker
set search_path = ''
as $$
declare result public.students;
begin
  update public.students
     set stage_done = true,
         stage_done_at = coalesce(stage_done_at, now()),
         stage = case when stage in ('booth','complete') then stage else 'stage-done' end,
         photo_count = photo_count + greatest(p_photos, 0)
   where id = p_student_id
   returning * into result;

  if result.id is null then
    raise exception 'Student not found';
  end if;

  insert into public.scans (student_id, volunteer_id, kind, detail)
  values (p_student_id, auth.uid(), 'stage', p_photos || ' photo(s)');

  return result;
end;
$$;

-- Assigns to whichever booth clears the graduate soonest, which is
-- queue length x that booth's own average session time.
create or replace function assign_booth(p_student_id uuid)
returns table (booth_id int, token text, est_wait int)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  target      record;
  next_pos    int;
  new_token   text;
begin
  select b.id,
         b.avg_minutes,
         count(q.id) filter (where not q.served) as waiting
    into target
    from public.booths b
    left join public.booth_queue q on q.booth_id = b.id
   where b.status = 'active'
   group by b.id, b.avg_minutes
   order by count(q.id) filter (where not q.served) * b.avg_minutes asc, b.id asc
   limit 1;

  if target.id is null then
    raise exception 'No active booth available';
  end if;

  select coalesce(max(position), 0) + 1 into next_pos
    from public.booth_queue where booth_queue.booth_id = target.id;

  new_token := 'B' || target.id || '-' || lpad(next_pos::text, 3, '0');

  insert into public.booth_queue (booth_id, student_id, token, position)
  values (target.id, p_student_id, new_token, next_pos);

  insert into public.scans (student_id, volunteer_id, kind, detail)
  values (p_student_id, auth.uid(), 'booth-assign', new_token);

  booth_id := target.id;
  token    := new_token;
  est_wait := (target.waiting + 1) * target.avg_minutes;
  return next;
end;
$$;

create or replace function complete_booth(p_student_id uuid, p_photos int default 0)
returns public.students
language plpgsql
security invoker
set search_path = ''
as $$
declare result public.students;
begin
  update public.students
     set booth_done = true,
         booth_done_at = coalesce(booth_done_at, now()),
         stage = case when stage = 'complete' then stage else 'booth' end,
         photo_count = photo_count + greatest(p_photos, 0)
   where id = p_student_id
   returning * into result;

  if result.id is null then
    raise exception 'Student not found';
  end if;

  update public.booth_queue set served = true
   where student_id = p_student_id and not served;

  insert into public.scans (student_id, volunteer_id, kind, detail)
  values (p_student_id, auth.uid(), 'booth-complete', p_photos || ' frame(s)');

  return result;
end;
$$;

-- Lunch and certificates reject a second scan, so a duplicate can
-- never be redeemed even if two counters scan at once.
create or replace function redeem_lunch(p_student_id uuid)
returns public.students
language plpgsql
security invoker
set search_path = ''
as $$
declare result public.students;
begin
  update public.students
     set lunch_done = true, lunch_done_at = now()
   where id = p_student_id and not lunch_done
   returning * into result;

  if result.id is null then
    if exists (select 1 from public.students where id = p_student_id) then
      raise exception 'ALREADY_REDEEMED';
    end if;
    raise exception 'Student not found';
  end if;

  insert into public.scans (student_id, volunteer_id, kind)
  values (p_student_id, auth.uid(), 'lunch');

  return result;
end;
$$;

create or replace function collect_certificate(p_student_id uuid)
returns public.students
language plpgsql
security invoker
set search_path = ''
as $$
declare result public.students;
begin
  update public.students
     set certificate_done = true,
         certificate_done_at = now(),
         stage = 'complete'
   where id = p_student_id and not certificate_done
   returning * into result;

  if result.id is null then
    if exists (select 1 from public.students where id = p_student_id) then
      raise exception 'ALREADY_COLLECTED';
    end if;
    raise exception 'Student not found';
  end if;

  insert into public.scans (student_id, volunteer_id, kind)
  values (p_student_id, auth.uid(), 'certificate');

  return result;
end;
$$;
