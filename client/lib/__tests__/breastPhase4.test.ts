/**
 * Breast Module Phase 4 Tests — gender-affirming, chest masc, episode flags,
 * completion with chest masc, summary strings, copy-to-other-side, duplicate cloning.
 */

import { describe, it, expect } from "vitest";
import {
  getBreastModuleFlags,
  calculateBreastCompletion,
  getChestMascSummary,
} from "../breastConfig";
import { PROCEDURE_PICKLIST } from "../procedurePicklist";
import type { ProcedurePicklistEntry } from "../procedurePicklist";
import { BREAST_DIAGNOSES } from "../diagnosisPicklists/breastDiagnoses";
import type {
  BreastSideAssessment,
  ChestMasculinisationData,
  BreastAssessmentData,
} from "@/types/breast";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function proc(id: string, tags?: string[]): ProcedurePicklistEntry {
  return {
    id,
    label: id,
    snomedCtCodes: [],
    specialties: ["breast"],
    subcategory: "",
    tags: tags ?? [],
  };
}

function baseSide(
  overrides?: Partial<BreastSideAssessment>,
): BreastSideAssessment {
  return {
    side: "left",
    clinicalContext: "reconstructive",
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Module flags for gender-affirming / chest masc
// ─────────────────────────────────────────────────────────────────────────────

describe("getBreastModuleFlags — Phase 4", () => {
  it("shows gender-affirming context for gender_affirming clinical context", () => {
    const flags = getBreastModuleFlags([], "gender_affirming");
    expect(flags.showGenderAffirmingContext).toBe(true);
    expect(flags.showReconstructionEpisode).toBe(false);
  });

  it("shows reconstruction episode for reconstructive context", () => {
    const flags = getBreastModuleFlags([], "reconstructive");
    expect(flags.showReconstructionEpisode).toBe(true);
    expect(flags.showGenderAffirmingContext).toBe(false);
  });

  it("shows chest masculinisation for chest masc procedures", () => {
    const flags = getBreastModuleFlags(
      [proc("breast_ga_chest_masc_di_fng")],
      "gender_affirming",
    );
    expect(flags.showChestMasculinisation).toBe(true);
  });

  it("does not show chest masc for non-chest-masc procedures", () => {
    const flags = getBreastModuleFlags(
      [proc("breast_impl_dti")],
      "gender_affirming",
    );
    expect(flags.showChestMasculinisation).toBe(false);
  });

  it("shows multiple flags simultaneously", () => {
    const flags = getBreastModuleFlags(
      [proc("breast_ga_chest_masc_periareolar"), proc("breast_fat_graft")],
      "gender_affirming",
    );
    expect(flags.showChestMasculinisation).toBe(true);
    expect(flags.showLipofilling).toBe(true);
    expect(flags.showGenderAffirmingContext).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Completion with chest masculinisation
// ─────────────────────────────────────────────────────────────────────────────

describe("calculateBreastCompletion — chest masc", () => {
  const baseFlags = {
    showImplantDetails: false,
    showBreastFlapDetails: false,
    showPedicledFlapDetails: false,
    showLipofilling: false,
    showChestMasculinisation: true,
    showNippleDetails: false,
    showReconstructionEpisode: false,
    showGenderAffirmingContext: true,
  };

  it("chest masc incomplete when technique not set", () => {
    const result = calculateBreastCompletion(
      baseSide({ chestMasculinisation: {} }),
      baseFlags,
    );
    expect(result.chestMascComplete).toBe(false);
  });

  it("chest masc complete when technique is set", () => {
    const result = calculateBreastCompletion(
      baseSide({
        chestMasculinisation: { technique: "double_incision_fng" },
      }),
      baseFlags,
    );
    expect(result.chestMascComplete).toBe(true);
  });

  it("overall percentage reflects chest masc completion", () => {
    const incomplete = calculateBreastCompletion(
      baseSide({ chestMasculinisation: {} }),
      baseFlags,
    );
    const complete = calculateBreastCompletion(
      baseSide({
        chestMasculinisation: { technique: "double_incision_fng" },
      }),
      baseFlags,
    );
    expect(complete.overallPercentage).toBeGreaterThan(
      incomplete.overallPercentage,
    );
  });

  it("returns 0 for undefined side", () => {
    const result = calculateBreastCompletion(undefined, baseFlags);
    expect(result.overallPercentage).toBe(0);
    expect(result.chestMascComplete).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getChestMascSummary
// ─────────────────────────────────────────────────────────────────────────────

describe("getChestMascSummary", () => {
  it("returns empty string for undefined data", () => {
    expect(getChestMascSummary(undefined)).toBe("");
  });

  it("returns empty string for empty object", () => {
    expect(getChestMascSummary({})).toBe("");
  });

  it("shows technique only", () => {
    const summary = getChestMascSummary({ technique: "periareolar" });
    expect(summary).toBe("Periareolar");
  });

  it("shows technique + FNG with short label", () => {
    const summary = getChestMascSummary({
      technique: "double_incision_fng",
    });
    expect(summary).toBe("Double incision + FNG");
  });

  it("shows bilateral specimen weights", () => {
    const data: ChestMasculinisationData = {
      technique: "double_incision_fng",
      specimenWeightLeftGrams: 320,
      specimenWeightRightGrams: 310,
    };
    expect(getChestMascSummary(data)).toBe(
      "Double incision + FNG, L 320g R 310g",
    );
  });

  it("shows unilateral weight", () => {
    const data: ChestMasculinisationData = {
      technique: "keyhole",
      specimenWeightLeftGrams: 250,
    };
    expect(getChestMascSummary(data)).toBe("Keyhole, L 250g");
  });

  it("includes NAC management when not N/A", () => {
    const data: ChestMasculinisationData = {
      technique: "double_incision_fng",
      nacManagement: "free_nipple_graft",
    };
    const summary = getChestMascSummary(data);
    expect(summary).toContain("Free Nipple Graft");
  });

  it("excludes NAC management when not_applicable", () => {
    const data: ChestMasculinisationData = {
      technique: "double_incision_fng",
      nacManagement: "not_applicable",
    };
    expect(getChestMascSummary(data)).toBe("Double incision + FNG");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Copy-to-other-side includes new fields
// ─────────────────────────────────────────────────────────────────────────────

describe("copy-to-other-side — new fields", () => {
  it("JSON deep clone preserves chestMasculinisation", () => {
    const source: BreastSideAssessment = baseSide({
      chestMasculinisation: {
        technique: "double_incision_fng",
        specimenWeightLeftGrams: 320,
        adjunctiveLiposuction: true,
      },
    });

    const copied: BreastSideAssessment = {
      ...JSON.parse(JSON.stringify(source)),
      side: "right",
    };

    expect(copied.chestMasculinisation?.technique).toBe(
      "double_incision_fng",
    );
    expect(copied.chestMasculinisation?.specimenWeightLeftGrams).toBe(320);
    expect(copied.chestMasculinisation?.adjunctiveLiposuction).toBe(true);
    expect(copied.side).toBe("right");
    // Verify it's a deep copy (independent object)
    expect(copied.chestMasculinisation).not.toBe(
      source.chestMasculinisation,
    );
  });

  it("JSON deep clone preserves genderAffirmingContext", () => {
    const source: BreastSideAssessment = baseSide({
      clinicalContext: "gender_affirming",
      genderAffirmingContext: {
        hormoneTherapyStatus: "current",
        hormoneType: "testosterone",
        hormoneTherapyDurationMonths: 24,
        bindingHistory: true,
        wpath8CriteriaMet: true,
      },
    });

    const copied: BreastSideAssessment = {
      ...JSON.parse(JSON.stringify(source)),
      side: "right",
    };

    expect(copied.genderAffirmingContext?.hormoneTherapyStatus).toBe(
      "current",
    );
    expect(copied.genderAffirmingContext?.hormoneTherapyDurationMonths).toBe(
      24,
    );
    expect(copied.genderAffirmingContext?.bindingHistory).toBe(true);
    expect(copied.genderAffirmingContext).not.toBe(
      source.genderAffirmingContext,
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Duplicate case cloning — breastAssessment
// ─────────────────────────────────────────────────────────────────────────────

describe("structuredClone — breastAssessment", () => {
  it("structuredClone creates independent breast assessment copy", () => {
    const original: BreastAssessmentData = {
      laterality: "bilateral",
      sides: {
        left: {
          side: "left",
          clinicalContext: "gender_affirming",
          genderAffirmingContext: {
            hormoneTherapyStatus: "current",
            bindingHistory: true,
          },
          chestMasculinisation: {
            technique: "double_incision_fng",
            specimenWeightLeftGrams: 300,
          },
        },
        right: {
          side: "right",
          clinicalContext: "gender_affirming",
          chestMasculinisation: {
            technique: "double_incision_fng",
            specimenWeightRightGrams: 290,
          },
        },
      },
    };

    const cloned = structuredClone(original);

    // Values match
    expect(cloned.laterality).toBe("bilateral");
    expect(cloned.sides.left?.chestMasculinisation?.technique).toBe(
      "double_incision_fng",
    );
    expect(
      cloned.sides.left?.genderAffirmingContext?.bindingHistory,
    ).toBe(true);

    // Independent objects
    expect(cloned.sides.left).not.toBe(original.sides.left);
    expect(cloned.sides.left?.chestMasculinisation).not.toBe(
      original.sides.left?.chestMasculinisation,
    );

    // Mutating clone doesn't affect original
    if (cloned.sides.left?.chestMasculinisation) {
      cloned.sides.left.chestMasculinisation.technique = "periareolar";
    }
    expect(original.sides.left?.chestMasculinisation?.technique).toBe(
      "double_incision_fng",
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Catalogue tests — gender-affirming diagnoses and procedures
// ─────────────────────────────────────────────────────────────────────────────

describe("breast catalogue — gender-affirming entries", () => {

  it("has at least 2 gender-affirming diagnoses", () => {
    const gaDx = BREAST_DIAGNOSES.filter(
      (d) => d.clinicalGroup === "gender_affirming",
    );
    expect(gaDx.length).toBeGreaterThanOrEqual(2);
  });

  it("has transmasculine diagnosis with chest masc procedure suggestions", () => {
    const tmDx = BREAST_DIAGNOSES.find(
      (d) => d.id === "breast_dx_gender_dysphoria_transmasc",
    );
    expect(tmDx).toBeDefined();
    expect(tmDx!.suggestedProcedures?.length).toBeGreaterThanOrEqual(1);
    const hasChestMasc = tmDx!.suggestedProcedures?.some(
      (p) => p.procedurePicklistId?.startsWith("breast_ga_chest_masc"),
    );
    expect(hasChestMasc).toBe(true);
  });

  it("has at least 3 chest masculinisation procedures in catalogue", () => {
    const chestMascProcs = PROCEDURE_PICKLIST.filter(
      (p: ProcedurePicklistEntry) => p.id.startsWith("breast_ga_chest_masc"),
    );
    expect(chestMascProcs.length).toBeGreaterThanOrEqual(3);
  });

  it("has at least 3 lipofilling procedures in catalogue", () => {
    const fatProcs = PROCEDURE_PICKLIST.filter(
      (p: ProcedurePicklistEntry) => p.id.startsWith("breast_fat_"),
    );
    expect(fatProcs.length).toBeGreaterThanOrEqual(3);
  });
});
