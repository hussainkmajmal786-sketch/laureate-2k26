import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Routes reachable without signing in. The TV board is deliberately open. */
const PUBLIC_ROUTES = ["/", "/login", "/signup", "/display", "/hub", "/booth-kiosk", "/auth"];

/*
 * A bare register number is the printed pass's own address, so it has to
 * work for a graduate who has never signed in. Matched by shape rather
 * than added to PUBLIC_ROUTES so it cannot widen into a prefix match on
 * anything else.
 */
const REG_NO_PATH = /^\/[A-Za-z]{2,6}\d{2}[A-Za-z]{2}\d{3}$/;

function isPublic(pathname: string) {
  if (REG_NO_PATH.test(pathname)) return true;
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  /*
   * Without Supabase credentials there is no session to read. Rather than
   * throwing (which would 500 the whole deployment before any page renders),
   * fall through — the console layout does its own auth check, so protected
   * pages still redirect to /login.
   */
  if (!url || !key) return NextResponse.next({ request });

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  let user = null;
  try {
    // getUser() revalidates the token with Supabase — do not swap for
    // getSession(), which trusts an unverified cookie.
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // Auth service unreachable. Let the request through to the layout, which
    // redirects to /login when it cannot resolve a volunteer.
    return response;
  }

  const { pathname } = request.nextUrl;

  if (!user && !isPublic(pathname)) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/login";
    redirect.searchParams.set("next", pathname);
    return NextResponse.redirect(redirect);
  }

  // A signed-in volunteer landing on /login goes straight to the console.
  if (user && (pathname === "/login" || pathname === "/signup")) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/dashboard";
    redirect.search = "";
    return NextResponse.redirect(redirect);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Everything except static assets and image files — those never need a
     * session check and would only add latency.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
