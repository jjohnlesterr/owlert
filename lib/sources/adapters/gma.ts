import "server-only";

import { parseFeed } from "@/lib/sources/adapters/rss";
import type { AdapterMatch } from "@/lib/sources/adapters/types";
import { tryFetchTextSafe } from "@/lib/sources/fetch-safe";

export function isGmaHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  return lower === "gmanetwork.com" || lower.endsWith(".gmanetwork.com");
}

// Discovered from GMA's own RSS directory (gmanetwork.com/news/rss/) — GMA
// has no single "weather" feed, but these two are directly relevant:
// "Walang Pasok" (class suspensions) is a dedicated section, and "Nation"
// regularly covers PAGASA bulletins and severe-weather news. Tried in this
// order since class suspensions are the more actionable, specific signal.
// The whole Walang Pasok section is inherently class-suspension content —
// tagged explicitly so the pipeline's relevance filter trusts it even when
// an individual item's blurb doesn't happen to contain a literal weather
// keyword (e.g. "suspended in some areas" without naming the cause).
const CANDIDATE_FEEDS: { url: string; category: "class_suspension" | undefined }[] = [
  {
    url: "https://data.gmanetwork.com/gno/rss/serbisyopubliko/walangpasok/feed.xml",
    category: "class_suspension",
  },
  { url: "https://data.gmanetwork.com/gno/rss/news/nation/feed.xml", category: undefined },
];

/**
 * GMA's news/weather hub and archive pages are JS-rendered shells (the
 * story lists load via client-side AJAX and are empty in the raw server
 * HTML — confirmed by inspection), so scraping them directly doesn't work.
 * GMA does publish real per-section RSS feeds under a separate
 * data.gmanetwork.com host, though — this adapter tries those instead of
 * pretending the hub page's static HTML has content it doesn't.
 */
export async function tryGma(hostname: string): Promise<AdapterMatch | null> {
  if (!isGmaHost(hostname)) return null;

  for (const candidate of CANDIDATE_FEEDS) {
    const fetched = await tryFetchTextSafe(candidate.url);
    if (!fetched) continue;

    const parsed = await parseFeed(fetched.text, candidate.url);
    if (parsed && parsed.items.length > 0) {
      const items = candidate.category
        ? parsed.items.map((item) => ({ ...item, category: candidate.category }))
        : parsed.items;
      return { adapter: "gma", items, sourceName: parsed.feedTitle };
    }
  }

  return null;
}
