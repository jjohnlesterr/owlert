import type { AdvisoryInfo, SourceRef } from "@/lib/types";

// NOTE: mockAdvisory is the one remaining mock/sample value in the app —
// the Active Weather Advisory card is illustrative only until PAGASA-style
// official advisories are ingested as a real monitored source (see
// PLAN.md). Everything else on the dashboard (weather, class status,
// updates, sources) is real as of Phase 3C.

const hoursAgo = (h: number) => new Date(Date.now() - h * 60 * 60 * 1000).toISOString();

const pagasaSource: SourceRef = {
  name: "PAGASA",
  kind: "official",
  url: "https://www.pagasa.dost.gov.ph/weather",
};

export const mockAdvisory: AdvisoryInfo = {
  title: "Yellow Rainfall Warning",
  severity: "warning",
  summary:
    "Moderate to heavy rainfall expected over Metro Manila and nearby provinces within the next 3 hours due to the southwest monsoon (habagat). Flooding is possible in low-lying areas.",
  location: "Metro Manila",
  source: pagasaSource,
  issuedAt: hoursAgo(1.5),
};
