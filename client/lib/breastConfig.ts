/**
 * Breast Surgery Module — Configuration & Activation
 *
 * Activation check, clinical context resolution, module visibility rules,
 * implant manufacturer lists, ADM product lists.
 */

import type { DiagnosisPicklistEntry } from "@/types/diagnosis";
import type { ProcedurePicklistEntry } from "@/lib/procedurePicklist";
import type { BreastClinicalContext, BreastSideAssessment } from "@/types/breast";

// ═══════════════════════════════════════════════════════════════════════════════
// ACTIVATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Returns true if the breast module should activate for this specialty.
 * The breast module activates on specialty, not diagnosis metadata
 * (unlike skin cancer which activates on diagnosis).
 */
export function isBreastSpecialty(specialty: string): boolean {
  return specialty === "breast";
}

/**
 * Infer the clinical context for a breast side from the selected diagnosis.
 */
export function getBreastClinicalContext(
  diagnosisEntry?: DiagnosisPicklistEntry
): BreastClinicalContext {
  if (!diagnosisEntry) return "reconstructive";
  if (diagnosisEntry.clinicalGroup === "gender_affirming") return "gender_affirming";
  if (diagnosisEntry.clinicalGroup === "aesthetic") return "aesthetic";
  return "reconstructive";
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE VISIBILITY — which specialty cards to show per procedure
// ═══════════════════════════════════════════════════════════════════════════════

export interface BreastModuleFlags {
  showImplantDetails: boolean;
  showBreastFlapDetails: boolean;
  showPedicledFlapDetails: boolean;
  showLipofilling: boolean;
  showChestMasculinisation: boolean;
  showNippleDetails: boolean;
  showReconstructionEpisode: boolean;
  showGenderAffirmingContext: boolean;
}

/**
 * Determine which breast specialty modules to show based on selected procedures
 * and clinical context.
 */
export function getBreastModuleFlags(
  procedures: ProcedurePicklistEntry[],
  clinicalContext: BreastClinicalContext
): BreastModuleFlags {
  const tags = new Set(procedures.flatMap((p) => p.tags ?? []));
  const ids = new Set(procedures.map((p) => p.id));

  const hasImplantProc =
    ids.has("breast_aes_augmentation_implant") ||
    ids.has("breast_impl_dti") ||
    ids.has("breast_impl_expander_insertion") ||
    ids.has("breast_impl_expander_to_implant") ||
    ids.has("breast_impl_adm_assisted") ||
    ids.has("breast_impl_prepectoral") ||
    ids.has("breast_impl_combined_autologous") ||
    ids.has("breast_ga_augmentation_transfem") ||
    ids.has("breast_rev_implant_exchange") ||
    ids.has("breast_rev_capsulectomy_total") ||
    ids.has("breast_rev_capsulectomy_en_bloc") ||
    ids.has("breast_rev_implant_removal");

  const hasFreeFlap = tags.has("free_flap") || tags.has("microsurgery");
  const hasPedicledFlap = tags.has("pedicled_flap") && !hasFreeFlap;
  const hasLipofilling = tags.has("lipofilling") || [...ids].some((id) => id.startsWith("breast_fat_"));
  const hasChestMasc = [...ids].some((id) => id.startsWith("breast_ga_chest_masc"));
  const hasNipple = ids.has("breast_nipple_reconstruction") || ids.has("breast_nipple_tattooing");

  return {
    showImplantDetails: hasImplantProc,
    showBreastFlapDetails: hasFreeFlap,
    showPedicledFlapDetails: hasPedicledFlap,
    showLipofilling: hasLipofilling,
    showChestMasculinisation: hasChestMasc,
    showNippleDetails: hasNipple,
    showReconstructionEpisode: clinicalContext === "reconstructive",
    showGenderAffirmingContext: clinicalContext === "gender_affirming",
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPLETION CALCULATOR
// ═══════════════════════════════════════════════════════════════════════════════

export interface BreastCompletionStatus {
  lateralityComplete: boolean;
  contextComplete: boolean;
  implantComplete: boolean;
  flapComplete: boolean;
  lipofillingComplete: boolean;
  overallPercentage: number;
}

export function calculateBreastCompletion(
  side: BreastSideAssessment | undefined,
  flags: BreastModuleFlags
): BreastCompletionStatus {
  if (!side) {
    return {
      lateralityComplete: false,
      contextComplete: false,
      implantComplete: false,
      flapComplete: false,
      lipofillingComplete: false,
      overallPercentage: 0,
    };
  }

  const lateralityComplete = true; // Side exists, so laterality was selected
  const contextComplete = !!side.clinicalContext;

  const implantComplete = !flags.showImplantDetails || (
    !!side.implantDetails?.deviceType &&
    !!side.implantDetails?.implantPlane
  );

  const flapComplete = !flags.showBreastFlapDetails || (
    !!side.flapDetails?.recipientArtery
  );

  const lipofillingComplete = !flags.showLipofilling || (
    !!side.lipofilling?.harvestSites?.length &&
    (!!side.lipofilling?.injectionLeft?.volumeInjectedMl || !!side.lipofilling?.injectionRight?.volumeInjectedMl)
  );

  const sections = [lateralityComplete, contextComplete, implantComplete, flapComplete, lipofillingComplete];
  const complete = sections.filter(Boolean).length;
  const overallPercentage = Math.round((complete / sections.length) * 100);

  return { lateralityComplete, contextComplete, implantComplete, flapComplete, lipofillingComplete, overallPercentage };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUMMARY STRING HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

import type {
  ImplantDetailsData,
  BreastFlapDetailsData,
  LipofillingData,
  LiposuctionData,
} from "@/types/breast";
import {
  IMPLANT_PLANE_LABELS,
  IMPLANT_SHAPE_LABELS,
  BREAST_RECIPIENT_ARTERY_LABELS,
  IMA_INTERSPACE_LABELS,
} from "@/types/breast";

/**
 * One-line implant summary for card headers.
 * e.g. "350cc Allergan Round Dual Plane"
 */
export function getImplantSummary(data: ImplantDetailsData | undefined): string {
  if (!data) return "";
  const parts: string[] = [];
  if (data.volumeCc) parts.push(`${data.volumeCc}cc`);
  if (data.manufacturer) {
    const mfr = IMPLANT_MANUFACTURERS.find((m) => m.id === data.manufacturer);
    parts.push(mfr ? mfr.label.split(" (")[0]! : data.manufacturer);
  }
  if (data.shape) parts.push(IMPLANT_SHAPE_LABELS[data.shape]);
  if (data.implantPlane) parts.push(IMPLANT_PLANE_LABELS[data.implantPlane]);
  return parts.join(" ");
}

/**
 * One-line flap summary for card headers.
 * e.g. "2 perforators, IMA 3rd Interspace, coupler 2.8mm, 485g"
 */
export function getFlapSummary(data: BreastFlapDetailsData | undefined): string {
  if (!data) return "";
  const parts: string[] = [];
  const perfCount = data.perforators?.length ?? 0;
  if (perfCount > 0) parts.push(`${perfCount} perforator${perfCount > 1 ? "s" : ""}`);
  if (data.recipientArtery) {
    const arteryLabel = BREAST_RECIPIENT_ARTERY_LABELS[data.recipientArtery];
    if (data.recipientArtery === "ima" && data.imaInterspace) {
      parts.push(`${arteryLabel} ${IMA_INTERSPACE_LABELS[data.imaInterspace]}`);
    } else {
      parts.push(arteryLabel);
    }
  }
  if (data.venousCouplerUsed && data.venousCouplerSizeMm) {
    parts.push(`coupler ${data.venousCouplerSizeMm}mm`);
  }
  if (data.flapWeightGrams) parts.push(`${data.flapWeightGrams}g`);
  return parts.join(", ");
}

/**
 * One-line lipofilling summary for card headers.
 * e.g. "2 sites, 120ml harvested, 80ml injected (L)"
 */
export function getLipofillingSummary(data: LipofillingData | undefined): string {
  if (!data) return "";
  const parts: string[] = [];
  const siteCount = data.harvestSites?.length ?? 0;
  if (siteCount > 0) parts.push(`${siteCount} site${siteCount > 1 ? "s" : ""}`);
  if (data.totalVolumeHarvestedMl) parts.push(`${data.totalVolumeHarvestedMl}ml harvested`);
  const leftVol = data.injectionLeft?.volumeInjectedMl;
  const rightVol = data.injectionRight?.volumeInjectedMl;
  if (leftVol && rightVol) {
    parts.push(`${leftVol}ml (L), ${rightVol}ml (R)`);
  } else if (leftVol) {
    parts.push(`${leftVol}ml injected (L)`);
  } else if (rightVol) {
    parts.push(`${rightVol}ml injected (R)`);
  }
  return parts.join(", ");
}

/**
 * One-line liposuction summary for card headers.
 * e.g. "2 areas, 450ml"
 */
export function getLiposuctionSummary(data: LiposuctionData | undefined): string {
  if (!data) return "";
  const parts: string[] = [];
  const areaCount = data.areas?.length ?? 0;
  if (areaCount > 0) parts.push(`${areaCount} area${areaCount > 1 ? "s" : ""}`);
  const totalMl = data.totalAspirateMl ??
    (data.areas ?? []).reduce((sum, a) => sum + (a.volumeAspirateMl ?? 0), 0);
  if (totalMl > 0) parts.push(`${totalMl}ml`);
  return parts.join(", ");
}

// ═══════════════════════════════════════════════════════════════════════════════
// PREDEFINED PRODUCT LISTS
// ═══════════════════════════════════════════════════════════════════════════════

export const IMPLANT_MANUFACTURERS = [
  { id: "allergan", label: "Allergan (Natrelle)" },
  { id: "mentor", label: "Mentor (Johnson & Johnson)" },
  { id: "sientra", label: "Sientra" },
  { id: "motiva", label: "Motiva (Establishment Labs)" },
  { id: "polytech", label: "Polytech" },
  { id: "sebbin", label: "Sebbin" },
  { id: "eurosilicone", label: "Eurosilicone" },
  { id: "gc_aesthetics", label: "GC Aesthetics (Nagor)" },
  { id: "hansbiomed", label: "Hans Biomed" },
  { id: "ideal_implant", label: "IDEAL Implant" },
  { id: "other", label: "Other" },
] as const;

export const ADM_PRODUCTS = [
  { id: "alloderm", label: "AlloDerm (Allergan)", origin: "human_allograft" as const },
  { id: "flexhd", label: "FlexHD (MTF Biologics)", origin: "human_allograft" as const },
  { id: "strattice", label: "Strattice (Allergan)", origin: "porcine_xenograft" as const },
  { id: "surgimend", label: "SurgiMend (Integra)", origin: "bovine_xenograft" as const },
  { id: "tigr_matrix", label: "TIGR Matrix", origin: "synthetic_absorbable" as const },
  { id: "galaflex", label: "GalaFLEX (Galatea)", origin: "synthetic_absorbable" as const },
  { id: "tiloop_bra", label: "TiLOOP Bra (pfm medical)", origin: "synthetic_nonabsorbable" as const },
  { id: "phasix", label: "Phasix ST (Bard/BD)", origin: "synthetic_absorbable" as const },
  { id: "other", label: "Other" },
] as const;
