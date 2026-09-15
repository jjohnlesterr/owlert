import "server-only";

import { looksLikeFeed, parseFeed } from "@/lib/sources/adapters/rss";
import type { AdapterMatch } from "@/lib/sources/adapters/types";
import { tryFetchTextSafe } from "@/lib/sources/fetch-safe";

export function isAbsCbnHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  return lower === "abs-cbn.com" || lower.endsWith(".abs-cbn.com");
}

// news.abs-cbn.com currently returns HTTP 403 for automated requests on
// effectively every path we've probed (including its real, non-guessed
// pages) — this looks like blanket bot-blocking (Cloudflare/Akamai-style),
// not a single broken page. These candidates are tried in good faith, but
// in practice this adapter is expected to return null — that's an honest
// "Limited" outcome (see check-source.ts), not something to paper over.
const CANDIDATE_FEEDS = [
  "https://news.abs-cbn.com/rss",
  "https://news.abs-cbn.com/rss/news",
];

export async function tryAbsCbn(hostname: string): Promise<AdapterMatch | null> {
  if (!isAbsCbnHost(hostname)) return null;

  for (const feedUrl of CANDIDATE_FEEDS) {
    const fetched = await tryFetchTextSafe(feedUrl);
    if (!fetched || !looksLikeFeed(fetched.text)) continue;

    const parsed = await parseFeed(fetched.text, feedUrl);
    if (parsed && parsed.items.length > 0) {
      return { adapter: "abs-cbn", items: parsed.items, sourceName: parsed.feedTitle };
    }
  }

  return null;
}
