"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

/** Browser-side Supabase client. Safe to call repeatedly — it memoises. */
export function createClient() {
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";

  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    supabaseKey,
  );
}
