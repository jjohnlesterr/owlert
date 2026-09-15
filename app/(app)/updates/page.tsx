import Link from "next/link";
import { redirect } from "next/navigation";
import { UpdateCard } from "@/components/dashboard/update-card";
import { RegionFilterSelect } from "@/components/updates/region-filter-select";
import { Card } from "@/components/ui/card";
import { getAuthUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { toUpdateItem, type SourceUpdateWithSource } from "@/lib/sources/to-update-item";
import { resolveRowRegions } from "@/lib/sources/resolve-region";
import { historyWindowStart } from "@/lib/updates/window";
import { isPhRegionCode, phRegionLabel, type PhRegionCode } from "@/lib/ph-regions";
import type { UpdateType } from "@/lib/types";

const FILTERS: { label: string; value: UpdateType | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Weather", value: "weather" },
  { label: "Classes", value: "classes" },
  { label: "School", value: "school" },
];

const VALID_TYPES: UpdateType[] = ["weather", "classes", "school"];

// "Recent history" window per the spec — newest first, up to 7 days back.
// Fetched on detected_at (Owlert's own reliable timestamp, always present)
// rather than published_at (best-effort, sometimes null).
const HISTORY_WINDOW_DAYS = 7;

export default async function UpdatesPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string | string[]; region?: string | string[] }>;
}) {
  const user = await getAuthUser();
  if (!user) {
    redirect("/login");
  }

  const params = await searchParams;
  const rawType = Array.isArray(params.type) ? params.type[0] : params.type;
  const activeFilter: UpdateType | "all" = VALID_TYPES.includes(
    rawType as UpdateType,
  )
    ? (rawType as UpdateType)
    : "all";

  const supabase = await createClient();

  // The `region` query param is a temporary override for this view only. If
  // it isn't present at all, fall back to the user's saved preference —
  // but an explicit `?region=` (including "" for All Regions) always wins
  // and never writes back to the profile.
  const rawRegion = Array.isArray(params.region) ? params.region[0] : params.region;
  let activeRegion: PhRegionCode | null;
  if (rawRegion !== undefined) {
    activeRegion = isPhRegionCode(rawRegion) ? rawRegion : null;
  } else {
    const { data: profile } = await supabase
      .from("profiles")
      .select("preferred_region")
      .eq("id", user.id)
      .maybeSingle<{ preferred_region: PhRegionCode | null }>();
    activeRegion = profile?.preferred_region ?? null;
  }

  const windowStart = historyWindowStart(HISTORY_WINDOW_DAYS);

  let query = supabase
    .from("source_updates")
    .select("*, source:sources(name, trust_level)")
    .eq("user_id", user.id)
    .gte("detected_at", windowStart)
    .order("detected_at", { ascending: false })
    .limit(100);

  if (activeFilter !== "all") {
    query = query.eq("category", activeFilter);
  }

  const { data: rows } = await query.returns<SourceUpdateWithSource[]>();

  // Region filtering happens here, not in the query: `affected_regions` is
  // empty on some real rows (older detections, or content whose location
  // extraction genuinely found nothing at the time), which would silently
  // hide legitimate updates from a region-filtered view if we filtered at
  // the DB level with `.contains()`. Deriving from detected_locations when
  // the stored array is empty recovers those without ever guessing an
  // unknown location — see lib/sources/resolve-region.ts.
  const filteredRows = activeRegion
    ? (rows ?? []).filter((row) => resolveRowRegions(row).includes(activeRegion))
    : (rows ?? []);

  const updates = filteredRows.map(toUpdateItem);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-xl font-semibold text-navy">Updates</h1>
        <p className="text-sm text-slate-500">
          Weather-related updates detected from your monitored sources over
          the last {HISTORY_WINDOW_DAYS} days.
        </p>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((filter) => {
            const isActive = filter.value === activeFilter;
            const href = new URLSearchParams();
            if (filter.value !== "all") href.set("type", filter.value);
            if (rawRegion !== undefined) href.set("region", rawRegion);
            const query = href.toString();
            return (
              <Link
                key={filter.value}
                href={query ? `/updates?${query}` : "/updates"}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50"
                }`}
              >
                {filter.label}
              </Link>
            );
          })}
        </div>

        <RegionFilterSelect current={activeRegion ?? ""} />
      </div>

      {updates.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {updates.map((update) => (
            <UpdateCard key={update.id} update={update} />
          ))}
        </div>
      ) : (
        <Card>
          <p className="text-sm text-slate-500">
            {activeFilter === "all" && !activeRegion ? (
              <>
                No updates detected yet.{" "}
                <Link href="/sources" className="font-medium text-blue-600 hover:underline">
                  Add a source
                </Link>{" "}
                and click Check Now to start monitoring.
              </>
            ) : activeRegion ? (
              `No updates detected yet for ${phRegionLabel[activeRegion]}.`
            ) : (
              `No ${activeFilter} updates detected yet.`
            )}
          </p>
        </Card>
      )}
    </div>
  );
}
