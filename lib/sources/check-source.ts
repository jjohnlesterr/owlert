import "server-only";

import crypto from "node:crypto";
import { assertPublicHttpUrl } from "@/lib/sources/url-safety";
import { FetchHttpError, fetchTextSafe } from "@/lib/sources/fetch-safe";
import { FACEBOOK_LIMITED_MESSAGE, isFacebookHost } from "@/lib/sources/facebook";
import { looksLikeFeed, parseFeed } from "@/lib/sources/adapters/rss";
import { tryPagasa } from "@/lib/sources/adapters/pagasa";
import { tryGma } from "@/lib/sources/adapters/gma";
import { tryAbsCbn } from "@/lib/sources/adapters/abs-cbn";
import { tryGeneric } from "@/lib/sources/adapters/generic";
import {
  computeFreshness,
  type AdapterMatch,
  type AdapterName,
  type NormalizedCategory,
  type NormalizedItem,
} from "@/lib/sources/adapters/types";
import { isPhRegionCode, type PhRegionCode } from "@/lib/ph-regions";
import type { SourceStatus, UpdateType } from "@/lib/types";

const KEYWORDS = [
  "weather",
  "rainfall",
  "thunderstorm",
  "typhoon",
  "tropical cyclone",
  "flood",
  "habagat",
  "warning",
  "advisory",
  "storm",
];

// Rule-based only (no AI). "classes" wins over "school" when both match,
// since a suspension announcement is the more actionable category.
const CLASS_KEYWORDS = [
  "class suspension",
  "classes suspended",
  "suspension of classes",
  "walang pasok",
  "no classes",
];
const SCHOOL_KEYWORDS = [
  "school",
  "deped",
  "department of education",
  "division office",
];

// HTTP codes that mean "the server refused/throttled us specifically" —
// evidence of blocking, not evidence the source is broken or doesn't exist.
const BLOCKED_HTTP_STATUSES = new Set([401, 403, 429]);

// Below this, the generic adapter's loosest strategy (headings+paragraphs)
// still failed to find anything — effectively empty.
// At/above this for the *generic* adapter specifically, we're reasonably
// confident it's real article content rather than nav/footer boilerplate —
// a simple, deterministic stand-in for "the parser can reliably inspect
// recent content." RSS and provider-specific adapters skip this check
// entirely: a structural match from those is reliable regardless of how
// short the resulting summary is (a real RSS blurb can be one sentence).
const SUBSTANTIAL_READABLE_CHARS = 300;

const INCOMPATIBLE_CONTENT_TYPE_PREFIXES = [
  "image/",
  "video/",
  "audio/",
  "application/pdf",
  "application/octet-stream",
  "application/zip",
];

function isRelevant(text: string): boolean {
  const lower = text.toLowerCase();
  return KEYWORDS.some((keyword) => lower.includes(keyword));
}

function classifyCategory(text: string): UpdateType {
  const lower = text.toLowerCase();
  if (CLASS_KEYWORDS.some((k) => lower.includes(k))) return "classes";
  if (SCHOOL_KEYWORDS.some((k) => lower.includes(k))) return "school";
  return "weather";
}

function mapNormalizedCategory(category?: NormalizedCategory): UpdateType | undefined {
  if (category === "class_suspension") return "classes";
  return category;
}

function hashText(text: string): string {
  return crypto
    .createHash("sha256")
    .update(text.trim().toLowerCase())
    .digest("hex");
}

export interface DetectedUpdate {
  title: string;
  summary: string;
  category: UpdateType;
  originalUrl: string;
  contentHash: string;
  detectedLocations: string[];
  affectedRegions: PhRegionCode[];
  locationLabel: string;
  /** The source's own real publish time when determinable — never guessed. */
  publishedAt: string | null;
}

export interface CheckSourceResult {
  status: SourceStatus;
  sourceName: string;
  resolvedUrl: string;
  update: DetectedUpdate | null;
  errorMessage?: string;
  /** Which adapter produced the result — logged for debugging (see below). */
  adapterUsed?: AdapterName;
}

function toDetectedUpdate(item: NormalizedItem, fallbackTitle: string): DetectedUpdate {
  const title = item.title?.trim() || fallbackTitle;
  const summary = (item.description?.trim() || "(No summary available.)").slice(0, 400);
  const combined = `${title} ${summary}`;
  const category = mapNormalizedCategory(item.category) ?? classifyCategory(combined);
  const detectedLocations = item.detectedLocations ?? [];
  const affectedRegions = (item.affectedRegions ?? []).filter(isPhRegionCode);

  return {
    title,
    summary,
    category,
    originalUrl: item.sourceUrl,
    contentHash: hashText(`${title}|${summary}`),
    detectedLocations,
    affectedRegions,
    locationLabel:
      detectedLocations.length > 0
        ? detectedLocations.join(", ")
        : "Location not determined",
    publishedAt:
      item.publishedAt && !Number.isNaN(item.publishedAt.getTime())
        ? item.publishedAt.toISOString()
        : null,
  };
}

/** Freshness filter: never surface/save an item we're confident is stale. */
function selectCandidate(items: NormalizedItem[]): NormalizedItem | undefined {
  const candidates = items
    .filter((item) => {
      const combined = `${item.title} ${item.description ?? ""}`;
      // Trust an adapter-provided category (e.g. GMA's Walang Pasok feed)
      // as sufficient evidence of relevance even without a literal weather
      // keyword — a class-suspension item doesn't always say "rain."
      const relevant = item.category !== undefined || isRelevant(combined);
      const fresh = (item.freshnessStatus ?? computeFreshness(item.publishedAt)) !== "old";
      return relevant && fresh;
    })
    .sort((a, b) => (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0));

  return candidates[0];
}

/**
 * Fetches a single page/feed server-side (SSRF-guarded, size- and
 * time-capped) and runs it through the adapter pipeline, in order:
 *   1. RSS/Atom      — the fetched body is itself a feed
 *   2. Provider adapter — PAGASA / GMA / ABS-CBN specific extraction
 *   3. Generic adapter  — RSS autodiscovery, <article>, <main>, meta tags,
 *                          headings+paragraphs (nav/footer/menu stripped)
 *   4. Nothing worked -> Limited (or Unsupported if truly nothing at all)
 *
 * No recursive crawling, no JS execution. Never fabricates an update —
 * only ever returns content an adapter actually extracted.
 */
export async function checkSource(rawUrl: string): Promise<CheckSourceResult> {
  const url = await assertPublicHttpUrl(rawUrl);
  const isFacebook = isFacebookHost(url.hostname);

  let initial: { text: string; contentType: string };
  try {
    initial = await fetchTextSafe(url);
  } catch (error) {
    if (error instanceof FetchHttpError && BLOCKED_HTTP_STATUSES.has(error.status)) {
      return logResult({
        status: "limited",
        sourceName: url.hostname,
        resolvedUrl: url.toString(),
        update: null,
        errorMessage: `Limited monitoring — this source returned HTTP ${error.status}, which usually means it's blocking or rate-limiting automated requests, not that it's broken.`,
      });
    }
    if (isFacebook) {
      return logResult({
        status: "limited",
        sourceName: url.hostname,
        resolvedUrl: url.toString(),
        update: null,
        errorMessage: FACEBOOK_LIMITED_MESSAGE,
      });
    }
    return logResult({
      status: "unsupported",
      sourceName: url.hostname,
      resolvedUrl: url.toString(),
      update: null,
      errorMessage:
        error instanceof Error ? error.message : "Couldn't read this source.",
    });
  }

  if (
    INCOMPATIBLE_CONTENT_TYPE_PREFIXES.some((prefix) =>
      initial.contentType.toLowerCase().startsWith(prefix),
    )
  ) {
    return logResult({
      status: "unsupported",
      sourceName: url.hostname,
      resolvedUrl: url.toString(),
      update: null,
      errorMessage:
        "This source returns a format Owlert can't monitor (not a webpage or feed).",
    });
  }

  // Step 1: RSS/Atom.
  let match: AdapterMatch | null = null;
  if (looksLikeFeed(initial.text)) {
    const parsed = await parseFeed(initial.text, url.toString());
    if (parsed) {
      match = { adapter: "rss", items: parsed.items, sourceName: parsed.feedTitle };
    }
  }

  // Step 2: provider-specific.
  if (!match) {
    match =
      tryPagasa(url, initial.text) ??
      (await tryGma(url.hostname)) ??
      (await tryAbsCbn(url.hostname));
  }

  // Step 3: generic fallback.
  let usedGeneric = false;
  if (!match) {
    match = await tryGeneric(url, initial.text);
    usedGeneric = true;
  }

  const sourceName = match?.sourceName?.trim() || url.hostname;

  // Step 4: nothing worked at all.
  if (!match) {
    if (isFacebook) {
      return logResult({
        status: "limited",
        sourceName: url.hostname,
        resolvedUrl: url.toString(),
        update: null,
        errorMessage: FACEBOOK_LIMITED_MESSAGE,
      });
    }
    return logResult({
      status: "unsupported",
      sourceName: url.hostname,
      resolvedUrl: url.toString(),
      update: null,
      errorMessage: "This page didn't have enough readable text to check.",
    });
  }

  // RSS and provider-specific adapters imply a reliable structural match
  // regardless of content length; the generic adapter only counts as
  // "supported" once its extracted text clears the substantiality bar —
  // and Facebook is always "limited" no matter which adapter matched.
  //
  // Status reflects whether the page was *readable*, not whether anything
  // relevant happened to be posted right now — so it's judged on the raw
  // extracted content (every item, before relevance/freshness filtering),
  // not on the (possibly empty, if nothing is currently relevant) selected
  // candidate below.
  const rawContentLength = match.items.reduce(
    (max, item) => Math.max(max, `${item.title} ${item.description ?? ""}`.length),
    0,
  );

  const status: SourceStatus = isFacebook
    ? "limited"
    : !usedGeneric
      ? "supported"
      : rawContentLength >= SUBSTANTIAL_READABLE_CHARS
        ? "supported"
        : "limited";

  const candidate = selectCandidate(match.items);

  if (!candidate) {
    return logResult({
      status,
      sourceName,
      resolvedUrl: url.toString(),
      update: null,
      errorMessage: isFacebook ? FACEBOOK_LIMITED_MESSAGE : undefined,
      adapterUsed: match.adapter,
    });
  }

  return logResult({
    status,
    sourceName,
    resolvedUrl: url.toString(),
    update: toDetectedUpdate(candidate, sourceName),
    adapterUsed: match.adapter,
  });
}

function logResult(result: CheckSourceResult): CheckSourceResult {
  console.log(
    `[owlert] source check: ${result.resolvedUrl} -> adapter=${result.adapterUsed ?? "none"} status=${result.status}`,
  );
  return result;
}
