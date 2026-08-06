-- Aggregates for the dashboard and reports. security_invoker keeps
-- the caller's RLS in force rather than the view owner's.

create view event_stats
with (security_invoker = true) as
select
  count(*)::int                                            as total,
  count(*) filter (where attendance)::int                   as checked_in,
  count(*) filter (where stage = 'waiting')::int            as waiting,
  count(*) filter (where stage = 'on-stage')::int           as on_stage,
  count(*) filter (where stage_done)::int                   as stage_done,
  count(*) filter (where booth_done)::int                   as booth_done,
  count(*) filter (where lunch_done)::int                   as lunch_done,
  count(*) filter (where certificate_done)::int             as certificate_done,
  coalesce(sum(photo_count), 0)::int                        as photos
from students;

create view department_stats
with (security_invoker = true) as
select
  d.code, d.name, d.short, d.color, d.sort_order,
  count(s.id)::int                                       as total,
  count(s.id) filter (where s.attendance)::int            as checked_in,
  count(s.id) filter (where s.stage_done)::int            as stage,
  count(s.id) filter (where s.booth_done)::int            as booth,
  count(s.id) filter (where s.lunch_done)::int            as lunch,
  count(s.id) filter (where s.certificate_done)::int      as certificate
from departments d
left join students s on s.dept_code = d.code
group by d.code, d.name, d.short, d.color, d.sort_order
order by d.sort_order;

create view booth_status
with (security_invoker = true) as
select
  b.id, b.name, b.photographer, b.status, b.avg_minutes, b.served_today,
  b.current_token, b.current_student_id,
  cs.name    as current_name,
  cs.reg_no  as current_reg_no,
  cs.hue     as current_hue,
  count(q.id) filter (where not q.served)::int as waiting,
  (count(q.id) filter (where not q.served) * b.avg_minutes)::int as est_wait
from booths b
left join students cs on cs.id = b.current_student_id
left join booth_queue q on q.booth_id = b.id
group by b.id, b.name, b.photographer, b.status, b.avg_minutes,
         b.served_today, b.current_token, b.current_student_id,
         cs.name, cs.reg_no, cs.hue
order by b.id;

-- Hourly throughput, derived from the scan log rather than stored.
create view hourly_flow
with (security_invoker = true) as
select
  to_char(date_trunc('hour', created_at), 'HH24:00')        as hour,
  count(*) filter (where kind = 'check-in')::int             as checkin,
  count(*) filter (where kind = 'stage')::int                as stage,
  count(*) filter (where kind = 'booth-complete')::int       as booth,
  count(*) filter (where kind = 'lunch')::int                as lunch
from scans
group by date_trunc('hour', created_at)
order by date_trunc('hour', created_at);

create view recent_activity
with (security_invoker = true) as
select
  sc.id,
  sc.kind,
  sc.detail,
  sc.station,
  sc.created_at,
  s.name    as student_name,
  s.reg_no  as student_reg_no,
  s.hue     as student_hue,
  v.name    as volunteer_name,
  v.role    as volunteer_role
from scans sc
join students s on s.id = sc.student_id
left join volunteers v on v.id = sc.volunteer_id
order by sc.created_at desc
limit 50;
