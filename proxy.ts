import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// NOTE: Next.js 16 renamed the `middleware.ts` convention to `proxy.ts`
// (see node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md).
// This file replaces what would previously have been middleware.ts.
export function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|mascot/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
