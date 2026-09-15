export const PH_REGIONS = [
  { code: "NCR", label: "NCR — National Capital Region" },
  { code: "CAR", label: "CAR — Cordillera Administrative Region" },
  { code: "REGION_I", label: "Region I — Ilocos Region" },
  { code: "REGION_II", label: "Region II — Cagayan Valley" },
  { code: "REGION_III", label: "Region III — Central Luzon" },
  { code: "REGION_IV_A", label: "Region IV-A — CALABARZON" },
  { code: "REGION_IV_B", label: "Region IV-B — MIMAROPA" },
  { code: "REGION_V", label: "Region V — Bicol Region" },
  { code: "REGION_VI", label: "Region VI — Western Visayas" },
  { code: "REGION_VII", label: "Region VII — Central Visayas" },
  { code: "REGION_VIII", label: "Region VIII — Eastern Visayas" },
  { code: "REGION_IX", label: "Region IX — Zamboanga Peninsula" },
  { code: "REGION_X", label: "Region X — Northern Mindanao" },
  { code: "REGION_XI", label: "Region XI — Davao Region" },
  { code: "REGION_XII", label: "Region XII — SOCCSKSARGEN" },
  { code: "REGION_XIII", label: "Region XIII — Caraga" },
  { code: "BARMM", label: "BARMM" },
  { code: "NIR", label: "NIR — Negros Island Region" },
] as const;

export type PhRegionCode = (typeof PH_REGIONS)[number]["code"];

export const PH_REGION_CODES: PhRegionCode[] = PH_REGIONS.map((r) => r.code);

export const phRegionLabel: Record<PhRegionCode, string> = Object.fromEntries(
  PH_REGIONS.map((r) => [r.code, r.label]),
) as Record<PhRegionCode, string>;

export function isPhRegionCode(value: string): value is PhRegionCode {
  return (PH_REGION_CODES as string[]).includes(value);
}
