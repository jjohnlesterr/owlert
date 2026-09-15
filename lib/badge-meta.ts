import type { BadgeTone } from "@/components/ui/badge";
import type { Severity, SourceKind, SourceStatus, TrustLevel } from "@/lib/types";

export const sourceKindLabel: Record<SourceKind, string> = {
  official: "Official",
  news: "News",
  custom: "Custom",
};

export const sourceKindTone: Record<SourceKind, BadgeTone> = {
  official: "official",
  news: "news",
  custom: "custom",
};

export const severityLabel: Record<Severity, string> = {
  info: "Info",
  advisory: "Advisory",
  warning: "Warning",
  critical: "Critical",
};

export const severityTone: Record<Severity, BadgeTone> = {
  info: "info",
  advisory: "warning",
  warning: "warning",
  critical: "critical",
};

export const sourceStatusLabel: Record<SourceStatus, string> = {
  supported: "Supported",
  limited: "Limited",
  unsupported: "Unsupported",
};

export const sourceStatusTone: Record<SourceStatus, BadgeTone> = {
  supported: "safe",
  limited: "warning",
  unsupported: "critical",
};

/** Friendlier "monitoring capability" phrasing used on Trusted Source cards. */
export const monitoringCapabilityLabel: Record<SourceStatus, string> = {
  supported: "Full Monitoring",
  limited: "Limited Monitoring",
  unsupported: "Unsupported",
};

export const trustLevelLabel: Record<TrustLevel, string> = {
  official: "Official",
  trusted_news: "Trusted News",
  verified_organization: "Verified Org",
  unverified: "Unverified",
  limited: "Limited",
  unsupported: "Unsupported",
};

export const trustLevelTone: Record<TrustLevel, BadgeTone> = {
  official: "safe",
  trusted_news: "info",
  verified_organization: "info",
  unverified: "neutral",
  limited: "warning",
  unsupported: "critical",
};

/** Stronger icon-circle surface colors for card headers (vs. the softer Badge tones). */
export const toneIconSurface: Partial<Record<BadgeTone, string>> = {
  safe: "bg-green-100 text-green-600",
  warning: "bg-amber-100 text-amber-600",
  critical: "bg-red-100 text-red-600",
  info: "bg-blue-100 text-blue-600",
  neutral: "bg-slate-100 text-slate-500",
};
