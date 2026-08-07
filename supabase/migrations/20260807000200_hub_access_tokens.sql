-- ─────────────────────────────────────────────────────────────
-- Capability-based access to the graduate hub.
--
-- Each graduate gets an unguessable token embedded in their QR pass.
-- The hub is fetched through a function that requires it, so a
-- graduate sees only their own record and photos and no one can
-- enumerate the cohort anonymously.
-- ─────────────────────────────────────────────────────────────

alter table students
  add column if not exists hub_token uuid not null default gen_random_uuid();

create unique index if not exists students_hub_token_idx on students (hub_token);

create or replace function get_student_hub(p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.students;
  result jsonb;
begin
  select * into s from public.students where hub_token = p_token;
  if s.id is null then
    return null;   -- wrong token reveals nothing at all
  end if;

  select jsonb_build_object(
    'student', jsonb_build_object(
      'id', s.id, 'name', s.name, 'reg_no', s.reg_no,
      'dept_code', s.dept_code, 'cgpa', s.cgpa, 'batch', s.batch,
      'hue', s.hue, 'photo_url', s.photo_url,
      'attendance', s.attendance, 'stage_done', s.stage_done,
      'booth_done', s.booth_done, 'lunch_done', s.lunch_done,
      'certificate_done', s.certificate_done, 'photo_count', s.photo_count
    ),
    'photos', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', m.id, 'title', m.title, 'category', m.category,
        'hue', m.hue, 'captured_at', m.captured_at,
        'drive_view_url', m.drive_view_url,
        'drive_thumb_url', m.drive_thumb_url
      ) order by m.captured_at desc)
      from public.media m where m.student_id = s.id
    ), '[]'::jsonb),
    'queue', (
      select jsonb_build_object('booth_id', q.booth_id, 'token', q.token)
      from public.booth_queue q
      where q.student_id = s.id and not q.served
      limit 1
    ),
    'event', (
      select jsonb_build_object(
        'college', e.college, 'event_date', e.event_date,
        'venue', e.venue, 'stream_url', e.stream_url,
        'stream_live', e.stream_live
      ) from public.event_settings e where e.id = 1
    )
  ) into result;

  return result;
end;
$$;

revoke execute on function public.get_student_hub(uuid) from public;
grant execute on function public.get_student_hub(uuid) to anon, authenticated;
