import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./types";

/**
 * Server-side Supabase client for Server Components, Route Handlers and
 * Server Actions. Reads the session from cookies so RLS applies as the
 * signed-in volunteer.
 */
export async function createClient() {
  const cookieStore = await cookies();

  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    supabaseKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component, where cookies are read-only.
            // Middleware refreshes the session, so this is safe to ignore.
          }
        },
      },
    },
  );
}

/**
 * The signed-in volunteer's profile, or null when signed out.
 *
 * Returns null rather than throwing if Supabase is unreachable or the env
 * vars are missing — the console layout treats null as "not signed in" and
 * redirects to /login, which fails closed.
 */
export async function getCurrentVolunteer() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
      .from("volunteers")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    return data;
  } catch {
    return null;
  }
}
