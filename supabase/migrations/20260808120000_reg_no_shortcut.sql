/*
 * Resolve a register number to a graduate's hub.
 *
 * The printed pass carries the register number rather than the random
 * hub token, so /KGR22CS019 has to reach the same page /hub/<token>
 * does. RLS deliberately hides the students table from anon, so this
 * runs as SECURITY DEFINER and returns exactly one column: the token.
 *
 * NOTE ON EXPOSURE. Register numbers are sequential (…CS001, …CS002),
 * so this makes every graduate's gallery reachable by counting up. That
 * is a deliberate product decision to keep the pass human-readable, not
 * an oversight. Nothing here should ever return name, parentage, CGPA
 * or any other field - the token alone, so this stays no worse than the
 * QR itself.
 */
create or replace function public.hub_token_for_reg_no(p_reg_no text)
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select hub_token
  from public.students
  where upper(trim(reg_no)) = upper(trim(p_reg_no))
  limit 1;
$$;

revoke all on function public.hub_token_for_reg_no(text) from public;
grant execute on function public.hub_token_for_reg_no(text) to anon, authenticated;

comment on function public.hub_token_for_reg_no(text) is
  'Maps a printed register number to its hub token so /<regno> can redirect to /hub/<token>. Returns only the token.';
