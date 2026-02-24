/**
 * Diagnosis Picklist System — Master Index
 *
 * Re-exports all specialty diagnosis picklists and provides:
 * - Master lookup by specialty / ID / SNOMED code
 * - Type-ahead search across all diagnoses
 * - Staging-conditional procedure suggestion evaluation
 *
 * Phase 1: Hand Surgery, Burns, Body Contouring
 * Phase 2: Breast, Aesthetics, General
 * Phase 3: Head & Neck, Orthoplastic
 *
 * Usage:
 *   import { getDiagnosesForSpecialty, evaluateSuggestions } from "@/lib/diagnosisPicklists";
 */

import type { Specialty } from "@/types/case";
import type {
  DiagnosisPicklistEntry,
  ProcedureSuggestion,
  EvaluatedSuggestion,
  StagingSelections,
} from "@/types/diagnosis";

// ─── Re-exports ──────────────────────────────────────────────────────────────

export { HAND_SURGERY_DIAGNOSES } from "./handSurgeryDiagnoses";
export { BURNS_DIAGNOSES } from "./burnsDiagnoses";
export { BODY_CONTOURING_DIAGNOSES } from "./bodyContouringDiagnoses";
export { BREAST_DIAGNOSES } from "./breastDiagnoses";
export { AESTHETICS_DIAGNOSES } from "./aestheticsDiagnoses";
export { GENERAL_DIAGNOSES } from "./generalDiagnoses";
export { HEAD_NECK_DIAGNOSES } from "./headNeckDiagnoses";
export { ORTHOPLASTIC_DIAGNOSES } from "./orthoplasticDiagnoses";

// Re-export types
export type {
  DiagnosisPicklistEntry,
  ProcedureSuggestion,
  EvaluatedSuggestion,
  StagingSelections,
} from "@/types/diagnosis";

// ─── Import all diagnosis arrays ─────────────────────────────────────────────

import { HAND_SURGERY_DIAGNOSES } from "./handSurgeryDiagnoses";
import { BURNS_DIAGNOSES } from "./burnsDiagnoses";
import { BODY_CONTOURING_DIAGNOSES } from "./bodyContouringDiagnoses";
import { BREAST_DIAGNOSES } from "./breastDiagnoses";
import { AESTHETICS_DIAGNOSES } from "./aestheticsDiagnoses";
import { GENERAL_DIAGNOSES } from "./generalDiagnoses";

import { HEAD_NECK_DIAGNOSES } from "./headNeckDiagnoses";
import { ORTHOPLASTIC_DIAGNOSES } from "./orthoplasticDiagnoses";

// ─── Master Diagnosis Registry ───────────────────────────────────────────────

/**
 * All structured diagnoses across all specialties.
 * Grows as Phase 3 specialties are added.
 */
export const ALL_DIAGNOSES: DiagnosisPicklistEntry[] = [
  ...HAND_SURGERY_DIAGNOSES,
  ...BURNS_DIAGNOSES,
  ...BODY_CONTOURING_DIAGNOSES,
  ...BREAST_DIAGNOSES,
  ...AESTHETICS_DIAGNOSES,
  ...GENERAL_DIAGNOSES,
  ...HEAD_NECK_DIAGNOSES,
  ...ORTHOPLASTIC_DIAGNOSES,
];

// ─── Lookup by specialty ─────────────────────────────────────────────────────

/** Specialty → diagnosis array mapping for direct access */
const SPECIALTY_MAP: Partial<Record<Specialty, DiagnosisPicklistEntry[]>> = {
  hand_surgery: HAND_SURGERY_DIAGNOSES,
  burns: BURNS_DIAGNOSES,
  body_contouring: BODY_CONTOURING_DIAGNOSES,
  breast: BREAST_DIAGNOSES,
  aesthetics: AESTHETICS_DIAGNOSES,
  general: GENERAL_DIAGNOSES,
  head_neck: HEAD_NECK_DIAGNOSES,
  orthoplastic: ORTHOPLASTIC_DIAGNOSES,
};

/**
 * Get all structured diagnoses for a given specialty.
 * Returns empty array for specialties without a picklist yet.
 */
export function getDiagnosesForSpecialty(
  specialty: Specialty
): DiagnosisPicklistEntry[] {
  return SPECIALTY_MAP[specialty] ?? [];
}

/**
 * Check whether a specialty has a structured diagnosis picklist.
 * Use this to decide whether to show the diagnosis picker or fall through
 * to the free SNOMED search.
 */
export function hasDiagnosisPicklist(specialty: Specialty): boolean {
  const list = SPECIALTY_MAP[specialty];
  return !!list && list.length > 0;
}

/**
 * Get unique subcategories for a specialty's diagnosis picklist.
 * Preserves the order they appear in the data (not alphabetical).
 */
export function getDiagnosisSubcategories(specialty: Specialty): string[] {
  const diagnoses = getDiagnosesForSpecialty(specialty);
  const seen = new Set<string>();
  const result: string[] = [];
  for (const dx of diagnoses) {
    if (!seen.has(dx.subcategory)) {
      seen.add(dx.subcategory);
      result.push(dx.subcategory);
    }
  }
  return result;
}

/**
 * Get diagnoses for a specific subcategory within a specialty.
 */
export function getDiagnosesForSubcategory(
  specialty: Specialty,
  subcategory: string
): DiagnosisPicklistEntry[] {
  return getDiagnosesForSpecialty(specialty).filter(
    (dx) => dx.subcategory === subcategory
  );
}

// ─── Lookup by ID / SNOMED code ──────────────────────────────────────────────

/** Lazily built index for O(1) lookup by ID */
let _idIndex: Map<string, DiagnosisPicklistEntry> | null = null;

function getIdIndex(): Map<string, DiagnosisPicklistEntry> {
  if (!_idIndex) {
    _idIndex = new Map();
    for (const dx of ALL_DIAGNOSES) {
      _idIndex.set(dx.id, dx);
    }
  }
  return _idIndex;
}

/** Find a diagnosis by its unique ID */
export function findDiagnosisById(
  id: string
): DiagnosisPicklistEntry | undefined {
  return getIdIndex().get(id);
}

/** Find a diagnosis by its SNOMED CT code (returns first match) */
export function findDiagnosisBySnomedCode(
  snomedCtCode: string,
  specialty?: Specialty
): DiagnosisPicklistEntry | undefined {
  const pool = specialty
    ? getDiagnosesForSpecialty(specialty)
    : ALL_DIAGNOSES;
  return pool.find((dx) => dx.snomedCtCode === snomedCtCode);
}

// ─── Type-ahead search ───────────────────────────────────────────────────────

/**
 * Search diagnoses by text query within a specialty.
 * Matches against displayName, shortName, and searchSynonyms.
 * Returns results sorted by relevance (exact prefix > substring > synonym).
 */
export function searchDiagnoses(
  query: string,
  specialty?: Specialty,
  limit: number = 15
): DiagnosisPicklistEntry[] {
  if (!query || query.length < 2) return [];

  const q = query.toLowerCase().trim();
  const pool = specialty
    ? getDiagnosesForSpecialty(specialty)
    : ALL_DIAGNOSES;

  const scored: Array<{ dx: DiagnosisPicklistEntry; score: number }> = [];

  for (const dx of pool) {
    let score = 0;

    const display = dx.displayName.toLowerCase();
    const short = dx.shortName?.toLowerCase() ?? "";

    if (display.startsWith(q)) {
      score = 100;
    } else if (short && short.startsWith(q)) {
      score = 90;
    } else if (display.includes(q)) {
      score = 70;
    } else if (short && short.includes(q)) {
      score = 60;
    } else {
      const words = display.split(/[\s\-\/\(\)]+/);
      if (words.some((w) => w.startsWith(q))) {
        score = 50;
      }
    }

    if (score === 0 && dx.searchSynonyms?.some((syn) => syn.toLowerCase().includes(q))) {
      score = 40;
    }

    if (score > 0) {
      scored.push({ dx, score });
    }
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.dx.sortOrder - b.dx.sortOrder;
  });

  return scored.slice(0, limit).map((s) => s.dx);
}

// ─── Staging-conditional procedure evaluation ────────────────────────────────

/**
 * Evaluate procedure suggestions against current staging selections.
 *
 * This is the core engine that powers:
 *   "Deep partial burn → tangential excision + STSG auto-suggested"
 *   "Capsular contracture Baker IV → en bloc capsulectomy auto-suggested"
 *   "Pressure injury Stage 4 → flap closure auto-suggested"
 *   "Lymphoedema ISL III → debulking auto-suggested"
 *
 * @param diagnosis - The selected diagnosis
 * @param stagingSelections - Current staging values keyed by staging system name
 * @returns All suggestions with `isActive` flag indicating whether they should
 *          be shown as selected (default + met conditions) or available but inactive.
 */
export function evaluateSuggestions(
  diagnosis: DiagnosisPicklistEntry,
  stagingSelections: StagingSelections = {}
): EvaluatedSuggestion[] {
  return diagnosis.suggestedProcedures.map((suggestion) => {
    let isActive: boolean;

    if (!suggestion.isConditional) {
      isActive = suggestion.isDefault;
    } else if (!suggestion.conditionStagingMatch) {
      isActive = false;
    } else {
      const { stagingSystemName, matchValues } =
        suggestion.conditionStagingMatch;
      const selectedValue = stagingSelections[stagingSystemName];

      isActive = selectedValue
        ? matchValues.includes(selectedValue)
        : false;
    }

    return {
      ...suggestion,
      isActive,
    };
  });
}

/**
 * Convenience: get only the active (auto-selected) procedure IDs
 * for a diagnosis + staging combination.
 */
export function getActiveProcedureIds(
  diagnosis: DiagnosisPicklistEntry,
  stagingSelections: StagingSelections = {}
): string[] {
  return evaluateSuggestions(diagnosis, stagingSelections)
    .filter((s) => s.isActive)
    .map((s) => s.procedurePicklistId);
}

/**
 * Get all available procedure suggestion IDs for a diagnosis
 * (both active and inactive — everything the surgeon might pick).
 */
export function getAllSuggestionProcedureIds(
  diagnosis: DiagnosisPicklistEntry
): string[] {
  return diagnosis.suggestedProcedures.map((s) => s.procedurePicklistId);
}
