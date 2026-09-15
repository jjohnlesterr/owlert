import "server-only";

import * as cheerio from "cheerio";
import { extractLocations, mapLocationsToRegions } from "@/lib/ph-location-map";
import { computeFreshness, type AdapterMatch, type NormalizedItem } from "@/lib/sources/adapters/types";

const MIN_SECTION_CHARS = 15;
const MAX_SECTIONS = 6;

export function isPagasaHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  return lower === "pagasa.dost.gov.ph" || lower.endsWith(".pagasa.dost.gov.ph");
}

/**
 * PAGASA's site (pagasa.dost.gov.ph) is a large nav-menu template wrapped
 * around real content: a "Synopsis" panel, a "TC Information" table, and
 * several <h3>-delimited forecast sections. Confirmed by inspecting the
 * actual page (see the check-source history) — this is NOT a generic
 * heuristic, it targets the real blocks PAGASA uses, after stripping the
 * nav/sidebar menus that otherwise dominate the raw HTML.
 */
export function tryPagasa(url: URL, html: string): AdapterMatch | null {
  if (!isPagasaHost(url.hostname)) return null;

  const $ = cheerio.load(html);
  $("nav, header, footer, script, style, noscript").remove();

  const bodyText = $("body").text();
  const issuedMatch = bodyText.match(
    /Issued at:\s*([\d:]+\s*[AP]M,\s*\d{1,2}\s+\w+\s+\d{4})/i,
  );
  const publishedAt = issuedMatch
    ? new Date(`${issuedMatch[1]} GMT+0800`)
    : undefined;
  const validPublishedAt =
    publishedAt && !Number.isNaN(publishedAt.getTime()) ? publishedAt : undefined;

  const items: NormalizedItem[] = [];

  const pushSection = (heading: string, body: string) => {
    const trimmedHeading = heading.replace(/\s+/g, " ").trim();
    const trimmedBody = body.replace(/\s+/g, " ").trim();
    if (!trimmedHeading || trimmedBody.length < MIN_SECTION_CHARS) return;
    if (items.some((item) => item.title === `PAGASA: ${trimmedHeading}`)) return;

    const combined = `${trimmedHeading} ${trimmedBody}`;
    const detectedLocations = extractLocations(combined);
    items.push({
      title: `PAGASA: ${trimmedHeading}`,
      description: trimmedBody.slice(0, 500),
      sourceUrl: url.toString(),
      publishedAt: validPublishedAt,
      detectedLocations,
      affectedRegions: mapLocationsToRegions(detectedLocations),
      freshnessStatus: computeFreshness(validPublishedAt),
    });
  };

  // Pattern 1: Bootstrap-style .panel-heading / .panel-body pairs (e.g. "Synopsis").
  $(".panel").each((_, panel) => {
    if (items.length >= MAX_SECTIONS) return;
    const heading = $(panel).find(".panel-heading").first().text();
    const body = $(panel).find(".panel-body").first().text();
    pushSection(heading, body);
  });

  // Pattern 2: <h3> heading followed by loose content (table/div) until the
  // next <h3> — e.g. "TC Information", "Forecast Weather Conditions".
  $("h3").each((_, el) => {
    if (items.length >= MAX_SECTIONS) return;
    const heading = $(el).text();
    const body = $(el).nextUntil("h3").text();
    pushSection(heading, body);
  });

  if (items.length === 0) return null;
  return { adapter: "pagasa", items, sourceName: "PAGASA" };
}
