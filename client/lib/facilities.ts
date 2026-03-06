import type { UserFacility } from "@/lib/auth";
import {
  getFacilityById,
  SUPPORTED_COUNTRIES,
  type SupportedCountryCode,
} from "@/data/facilities";

const PROFILE_COUNTRY_TO_FACILITY_CODE: Record<string, SupportedCountryCode> = {
  new_zealand: "NZ",
};

function humanizeFacilityId(facilityId: string) {
  return facilityId
    .replace(/^nz-/, "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function getFacilityCountryCodeFromProfile(
  countryOfPractice: string | null | undefined,
): SupportedCountryCode | null {
  if (!countryOfPractice) {
    return null;
  }

  return PROFILE_COUNTRY_TO_FACILITY_CODE[countryOfPractice] ?? null;
}

export function getDefaultFacilityCountryCode(
  countryOfPractice: string | null | undefined,
): SupportedCountryCode | null {
  const preferredCountryCode =
    getFacilityCountryCodeFromProfile(countryOfPractice);
  if (preferredCountryCode) {
    return preferredCountryCode;
  }

  return SUPPORTED_COUNTRIES[0]?.code ?? null;
}

export function resolveFacilityName(facility: {
  facilityId?: string | null;
  facilityName?: string | null;
}) {
  const storedName = facility.facilityName?.trim();
  if (storedName) {
    return storedName;
  }

  const curatedName = facility.facilityId
    ? getFacilityById(facility.facilityId)?.name
    : undefined;
  if (curatedName) {
    return curatedName;
  }

  if (facility.facilityId) {
    return humanizeFacilityId(facility.facilityId);
  }

  return "Unnamed Hospital";
}

export function normalizeUserFacility(facility: UserFacility): UserFacility {
  return {
    ...facility,
    facilityName: resolveFacilityName(facility),
  };
}
