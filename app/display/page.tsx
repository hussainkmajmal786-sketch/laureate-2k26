import { createClient } from "@/lib/supabase/server";
import { DisplayBoard } from "./board";

// Public board — always current, never cached.
export const dynamic = "force-dynamic";

export default async function DisplayPage() {
  // The board runs signed out on a TV, so it reads through the anon
  // policies rather than the authenticated query helpers.
  const supabase = await createClient();

  const [{ data: booths }, { data: queue }, { data: announcements }, { data: settings }] =
    await Promise.all([
      supabase.from("booth_status").select("*").order("id"),
      supabase
        .from("booth_queue")
        .select("id, booth_id, token, position, student:students(id, name, reg_no, hue, dept_code)")
        .eq("served", false)
        .order("booth_id")
        .order("position"),
      supabase.from("announcements").select("*").eq("active", true).order("sort_order"),
      supabase.from("event_settings").select("*").eq("id", 1).maybeSingle(),
    ]);

  return (
    <DisplayBoard
      booths={booths ?? []}
      queue={(queue ?? []) as never}
      announcements={(announcements ?? []).map((a) => a.body)}
      college={settings?.college ?? "College of Engineering Kidangoor"}
      eventDate={settings?.event_date ?? ""} />
  );
}
