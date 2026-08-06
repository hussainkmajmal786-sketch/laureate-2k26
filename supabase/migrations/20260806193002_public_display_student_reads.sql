-- The TV board runs signed out and must show the name of whoever is being
-- served. Rather than exposing the whole cohort to anon, this limits the
-- public read to graduates who are actually in a booth queue or currently
-- at a booth — the same people whose names are already on the screen.
create policy "public_read_queued_students" on students
  for select to anon
  using (
    exists (select 1 from booth_queue q where q.student_id = students.id and not q.served)
    or exists (select 1 from booths b where b.current_student_id = students.id)
  );

-- Departments carry no personal data and are needed for colour coding.
create policy "public_read_departments" on departments for select to anon using (true);
