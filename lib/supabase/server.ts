import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * Supabase client for use in Server Components, Server Actions, and Route
 * Handlers. Reads/writes the session via Next.js cookies so auth state
 * stays in sync with the browser client. Uses only public env vars.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
            // Called from a Server Component render, where cookies can't be
            // written. Safe to ignore — proxy.ts refreshes the session cookie
            // on every request, so it stays valid.
          }
        },
      },
    },
  );
}
