import { z } from "zod";

export const PROFESSIONAL_REGISTRATION_OPTIONS = [
  {
    id: "new_zealand",
    label: "New Zealand",
    authority: "MCNZ",
    placeholder: "Enter MCNZ number",
  },
  {
    id: "australia",
    label: "Australia",
    authority: "AHPRA",
    placeholder: "Enter AHPRA number",
  },
  {
    id: "poland",
    label: "Poland",
    authority: "PWZ",
    placeholder: "Enter PWZ number",
  },
  {
    id: "switzerland",
    label: "Switzerland",
    authority: "MEBEKO",
    placeholder: "Enter MEBEKO number",
  },
  {
    id: "united_kingdom",
    label: "United Kingdom",
    authority: "GMC",
    placeholder: "Enter GMC number",
  },
  {
    id: "united_states",
    label: "United States",
    authority: "State licence / NPI",
    placeholder: "Enter licence or NPI",
  },
  {
    id: "other",
    label: "Other jurisdiction",
    authority: "Other",
    placeholder: "Enter registration number",
  },
] as const;

export type ProfessionalRegistrationJurisdiction =
  (typeof PROFESSIONAL_REGISTRATION_OPTIONS)[number]["id"];

export type ProfessionalRegistrations = Partial<
  Record<ProfessionalRegistrationJurisdiction, string>
>;

export const professionalRegistrationsSchema = z
  .object({
    new_zealand: z.string().trim().max(64).nullable().optional(),
    australia: z.string().trim().max(64).nullable().optional(),
    poland: z.string().trim().max(64).nullable().optional(),
    switzerland: z.string().trim().max(64).nullable().optional(),
    united_kingdom: z.string().trim().max(64).nullable().optional(),
    united_states: z.string().trim().max(64).nullable().optional(),
    other: z.string().trim().max(64).nullable().optional(),
  })
  .strict();

type ProfessionalRegistrationsInput =
  | Partial<Record<ProfessionalRegistrationJurisdiction, string | null>>
  | null
  | undefined;

function cleanRegistrationNumber(
  value: string | null | undefined,
): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function normalizeProfessionalRegistrations(
  registrations: ProfessionalRegistrationsInput,
): ProfessionalRegistrations | undefined {
  if (!registrations) {
    return undefined;
  }

  const normalized: ProfessionalRegistrations = {};

  for (const option of PROFESSIONAL_REGISTRATION_OPTIONS) {
    const value = cleanRegistrationNumber(registrations[option.id]);
    if (value) {
      normalized[option.id] = value;
    }
  }

  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

export function getRegistrationJurisdictionForCountry(
  countryOfPractice: string | null | undefined,
): ProfessionalRegistrationJurisdiction | undefined {
  switch (countryOfPractice) {
    case "new_zealand":
      return "new_zealand";
    case "australia":
      return "australia";
    case "poland":
      return "poland";
    case "united_kingdom":
      return "united_kingdom";
    case "united_states":
      return "united_states";
    default:
      return undefined;
  }
}

export function getProfessionalRegistrations(
  registrations: ProfessionalRegistrationsInput,
  legacyMedicalCouncilNumber?: string | null,
  countryOfPractice?: string | null,
): ProfessionalRegistrations | undefined {
  const normalized = normalizeProfessionalRegistrations(registrations);
  if (normalized) {
    return normalized;
  }

  const legacyNumber = cleanRegistrationNumber(legacyMedicalCouncilNumber);
  if (!legacyNumber) {
    return undefined;
  }

  const fallbackJurisdiction =
    getRegistrationJurisdictionForCountry(countryOfPractice) ?? "other";

  return {
    [fallbackJurisdiction]: legacyNumber,
  };
}

export function getLegacyMedicalCouncilNumber(
  registrations: ProfessionalRegistrationsInput,
  countryOfPractice?: string | null,
): string | null {
  const normalized = normalizeProfessionalRegistrations(registrations);
  if (!normalized) {
    return null;
  }

  const primaryJurisdiction =
    getRegistrationJurisdictionForCountry(countryOfPractice);
  if (primaryJurisdiction && normalized[primaryJurisdiction]) {
    return normalized[primaryJurisdiction] ?? null;
  }

  for (const option of PROFESSIONAL_REGISTRATION_OPTIONS) {
    const value = normalized[option.id];
    if (value) {
      return value;
    }
  }

  return null;
}

export function getProfessionalRegistrationEntries(
  registrations: ProfessionalRegistrationsInput,
  legacyMedicalCouncilNumber?: string | null,
  countryOfPractice?: string | null,
) {
  const resolved = getProfessionalRegistrations(
    registrations,
    legacyMedicalCouncilNumber,
    countryOfPractice,
  );

  if (!resolved) {
    return [];
  }

  return PROFESSIONAL_REGISTRATION_OPTIONS.flatMap((option) => {
    const number = resolved[option.id];
    if (!number) {
      return [];
    }

    return [
      {
        jurisdiction: option.id,
        label: option.label,
        authority: option.authority,
        number,
      },
    ];
  });
}
