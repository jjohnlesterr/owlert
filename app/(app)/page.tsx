import { Bell, ListChecks } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { StatusCard } from "@/components/dashboard/status-card";
import { UpdateCard } from "@/components/dashboard/update-card";
import { UpdateListItem } from "@/components/dashboard/update-list-item";
import { WeatherSection } from "@/components/dashboard/weather-section";
import { WeatherCardSkeleton } from "@/components/dashboard/weather-card";
import { Card } from "@/components/ui/card";
import { getAuthUser } from "@/lib/dal";
import { getClassStatus } from "@/lib/class-status";
import { createClient } from "@/lib/supabase/server";
import { toUpdateItem, type SourceUpdateWithSource } from "@/lib/sources/to-update-item";
import { resolveRowRegions } from "@/lib/sources/resolve-region";
import { historyWindowStart } from "@/lib/updates/window";
import type { PhRegionCode } from "@/lib/ph-regions";

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
    profile?.full_name?.trim().split(" ")[0] ||
    user.email?.split("@")[0] ||
    "there";
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

  const [classStatus, { data: latestUpdateRows }] = await Promise.all([
    getClassStatus(user.id, locationLabel),
    latestUpdatesQuery.returns<SourceUpdateWithSource[]>(),
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

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      {/* Full-bleed on mobile — bleeds past <main>'s px-4/-mt-2 so the hero
          starts flush at the very top with only large bottom corners; reverts
          to a normal inset rounded card once <main>'s own padding kicks in
          at sm+. The logoname+bell row here replaces the generic app header
          for this page only (see components/nav/app-shell.tsx). */}
      <div className="relative -mx-4 -mt-2 overflow-hidden rounded-b-3xl bg-gradient-to-br from-navy via-navy to-navy-deep sm:mx-0 sm:mt-0 sm:rounded-3xl">
        {/* One restrained accent glow — bee yellow, not blue-on-blue */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-[var(--color-bee-yellow)]/10 blur-3xl"
        />

        {/* Mobile-only top row: replaces the generic header for Home so the
            hero itself is the top of the page. Desktop keeps its sidebar
            branding and just gets the standalone bell below. */}
        <div className="flex items-center justify-between px-5 pt-6 md:hidden">
          <Image
            src="/mascot/beealert-logoname-trimmed.png"
            alt="BeeAlert"
            width={150}
            height={40}
            priority
            className="h-7 w-auto object-contain"
          />
          <button
            type="button"
            aria-label="Notifications"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-colors hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <Bell className="h-[18px] w-[18px]" />
          </button>
        </div>

        <button
          type="button"
          aria-label="Notifications"
          className="absolute right-5 top-5 z-10 hidden h-9 w-9 items-center justify-center rounded-full bg-white text-navy shadow-sm transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:flex"
        >
          <Bell className="h-4 w-4" />
        </button>

        {/* Text stays left and keeps its own right padding at every
            breakpoint so the corner-anchored mascot never sits over it —
            no stack-then-switch-to-row, the composition is the same shape
            from mobile up, just smaller. */}
        <div className="relative px-5 pb-9 pt-5 pr-32 sm:px-7 sm:py-8 sm:pr-40 md:px-9 md:py-9 md:pr-48">
          <p className="text-xs font-medium text-slate-300 sm:text-sm">
            Welcome back, {displayName}
          </p>
          <h1 className="mt-1.5 text-2xl font-semibold text-white">
            Weather &amp; class updates
          </h1>
          <p className="mt-2 text-xs text-slate-300 sm:text-sm">
            Verified local alerts at a glance.
          </p>
        </div>

        {/* Mascot peeks in from the bottom-right corner. A radial mask
            fades out its own flat background near the top-left of the
            image so it blends into the gradient instead of showing as a
            dark box — the bee itself sits inside the visible portion. */}
        <div
          className="pointer-events-none absolute bottom-0 right-1 h-36 w-36 sm:h-40 sm:w-40 md:h-44 md:w-44 [mask-image:radial-gradient(circle_at_bottom_right,black_58%,transparent_98%)] [-webkit-mask-image:radial-gradient(circle_at_bottom_right,black_58%,transparent_98%)]"
        >
          <Image
            src="/mascot/beealert-banner.png"
            alt="BeeAlert the bee mascot"
            fill
            sizes="(min-width: 768px) 176px, (min-width: 640px) 144px, 128px"
            className="object-contain object-bottom"
            priority
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
        <StatusCard status={classStatus} />
        <Suspense fallback={<WeatherCardSkeleton />}>
          <WeatherSection city={profile?.city ?? null} province={profile?.province ?? null} />
        </Suspense>
      </div>

      <section>
        <div className="mb-2.5 flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-base font-semibold text-navy">
            <ListChecks className="h-4 w-4 text-slate-400" />
            Latest Updates
          </h2>
          <Link
            href="/updates"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            See all
          </Link>
        </div>
        {latestUpdates.length > 0 ? (
          <>
            <div className="flex flex-col gap-2.5 md:hidden">
              {latestUpdates.map((update) => (
                <UpdateListItem key={update.id} update={update} />
              ))}
            </div>
            <div className="hidden md:grid md:grid-cols-2 md:gap-4">
              {latestUpdates.map((update) => (
                <UpdateCard key={update.id} update={update} />
              ))}
            </div>
          </>
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
    </div>
  );
}
