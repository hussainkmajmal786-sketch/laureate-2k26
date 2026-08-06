import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Routes reachable without signing in. The TV board is deliberately open. */
const PUBLIC_ROUTES = ["/", "/login", "/signup", "/display", "/student", "/auth"];

function isPublic(pathname: string) {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || (route !== "/" && pathname.startsWith(`${route}/`)),
  );
}

export async function middleware(request: NextRequest) {
  try {
    let response = NextResponse.next({ request });
    const { pathname } = request.nextUrl;

    // Public pages must remain available even when Supabase is unavailable or
    // its Vercel environment variables have not been configured yet.
    if (isPublic(pathname)) {
      return response;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return response;
    }

    let user = null;

    try {
      const supabase = createServerClient(supabaseUrl, supabaseKey, {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value }) =>
                request.cookies.set(name, value),
              );
            } catch {
              // Ignore request cookie mutations if unsupported in Edge environment
            }
            response = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options),
            );
          },
        },
      });

      const { data } = await supabase.auth.getUser();
      user = data?.user ?? null;
    } catch (error) {
      console.error("Middleware auth error:", error);
    }

    if (!user && !isPublic(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }

    // A signed-in volunteer landing on /login goes straight to the console.
    if (user && (pathname === "/login" || pathname === "/signup")) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      url.search = "";
      return NextResponse.redirect(url);
    }

    return response;
  } catch (err) {
    console.error("Top-level middleware error:", err);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Everything except static assets and image files — those never need
     * a session check and would only add latency.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
