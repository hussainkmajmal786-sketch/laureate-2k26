"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createClient } from "./supabase/client";

/**
 * Refreshes the current route whenever any of the given tables change.
 * Server components re-run and stream fresh data down, so a scan at one
 * station appears on every other screen without a manual reload.
 *
 * Refreshes are debounced — a burst of scans should cost one round trip,
 * not one per row.
 */
export function useRealtimeRefresh(tables: string[], debounceMs = 400) {
  const router = useRouter();
  // Stringified so a fresh array literal each render doesn't resubscribe.
  const key = tables.join(",");

  React.useEffect(() => {
    const supabase = createClient();
    let timer: ReturnType<typeof setTimeout> | null = null;

    const scheduleRefresh = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => router.refresh(), debounceMs);
    };

    const channel = supabase.channel(`realtime:${key}`);

    for (const table of key.split(",")) {
      channel.on("postgres_changes", { event: "*", schema: "public", table }, scheduleRefresh);
    }

    channel.subscribe();

    return () => {
      if (timer) clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [key, debounceMs, router]);
}
