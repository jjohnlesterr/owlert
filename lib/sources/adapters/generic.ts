import "server-only";

import * as cheerio from "cheerio";
import { extractLocations, mapLocationsToRegions } from "@/lib/ph-location-map";
import { computeFreshness, type AdapterMatch, type NormalizedItem } from "@/lib/sources/adapters/types";
import { looksLikeFeed, parseFeed } from "@/lib/sources/adapters/rss";
import { tryFetchTextSafe } from "@/lib/sources/fetch-safe";

const MIN_CHARS = 40;

function buildItem(
  url: URL,
  title: string,
  description: string,
  publishedAt?: Date,
): NormalizedItem {
  const combined = `${title} ${description}`;
  const detectedLocations = extractLocations(combined);
  return {
    title: title.slice(0, 200),
    description: description.slice(0, 500),
    sourceUrl: url.toString(),
    publishedAt,
    detectedLocations,
    affectedRegions: mapLocationsToRegions(detectedLocations),
    freshnessStatus: computeFreshness(publishedAt),
  };
}

/**
 * Last-resort adapter for any custom source, tried in order: RSS
 * autodiscovery, <article>, <main>, meta tags, then headings+paragraphs.
 * nav/header/footer/script/style are stripped first so none of these
 * strategies pick up menu noise. Returns null (not "supported") when even
 * this can't find at least MIN_CHARS of real content — that's a genuine
 * "couldn't reliably read this" outcome, not a bug.
 */
export async function tryGeneric(url: URL, html: string): Promise<AdapterMatch | null> {
  const $ = cheerio.load(html);
  $("nav, header, footer, script, style, noscript, form, aside").remove();

  // 1. RSS/Atom autodiscovery.
  const feedHref = $(
    'link[rel="alternate"][type*="rss"], link[rel="alternate"][type*="atom"]',
  )
    .first()
    .attr("href");
  if (feedHref) {
    try {
      const feedUrl = new URL(feedHref, url).toString();
      const fetched = await tryFetchTextSafe(feedUrl);
      if (fetched && looksLikeFeed(fetched.text)) {
        const parsed = await parseFeed(fetched.text, feedUrl);
        if (parsed && parsed.items.length > 0) {
          return { adapter: "rss", items: parsed.items, sourceName: parsed.feedTitle };
        }
      }
    } catch {
      // Malformed href — fall through to the other strategies.
    }
  }

  const metaPublished = $('meta[property="article:published_time"]').attr(
    "content",
  );
  const timeDatetime = $("time[datetime]").first().attr("datetime");
  const publishedRaw = metaPublished || timeDatetime;
  const publishedAt = publishedRaw ? new Date(publishedRaw) : undefined;
  const validPublishedAt =
    publishedAt && !Number.isNaN(publishedAt.getTime()) ? publishedAt : undefined;

  const ogSiteName = $('meta[property="og:site_name"]').attr("content")?.trim();
  const ogTitle = $('meta[property="og:title"]').attr("content")?.trim();
  const ogDescription = $('meta[property="og:description"]').attr(
    "content",
  )?.trim();
  const pageTitle = $("title").first().text().trim();
  const sourceName = ogSiteName || pageTitle || url.hostname;

  // 2. <article>.
  const articleText = $("article").first().text().replace(/\s+/g, " ").trim();
  if (articleText.length >= MIN_CHARS) {
    const title =
      $("article h1, article h2").first().text().trim() ||
      ogTitle ||
      pageTitle ||
      url.hostname;
    return {
      adapter: "generic",
      items: [buildItem(url, title, articleText, validPublishedAt)],
      sourceName,
    };
  }

  // 3. <main>.
  const mainText = $("main").first().text().replace(/\s+/g, " ").trim();
  if (mainText.length >= MIN_CHARS) {
    const title = ogTitle || pageTitle || url.hostname;
    return {
      adapter: "generic",
      items: [buildItem(url, title, mainText, validPublishedAt)],
      sourceName,
    };
  }

  // 4. og:title / og:description.
  if (ogTitle && ogDescription && ogDescription.length >= MIN_CHARS) {
    return {
      adapter: "generic",
      items: [buildItem(url, ogTitle, ogDescription, validPublishedAt)],
      sourceName,
    };
  }

  // 5. Headings + paragraphs — last resort.
  const headingsAndParagraphs = $("h1, h2, h3, p")
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  if (headingsAndParagraphs.length >= MIN_CHARS) {
    const title = $("h1").first().text().trim() || ogTitle || pageTitle || url.hostname;
    return {
      adapter: "generic",
      items: [buildItem(url, title, headingsAndParagraphs, validPublishedAt)],
      sourceName,
    };
  }

  return null;
}
