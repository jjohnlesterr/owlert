export type NormalizedCategory = "weather" | "class_suspension" | "school";

export type FreshnessStatus = "fresh" | "uncertain" | "old";

export interface NormalizedItem {
  title: string;
  description?: string;
  sourceUrl: string;
  publishedAt?: Date;
  category?: NormalizedCategory;
  detectedLocations?: string[];
  affectedRegions?: string[];
  freshnessStatus?: FreshnessStatus;
}

export type AdapterName = "rss" | "pagasa" | "gma" | "abs-cbn" | "generic";

export interface AdapterMatch {
  adapter: AdapterName;
  items: NormalizedItem[];
  /** Channel/site-level name (e.g. an RSS feed's <title>) — distinct from
   * any individual item's title. Falls back to the hostname when absent. */
  sourceName?: string;
}

const FRESH_MAX_AGE_MS = 2 * 24 * 60 * 60 * 1000; // 2 days
const OLD_MIN_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * No publishedAt at all is "uncertain" (we genuinely don't know), not
 * "old" — only a confirmed stale date is filtered out downstream.
 */
export function computeFreshness(publishedAt?: Date): FreshnessStatus {
  if (!publishedAt || Number.isNaN(publishedAt.getTime())) return "uncertain";
  const age = Date.now() - publishedAt.getTime();
  if (age < 0) return "uncertain"; // clock skew / bad parse — don't guess
  if (age <= FRESH_MAX_AGE_MS) return "fresh";
  if (age <= OLD_MIN_AGE_MS) return "uncertain";
  return "old";
}
