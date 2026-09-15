import { CloudOff, MapPin } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { WeatherCard } from "@/components/dashboard/weather-card";
import { getWeatherForLocation } from "@/lib/weather/open-meteo";

function MissingLocationCard() {
  return (
    <Card>
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          <MapPin className="h-6 w-6" />
        </span>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Weather
          </p>
          <h3 className="mt-0.5 text-sm font-semibold text-navy">
            Add your location to see local weather
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Set your city and province in your profile and we&apos;ll show
            weather for your area.
          </p>
          <Link
            href="/profile"
            className="mt-2 inline-block text-sm font-medium text-blue-600 hover:underline"
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
    <Card>
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          <CloudOff className="h-6 w-6" />
        </span>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Weather
          </p>
          <h3 className="mt-0.5 text-sm font-semibold text-navy">
            Weather unavailable right now
          </h3>
          <p className="mt-1 text-sm text-slate-600">{message}</p>
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
