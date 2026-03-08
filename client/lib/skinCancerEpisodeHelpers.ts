/**
 * skinCancerEpisodeHelpers.ts
 * ═══════════════════════════════════════
 * Pure logic helpers for skin cancer episode auto-creation and
 * auto-resolution. Kept in lib/ (not hooks/) so Vitest can import
 * them without pulling in React Native.
 */

import type { Case } from "@/types/case";
import type { SkinCancerLesionAssessment } from "@/types/skinCancer";

/**
 * Collect all pending skin cancer lesions that need histology follow-up.
 * Used by episode auto-creation logic.
 */
export function collectPendingSkinCancerLesions(
  savedCase: Case,
): { site: string; suspicion: string }[] {
  const pending: { site: string; suspicion: string }[] = [];

  for (const group of savedCase.diagnosisGroups ?? []) {
    // Single-lesion
    if (group.skinCancerAssessment?.pathwayStage === "excision_biopsy") {
      const a = group.skinCancerAssessment;
      const histo = a.currentHistology;
      if (!histo || histo.marginStatus === "pending") {
        pending.push({
          site: a.site ?? "unknown site",
          suspicion: a.clinicalSuspicion ?? "skin lesion",
        });
      }
    }
    // Multi-lesion
    for (const lesion of group.lesionInstances ?? []) {
      if (lesion.skinCancerAssessment?.pathwayStage === "excision_biopsy") {
        const a = lesion.skinCancerAssessment;
        const histo = a.currentHistology;
        if (!histo || histo.marginStatus === "pending") {
          pending.push({
            site: a.site ?? lesion.site ?? "unknown site",
            suspicion: a.clinicalSuspicion ?? "skin lesion",
          });
        }
      }
    }
  }

  return pending;
}

/**
 * Determine the episode action to take based on all skin cancer
 * assessments in a case.
 *
 * Returns:
 * - "resolve"     – all assessments have clear margins
 * - "reexcision"  – any assessment has incomplete/close margins
 * - "none"        – no assessments, or some still pending
 */
export function determineSkinCancerEpisodeAction(
  caseData: Case,
): "resolve" | "reexcision" | "none" {
  let allClear = true;
  let anyIncomplete = false;
  let hasAssessments = false;

  const check = (a: SkinCancerLesionAssessment | undefined) => {
    if (!a) return;
    hasAssessments = true;
    const histo = a.currentHistology;
    if (
      !histo ||
      histo.marginStatus === "pending" ||
      histo.marginStatus === "unknown"
    ) {
      allClear = false;
    } else if (
      histo.marginStatus === "incomplete" ||
      histo.marginStatus === "close"
    ) {
      allClear = false;
      anyIncomplete = true;
    }
  };

  for (const group of caseData.diagnosisGroups ?? []) {
    check(group.skinCancerAssessment);
    for (const lesion of group.lesionInstances ?? []) {
      check(lesion.skinCancerAssessment);
    }
  }

  if (!hasAssessments) return "none";
  if (allClear) return "resolve";
  if (anyIncomplete) return "reexcision";
  return "none";
}
