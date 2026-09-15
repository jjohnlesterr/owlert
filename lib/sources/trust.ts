import "server-only";

import { isFacebookHost } from "@/lib/sources/facebook";
import type { SourceStatus, TrustLevel } from "@/lib/types";

// Small, explicit allowlist of established Philippine news domains —
// deterministic, not exhaustive. Government domains are handled separately
// below via the .gov.ph suffix rule, which takes priority.
const TRUSTED_NEWS_DOMAINS = [
  "gmanetwork.com",
  "abs-cbn.com",
  "inquirer.net",
  "philstar.com",
  "rappler.com",
  "mb.com.ph",
  "manilatimes.net",
  "sunstar.com.ph",
  "cnnphilippines.com",
];

function hostMatchesSuffix(hostname: string, suffix: string): boolean {
  return hostname === suffix || hostname.endsWith(`.${suffix}`);
}

export interface TrustResult {
  level: TrustLevel;
  reason: string;
}

/**
 * Deterministic, rule-based trust classification — no AI, no external
 * reputation APIs. Order matters: a fetch/safety failure always wins
 * (nothing else can be assessed), then domain patterns (.gov.ph, news
 * allowlist, .edu.ph), with "unverified" as the honest default — never
 * "fake".
 *
 * Facebook is NOT special-cased to "limited" trust here — monitoring
 * *status* ("limited") is handled separately in check-source.ts, since
 * Facebook pages are structurally hard to read regardless of who runs them.
 * Trust *level* is a different question ("who owns this page?"), and the
 * domain alone can't answer that for a facebook.com URL, so it's evaluated
 * the same way as any other source and normally lands on "unverified".
 */
export function classifyTrust(
  hostname: string,
  checkStatus: SourceStatus,
): TrustResult {
  const lower = hostname.toLowerCase();

  if (checkStatus === "unsupported") {
    return {
      level: "unsupported",
      reason:
        "This source couldn't be safely or reliably fetched (unreachable, blocked, or an unsafe URL).",
    };
  }

  if (hostMatchesSuffix(lower, "gov.ph")) {
    return {
      level: "official",
      reason: "Philippine government domain (.gov.ph).",
    };
  }

  const newsMatch = TRUSTED_NEWS_DOMAINS.find((domain) =>
    hostMatchesSuffix(lower, domain),
  );
  if (newsMatch) {
    return {
      level: "trusted_news",
      reason: `Recognized news outlet domain (${newsMatch}).`,
    };
  }

  if (hostMatchesSuffix(lower, "edu.ph")) {
    return {
      level: "verified_organization",
      reason: "Philippine educational institution domain (.edu.ph).",
    };
  }

  if (isFacebookHost(lower)) {
    return {
      level: "unverified",
      reason:
        "Facebook page — ownership can't be verified from the domain alone, so it can't independently confirm a class suspension. Recent posts may also not be reliably readable (monitoring status is separately marked Limited).",
    };
  }

  if (checkStatus === "limited") {
    return {
      level: "limited",
      reason:
        "This page could be reached, but its content couldn't be reliably extracted (no feed, generic page text only).",
    };
  }

  return {
    level: "unverified",
    reason:
      "Not a recognized government, news, or school domain. It can still be monitored, but shouldn't independently confirm a class suspension.",
  };
}
