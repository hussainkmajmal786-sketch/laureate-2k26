-- ─────────────────────────────────────────────────────────────
-- Row Level Security
-- Every table is readable by any signed-in volunteer; writes are
-- restricted to the roles that actually work that station.
-- ─────────────────────────────────────────────────────────────

alter table departments    enable row level security;
alter table students       enable row level security;
alter table volunteers     enable row level security;
alter table booths         enable row level security;
alter table booth_queue    enable row level security;
alter table media          enable row level security;
alter table scans          enable row level security;
alter table timeline_items enable row level security;
alter table announcements  enable row level security;
alter table event_settings enable row level security;

-- Helper: current user's role. SECURITY DEFINER so the policy can
-- read volunteers without recursing through its own RLS.
create or replace function auth_role()
returns volunteer_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.volunteers where id = auth.uid();
$$;

create or replace function has_role(roles volunteer_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.auth_role() = any(roles), false);
$$;

-- ── Read: any authenticated volunteer ────────────────────────
create policy "read_departments"    on departments    for select to authenticated using (true);
create policy "read_students"       on students       for select to authenticated using (true);
create policy "read_volunteers"     on volunteers     for select to authenticated using (true);
create policy "read_booths"         on booths         for select to authenticated using (true);
create policy "read_booth_queue"    on booth_queue    for select to authenticated using (true);
create policy "read_media"          on media          for select to authenticated using (true);
create policy "read_scans"          on scans          for select to authenticated using (true);
create policy "read_timeline"       on timeline_items for select to authenticated using (true);
create policy "read_announcements"  on announcements  for select to authenticated using (true);
create policy "read_settings"       on event_settings for select to authenticated using (true);

-- The TV board is a public display with no operator signed in.
create policy "public_read_booths"        on booths         for select to anon using (true);
create policy "public_read_booth_queue"   on booth_queue    for select to anon using (true);
create policy "public_read_announcements" on announcements  for select to anon using (true);
create policy "public_read_settings"      on event_settings for select to anon using (true);

-- ── Writes ───────────────────────────────────────────────────
-- Students: any operational role may advance a graduate's journey.
create policy "update_students" on students for update to authenticated
  using (has_role(array['admin','registration','stage','booth','counter']::volunteer_role[]))
  with check (has_role(array['admin','registration','stage','booth','counter']::volunteer_role[]));

create policy "admin_insert_students" on students for insert to authenticated
  with check (has_role(array['admin']::volunteer_role[]));

create policy "admin_delete_students" on students for delete to authenticated
  using (has_role(array['admin']::volunteer_role[]));

-- Booth queue: booth operators, stage coordinators and admins.
create policy "write_booth_queue" on booth_queue for insert to authenticated
  with check (has_role(array['admin','booth','stage']::volunteer_role[]));
create policy "update_booth_queue" on booth_queue for update to authenticated
  using (has_role(array['admin','booth','stage']::volunteer_role[]));
create policy "delete_booth_queue" on booth_queue for delete to authenticated
  using (has_role(array['admin','booth','stage']::volunteer_role[]));

create policy "update_booths" on booths for update to authenticated
  using (has_role(array['admin','booth']::volunteer_role[]));

-- Media: booth operators and the media team.
create policy "insert_media" on media for insert to authenticated
  with check (has_role(array['admin','booth','media','stage']::volunteer_role[]));
create policy "update_media" on media for update to authenticated
  using (has_role(array['admin','booth','media']::volunteer_role[]));

-- Scans: every station writes its own audit rows.
create policy "insert_scans" on scans for insert to authenticated with check (true);

-- Volunteers: you may edit your own row; admins may edit anyone.
create policy "insert_own_volunteer" on volunteers for insert to authenticated
  with check (id = auth.uid());
create policy "update_own_volunteer" on volunteers for update to authenticated
  using (id = auth.uid() or has_role(array['admin']::volunteer_role[]))
  with check (id = auth.uid() or has_role(array['admin']::volunteer_role[]));

-- Config: admins only.
create policy "admin_write_settings" on event_settings for update to authenticated
  using (has_role(array['admin']::volunteer_role[]));
create policy "admin_write_timeline" on timeline_items for all to authenticated
  using (has_role(array['admin']::volunteer_role[]))
  with check (has_role(array['admin']::volunteer_role[]));
create policy "admin_write_announcements" on announcements for all to authenticated
  using (has_role(array['admin']::volunteer_role[]))
  with check (has_role(array['admin']::volunteer_role[]));
create policy "admin_write_departments" on departments for all to authenticated
  using (has_role(array['admin']::volunteer_role[]))
  with check (has_role(array['admin']::volunteer_role[]));
