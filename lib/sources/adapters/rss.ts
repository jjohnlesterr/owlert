import "server-only";

import Parser from "rss-parser";
import { extractLocations, mapLocationsToRegions } from "@/lib/ph-location-map";
import type { NormalizedItem } from "@/lib/sources/adapters/types";

const FEED_PARSE_TIMEOUT_MS = 8000;

export function looksLikeFeed(body: string): boolean {
  return /<rss[\s>]|<feed[\s>]/i.test(body.slice(0, 2000));
}

/**
 * Parses an RSS/Atom body into normalized items. Returns null if the body
 * doesn't actually parse as a feed (caller falls through to the next
 * pipeline step) — never throws.
 */
export async function parseFeed(
  body: string,
  fallbackSourceUrl: string,
): Promise<{ items: NormalizedItem[]; feedTitle: string } | null> {
  try {
    const parser = new Parser({ timeout: FEED_PARSE_TIMEOUT_MS });
    const feed = await parser.parseString(body);
    const feedTitle = feed.title?.trim() || fallbackSourceUrl;

    const items: NormalizedItem[] = (feed.items ?? []).map((item) => {
      const title = item.title?.trim() || feedTitle;
      const description = (item.contentSnippet ?? item.content ?? "").trim();
      const combined = `${title} ${description}`;
      const detectedLocations = extractLocations(combined);
      const publishedAt = item.isoDate
        ? new Date(item.isoDate)
        : item.pubDate
          ? new Date(item.pubDate)
          : undefined;

      return {
        title,
        description: description || undefined,
        sourceUrl: item.link?.trim() || fallbackSourceUrl,
        publishedAt:
          publishedAt && !Number.isNaN(publishedAt.getTime())
            ? publishedAt
            : undefined,
        detectedLocations,
        affectedRegions: mapLocationsToRegions(detectedLocations),
      };
    });

    return { items, feedTitle };
  } catch {
    return null;
  }
}
