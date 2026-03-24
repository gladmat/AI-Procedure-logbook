import { describe, it, expect } from "vitest";
import {
  CAREER_STAGE_OPTIONS,
  getCareerStagesForCountry,
  getCareerStageLabel,
} from "@shared/careerStages";
import {
  getSeniorityTier,
  isSeniorTo,
  CAREER_STAGE_TIERS,
} from "@/lib/seniorityTier";
import { isConsultantLevel } from "@/lib/roleDefaults";

// ---------------------------------------------------------------------------
// getCareerStagesForCountry
// ---------------------------------------------------------------------------

describe("getCareerStagesForCountry", () => {
  it("returns 8 stages for new_zealand", () => {
    const stages = getCareerStagesForCountry("new_zealand");
    expect(stages).toHaveLength(8);
    expect(stages.map((s) => s.value)).toContain("nz_pgy1");
    expect(stages.map((s) => s.value)).toContain("nz_moss");
    expect(stages.map((s) => s.value)).toContain("nz_head_of_department");
  });

  it("returns 8 stages for australia sharing NZ values", () => {
    const stages = getCareerStagesForCountry("australia");
    expect(stages).toHaveLength(8);
    // AU uses nz_ prefixed values
    expect(stages.map((s) => s.value)).toContain("nz_pgy1");
    expect(stages.map((s) => s.value)).toContain("nz_consultant");
  });

  it("AU MOSS label differs from NZ", () => {
    const nzStages = getCareerStagesForCountry("new_zealand");
    const auStages = getCareerStagesForCountry("australia");
    const nzMoss = nzStages.find((s) => s.value === "nz_moss");
    const auMoss = auStages.find((s) => s.value === "nz_moss");
    expect(nzMoss?.label).toBe("Medical Officer Special Scale");
    expect(auMoss?.label).toBe("Staff Specialist / VMO");
  });

  it("returns 10 stages for united_kingdom", () => {
    const stages = getCareerStagesForCountry("united_kingdom");
    expect(stages).toHaveLength(10);
    expect(stages.map((s) => s.value)).toContain("uk_fy1");
    expect(stages.map((s) => s.value)).toContain("uk_clinical_director");
  });

  it("returns 7 stages for germany", () => {
    const stages = getCareerStagesForCountry("germany");
    expect(stages).toHaveLength(7);
    expect(stages.map((s) => s.value)).toContain("de_assistenzarzt_junior");
    expect(stages.map((s) => s.value)).toContain("de_chefarzt");
  });

  it("returns 6 stages for switzerland", () => {
    const stages = getCareerStagesForCountry("switzerland");
    expect(stages).toHaveLength(6);
    expect(stages.map((s) => s.value)).toContain("ch_assistenzarzt_junior");
    expect(stages.map((s) => s.value)).toContain("ch_chefarzt");
  });

  it("returns 6 stages for poland", () => {
    const stages = getCareerStagesForCountry("poland");
    expect(stages).toHaveLength(6);
    expect(stages.map((s) => s.value)).toContain("pl_stazysta");
    expect(stages.map((s) => s.value)).toContain("pl_ordynator");
  });

  it("returns 6 stages for united_states", () => {
    const stages = getCareerStagesForCountry("united_states");
    expect(stages).toHaveLength(6);
    expect(stages.map((s) => s.value)).toContain("us_intern");
    expect(stages.map((s) => s.value)).toContain("us_division_chief");
  });

  it("returns 4 other stages for unknown country", () => {
    const stages = getCareerStagesForCountry("unknown_country");
    expect(stages).toHaveLength(4);
    expect(stages.every((s) => s.country === "other")).toBe(true);
  });

  it("falls back to other for null", () => {
    const stages = getCareerStagesForCountry(null);
    expect(stages).toHaveLength(4);
    expect(stages.every((s) => s.country === "other")).toBe(true);
  });

  it("falls back to other for undefined", () => {
    const stages = getCareerStagesForCountry(undefined);
    expect(stages).toHaveLength(4);
  });
});

// ---------------------------------------------------------------------------
// getCareerStageLabel
// ---------------------------------------------------------------------------

describe("getCareerStageLabel", () => {
  it("returns label for new country-specific value", () => {
    expect(getCareerStageLabel("nz_consultant")).toBe(
      "Consultant / Specialist",
    );
    expect(getCareerStageLabel("de_facharzt")).toBe("Facharzt");
    expect(getCareerStageLabel("uk_st_senior")).toBe(
      "Specialty Registrar (ST6\u2013ST8)",
    );
  });

  it("returns label for legacy values", () => {
    expect(getCareerStageLabel("consultant_specialist")).toBe(
      "Consultant / Specialist",
    );
    expect(getCareerStageLabel("junior_house_officer")).toBe(
      "Junior House Officer",
    );
    expect(getCareerStageLabel("moss")).toBe("Medical Officer Special Scale");
  });

  it("returns raw value for unknown stages", () => {
    expect(getCareerStageLabel("totally_unknown")).toBe("totally_unknown");
  });
});

// ---------------------------------------------------------------------------
// getSeniorityTier
// ---------------------------------------------------------------------------

describe("getSeniorityTier", () => {
  it("returns correct tier for NZ stages", () => {
    expect(getSeniorityTier("nz_pgy1")).toBe(1);
    expect(getSeniorityTier("nz_registrar_non_training")).toBe(2);
    expect(getSeniorityTier("nz_set_trainee")).toBe(3);
    expect(getSeniorityTier("nz_fellow")).toBe(4);
    expect(getSeniorityTier("nz_consultant")).toBe(5);
    expect(getSeniorityTier("nz_head_of_department")).toBe(6);
    expect(getSeniorityTier("nz_moss")).toBe(4);
  });

  it("returns correct tier for UK stages", () => {
    expect(getSeniorityTier("uk_fy1")).toBe(1);
    expect(getSeniorityTier("uk_ct")).toBe(2);
    expect(getSeniorityTier("uk_st_senior")).toBe(3);
    expect(getSeniorityTier("uk_post_cct_fellow")).toBe(4);
    expect(getSeniorityTier("uk_consultant")).toBe(5);
    expect(getSeniorityTier("uk_clinical_director")).toBe(6);
  });

  it("returns correct tier for DE stages", () => {
    expect(getSeniorityTier("de_assistenzarzt_junior")).toBe(1);
    expect(getSeniorityTier("de_assistenzarzt_senior")).toBe(2);
    expect(getSeniorityTier("de_fellow")).toBe(3);
    expect(getSeniorityTier("de_facharzt")).toBe(4);
    expect(getSeniorityTier("de_oberarzt")).toBe(5);
    expect(getSeniorityTier("de_leitender_oberarzt")).toBe(6);
    expect(getSeniorityTier("de_chefarzt")).toBe(6);
  });

  it("returns correct tier for CH stages", () => {
    expect(getSeniorityTier("ch_assistenzarzt_junior")).toBe(1);
    expect(getSeniorityTier("ch_oberarzt")).toBe(4);
    expect(getSeniorityTier("ch_leitender_arzt")).toBe(5);
    expect(getSeniorityTier("ch_chefarzt")).toBe(6);
  });

  it("returns correct tier for PL stages", () => {
    expect(getSeniorityTier("pl_stazysta")).toBe(1);
    expect(getSeniorityTier("pl_rezydent_junior")).toBe(2);
    expect(getSeniorityTier("pl_specjalista")).toBe(4);
    expect(getSeniorityTier("pl_ordynator")).toBe(6);
  });

  it("returns correct tier for US stages", () => {
    expect(getSeniorityTier("us_intern")).toBe(1);
    expect(getSeniorityTier("us_resident_junior")).toBe(2);
    expect(getSeniorityTier("us_resident_senior")).toBe(3);
    expect(getSeniorityTier("us_fellow")).toBe(3);
    expect(getSeniorityTier("us_attending")).toBe(5);
    expect(getSeniorityTier("us_division_chief")).toBe(6);
  });

  it("returns correct tier for legacy values", () => {
    expect(getSeniorityTier("junior_house_officer")).toBe(1);
    expect(getSeniorityTier("registrar_non_training")).toBe(2);
    expect(getSeniorityTier("set_trainee")).toBe(3);
    expect(getSeniorityTier("fellow")).toBe(4);
    expect(getSeniorityTier("moss")).toBe(4);
    expect(getSeniorityTier("consultant_specialist")).toBe(5);
  });

  it("returns null for null/undefined/unknown", () => {
    expect(getSeniorityTier(null)).toBeNull();
    expect(getSeniorityTier(undefined)).toBeNull();
    expect(getSeniorityTier("unknown_value")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// isSeniorTo
// ---------------------------------------------------------------------------

describe("isSeniorTo", () => {
  it("consultant is senior to fellow", () => {
    expect(isSeniorTo("nz_consultant", "nz_fellow")).toBe(true);
  });

  it("fellow is NOT senior to consultant", () => {
    expect(isSeniorTo("nz_fellow", "nz_consultant")).toBe(false);
  });

  it("equal tiers are NOT senior", () => {
    expect(isSeniorTo("nz_consultant", "uk_consultant")).toBe(false);
  });

  it("returns false for unknown stages", () => {
    expect(isSeniorTo("nz_consultant", "unknown")).toBe(false);
    expect(isSeniorTo("unknown", "nz_pgy1")).toBe(false);
    expect(isSeniorTo(null, "nz_pgy1")).toBe(false);
    expect(isSeniorTo("nz_consultant", null)).toBe(false);
  });

  it("cross-country comparison works via tier", () => {
    // DE Oberarzt (tier 5) is senior to UK ST Senior (tier 3)
    expect(isSeniorTo("de_oberarzt", "uk_st_senior")).toBe(true);
    // US attending (tier 5) is senior to PL rezydent junior (tier 2)
    expect(isSeniorTo("us_attending", "pl_rezydent_junior")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// isConsultantLevel
// ---------------------------------------------------------------------------

describe("isConsultantLevel", () => {
  it("returns true for new consultant-level stages", () => {
    expect(isConsultantLevel("nz_consultant")).toBe(true);
    expect(isConsultantLevel("nz_fellow")).toBe(true);
    expect(isConsultantLevel("nz_moss")).toBe(true);
    expect(isConsultantLevel("nz_head_of_department")).toBe(true);
    expect(isConsultantLevel("de_facharzt")).toBe(true);
    expect(isConsultantLevel("de_oberarzt")).toBe(true);
    expect(isConsultantLevel("uk_consultant")).toBe(true);
    expect(isConsultantLevel("uk_post_cct_fellow")).toBe(true);
    expect(isConsultantLevel("us_attending")).toBe(true);
    expect(isConsultantLevel("pl_specjalista")).toBe(true);
    expect(isConsultantLevel("ch_oberarzt")).toBe(true);
  });

  it("returns false for trainee-level stages", () => {
    expect(isConsultantLevel("nz_pgy1")).toBe(false);
    expect(isConsultantLevel("nz_set_trainee")).toBe(false);
    expect(isConsultantLevel("uk_st_senior")).toBe(false);
    expect(isConsultantLevel("uk_ct")).toBe(false);
    expect(isConsultantLevel("de_assistenzarzt_junior")).toBe(false);
    expect(isConsultantLevel("us_intern")).toBe(false);
    expect(isConsultantLevel("us_fellow")).toBe(false);
    expect(isConsultantLevel("pl_rezydent_senior")).toBe(false);
  });

  it("returns true for legacy consultant stages", () => {
    expect(isConsultantLevel("consultant_specialist")).toBe(true);
    expect(isConsultantLevel("fellow")).toBe(true);
    expect(isConsultantLevel("moss")).toBe(true);
  });

  it("returns false for legacy non-consultant stages", () => {
    expect(isConsultantLevel("junior_house_officer")).toBe(false);
    expect(isConsultantLevel("registrar_non_training")).toBe(false);
    expect(isConsultantLevel("set_trainee")).toBe(false);
  });

  it("returns false for null/undefined", () => {
    expect(isConsultantLevel(null)).toBe(false);
    expect(isConsultantLevel(undefined)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Data integrity
// ---------------------------------------------------------------------------

describe("data integrity", () => {
  it("every CAREER_STAGE_OPTIONS value has a tier in CAREER_STAGE_TIERS", () => {
    const uniqueValues = new Set(CAREER_STAGE_OPTIONS.map((o) => o.value));
    for (const value of uniqueValues) {
      expect(CAREER_STAGE_TIERS[value]).toBeDefined();
    }
  });

  it("every CAREER_STAGE_OPTIONS tier matches CAREER_STAGE_TIERS", () => {
    for (const option of CAREER_STAGE_OPTIONS) {
      expect(CAREER_STAGE_TIERS[option.value]).toBe(option.seniorityTier);
    }
  });

  it("all 6 legacy values have tier mappings", () => {
    const legacyValues = [
      "junior_house_officer",
      "registrar_non_training",
      "set_trainee",
      "fellow",
      "consultant_specialist",
      "moss",
    ];
    for (const value of legacyValues) {
      expect(getSeniorityTier(value)).not.toBeNull();
    }
  });
});
