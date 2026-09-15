"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PH_REGIONS } from "@/lib/ph-regions";

/**
 * Temporary, URL-driven region filter for the Updates page. Changing it
 * never touches the user's saved profiles.preferred_region — it only
 * updates the `region` query param for this view.
 */
export function RegionFilterSelect({ current }: { current: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <label className="flex items-center gap-2 text-sm text-slate-600">
      <span className="hidden sm:inline">Region:</span>
      <select
        value={current}
        onChange={(event) => {
          const params = new URLSearchParams(searchParams.toString());
          if (event.target.value) {
            params.set("region", event.target.value);
          } else {
            params.delete("region");
          }
          const query = params.toString();
          router.push(query ? `${pathname}?${query}` : pathname);
        }}
        className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-navy focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
      >
        <option value="">All Regions</option>
        {PH_REGIONS.map((region) => (
          <option key={region.code} value={region.code}>
            {region.label}
          </option>
        ))}
      </select>
    </label>
  );
}
