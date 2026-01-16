import { getApiUrl } from "./query-client";
import type { SnomedRefItem, AnatomicalRegion } from "@/types/case";

const API_BASE = getApiUrl();

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
