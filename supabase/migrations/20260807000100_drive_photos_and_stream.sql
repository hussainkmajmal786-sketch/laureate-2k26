-- ─────────────────────────────────────────────────────────────
-- Photo files live in Google Drive; this schema is the index that
-- says which Drive file belongs to which graduate. The mapping is
-- what enforces "only their own photos" — Drive itself cannot.
-- ─────────────────────────────────────────────────────────────

alter table media
  add column if not exists drive_file_id   text,
  add column if not exists drive_view_url  text,
  add column if not exists drive_thumb_url text,
  add column if not exists drive_folder_id text,
  -- Capture time from EXIF, used to match a photo to whoever was on
  -- stage at that moment during bulk import.
  add column if not exists taken_at        timestamptz,
  add column if not exists original_name   text,
  add column if not exists imported_by     uuid references volunteers(id) on delete set null;

create index if not exists media_student_idx  on media (student_id);
create index if not exists media_taken_at_idx on media (taken_at);
create unique index if not exists media_drive_file_idx
  on media (drive_file_id) where drive_file_id is not null;

-- ── Live stream + Drive config on the event record ───────────
alter table event_settings
  add column if not exists stream_url        text,
  add column if not exists stream_live       boolean not null default false,
  add column if not exists drive_root_folder text,
  add column if not exists drive_connected   boolean not null default false;

-- ── Stage timeline: when each graduate was actually on stage ──
-- Bulk import matches an EXIF timestamp against these windows.
create table if not exists stage_appearances (
  id           uuid primary key default uuid_generate_v4(),
  student_id   uuid not null references students(id) on delete cascade,
  started_at   timestamptz not null default now(),
  ended_at     timestamptz,
  volunteer_id uuid references volunteers(id) on delete set null
);

create index if not exists stage_appearances_time_idx
  on stage_appearances (started_at, ended_at);

alter table stage_appearances enable row level security;

create policy "read_stage_appearances" on stage_appearances
  for select to authenticated using (true);
create policy "write_stage_appearances" on stage_appearances
  for all to authenticated
  using (has_role(array['admin','stage','booth']::volunteer_role[]))
  with check (has_role(array['admin','stage','booth']::volunteer_role[]));
