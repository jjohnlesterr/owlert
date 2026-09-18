import type { BadgeTone } from "@/components/ui/badge";

export type UpdateFreshness = "active" | "recent" | "historical" | "expired" | "uncertain";

const ACTIVE_MAX_MS = 24 * 60 * 60 * 1000; // 1 day
const RECENT_MAX_MS = 3 * 24 * 60 * 60 * 1000; // 3 days
const HISTORICAL_MAX_MS = 7 * 24 * 60 * 60 * 1000; // 7 days — the default history window

/**
 * Display-facing freshness tier for an update, based on its real publish
 * time when known (falls back to when BeeAlert detected it). This is always
 * computed at read time, never stored — freshness is relative to "now" and
 * would go stale immediately if persisted as a static value.
 */
export function computeUpdateFreshness(
  publishedAt: string | null,
  detectedAt: string,
): UpdateFreshness {
  const referenceIso = publishedAt ?? detectedAt;
  const date = new Date(referenceIso);
  if (Number.isNaN(date.getTime())) return "uncertain";

  const age = Date.now() - date.getTime();
  if (age < 0) return "uncertain"; // clock skew / bad parse — don't guess
  if (age <= ACTIVE_MAX_MS) return "active";
  if (age <= RECENT_MAX_MS) return "recent";
  if (age <= HISTORICAL_MAX_MS) return "historical";
  return "expired";
}

export const updateFreshnessLabel: Record<UpdateFreshness, string> = {
  active: "Active",
  recent: "Recent",
  historical: "Historical",
  expired: "Expired",
  uncertain: "",
};

// Deliberately muted for "historical"/"expired" — old updates are a normal
// part of the record, not a problem to flag with alarming colors.
export const updateFreshnessTone: Record<UpdateFreshness, BadgeTone> = {
  active: "safe",
  recent: "info",
  historical: "neutral",
  expired: "neutral",
  uncertain: "neutral",
};
