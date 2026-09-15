import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Exact-match route lists are fine for now — the app only has these four
// tabs plus the two auth pages. Revisit with prefix matching if nested
// routes are added later.
const PROTECTED_PATHS = ["/", "/updates", "/sources", "/profile"];
const AUTH_PATHS = ["/login", "/signup"];

/**
 * Refreshes the Supabase session cookie on every request and performs an
 * optimistic redirect based on auth state. This is the fast, first line of
 * defense — pages that read user-specific data (e.g. Profile) still verify
 * the session themselves server-side before querying.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser() (not getSession()) revalidates the token against Supabase Auth
  // rather than trusting the cookie as-is.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  if (!user && PROTECTED_PATHS.includes(path)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && AUTH_PATHS.includes(path)) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return response;
}
