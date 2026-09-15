import "server-only";

import { checkSource } from "@/lib/sources/check-source";
import { classifyTrust } from "@/lib/sources/trust";
import type { createClient } from "@/lib/supabase/server";

export interface BuiltInSourceConfig {
  slug: string;
  name: string;
  url: string;
  description: string;
}

// Small, curated, code-defined list — no admin UI/table needed. Each entry
// becomes a regular `sources` row (is_builtin = true) the first time a user
// opens the Sources page, reusing the exact same check/trust pipeline as a
// custom source. Add/remove entries here to change what every user sees.
export const BUILT_IN_SOURCES: BuiltInSourceConfig[] = [
  {
    slug: "pagasa",
    name: "PAGASA",
    url: "https://www.pagasa.dost.gov.ph/weather",
    description:
      "Philippine Atmospheric, Geophysical and Astronomical Services Administration — the national weather bureau.",
  },
  {
    slug: "gma-news-weather",
    name: "GMA News",
    url: "https://www.gmanetwork.com/news/weather/",
    description: "GMA News weather and severe-weather coverage.",
  },
  {
    slug: "abs-cbn-news-weather",
    name: "ABS-CBN News",
    url: "https://news.abs-cbn.com/weather",
    description: "ABS-CBN News weather and severe-weather coverage.",
  },
];

/**
 * Ensures every built-in source has a per-user `sources` row. For a
 * returning user this is a single cheap SELECT with no external fetches —
 * the real check pipeline only runs (once, ever, per source) the first
 * time a given built-in source is missing for that user.
 */
export async function ensureBuiltInSources(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<void> {
  const { data: existing } = await supabase
    .from("sources")
    .select("url")
    .eq("user_id", userId)
    .eq("is_builtin", true);

  const existingUrls = new Set((existing ?? []).map((r) => r.url as string));
  const missing = BUILT_IN_SOURCES.filter(
    (config) => !existingUrls.has(config.url),
  );
  if (missing.length === 0) return;

  await Promise.all(
    missing.map(async (config) => {
      try {
        const result = await checkSource(config.url);
        const trust = classifyTrust(
          new URL(result.resolvedUrl).hostname,
          result.status,
        );

        const { data: source, error } = await supabase
          .from("sources")
          .insert({
            user_id: userId,
            url: result.resolvedUrl,
            name: config.name,
            status: result.status,
            trust_level: trust.level,
            trust_reason: trust.reason,
            is_builtin: true,
            last_checked_at: new Date().toISOString(),
          })
          .select("id")
          .single<{ id: string }>();

        if (error || !source || !result.update) return;

        await supabase.from("source_updates").insert({
          source_id: source.id,
          user_id: userId,
          content_hash: result.update.contentHash,
          title: result.update.title,
          summary: result.update.summary,
          category: result.update.category,
          location: result.update.locationLabel,
          affected_regions: result.update.affectedRegions,
          detected_locations: result.update.detectedLocations,
          original_url: result.update.originalUrl,
          published_at: result.update.publishedAt,
        });
      } catch {
        // Shouldn't happen for our own curated, valid URLs — genuinely
        // means the URL itself is invalid/unsafe (assertPublicHttpUrl
        // threw), which is a real "unsupported" case, not a leniency
        // exception. Still provision a row so we don't re-attempt a fetch
        // on every future page load.
        await supabase.from("sources").insert({
          user_id: userId,
          url: config.url,
          name: config.name,
          status: "unsupported",
          trust_level: "unsupported",
          trust_reason: "Couldn't validate this built-in source's URL.",
          is_builtin: true,
          last_checked_at: new Date().toISOString(),
        });
      }
    }),
  );
}
