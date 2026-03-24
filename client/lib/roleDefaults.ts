import type { OperativeRole, SupervisionLevel } from "@/types/operativeRole";
import { CAREER_STAGE_OPTIONS } from "@shared/careerStages";

/** Legacy fallback set for backward compat when a value isn't in CAREER_STAGE_OPTIONS */
const LEGACY_CONSULTANT_STAGES = new Set([
  "consultant_specialist",
  "fellow",
  "moss",
]);

/**
 * Returns true if the given career stage is consultant-level.
 * Looks up from CAREER_STAGE_OPTIONS first, then falls back to legacy check.
 */
export function isConsultantLevel(
  careerStage: string | null | undefined,
): boolean {
  if (!careerStage) return false;
  const option = CAREER_STAGE_OPTIONS.find((o) => o.value === careerStage);
  if (option) return option.isConsultantLevel;
  return LEGACY_CONSULTANT_STAGES.has(careerStage);
}

/**
 * Suggests default role and supervision based on user profile.
 * Called when form initialises (new case) or when responsible consultant changes.
 */
export function suggestRoleDefaults(
  profile: {
    careerStage?: string | null;
    userId?: string;
  } | null,
): { role: OperativeRole; supervision: SupervisionLevel } {
  if (!profile) {
    return { role: "SURGEON", supervision: "INDEPENDENT" };
  }

  if (isConsultantLevel(profile.careerStage)) {
    return { role: "SURGEON", supervision: "INDEPENDENT" };
  }

  // Trainee → Surgeon with supervisor scrubbed (most common training scenario)
  return { role: "SURGEON", supervision: "SUP_SCRUBBED" };
}
