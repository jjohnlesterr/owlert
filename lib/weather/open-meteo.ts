import "server-only";

import { describeWeatherCode } from "@/lib/weather/wmo-codes";
import type { WeatherFetchResult } from "@/lib/types";

// Open-Meteo: free, no API key required (fair-use limit is far beyond a
// hackathon demo's needs). Chosen over key-based providers specifically to
// avoid an extra .env.local variable and signup step — see PLAN.md /
// SKILLS.md for the "simplest reliable option" priority.
const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

const FETCH_TIMEOUT_MS = 8000;
const PH_UTC_OFFSET = "+08:00"; // Asia/Manila has no daylight saving.

interface GeocodeCandidate {
  latitude: number;
  longitude: number;
  name: string;
  admin1?: string;
  admin2?: string;
  admin3?: string;
  country_code?: string;
}

interface ResolvedLocation {
  latitude: number;
  longitude: number;
  displayName: string;
}

// Open-Meteo's geocoder returns official region names ("National Capital
// Region") while PH users commonly write their province as "Metro Manila" —
// without this, province disambiguation would silently fail for the most
// common demo case.
const PROVINCE_ALIASES: Record<string, string[]> = {
  "metro manila": ["national capital region", "ncr"],
  ncr: ["national capital region", "metro manila"],
};

function provinceMatches(
  regions: Array<string | undefined>,
  province: string,
): boolean {
  const target = province.trim().toLowerCase();
  const aliases = PROVINCE_ALIASES[target] ?? [];
  return regions.some((region) => {
    if (!region) return false;
    const regionLower = region.toLowerCase();
    return (
      regionLower.includes(target) ||
      aliases.some((alias) => regionLower.includes(alias))
    );
  });
}

async function geocode(
  city: string,
  province: string,
): Promise<ResolvedLocation | null> {
  const url = new URL(GEOCODING_URL);
  url.searchParams.set("name", city);
  url.searchParams.set("count", "10");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");
  url.searchParams.set("country", "PH");

  const res = await fetch(url, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    // City/province coordinates never change — cache generously.
    next: { revalidate: 60 * 60 * 24 },
  });

  if (!res.ok) return null;

  const body = (await res.json()) as { results?: GeocodeCandidate[] };
  const candidates = (body.results ?? []).filter(
    (r) => r.country_code === "PH",
  );
  if (candidates.length === 0) return null;

  const match =
    candidates.find((r) =>
      provinceMatches([r.admin1, r.admin2, r.admin3], province),
    ) ?? candidates[0];

  return {
    latitude: match.latitude,
    longitude: match.longitude,
    displayName: `${match.name}, ${match.admin1 ?? province}`,
  };
}

interface OpenMeteoResponse {
  current?: {
    time: string;
    temperature_2m: number;
    weather_code: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
  };
  hourly?: {
    time: string[];
    precipitation_probability: number[];
  };
}

function degreesToCompass(deg: number): string {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return directions[Math.round(deg / 45) % 8];
}

function findRainChance(
  currentTime: string,
  hourly: OpenMeteoResponse["hourly"],
): number {
  if (!hourly) return 0;
  // `current.time` has 15-minute granularity (e.g. "…T14:15") but `hourly.time`
  // is only on the hour (e.g. "…T14:00") — match on the hour bucket, not the
  // exact timestamp, otherwise this almost always misses and silently falls
  // back to the wrong hour.
  const hourBucket = `${currentTime.slice(0, 13)}:00`;
  const index = hourly.time.indexOf(hourBucket);
  const value = hourly.precipitation_probability[index === -1 ? 0 : index];
  return value ?? 0;
}

async function fetchForecast(latitude: number, longitude: number) {
  const url = new URL(FORECAST_URL);
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set(
    "current",
    "temperature_2m,weather_code,wind_speed_10m,wind_direction_10m",
  );
  url.searchParams.set("hourly", "precipitation_probability");
  url.searchParams.set("forecast_days", "1");
  url.searchParams.set("timezone", "Asia/Manila");

  const res = await fetch(url, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    // Fresh enough for a dashboard, gentle enough not to hammer the API.
    next: { revalidate: 15 * 60 },
  });

  if (!res.ok) return null;

  const body = (await res.json()) as OpenMeteoResponse;
  if (!body.current) return null;

  return {
    // Open-Meteo returns local time with no offset (e.g. "2026-09-15T14:00")
    // since we requested timezone=Asia/Manila — pin the offset explicitly so
    // Date parsing doesn't silently treat it as the server's own timezone.
    isoTime: `${body.current.time}:00${PH_UTC_OFFSET}`,
    temperatureC: Math.round(body.current.temperature_2m),
    condition: describeWeatherCode(body.current.weather_code),
    windKph: Math.round(body.current.wind_speed_10m),
    windDirection: degreesToCompass(body.current.wind_direction_10m),
    rainChancePercent: Math.round(
      findRainChance(body.current.time, body.hourly),
    ),
  };
}

const UNAVAILABLE_MESSAGE =
  "Weather service is temporarily unavailable. Please try again shortly.";

export async function getWeatherForLocation(
  city: string,
  province: string,
): Promise<WeatherFetchResult> {
  try {
    const location = await geocode(city, province);
    if (!location) {
      return {
        status: "error",
        message: `We couldn't find "${city}, ${province}" on the map. Double-check your city and province in your profile.`,
      };
    }

    const forecast = await fetchForecast(location.latitude, location.longitude);
    if (!forecast) {
      return { status: "error", message: UNAVAILABLE_MESSAGE };
    }

    return {
      status: "ok",
      data: {
        location: location.displayName,
        temperatureC: forecast.temperatureC,
        condition: forecast.condition,
        rainChancePercent: forecast.rainChancePercent,
        windKph: forecast.windKph,
        windDirection: forecast.windDirection,
        lastUpdatedAt: forecast.isoTime,
      },
    };
  } catch {
    return { status: "error", message: UNAVAILABLE_MESSAGE };
  }
}
