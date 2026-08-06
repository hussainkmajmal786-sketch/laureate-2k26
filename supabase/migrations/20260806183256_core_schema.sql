-- ─────────────────────────────────────────────────────────────
-- LAUREATE 2K26 — core schema
-- Graduation management for College of Engineering Kidangoor
-- ─────────────────────────────────────────────────────────────

create extension if not exists "uuid-ossp";

-- ── Enums ────────────────────────────────────────────────────
create type ceremony_stage as enum (
  'registered', 'checked-in', 'waiting', 'on-stage',
  'stage-done', 'booth', 'complete'
);

create type volunteer_role as enum (
  'admin', 'registration', 'stage', 'booth', 'counter', 'media', 'viewer'
);

create type media_category as enum ('Stage', 'Booth', 'Candid', 'Group');

create type scan_kind as enum (
  'check-in', 'stage', 'booth-assign', 'booth-complete', 'lunch', 'certificate'
);

-- ── Departments ──────────────────────────────────────────────
create table departments (
  code        text primary key,
  name        text not null,
  short       text not null,
  color       text not null,
  sort_order  int  not null default 0
);

-- ── Students ─────────────────────────────────────────────────
create table students (
  id            uuid primary key default uuid_generate_v4(),
  reg_no        text not null unique,
  name          text not null,
  dept_code     text not null references departments(code) on delete restrict,
  cgpa          numeric(4,2) not null check (cgpa >= 0 and cgpa <= 10),
  batch         text not null default '2022 - 2026',
  phone         text,
  photo_url     text,
  hue           int  not null default 0,

  stage         ceremony_stage not null default 'registered',
  qr_issued     boolean not null default true,

  attendance        boolean not null default false,
  checked_in_at     timestamptz,
  stage_done        boolean not null default false,
  stage_done_at     timestamptz,
  booth_done        boolean not null default false,
  booth_done_at     timestamptz,
  lunch_done        boolean not null default false,
  lunch_done_at     timestamptz,
  certificate_done  boolean not null default false,
  certificate_done_at timestamptz,

  photo_count   int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index students_dept_idx        on students (dept_code);
create index students_stage_idx       on students (stage);
create index students_attendance_idx  on students (attendance);
create index students_name_idx        on students using gin (to_tsvector('simple', name));
create index students_reg_no_idx      on students (reg_no text_pattern_ops);

-- ── Volunteers (linked to auth.users) ────────────────────────
create table volunteers (
  id            uuid primary key references auth.users(id) on delete cascade,
  name          text not null,
  email         text not null unique,
  role          volunteer_role not null default 'viewer',
  station       text,
  online        boolean not null default false,
  shift_ends    text,
  hue           int not null default 0,
  scans_today   int not null default 0,
  avg_seconds   int not null default 0,
  created_at    timestamptz not null default now()
);

-- ── Booths ───────────────────────────────────────────────────
create table booths (
  id            int primary key,
  name          text not null,
  photographer  text not null,
  status        text not null default 'active',
  avg_minutes   int  not null default 3,
  served_today  int  not null default 0,
  current_student_id uuid references students(id) on delete set null,
  current_token text
);

-- ── Booth queue ──────────────────────────────────────────────
create table booth_queue (
  id          uuid primary key default uuid_generate_v4(),
  booth_id    int  not null references booths(id) on delete cascade,
  student_id  uuid not null references students(id) on delete cascade,
  token       text not null,
  position    int  not null,
  served      boolean not null default false,
  created_at  timestamptz not null default now(),
  unique (booth_id, token)
);

create index booth_queue_booth_idx on booth_queue (booth_id, served, position);

-- ── Media ────────────────────────────────────────────────────
create table media (
  id            uuid primary key default uuid_generate_v4(),
  student_id    uuid references students(id) on delete set null,
  title         text not null,
  category      media_category not null,
  dept_code     text references departments(code) on delete set null,
  photographer  text not null,
  storage_path  text,
  ratio         numeric(4,2) not null default 1,
  hue           int not null default 0,
  likes         int not null default 0,
  captured_at   timestamptz not null default now()
);

create index media_category_idx on media (category);
create index media_dept_idx     on media (dept_code);

-- ── Scan log (audit trail for every station action) ──────────
create table scans (
  id            uuid primary key default uuid_generate_v4(),
  student_id    uuid not null references students(id) on delete cascade,
  volunteer_id  uuid references volunteers(id) on delete set null,
  kind          scan_kind not null,
  station       text,
  detail        text,
  created_at    timestamptz not null default now()
);

create index scans_created_idx on scans (created_at desc);
create index scans_student_idx on scans (student_id);
create index scans_kind_idx    on scans (kind);

-- ── Timeline / announcements / settings ──────────────────────
create table timeline_items (
  id         uuid primary key default uuid_generate_v4(),
  time_label text not null,
  title      text not null,
  detail     text not null,
  status     text not null default 'upcoming',
  sort_order int  not null default 0
);

create table announcements (
  id         uuid primary key default uuid_generate_v4(),
  body       text not null,
  active     boolean not null default true,
  sort_order int not null default 0
);

create table event_settings (
  id            int primary key default 1 check (id = 1),
  name          text not null,
  college       text not null,
  tagline       text not null,
  event_date    text not null,
  venue         text not null,
  status        text not null,
  auto_assign   boolean not null default true,
  duplicate_block boolean not null default true,
  tv_ticker     boolean not null default true,
  queue_warn_at int not null default 25,
  holding_capacity int not null default 300
);

-- ── updated_at trigger ───────────────────────────────────────
create or replace function touch_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger students_touch_updated_at
  before update on students
  for each row execute function touch_updated_at();
