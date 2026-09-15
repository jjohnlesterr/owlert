import type { PhRegionCode } from "@/lib/ph-regions";

export type Severity = "info" | "advisory" | "warning" | "critical";

export type UpdateType = "weather" | "classes" | "school";

export type SourceKind = "official" | "news" | "custom";

export type SourceStatus = "supported" | "limited" | "unsupported";

// Trust is a separate dimension from SourceStatus: status describes *how*
// the content was read (feed vs. HTML fallback vs. failed); trust_level
// describes *who* the domain belongs to and how much that lets a detected
// update be relied on. "limited"/"unsupported" appear in both because
// unreadable content can't be trust-assessed either.
export type TrustLevel =
  | "official"
  | "trusted_news"
  | "verified_organization"
  | "unverified"
  | "limited"
  | "unsupported";

export type ClassStatusValue =
  | "no_announcement"
  | "continue"
  | "suspended"
  | "online"
  | "partial";

export interface SourceRef {
  name: string;
  kind: SourceKind;
  url: string;
  // Only populated for real (non-mock) sources — see lib/sources/trust.ts.
  trustLevel?: TrustLevel;
}

export interface ClassStatusInfo {
  status: ClassStatusValue;
  location: string;
  note: string;
  source: SourceRef | null;
  updatedAt: string;
}

export interface WeatherOverview {
  location: string;
  temperatureC: number;
  condition: string;
  rainChancePercent: number;
  windKph: number;
  windDirection: string;
  lastUpdatedAt: string;
}

export type WeatherFetchResult =
  | { status: "ok"; data: WeatherOverview }
  | { status: "error"; message: string };

export interface AdvisoryInfo {
  title: string;
  severity: Severity;
  summary: string;
  location: string;
  source: SourceRef;
  issuedAt: string;
}

export interface UpdateItem {
  id: string;
  title: string;
  summary: string;
  type: UpdateType;
  // Real detections don't extract severity/location yet — only mock data
  // populates these today. Nullable so UpdateCard can honestly omit them
  // rather than show a fabricated value.
  severity: Severity | null;
  source: SourceRef;
  location: string | null;
  publishedAt: string;
  detectedAt: string;
  originalUrl: string;
}

export type EducationLevel =
  | "elementary"
  | "junior_high"
  | "senior_high"
  | "college"
  | "other";

export interface NotificationPreferences {
  weather: boolean;
  classes: boolean;
  school: boolean;
}

export interface Profile {
  id: string;
  full_name: string;
  school: string | null;
  city: string | null;
  province: string | null;
  education_level: EducationLevel | null;
  notification_preferences: NotificationPreferences;
  // null = "All Regions" (default) — see lib/ph-regions.ts.
  preferred_region: PhRegionCode | null;
  created_at: string;
  updated_at: string;
}

export interface MonitoredSource {
  id: string;
  name: string;
  kind: SourceKind;
  status: SourceStatus;
  monitoringEnabled: boolean;
  notificationsEnabled: boolean;
  lastCheckedAt: string | null;
}

// Real DB rows for a user's monitored sources (Phase 4+) — distinct from
// the mock `MonitoredSource` shape still used on the dashboard preview.
// Covers both user-added custom sources and built-in trusted sources
// (is_builtin = true — see lib/sources/built-in.ts), which share this same
// table/pipeline and are only distinguished by that flag.
export interface SourceRow {
  id: string;
  user_id: string;
  url: string;
  name: string;
  status: SourceStatus;
  trust_level: TrustLevel;
  trust_reason: string | null;
  is_builtin: boolean;
  last_checked_at: string | null;
  created_at: string;
}

export interface SourceUpdateRow {
  id: string;
  source_id: string;
  user_id: string;
  content_hash: string;
  title: string;
  summary: string;
  category: UpdateType;
  severity: Severity | null;
  location: string | null;
  // Region codes the detected content mentions, e.g. ["REGION_III", "NCR"].
  // Empty array when no location could be reliably determined.
  affected_regions: PhRegionCode[];
  // The literal location names matched in the text, e.g. ["Pampanga", "Bulacan"].
  detected_locations: string[];
  original_url: string;
  detected_at: string;
  // The source's own real publish/issue time when an adapter could
  // determine one (RSS pubDate, PAGASA's "Issued at," article meta tags) —
  // null when unavailable. Never guessed. See lib/updates/freshness.ts.
  published_at: string | null;
}
