import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for use in Client Components. Reads only public,
 * browser-safe env vars — never the service role key.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
