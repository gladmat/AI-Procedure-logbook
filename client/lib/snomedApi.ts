import { getApiUrl } from "./query-client";
import type { SnomedRefItem, AnatomicalRegion, Specialty } from "@/types/case";

const API_BASE = getApiUrl();

// SNOMED CT Search Result from Snowstorm API
export interface SnomedSearchResult {
  conceptId: string;
  term: string;
  fsn: string;
  active: boolean;
  semanticTag?: string;
}

// Staging system types
export interface StagingOption {
  value: string;
  label: string;
  description?: string;
}

export interface StagingSystem {
  name: string;
  description?: string;
  options: StagingOption[];
}

export interface DiagnosisStagingConfig {
  snomedCtCodes: string[];
  keywords: string[];
  stagingSystems: StagingSystem[];
}

/**
 * Search SNOMED CT procedures using Snowstorm API
 */
export async function searchSnomedProcedures(
  query: string,
  specialty?: Specialty,
  limit: number = 20
): Promise<SnomedSearchResult[]> {
  if (!query || query.length < 2) {
    return [];
  }

  const params = new URLSearchParams({
    q: query,
    limit: String(limit),
  });
  if (specialty) {
    params.set("specialty", specialty);
  }

  const url = new URL(`/api/snomed/procedures?${params.toString()}`, API_BASE);
  const response = await fetch(url.toString());
  if (!response.ok) {
    console.error("Failed to search SNOMED procedures");
    return [];
  }
  return response.json();
}

/**
 * Search SNOMED CT diagnoses using Snowstorm API
 */
export async function searchSnomedDiagnoses(
  query: string,
  specialty?: Specialty,
  limit: number = 20
): Promise<SnomedSearchResult[]> {
  if (!query || query.length < 2) {
    return [];
  }

  const params = new URLSearchParams({
    q: query,
    limit: String(limit),
  });
  if (specialty) {
    params.set("specialty", specialty);
  }

  const url = new URL(`/api/snomed/diagnoses?${params.toString()}`, API_BASE);
  const response = await fetch(url.toString());
  if (!response.ok) {
    console.error("Failed to search SNOMED diagnoses");
    return [];
  }
  return response.json();
}

/**
 * Get staging configuration for a diagnosis
 */
export async function getDiagnosisStaging(
  snomedCode?: string,
  diagnosisName?: string
): Promise<DiagnosisStagingConfig | null> {
  const params = new URLSearchParams();
  if (snomedCode) {
    params.set("snomedCode", snomedCode);
  }
  if (diagnosisName) {
    params.set("diagnosisName", diagnosisName);
  }

  const url = new URL(`/api/staging/diagnosis?${params.toString()}`, API_BASE);
  const response = await fetch(url.toString());
  if (!response.ok) {
    console.error("Failed to fetch staging config");
    return null;
  }
  const data = await response.json();
  return data.stagingSystems?.length > 0 ? data : null;
}

export async function fetchSnomedRefs(
  category?: string,
  anatomicalRegion?: string,
  specialty?: string
): Promise<SnomedRefItem[]> {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (anatomicalRegion) params.set("anatomicalRegion", anatomicalRegion);
  if (specialty) params.set("specialty", specialty);

  const url = new URL(`/api/snomed-ref?${params.toString()}`, API_BASE);
  const response = await fetch(url.toString());
  if (!response.ok) throw new Error("Failed to fetch SNOMED refs");
  return response.json();
}

export async function fetchVesselsByRegion(
  region: AnatomicalRegion,
  vesselType?: "artery" | "vein"
): Promise<SnomedRefItem[]> {
  const params = new URLSearchParams();
  if (vesselType) params.set("subcategory", vesselType);

  const url = new URL(`/api/snomed-ref/vessels/${region}?${params.toString()}`, API_BASE);
  const response = await fetch(url.toString());
  if (!response.ok) throw new Error("Failed to fetch vessels");
  return response.json();
}

export async function fetchAnatomicalRegions(): Promise<SnomedRefItem[]> {
  const url = new URL("/api/snomed-ref/regions", API_BASE);
  const response = await fetch(url.toString());
  if (!response.ok) throw new Error("Failed to fetch regions");
  return response.json();
}

export async function fetchFlapTypes(): Promise<SnomedRefItem[]> {
  const url = new URL("/api/snomed-ref/flap-types", API_BASE);
  const response = await fetch(url.toString());
  if (!response.ok) throw new Error("Failed to fetch flap types");
  return response.json();
}

export async function fetchDonorVessels(flapType: string): Promise<SnomedRefItem[]> {
  const url = new URL(`/api/snomed-ref/donor-vessels/${flapType}`, API_BASE);
  const response = await fetch(url.toString());
  if (!response.ok) throw new Error("Failed to fetch donor vessels");
  return response.json();
}

export async function fetchCompositions(): Promise<SnomedRefItem[]> {
  const url = new URL("/api/snomed-ref/compositions", API_BASE);
  const response = await fetch(url.toString());
  if (!response.ok) throw new Error("Failed to fetch compositions");
  return response.json();
}

export async function fetchCouplingMethods(): Promise<SnomedRefItem[]> {
  const url = new URL("/api/snomed-ref/coupling-methods", API_BASE);
  const response = await fetch(url.toString());
  if (!response.ok) throw new Error("Failed to fetch coupling methods");
  return response.json();
}

export async function fetchAnastomosisConfigs(): Promise<SnomedRefItem[]> {
  const url = new URL("/api/snomed-ref/anastomosis-configs", API_BASE);
  const response = await fetch(url.toString());
  if (!response.ok) throw new Error("Failed to fetch anastomosis configs");
  return response.json();
}
