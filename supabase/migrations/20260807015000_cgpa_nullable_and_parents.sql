-- ─────────────────────────────────────────────────────────────
-- Real-cohort schema changes.
--
-- The official compering list only publishes CGPA for award winners,
-- so the column cannot be required. Null means "not published" — the
-- pass and profile omit the line rather than printing a placeholder.
-- ─────────────────────────────────────────────────────────────

alter table students alter column cgpa drop not null;

-- Parent names come from the official list and are read out at the stage.
alter table students
  add column if not exists father_name text,
  add column if not exists mother_name text,
  add column if not exists honours boolean not null default false,
  add column if not exists minor   boolean not null default false,
  -- Seat number from the compering list, which is the stage call order.
  add column if not exists seat_no int,
  add column if not exists award   text;

-- has_role() is SECURITY DEFINER and called from inside RLS policies.
-- An earlier hardening pass revoked EXECUTE from `authenticated`, which
-- also blocked the policies that call it — every insert failed with
-- "permission denied for function has_role". Granting it back does not
-- widen access: the function only reports the caller's own role, and the
-- policies still gate the table operation itself.
grant execute on function public.has_role(public.volunteer_role[]) to authenticated;
grant execute on function public.auth_role() to authenticated;
