import { CloudRain, Droplets, Thermometer, Wind } from "lucide-react";
import { Card } from "@/components/ui/card";
import { timeAgo } from "@/lib/format";
import type { WeatherOverview } from "@/lib/types";

export function WeatherCard({ weather }: { weather: WeatherOverview }) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Weather &middot; {weather.location}
          </p>
          <div className="mt-0.5 flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-navy">
              {weather.temperatureC}&deg;C
            </span>
            <span className="text-sm font-medium text-slate-500">
              {weather.condition}
            </span>
          </div>
        </div>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
          <CloudRain className="h-6 w-6" />
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 text-center">
        <div>
          <dt className="flex items-center justify-center gap-1 text-xs text-slate-400">
            <Droplets className="h-3.5 w-3.5" /> Rain
          </dt>
          <dd className="mt-1 text-sm font-semibold text-navy">
            {weather.rainChancePercent}%
          </dd>
        </div>
        <div>
          <dt className="flex items-center justify-center gap-1 text-xs text-slate-400">
            <Wind className="h-3.5 w-3.5" /> Wind
          </dt>
          <dd className="mt-1 text-sm font-semibold text-navy">
            {weather.windKph} km/h
          </dd>
        </div>
        <div>
          <dt className="flex items-center justify-center gap-1 text-xs text-slate-400">
            <Thermometer className="h-3.5 w-3.5" /> Dir.
          </dt>
          <dd className="mt-1 text-sm font-semibold text-navy">
            {weather.windDirection}
          </dd>
        </div>
      </dl>

      <p className="mt-3 text-xs text-slate-400">
        Updated {timeAgo(weather.lastUpdatedAt)}
      </p>
    </Card>
  );
}

export function WeatherCardSkeleton() {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="animate-pulse">
          <div className="h-3 w-28 rounded bg-slate-200" />
          <div className="mt-2 h-8 w-36 rounded bg-slate-200" />
        </div>
        <span className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-slate-200" />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <div className="h-3 w-10 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-8 animate-pulse rounded bg-slate-200" />
          </div>
        ))}
      </div>
    </Card>
  );
}
