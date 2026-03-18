/**
 * @deprecated Body contouring diagnoses are now part of AESTHETICS_DIAGNOSES.
 * This file re-exports for backward compatibility.
 * Import from './aestheticsDiagnoses' instead.
 */

import type { DiagnosisPicklistEntry } from "@/types/diagnosis";
import { AESTHETICS_DIAGNOSES } from "./aestheticsDiagnoses";

const BODY_CONTOURING_SUBCATEGORIES = [
  "Abdomen",
  "Upper Body",
  "Lower Body",
  "Post-Bariatric",
  "Lipodystrophy",
];

/** @deprecated Use AESTHETICS_DIAGNOSES instead */
export const BODY_CONTOURING_DIAGNOSES: DiagnosisPicklistEntry[] =
  AESTHETICS_DIAGNOSES.filter((dx) =>
    BODY_CONTOURING_SUBCATEGORIES.includes(dx.subcategory),
  );

/** @deprecated Use getAestheticsSubcategories() */
export function getBodyContouringSubcategories(): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const dx of BODY_CONTOURING_DIAGNOSES) {
    if (!seen.has(dx.subcategory)) {
      seen.add(dx.subcategory);
      result.push(dx.subcategory);
    }
  }
  return result;
}

/** @deprecated Use getAestheticsDiagnosesForSubcategory() */
export function getBodyContouringDiagnosesForSubcategory(
  subcategory: string,
): DiagnosisPicklistEntry[] {
  return BODY_CONTOURING_DIAGNOSES.filter(
    (dx) => dx.subcategory === subcategory,
  );
}
