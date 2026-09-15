import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * Verified Supabase auth user for the current request, memoized per render
 * pass. Returns null if there is no valid session — callers decide whether
 * to redirect (proxy.ts already keeps unauthenticated users out of
 * protected routes; this is the defense-in-depth check next to the data).
 */
export const getAuthUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});
