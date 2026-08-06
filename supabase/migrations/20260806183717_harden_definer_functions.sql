-- These are internal helpers used by RLS policies and triggers.
-- They must never be callable over /rest/v1/rpc. Revoking EXECUTE
-- from the API roles keeps them usable inside policies (which run
-- as the definer) while removing them from the public surface.

revoke execute on function public.auth_role()                          from anon, authenticated, public;
revoke execute on function public.has_role(public.volunteer_role[])    from anon, authenticated, public;
revoke execute on function public.handle_new_user()                    from anon, authenticated, public;
revoke execute on function public.touch_updated_at()                   from anon, authenticated, public;

-- Station RPCs stay callable, but only by signed-in volunteers.
revoke execute on function public.check_in_student(uuid, text)  from anon, public;
revoke execute on function public.complete_stage(uuid, int)     from anon, public;
revoke execute on function public.assign_booth(uuid)            from anon, public;
revoke execute on function public.complete_booth(uuid, int)     from anon, public;
revoke execute on function public.redeem_lunch(uuid)            from anon, public;
revoke execute on function public.collect_certificate(uuid)     from anon, public;

grant execute on function public.check_in_student(uuid, text)  to authenticated;
grant execute on function public.complete_stage(uuid, int)     to authenticated;
grant execute on function public.assign_booth(uuid)            to authenticated;
grant execute on function public.complete_booth(uuid, int)     to authenticated;
grant execute on function public.redeem_lunch(uuid)            to authenticated;
grant execute on function public.collect_certificate(uuid)     to authenticated;
