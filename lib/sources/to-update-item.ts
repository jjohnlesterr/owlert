import type { SourceUpdateRow, TrustLevel, UpdateItem } from "@/lib/types";

export type SourceUpdateWithSource = SourceUpdateRow & {
  source: { name: string; trust_level: TrustLevel } | null;
};

/**
 * Maps a real `source_updates` row (joined with its parent `sources` row)
 * onto the existing `UpdateItem` shape so the dashboard/Updates UI can reuse
 * `UpdateCard` unchanged for both mock and real data. Every user-added
 * source is "custom" by construction — there's no official/news distinction
 * in the real `sources` table yet; trustLevel carries the real signal.
 */
export function toUpdateItem(row: SourceUpdateWithSource): UpdateItem {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    type: row.category,
    severity: row.severity,
    source: {
      name: row.source?.name ?? "Custom Source",
      kind: "custom",
      url: row.original_url,
      trustLevel: row.source?.trust_level,
    },
    location: row.location,
    publishedAt: row.published_at ?? row.detected_at,
    detectedAt: row.detected_at,
    originalUrl: row.original_url,
  };
}
