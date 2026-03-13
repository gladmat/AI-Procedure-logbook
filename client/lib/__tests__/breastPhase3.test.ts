/**
 * Breast Module Phase 3 Tests — module flags, completion, summary strings.
 */

import { describe, it, expect } from "vitest";
import {
  getBreastModuleFlags,
  getBreastClinicalContext,
  calculateBreastCompletion,
  getImplantSummary,
  getFlapSummary,
  getLipofillingSummary,
  getLiposuctionSummary,
} from "../breastConfig";
import type { ProcedurePicklistEntry } from "../procedurePicklist";
import type {
  BreastSideAssessment,
  ImplantDetailsData,
  BreastFlapDetailsData,
  LipofillingData,
  LiposuctionData,
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

// ─────────────────────────────────────────────────────────────────────────────
// getBreastClinicalContext
// ─────────────────────────────────────────────────────────────────────────────

describe("getBreastClinicalContext", () => {
  it("returns reconstructive when no diagnosis", () => {
    expect(getBreastClinicalContext(undefined)).toBe("reconstructive");
  });

  it("returns aesthetic for aesthetic diagnosis", () => {
    expect(
      getBreastClinicalContext({ clinicalGroup: "aesthetic" } as any),
    ).toBe("aesthetic");
  });

  it("returns gender_affirming for gender_affirming diagnosis", () => {
    expect(
      getBreastClinicalContext({ clinicalGroup: "gender_affirming" } as any),
    ).toBe("gender_affirming");
  });

  it("returns reconstructive for other clinical groups", () => {
    expect(
      getBreastClinicalContext({ clinicalGroup: "oncology" } as any),
    ).toBe("reconstructive");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getBreastModuleFlags
// ─────────────────────────────────────────────────────────────────────────────

describe("getBreastModuleFlags", () => {
  it("returns all false for empty procedures", () => {
    const flags = getBreastModuleFlags([], "reconstructive");
    expect(flags.showImplantDetails).toBe(false);
    expect(flags.showBreastFlapDetails).toBe(false);
    expect(flags.showLipofilling).toBe(false);
    expect(flags.showChestMasculinisation).toBe(false);
    expect(flags.showNippleDetails).toBe(false);
  });

  it("shows implant details for DTI procedure", () => {
    const flags = getBreastModuleFlags([proc("breast_impl_dti")], "reconstructive");
    expect(flags.showImplantDetails).toBe(true);
  });

  it("shows implant details for augmentation implant", () => {
    const flags = getBreastModuleFlags(
      [proc("breast_aes_augmentation_implant")],
      "aesthetic",
    );
    expect(flags.showImplantDetails).toBe(true);
  });

  it("shows implant details for gender affirming augmentation", () => {
    const flags = getBreastModuleFlags(
      [proc("breast_ga_augmentation_transfem")],
      "gender_affirming",
    );
    expect(flags.showImplantDetails).toBe(true);
  });

  it("shows implant details for revision procedures", () => {
    const flags = getBreastModuleFlags(
      [proc("breast_rev_implant_exchange")],
      "reconstructive",
    );
    expect(flags.showImplantDetails).toBe(true);
  });

  it("shows flap details for free flap tagged procedures", () => {
    const flags = getBreastModuleFlags(
      [proc("breast_autologous_diep", ["free_flap", "microsurgery"])],
      "reconstructive",
    );
    expect(flags.showBreastFlapDetails).toBe(true);
    expect(flags.showPedicledFlapDetails).toBe(false);
  });

  it("shows pedicled flap for pedicled_flap tag without free_flap", () => {
    const flags = getBreastModuleFlags(
      [proc("breast_autologous_ldflap", ["pedicled_flap"])],
      "reconstructive",
    );
    expect(flags.showPedicledFlapDetails).toBe(true);
    expect(flags.showBreastFlapDetails).toBe(false);
  });

  it("shows lipofilling for lipofilling-tagged procedures", () => {
    const flags = getBreastModuleFlags(
      [proc("breast_fat_grafting", ["lipofilling"])],
      "reconstructive",
    );
    expect(flags.showLipofilling).toBe(true);
  });

  it("shows lipofilling for breast_fat_ prefixed IDs", () => {
    const flags = getBreastModuleFlags(
      [proc("breast_fat_primary")],
      "aesthetic",
    );
    expect(flags.showLipofilling).toBe(true);
  });

  it("shows chest masculinisation for ga_chest_masc IDs", () => {
    const flags = getBreastModuleFlags(
      [proc("breast_ga_chest_masc_standard")],
      "gender_affirming",
    );
    expect(flags.showChestMasculinisation).toBe(true);
  });

  it("shows nipple details for nipple reconstruction", () => {
    const flags = getBreastModuleFlags(
      [proc("breast_nipple_reconstruction")],
      "reconstructive",
    );
    expect(flags.showNippleDetails).toBe(true);
  });

  it("shows nipple details for tattooing", () => {
    const flags = getBreastModuleFlags(
      [proc("breast_nipple_tattooing")],
      "reconstructive",
    );
    expect(flags.showNippleDetails).toBe(true);
  });

  it("shows reconstruction episode for reconstructive context", () => {
    const flags = getBreastModuleFlags([], "reconstructive");
    expect(flags.showReconstructionEpisode).toBe(true);
    expect(flags.showGenderAffirmingContext).toBe(false);
  });

  it("shows gender affirming context for gender_affirming context", () => {
    const flags = getBreastModuleFlags([], "gender_affirming");
    expect(flags.showGenderAffirmingContext).toBe(true);
    expect(flags.showReconstructionEpisode).toBe(false);
  });

  it("handles multiple procedures combining flags", () => {
    const flags = getBreastModuleFlags(
      [
        proc("breast_impl_dti"),
        proc("breast_fat_primary", ["lipofilling"]),
      ],
      "reconstructive",
    );
    expect(flags.showImplantDetails).toBe(true);
    expect(flags.showLipofilling).toBe(true);
    expect(flags.showBreastFlapDetails).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// calculateBreastCompletion
// ─────────────────────────────────────────────────────────────────────────────

describe("calculateBreastCompletion", () => {
  const allFalseFlags = {
    showImplantDetails: false,
    showBreastFlapDetails: false,
    showPedicledFlapDetails: false,
    showLipofilling: false,
    showChestMasculinisation: false,
    showNippleDetails: false,
    showReconstructionEpisode: false,
    showGenderAffirmingContext: false,
  };

  it("returns 0% for undefined side", () => {
    const result = calculateBreastCompletion(undefined, allFalseFlags);
    expect(result.overallPercentage).toBe(0);
  });

  it("returns 40% for side with just laterality (no context)", () => {
    const side: BreastSideAssessment = { side: "left" } as any;
    const result = calculateBreastCompletion(side, allFalseFlags);
    // laterality=true, context=false, implant=true(skipped), flap=true(skipped), lipofilling=true(skipped)
    // 4/5 = 80%
    expect(result.lateralityComplete).toBe(true);
    expect(result.contextComplete).toBe(false);
  });

  it("counts implant incomplete when flag is on but data missing", () => {
    const side: BreastSideAssessment = {
      side: "left",
      clinicalContext: "reconstructive",
    };
    const flags = { ...allFalseFlags, showImplantDetails: true };
    const result = calculateBreastCompletion(side, flags);
    expect(result.implantComplete).toBe(false);
  });

  it("counts implant complete when deviceType and plane set", () => {
    const side: BreastSideAssessment = {
      side: "left",
      clinicalContext: "reconstructive",
      implantDetails: {
        deviceType: "permanent_implant",
        implantPlane: "subpectoral",
      },
    };
    const flags = { ...allFalseFlags, showImplantDetails: true };
    const result = calculateBreastCompletion(side, flags);
    expect(result.implantComplete).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Summary helpers
// ─────────────────────────────────────────────────────────────────────────────

describe("getImplantSummary", () => {
  it("returns empty for undefined", () => {
    expect(getImplantSummary(undefined)).toBe("");
  });

  it("returns empty for empty object", () => {
    expect(getImplantSummary({} as ImplantDetailsData)).toBe("");
  });

  it("generates summary with volume, manufacturer, shape, plane", () => {
    const data: ImplantDetailsData = {
      deviceType: "permanent_implant",
      volumeCc: 350,
      manufacturer: "allergan",
      shape: "round",
      implantPlane: "dual_plane",
    };
    const summary = getImplantSummary(data);
    expect(summary).toContain("350cc");
    expect(summary).toContain("Allergan");
    expect(summary).toContain("Round");
    expect(summary).toContain("Dual Plane");
  });

  it("handles partial data", () => {
    const data: ImplantDetailsData = { volumeCc: 275 };
    expect(getImplantSummary(data)).toBe("275cc");
  });
});

describe("getFlapSummary", () => {
  it("returns empty for undefined", () => {
    expect(getFlapSummary(undefined)).toBe("");
  });

  it("generates summary with perforators and weight", () => {
    const data: BreastFlapDetailsData = {
      perforators: [{ id: "p1", row: "medial" }, { id: "p2", row: "lateral" }],
      flapWeightGrams: 485,
    };
    const summary = getFlapSummary(data);
    expect(summary).toContain("2 perforators");
    expect(summary).toContain("485g");
  });

  it("includes IMA interspace when artery is IMA", () => {
    const data: BreastFlapDetailsData = {
      recipientArtery: "ima",
      imaInterspace: "3rd",
    };
    const summary = getFlapSummary(data);
    expect(summary).toContain("Internal Mammary Artery");
    expect(summary).toContain("3rd Interspace");
  });

  it("includes coupler size", () => {
    const data: BreastFlapDetailsData = {
      venousCouplerUsed: true,
      venousCouplerSizeMm: 2.8,
    };
    expect(getFlapSummary(data)).toContain("coupler 2.8mm");
  });
});

describe("getLipofillingSummary", () => {
  it("returns empty for undefined", () => {
    expect(getLipofillingSummary(undefined)).toBe("");
  });

  it("generates summary with sites, harvest, and injection", () => {
    const data: LipofillingData = {
      harvestSites: ["abdomen", "flanks"],
      totalVolumeHarvestedMl: 200,
      injectionLeft: { volumeInjectedMl: 80 },
    };
    const summary = getLipofillingSummary(data);
    expect(summary).toContain("2 sites");
    expect(summary).toContain("200ml harvested");
    expect(summary).toContain("80ml injected (L)");
  });

  it("shows both sides when bilateral", () => {
    const data: LipofillingData = {
      injectionLeft: { volumeInjectedMl: 60 },
      injectionRight: { volumeInjectedMl: 70 },
    };
    const summary = getLipofillingSummary(data);
    expect(summary).toContain("60ml (L)");
    expect(summary).toContain("70ml (R)");
  });
});

describe("getLiposuctionSummary", () => {
  it("returns empty for undefined", () => {
    expect(getLiposuctionSummary(undefined)).toBe("");
  });

  it("uses explicit total when set", () => {
    const data: LiposuctionData = {
      areas: [{ site: "abdomen", volumeAspirateMl: 200 }],
      totalAspirateMl: 250,
    };
    const summary = getLiposuctionSummary(data);
    expect(summary).toContain("1 area");
    expect(summary).toContain("250ml");
  });

  it("auto-sums areas when no explicit total", () => {
    const data: LiposuctionData = {
      areas: [
        { site: "abdomen", volumeAspirateMl: 200 },
        { site: "flanks", volumeAspirateMl: 150 },
      ],
    };
    const summary = getLiposuctionSummary(data);
    expect(summary).toContain("2 areas");
    expect(summary).toContain("350ml");
  });

  it("handles empty areas", () => {
    const data: LiposuctionData = {};
    expect(getLiposuctionSummary(data)).toBe("");
  });
});
