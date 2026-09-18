import "server-only";

import { assertPublicHttpUrl } from "@/lib/sources/url-safety";

const MAX_BYTES = 2_000_000;
const FETCH_TIMEOUT_MS = 8000;

/** Carries the real HTTP status code so callers can tell "blocked" from "broken." */
export class FetchHttpError extends Error {
  status: number;
  constructor(status: number) {
    super(`Source responded with HTTP ${status}.`);
    this.status = status;
  }
}

export interface FetchedContent {
  text: string;
  contentType: string;
}

/**
 * SSRF-guarded, size- and time-capped fetch, shared by the pipeline and by
 * adapters that need a secondary request (e.g. probing a known feed URL).
 * Every target — including adapter-initiated ones — goes through the same
 * `assertPublicHttpUrl` validation, never a raw `fetch`.
 */
export async function fetchTextSafe(
  rawUrlOrUrl: string | URL,
): Promise<FetchedContent> {
  const url =
    typeof rawUrlOrUrl === "string"
      ? await assertPublicHttpUrl(rawUrlOrUrl)
      : rawUrlOrUrl;

  const res = await fetch(url, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: {
      "User-Agent": "BeeAlertBot/0.1 (+weather source monitor; hackathon MVP)",
    },
  });

  if (!res.ok) {
    throw new FetchHttpError(res.status);
  }

  const contentType = res.headers.get("content-type") ?? "";

  const reader = res.body?.getReader();
  if (!reader) return { text: await res.text(), contentType };

  const chunks: Uint8Array[] = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > MAX_BYTES) {
      await reader.cancel();
      throw new Error("Source response was too large to read.");
    }
    chunks.push(value);
  }

  return {
    text: Buffer.concat(chunks.map((c) => Buffer.from(c))).toString("utf-8"),
    contentType,
  };
}

/**
 * Same as fetchTextSafe, but resolves to null instead of throwing — for
 * adapters probing optional secondary URLs (e.g. a candidate feed endpoint)
 * where a failure just means "try the next candidate," not a hard error.
 */
export async function tryFetchTextSafe(
  rawUrlOrUrl: string | URL,
): Promise<FetchedContent | null> {
  try {
    return await fetchTextSafe(rawUrlOrUrl);
  } catch {
    return null;
  }
}
