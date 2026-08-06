# Database — Laureate 2K26

The full schema, security policies and seed data live in `migrations/`, applied
in filename order. Everything the app needs is here: recreating a project from
these files gives you a working database with all 2,047 graduates.

## Migrations

| File | What it does |
| --- | --- |
| `…_core_schema.sql` | Enums, 10 tables, indexes, `updated_at` trigger |
| `…_rls_policies.sql` | Row-level security — reads for signed-in volunteers, writes gated by role |
| `…_auth_signup_trigger_and_rpcs.sql` | Signup → volunteer profile trigger, plus the six station RPCs |
| `…_stats_views.sql` | `event_stats`, `department_stats`, `booth_status`, `hourly_flow`, `recent_activity` |
| `…_seed_reference_data.sql` | Departments, booths, event settings, timeline, announcements |
| `…_seed_students.sql` | The 2,047-graduate cohort (seeded PRNG — reproducible) |
| `…_seed_queues_and_media.sql` | Booth queues and a sample media archive |
| `…_harden_definer_functions.sql` | Revokes API access to internal helper functions |
| `…_enable_realtime.sql` | Realtime publication for the live screens |
| `…_public_display_student_reads.sql` | Scoped anon read so the TV board can show names |

## Applying them

With the Supabase CLI, linked to your project:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

Or paste each file, in filename order, into the SQL Editor in the dashboard.

## Design notes

**Station actions are RPCs, not client-side updates.** `check_in_student`,
`complete_stage`, `assign_booth`, `complete_booth`, `redeem_lunch` and
`collect_certificate` each advance a graduate *and* write the audit row in one
transaction, so the scan log can never drift from the record.

**Duplicates are rejected by the database.** `redeem_lunch` and
`collect_certificate` match on `not lunch_done` / `not certificate_done` and
raise `ALREADY_REDEEMED` / `ALREADY_COLLECTED`. Two counters scanning the same
badge simultaneously cannot both succeed — this is not a UI check.

**Booth assignment optimises for wait, not queue length.** `assign_booth`
orders by `waiting × avg_minutes`, so a 9-person queue at 4 min/session loses
to a 12-person queue at 3 min/session.

**The first account to sign up becomes `admin`.** Everyone after that starts as
`viewer` until an admin promotes them. Role is never read from the signup form,
so a user cannot escalate their own privileges.

**Views use `security_invoker`.** Aggregates run with the caller's RLS in force
rather than the view owner's.
