-- ─────────────────────────────────────────────────────────────
-- Volunteer invites.
--
-- Creating auth users directly needs the service_role key, which must
-- never reach the browser. Instead an admin pre-assigns a role against
-- an email address; when that person signs up normally, the signup
-- trigger picks up the invite and grants the role.
-- ─────────────────────────────────────────────────────────────

create table if not exists volunteer_invites (
  id          uuid primary key default uuid_generate_v4(),
  email       text not null unique,
  name        text,
  role        volunteer_role not null default 'viewer',
  station     text,
  created_by  uuid references volunteers(id) on delete set null,
  claimed_at  timestamptz,
  created_at  timestamptz not null default now()
);

alter table volunteer_invites enable row level security;

create policy "admin_read_invites" on volunteer_invites
  for select to authenticated using (has_role(array['admin']::volunteer_role[]));
create policy "admin_write_invites" on volunteer_invites
  for all to authenticated
  using (has_role(array['admin']::volunteer_role[]))
  with check (has_role(array['admin']::volunteer_role[]));

-- Signup trigger, now invite-aware. Order matters: the first account
-- becomes admin so the event can be set up; otherwise an invite decides
-- the role; otherwise viewer. The role is never read from the signup
-- form, so nobody can self-promote.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  assigned  public.volunteer_role;
  invite    public.volunteer_invites;
  v_name    text;
  v_station text;
begin
  select * into invite
    from public.volunteer_invites
   where lower(email) = lower(new.email) and claimed_at is null;

  if (select count(*) from public.volunteers) = 0 then
    assigned := 'admin';
  elsif invite.id is not null then
    assigned := invite.role;
  else
    assigned := 'viewer';
  end if;

  v_name := coalesce(
    nullif(new.raw_user_meta_data ->> 'name', ''),
    invite.name,
    split_part(new.email, '@', 1));
  v_station := coalesce(new.raw_user_meta_data ->> 'station', invite.station);

  insert into public.volunteers (id, name, email, role, station, hue)
  values (new.id, v_name, new.email, assigned, v_station,
          (abs(hashtext(new.email)) % 360))
  on conflict (id) do nothing;

  if invite.id is not null then
    update public.volunteer_invites set claimed_at = now() where id = invite.id;
  end if;

  return new;
end;
$$;

revoke execute on function public.handle_new_user() from anon, authenticated, public;
