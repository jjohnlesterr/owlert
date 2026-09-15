import { Bell } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AdvisoryCard } from "@/components/dashboard/advisory-card";
import { SourceCard } from "@/components/dashboard/source-card";
import { StatusCard } from "@/components/dashboard/status-card";
import { UpdateCard } from "@/components/dashboard/update-card";
import { WeatherSection } from "@/components/dashboard/weather-section";
import { WeatherCardSkeleton } from "@/components/dashboard/weather-card";
import { Card } from "@/components/ui/card";
import { getAuthUser } from "@/lib/dal";
import { getClassStatus } from "@/lib/class-status";
import { createClient } from "@/lib/supabase/server";
import { mockAdvisory } from "@/lib/mock-data";
import { toUpdateItem, type SourceUpdateWithSource } from "@/lib/sources/to-update-item";
import { resolveRowRegions } from "@/lib/sources/resolve-region";
import { historyWindowStart } from "@/lib/updates/window";
import type { PhRegionCode } from "@/lib/ph-regions";
import type { MonitoredSource, SourceRow } from "@/lib/types";

const LATEST_UPDATES_LIMIT = 5;
const HISTORY_WINDOW_DAYS = 7;

export default async function HomePage() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/login");
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, city, province, preferred_region")
    .eq("id", user.id)
    .maybeSingle<{
      full_name: string;
      city: string | null;
      province: string | null;
      preferred_region: PhRegionCode | null;
    }>();

  const displayName =
    profile?.full_name?.trim() || user.email?.split("@")[0] || "there";
  const locationLabel = profile?.city?.trim() || "your area";

  // Dashboard Latest Updates always respects the user's saved region
  // preference (no temp filter UI here — that's the Updates page), and the
  // same 7-day recent-history window as the Updates page. Region filtering
  // happens in JS via resolveRowRegions rather than a DB-level `.contains()`
  // — see app/(app)/updates/page.tsx for why (empty affected_regions on
  // some real rows would otherwise hide legitimate updates).
  const windowStart = historyWindowStart(HISTORY_WINDOW_DAYS);

  const latestUpdatesQuery = supabase
    .from("source_updates")
    .select("*, source:sources(name, trust_level)")
    .eq("user_id", user.id)
    .gte("detected_at", windowStart)
    .order("detected_at", { ascending: false })
    .limit(50);

  const [classStatus, { data: latestUpdateRows }, { data: latestSourceRows }] =
    await Promise.all([
      getClassStatus(user.id, locationLabel),
      latestUpdatesQuery.returns<SourceUpdateWithSource[]>(),
      supabase
        .from("sources")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(3)
        .returns<SourceRow[]>(),
    ]);

  const preferredRegion = profile?.preferred_region ?? null;
  const filteredUpdateRows = preferredRegion
    ? (latestUpdateRows ?? []).filter((row) =>
        resolveRowRegions(row).includes(preferredRegion),
      )
    : (latestUpdateRows ?? []);

  const latestUpdates = filteredUpdateRows
    .slice(0, LATEST_UPDATES_LIMIT)
    .map(toUpdateItem);
  const sourcesPreview: MonitoredSource[] = (latestSourceRows ?? []).map(
    (row) => ({
      id: row.id,
      name: row.name,
      kind: "custom",
      status: row.status,
      monitoringEnabled: true,
      notificationsEnabled: true,
      lastCheckedAt: row.last_checked_at,
    }),
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-teal-600">
        {/* Subtle brand glow accents — no hard image edges, just soft color */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-teal-300/25 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-12 left-4 h-36 w-36 rounded-full bg-blue-300/20 blur-3xl"
        />

        <button
          type="button"
          aria-label="Notifications"
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25 sm:right-5 sm:top-5"
        >
          <Bell className="h-4 w-4" />
        </button>

        {/* Text stays left and keeps its own right padding at every
            breakpoint so the corner-anchored mascot never sits over it —
            no stack-then-switch-to-row, the composition is the same shape
            from mobile up, just smaller. */}
        <div className="relative px-5 py-6 pr-28 sm:px-8 sm:py-9 sm:pr-44 md:px-10 md:py-11 md:pr-52">
          <p className="text-sm font-medium text-blue-100">
            Welcome back, {displayName}
          </p>
          <h1 className="mt-1 text-xl font-semibold text-white sm:text-2xl md:text-3xl">
            Here&apos;s today&apos;s weather &amp; class update
          </h1>
          <p className="mt-2 text-sm text-blue-50/90 sm:max-w-sm sm:text-base">
            Trusted weather advisories and school/class alerts from the
            sources you monitor — all in one place.
          </p>
        </div>

        {/* Mascot peeks in from the bottom-right corner. A radial mask
            fades out its own flat background near the top-left of the
            image so it blends into the gradient instead of showing as a
            dark box — the owl itself sits inside the visible portion. */}
        <div
          className="pointer-events-none absolute bottom-0 right-1 h-28 w-24 sm:h-40 sm:w-36 md:h-48 md:w-44 [mask-image:radial-gradient(circle_at_bottom_right,black_58%,transparent_98%)] [-webkit-mask-image:radial-gradient(circle_at_bottom_right,black_58%,transparent_98%)]"
        >
          <Image
            src="/mascot/owlert-default.png"
            alt="Owlert the owl mascot"
            fill
            sizes="(min-width: 768px) 176px, (min-width: 640px) 144px, 96px"
            className="object-contain object-bottom"
            priority
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
        <StatusCard status={classStatus} />
        <Suspense fallback={<WeatherCardSkeleton />}>
          <WeatherSection city={profile?.city ?? null} province={profile?.province ?? null} />
        </Suspense>
      </div>

      <AdvisoryCard advisory={mockAdvisory} />

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-navy">Latest Updates</h2>
          <Link
            href="/updates"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            See all
          </Link>
        </div>
        {latestUpdates.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {latestUpdates.map((update) => (
              <UpdateCard key={update.id} update={update} />
            ))}
          </div>
        ) : (
          <Card>
            <p className="text-sm text-slate-500">
              {profile?.preferred_region ? (
                <>
                  No updates detected yet for your preferred region. Check{" "}
                  <Link href="/updates" className="font-medium text-blue-600 hover:underline">
                    Updates
                  </Link>{" "}
                  with a different region, or add more sources.
                </>
              ) : (
                <>
                  No updates detected yet.{" "}
                  <Link href="/sources" className="font-medium text-blue-600 hover:underline">
                    Add a source
                  </Link>{" "}
                  and check it for weather-related updates.
                </>
              )}
            </p>
          </Card>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-navy">
            Monitored Sources
          </h2>
          <Link
            href="/sources"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            View Sources
          </Link>
        </div>
        {sourcesPreview.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {sourcesPreview.map((source) => (
              <SourceCard key={source.id} source={source} compact />
            ))}
          </div>
        ) : (
          <Card>
            <p className="text-sm text-slate-500">
              You haven&apos;t added any sources yet.{" "}
              <Link href="/sources" className="font-medium text-blue-600 hover:underline">
                Add a Source
              </Link>
            </p>
          </Card>
        )}
      </section>
    </div>
  );
}
