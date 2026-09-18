import { CloudRain, Droplets, Thermometer, Wind } from "lucide-react";
import { Card } from "@/components/ui/card";
import { timeAgo } from "@/lib/format";
import type { WeatherOverview } from "@/lib/types";

export function WeatherCard({ weather }: { weather: WeatherOverview }) {
  return (
    <Card compact>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-medium uppercase tracking-wide text-slate-400 sm:text-xs">
            Weather &middot; {weather.location}
          </p>
          <div className="mt-0.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-semibold text-navy sm:text-3xl">
              {weather.temperatureC}&deg;C
            </span>
            <span className="truncate text-xs font-medium text-slate-500 sm:text-sm">
              {weather.condition}
            </span>
          </div>
        </div>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 sm:h-11 sm:w-11">
          <CloudRain className="h-5 w-5 sm:h-6 sm:w-6" />
        </span>
      </div>

      <dl className="mt-3 grid grid-cols-3 gap-1.5 border-t border-slate-100 pt-3 text-center sm:mt-4 sm:gap-2 sm:pt-4">
        <div>
          <dt className="flex items-center justify-center gap-1 text-[10px] text-slate-400 sm:text-xs">
            <Droplets className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Rain
          </dt>
          <dd className="mt-1 text-xs font-semibold text-navy sm:text-sm">
            {weather.rainChancePercent}%
          </dd>
        </div>
        <div>
          <dt className="flex items-center justify-center gap-1 text-[10px] text-slate-400 sm:text-xs">
            <Wind className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Wind
          </dt>
          <dd className="mt-1 text-xs font-semibold text-navy sm:text-sm">
            {weather.windKph} km/h
          </dd>
        </div>
        <div>
          <dt className="flex items-center justify-center gap-1 text-[10px] text-slate-400 sm:text-xs">
            <Thermometer className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Dir.
          </dt>
          <dd className="mt-1 text-xs font-semibold text-navy sm:text-sm">
            {weather.windDirection}
          </dd>
        </div>
      </dl>

      <p className="mt-2 text-[11px] text-slate-400 sm:mt-3 sm:text-xs">
        Updated {timeAgo(weather.lastUpdatedAt)}
      </p>
    </Card>
  );
}

export function WeatherCardSkeleton() {
  return (
    <Card compact>
      <div className="flex items-start justify-between">
        <div className="animate-pulse">
          <div className="h-2.5 w-24 rounded bg-slate-200" />
          <div className="mt-2 h-7 w-32 rounded bg-slate-200" />
        </div>
        <span className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-slate-200 sm:h-11 sm:w-11" />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-1.5 border-t border-slate-100 pt-3 sm:mt-4 sm:gap-2 sm:pt-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <div className="h-2.5 w-9 animate-pulse rounded bg-slate-200" />
            <div className="h-3.5 w-7 animate-pulse rounded bg-slate-200" />
          </div>
        ))}
      </div>
    </Card>
  );
}
