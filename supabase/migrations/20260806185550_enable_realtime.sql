-- Broadcast changes on the tables the live screens watch. RLS still
-- applies to realtime payloads, so the TV board only sees what the
-- anon policies allow.
alter publication supabase_realtime add table booth_queue;
alter publication supabase_realtime add table booths;
alter publication supabase_realtime add table students;
alter publication supabase_realtime add table scans;
