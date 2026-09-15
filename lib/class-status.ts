import "server-only";

import { createClient } from "@/lib/supabase/server";
import { computeUpdateFreshness } from "@/lib/updates/freshness";
import type { ClassStatusInfo, SourceUpdateRow, TrustLevel } from "@/lib/types";

const SUSPENSION_KEYWORDS = [
  "suspended",
  "suspension of classes",
  "classes are suspended",
  "walang pasok",
  "no classes",
];

// Feature 8: an Unverified or Limited source alone must never flip the
// dashboard to "Classes Suspended" — only Official/Trusted News/Verified
// Organization sources can confirm it.
const TRUSTED_FOR_SUSPENSION: TrustLevel[] = [
  "official",
  "trusted_news",
  "verified_organization",
];

// A suspension notice only counts as *current* status if it's still
// "active" or "recent" (<=3 days old, per lib/updates/freshness.ts) —
// last week's suspension must never be shown as today's status.
const CURRENT_ENOUGH = new Set(["active", "recent"]);

function indicatesSuspension(text: string): boolean {
  const lower = text.toLowerCase();
  return SUSPENSION_KEYWORDS.some((keyword) => lower.includes(keyword));
}

/**
 * Class status is never inferred from weather. It only ever reflects a real
 * `source_updates` row the user's own monitored sources detected, and only
 * ever asserts "suspended" when that row's text explicitly says so, the
 * source is trusted enough to confirm it, AND the notice is still current
 * (not a stale, days-old announcement) — otherwise it honestly reports no
 * verified announcement.
 */
export async function getClassStatus(
  userId: string,
  location: string,
): Promise<ClassStatusInfo> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("source_updates")
    .select("*, source:sources(name, url, trust_level)")
    .eq("user_id", userId)
    .eq("category", "classes")
    .order("detected_at", { ascending: false })
    .limit(10)
    .returns<
      (SourceUpdateRow & {
        source: { name: string; url: string; trust_level: TrustLevel } | null;
      })[]
    >();

  const suspensionUpdate = (data ?? []).find((row) => {
    if (!indicatesSuspension(`${row.title} ${row.summary}`)) return false;
    if (!row.source?.trust_level || !TRUSTED_FOR_SUSPENSION.includes(row.source.trust_level)) {
      return false;
    }
    const freshness = computeUpdateFreshness(row.published_at, row.detected_at);
    return CURRENT_ENOUGH.has(freshness);
  });

  if (suspensionUpdate) {
    return {
      status: "suspended",
      location,
      note: suspensionUpdate.summary,
      source: {
        name: suspensionUpdate.source?.name ?? "Custom Source",
        kind: "custom",
        url: suspensionUpdate.original_url,
        trustLevel: suspensionUpdate.source?.trust_level,
      },
      updatedAt: suspensionUpdate.published_at ?? suspensionUpdate.detected_at,
    };
  }

  return {
    status: "no_announcement",
    location,
    note: "No official suspension announcement has been detected from your monitored sources.",
    source: null,
    updatedAt: new Date().toISOString(),
  };
}
