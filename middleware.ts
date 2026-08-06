import { NextResponse, type NextRequest } from "next/server";

/**
 * Keep the edge middleware dependency-free. Supabase session work belongs in
 * server actions and route handlers; importing the SSR client here can make
 * the entire Vercel deployment fail before a page is rendered.
 */
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
