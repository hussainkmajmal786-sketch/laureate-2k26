-- Booth queues drawn from graduates who cleared the stage but
-- have not yet been photographed.
do $$
declare
  b        record;
  s        record;
  pos      int;
  sizes    int[] := array[12, 9];
begin
  for b in select id, avg_minutes from public.booths order by id loop
    pos := 0;
    for s in
      select id from public.students
       where stage_done and not booth_done
       order by md5(id::text || b.id::text)
       limit sizes[b.id]
    loop
      pos := pos + 1;
      insert into public.booth_queue (booth_id, student_id, token, position)
      values (b.id, s.id, 'B' || b.id || '-' || lpad((pos + 1)::text, 3, '0'), pos);
    end loop;

    -- Whoever is currently in front of the camera.
    update public.booths
       set current_student_id = (
             select id from public.students
              where stage_done and not booth_done
              order by md5(id::text || 'now' || b.id::text)
              limit 1),
           current_token = 'B' || b.id || '-001'
     where id = b.id;
  end loop;
end $$;

-- Media archive sampled across categories and departments.
insert into media (student_id, title, category, dept_code, photographer, ratio, hue, likes, captured_at)
select
  s.id,
  case when c.cat = 'Group' then d.short || ' - Class of 2026' else s.name end,
  c.cat,
  s.dept_code,
  (array['Arun Photography','Frames by Nithin','CEK Media Cell','Studio Aperture','Lensfolk Kerala'])
    [1 + (abs(hashtext(s.id::text || c.cat::text)) % 5)],
  (array[0.72,1.0,1.28,1.5,0.85,1.15])[1 + (abs(hashtext(s.id::text)) % 6)],
  s.hue,
  (abs(hashtext(s.id::text || c.cat::text)) % 180) + 4,
  date_trunc('day', now()) + make_interval(
    hours => 9 + (abs(hashtext(s.id::text)) % 5),
    mins  => abs(hashtext(c.cat::text || s.id::text)) % 60)
from (
  select id, name, dept_code, hue from students
   where booth_done
   order by md5(id::text)
   limit 14
) s
cross join (values ('Stage'::media_category), ('Booth'), ('Candid')) as c(cat)
join departments d on d.code = s.dept_code;
