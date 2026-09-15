import type { PhRegionCode } from "@/lib/ph-regions";

/**
 * Deterministic province/major-city name -> region mapping. No AI, no
 * external geocoding — just a fixed lookup table, per the Phase 5 spec.
 * Not exhaustive down to every municipality, but covers every province plus
 * common aliases and major cities likely to appear in weather/class news.
 */
export const LOCATION_TO_REGION: Record<string, PhRegionCode> = {
  // NCR
  "Metro Manila": "NCR",
  NCR: "NCR",
  Manila: "NCR",
  "Quezon City": "NCR",
  Makati: "NCR",
  Pasig: "NCR",
  Taguig: "NCR",
  Marikina: "NCR",
  Mandaluyong: "NCR",
  Paranaque: "NCR",
  "Las Pinas": "NCR",
  Muntinlupa: "NCR",
  Caloocan: "NCR",
  Malabon: "NCR",
  Navotas: "NCR",
  Valenzuela: "NCR",
  Pasay: "NCR",
  "San Juan": "NCR",
  Pateros: "NCR",

  // CAR
  Abra: "CAR",
  Apayao: "CAR",
  Benguet: "CAR",
  Ifugao: "CAR",
  Kalinga: "CAR",
  "Mountain Province": "CAR",
  Baguio: "CAR",

  // Region I — Ilocos Region
  "Ilocos Norte": "REGION_I",
  "Ilocos Sur": "REGION_I",
  "La Union": "REGION_I",
  Pangasinan: "REGION_I",

  // Region II — Cagayan Valley
  Batanes: "REGION_II",
  Cagayan: "REGION_II",
  Isabela: "REGION_II",
  "Nueva Vizcaya": "REGION_II",
  Quirino: "REGION_II",

  // Region III — Central Luzon
  Aurora: "REGION_III",
  Bataan: "REGION_III",
  Bulacan: "REGION_III",
  "Nueva Ecija": "REGION_III",
  Pampanga: "REGION_III",
  Tarlac: "REGION_III",
  Zambales: "REGION_III",
  "Angeles City": "REGION_III",
  Olongapo: "REGION_III",

  // Region IV-A — CALABARZON
  Batangas: "REGION_IV_A",
  Cavite: "REGION_IV_A",
  Laguna: "REGION_IV_A",
  Quezon: "REGION_IV_A",
  Rizal: "REGION_IV_A",

  // Region IV-B — MIMAROPA
  Marinduque: "REGION_IV_B",
  "Occidental Mindoro": "REGION_IV_B",
  "Oriental Mindoro": "REGION_IV_B",
  Palawan: "REGION_IV_B",
  Romblon: "REGION_IV_B",
  "Puerto Princesa": "REGION_IV_B",

  // Region V — Bicol Region
  Albay: "REGION_V",
  "Camarines Norte": "REGION_V",
  "Camarines Sur": "REGION_V",
  Catanduanes: "REGION_V",
  Masbate: "REGION_V",
  Sorsogon: "REGION_V",
  Legazpi: "REGION_V",
  Naga: "REGION_V",

  // Region VI — Western Visayas
  Aklan: "REGION_VI",
  Antique: "REGION_VI",
  Capiz: "REGION_VI",
  Guimaras: "REGION_VI",
  Iloilo: "REGION_VI",
  "Iloilo City": "REGION_VI",

  // Region VII — Central Visayas
  Bohol: "REGION_VII",
  Cebu: "REGION_VII",
  "Cebu City": "REGION_VII",
  Siquijor: "REGION_VII",
  Mandaue: "REGION_VII",
  "Lapu-Lapu": "REGION_VII",

  // Region VIII — Eastern Visayas
  Biliran: "REGION_VIII",
  "Eastern Samar": "REGION_VIII",
  Leyte: "REGION_VIII",
  "Northern Samar": "REGION_VIII",
  Samar: "REGION_VIII",
  "Southern Leyte": "REGION_VIII",
  Tacloban: "REGION_VIII",

  // Region IX — Zamboanga Peninsula
  "Zamboanga del Norte": "REGION_IX",
  "Zamboanga del Sur": "REGION_IX",
  "Zamboanga Sibugay": "REGION_IX",
  "Zamboanga City": "REGION_IX",

  // Region X — Northern Mindanao
  Bukidnon: "REGION_X",
  Camiguin: "REGION_X",
  "Lanao del Norte": "REGION_X",
  "Misamis Occidental": "REGION_X",
  "Misamis Oriental": "REGION_X",
  "Cagayan de Oro": "REGION_X",
  Iligan: "REGION_X",

  // Region XI — Davao Region
  "Davao de Oro": "REGION_XI",
  "Davao del Norte": "REGION_XI",
  "Davao del Sur": "REGION_XI",
  "Davao Occidental": "REGION_XI",
  "Davao Oriental": "REGION_XI",
  "Davao City": "REGION_XI",

  // Region XII — SOCCSKSARGEN
  Cotabato: "REGION_XII",
  "North Cotabato": "REGION_XII",
  Sarangani: "REGION_XII",
  "South Cotabato": "REGION_XII",
  "Sultan Kudarat": "REGION_XII",
  "General Santos": "REGION_XII",
  Koronadal: "REGION_XII",

  // Region XIII — Caraga
  "Agusan del Norte": "REGION_XIII",
  "Agusan del Sur": "REGION_XIII",
  "Dinagat Islands": "REGION_XIII",
  "Surigao del Norte": "REGION_XIII",
  "Surigao del Sur": "REGION_XIII",
  Butuan: "REGION_XIII",

  // BARMM
  Basilan: "BARMM",
  "Lanao del Sur": "BARMM",
  "Maguindanao del Norte": "BARMM",
  "Maguindanao del Sur": "BARMM",
  Maguindanao: "BARMM",
  Sulu: "BARMM",
  "Tawi-Tawi": "BARMM",
  "Cotabato City": "BARMM",

  // NIR — Negros Island Region
  "Negros Occidental": "NIR",
  "Negros Oriental": "NIR",
  Bacolod: "NIR",
  Dumaguete: "NIR",
};

// Longest names first so "Metro Manila" is tried before shorter overlapping
// names — doesn't change correctness (both map to NCR either way) but keeps
// detected_locations output closer to what a person would actually say.
const LOCATION_NAMES = Object.keys(LOCATION_TO_REGION).sort(
  (a, b) => b.length - a.length,
);

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Deterministic text matching only — no AI, no fuzzy matching. Returns the
 * canonical location names (as they appear in LOCATION_TO_REGION) found as
 * whole-word matches in the given text.
 */
export function extractLocations(text: string): string[] {
  const found: string[] = [];
  for (const name of LOCATION_NAMES) {
    const pattern = new RegExp(`\\b${escapeRegExp(name)}\\b`, "i");
    if (pattern.test(text)) {
      found.push(name);
    }
  }
  return found;
}

export function mapLocationsToRegions(locations: string[]): PhRegionCode[] {
  const regions = new Set<PhRegionCode>();
  for (const location of locations) {
    const region = LOCATION_TO_REGION[location];
    if (region) regions.add(region);
  }
  return Array.from(regions);
}
