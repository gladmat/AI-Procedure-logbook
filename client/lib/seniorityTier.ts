/**
 * Seniority tier resolution for career stages.
 * Tier is derived at runtime, never stored in the database.
 *
 * The 6-tier model:
 *   Tier 1 = Pre-training / Intern
 *   Tier 2 = Junior Trainee
 *   Tier 3 = Senior Trainee
 *   Tier 4 = Independent Specialist
 *   Tier 5 = Senior Specialist
 *   Tier 6 = Department Lead
 */

export type SeniorityTier = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Maps every career stage value (including legacy) to its seniority tier.
 */
export const CAREER_STAGE_TIERS: Record<string, SeniorityTier> = {
  // NZ / AU
  nz_pgy1: 1,
  nz_pgy2: 1,
  nz_registrar_non_training: 2,
  nz_set_trainee: 3,
  nz_fellow: 4,
  nz_moss: 4,
  nz_consultant: 5,
  nz_head_of_department: 6,

  // UK
  uk_fy1: 1,
  uk_fy2: 1,
  uk_ct: 2,
  uk_st_junior: 2,
  uk_trust_grade: 2,
  uk_st_senior: 3,
  uk_post_cct_fellow: 4,
  uk_sas: 4,
  uk_consultant: 5,
  uk_clinical_director: 6,

  // DE
  de_assistenzarzt_junior: 1,
  de_assistenzarzt_senior: 2,
  de_fellow: 3,
  de_facharzt: 4,
  de_oberarzt: 5,
  de_leitender_oberarzt: 6,
  de_chefarzt: 6,

  // CH
  ch_assistenzarzt_junior: 1,
  ch_assistenzarzt_senior: 2,
  ch_fellow: 3,
  ch_oberarzt: 4,
  ch_leitender_arzt: 5,
  ch_chefarzt: 6,

  // PL
  pl_stazysta: 1,
  pl_rezydent_junior: 2,
  pl_rezydent_senior: 3,
  pl_specjalista: 4,
  pl_starszy_asystent: 5,
  pl_ordynator: 6,

  // US
  us_intern: 1,
  us_resident_junior: 2,
  us_resident_senior: 3,
  us_fellow: 3,
  us_attending: 5,
  us_division_chief: 6,

  // Other
  other_junior_trainee: 2,
  other_senior_trainee: 3,
  other_specialist: 4,
  other_senior_specialist: 5,

  // Legacy values (backward compat with existing profiles)
  junior_house_officer: 1,
  registrar_non_training: 2,
  set_trainee: 3,
  fellow: 4,
  moss: 4,
  consultant_specialist: 5,
};

/**
 * Returns the seniority tier for a career stage value.
 * Returns null for unknown, null, or undefined values.
 */
export function getSeniorityTier(
  careerStage: string | null | undefined,
): SeniorityTier | null {
  if (!careerStage) return null;
  return CAREER_STAGE_TIERS[careerStage] ?? null;
}

/**
 * Returns true if the senior's tier is strictly higher than the junior's tier.
 * Returns false if either value is unknown/null.
 */
export function isSeniorTo(
  seniorStage: string | null | undefined,
  juniorStage: string | null | undefined,
): boolean {
  const seniorTier = getSeniorityTier(seniorStage);
  const juniorTier = getSeniorityTier(juniorStage);
  if (seniorTier === null || juniorTier === null) return false;
  return seniorTier > juniorTier;
}
