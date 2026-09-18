import { CloudOff, MapPin } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { WeatherCard } from "@/components/dashboard/weather-card";
import { getWeatherForLocation } from "@/lib/weather/open-meteo";

function MissingLocationCard() {
  return (
    <Card compact>
      <div className="flex items-start gap-2.5 sm:gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 sm:h-11 sm:w-11">
          <MapPin className="h-5 w-5 sm:h-6 sm:w-6" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400 sm:text-xs">
            Weather
          </p>
          <h3 className="mt-0.5 text-sm font-semibold text-navy">
            Add your location for local weather
          </h3>
          <p className="mt-1 line-clamp-2 text-xs text-slate-600 sm:text-sm">
            Set your city and province in your profile.
          </p>
          <Link
            href="/profile"
            className="mt-1.5 inline-block text-xs font-medium text-blue-600 hover:underline sm:text-sm"
          >
            Go to Profile
          </Link>
        </div>
      </div>
    </Card>
  );
}

function WeatherErrorCard({ message }: { message: string }) {
  return (
    <Card compact>
      <div className="flex items-start gap-2.5 sm:gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 sm:h-11 sm:w-11">
          <CloudOff className="h-5 w-5 sm:h-6 sm:w-6" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400 sm:text-xs">
            Weather
          </p>
          <h3 className="mt-0.5 text-sm font-semibold text-navy">
            Weather unavailable
          </h3>
          <p className="mt-1 line-clamp-2 text-xs text-slate-600 sm:text-sm">
            {message}
          </p>
        </div>
      </div>
    </Card>
  );
}

export async function WeatherSection({
  city,
  province,
}: {
  city: string | null;
  province: string | null;
}) {
  if (!city || !province) {
    return <MissingLocationCard />;
  }

  const result = await getWeatherForLocation(city, province);

  if (result.status === "error") {
    return <WeatherErrorCard message={result.message} />;
  }

  return <WeatherCard weather={result.data} />;
}
