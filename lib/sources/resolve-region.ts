import { mapLocationsToRegions } from "@/lib/ph-location-map";
import type { PhRegionCode } from "@/lib/ph-regions";

interface RegionBearingRow {
  affected_regions: PhRegionCode[] | null;
  detected_locations: string[] | null;
}

/**
 * Effective region list for a source_updates row: the stored value when
 * present, otherwise derived on the fly from detected_locations. Handles
 * rows created before region extraction existed, or where affected_regions
 * ended up empty even though detected_locations has something usable —
 * deterministic re-derivation only, never a guess at an unmapped location.
 */
export function resolveRowRegions(row: RegionBearingRow): PhRegionCode[] {
  if (row.affected_regions && row.affected_regions.length > 0) {
    return row.affected_regions;
  }
  return mapLocationsToRegions(row.detected_locations ?? []);
}
