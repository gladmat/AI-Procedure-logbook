/**
 * Skin Cancer Module — Activation & Clinical Logic
 * ══════════════════════════════════════════════════
 *
 * Pure logic module (no React). Contains:
 * - Module activation check (diagnosis-metadata driven, NOT specialty-gated)
 * - Clinical pathway assignment (melanoma-like / BCC-SCC-like / complex-MDT)
 * - Margin recommendation engine (guideline-based CDS)
 * - SLNB visibility rules
 * - Margin status sync (detailed → quick summary)
 * - Section completion calculator
 * - Rare type metadata
 *
 * NAMING: This module exports `shouldActivateSkinCancerModule` (not
 * `isSkinCancerDiagnosis`) to avoid import ambiguity with the function of
 * the same name in client/lib/skinCancerDiagnoses.ts.
 */

import { isSkinCancerDiagnosis } from "@/lib/skinCancerDiagnoses";
import type { DiagnosisPicklistEntry } from "@/types/diagnosis";
import type { LesionInstance, Case } from "@/types/case";
import type {
  SkinCancerPathologyCategory,
  SkinCancerPathwayStage,
  RareMalignantSubtype,
  SkinCancerHistology,
  SkinCancerLesionAssessment,
  MarginRecommendation,
  SkinCancerCompletionState,
  SectionStatus,
  ClinicalPathwayTemplate,
  DetailedMarginStatus,
} from "@/types/skinCancer";

// ═══════════════════════════════════════════════════════════
// ACTIVATION CHECK
// ═══════════════════════════════════════════════════════════

/**
 * Returns true if the skin cancer assessment module should activate for this
 * picklist entry. Two activation paths:
 *
 * 1. `hasEnhancedHistology === true` on the picklist entry
 * 2. The entry's SNOMED CT code matches a skin cancer diagnosis
 *
 * Does NOT check specialty, enabling cross-specialty activation.
 */
export function shouldActivateSkinCancerModule(
  entry: DiagnosisPicklistEntry | null | undefined,
): boolean {
  if (!entry) return false;
  if (entry.hasEnhancedHistology === true) return true;
  if (isSkinCancerDiagnosis(entry.snomedCtCode, entry.displayName)) return true;
  return false;
}

/**
 * Variant for when the picklist entry is not available — uses SNOMED code
 * and display name directly (same signature as isSkinCancerDiagnosis).
 */
export function shouldActivateSkinCancerModuleForSnomed(
  snomedCtCode?: string,
  displayName?: string,
): boolean {
  if (!snomedCtCode && !displayName) return false;
  return isSkinCancerDiagnosis(snomedCtCode, displayName);
}

// ═══════════════════════════════════════════════════════════
// DIAGNOSIS AUTO-CONFIG
// ═══════════════════════════════════════════════════════════

/**
 * Auto-configuration derived from the selected diagnosis.
 * Drives pathway gate filtering, pathology locking, and histology source
 * visibility — eliminating redundant manual selections.
 */
export interface DiagnosisAutoConfig {
  /** Pathway stage to auto-set when this diagnosis is selected */
  autoPathwayStage: SkinCancerPathwayStage;
  /** Pathology category to auto-set in histology (if known) */
  autoPathologyCategory?: SkinCancerPathologyCategory;
  /** Rare subtype to auto-set (for DFSP, AFX) */
  autoRareSubtype?: RareMalignantSubtype;
  /** Which pathway stages to show in PathwayGate */
  availablePathwayStages: SkinCancerPathwayStage[];
  /** Whether the pathology category chips should be locked */
  lockedPathology: boolean;
  /** Whether to hide "current_procedure" from histology source options */
  hideCurrentProcedureSource: boolean;
}

/** Stages shown for known diagnoses (biopsy already done) */
const KNOWN_DIAGNOSIS_STAGES: SkinCancerPathwayStage[] = [
  "histology_known",
];

/**
 * Returns auto-config for a skin cancer diagnosis picklist entry.
 * Called when the user selects a diagnosis from the picker.
 */
export function getSkinCancerDiagnosisAutoConfig(
  diagnosisId: string | undefined,
): DiagnosisAutoConfig {
  switch (diagnosisId) {
    // ── Unclear Lesion — biopsy pathway only ──
    case "sc_dx_skin_lesion_excision_biopsy":
      return {
        autoPathwayStage: "excision_biopsy",
        availablePathwayStages: ["excision_biopsy"],
        lockedPathology: false,
        hideCurrentProcedureSource: false,
      };

    // ── Premalignant — no pathology lock ──
    case "sc_dx_actinic_keratosis":
      return {
        autoPathwayStage: "histology_known",
        availablePathwayStages: KNOWN_DIAGNOSIS_STAGES,
        lockedPathology: false,
        hideCurrentProcedureSource: true,
      };

    // ── Non-Melanoma Skin Cancer ──
    case "sc_dx_bcc":
      return {
        autoPathwayStage: "histology_known",
        autoPathologyCategory: "bcc",
        availablePathwayStages: KNOWN_DIAGNOSIS_STAGES,
        lockedPathology: true,
        hideCurrentProcedureSource: true,
      };

    case "sc_dx_scc":
      return {
        autoPathwayStage: "histology_known",
        autoPathologyCategory: "scc",
        availablePathwayStages: KNOWN_DIAGNOSIS_STAGES,
        lockedPathology: true,
        hideCurrentProcedureSource: true,
      };

    case "sc_dx_bowens": // SCC in situ
      return {
        autoPathwayStage: "histology_known",
        autoPathologyCategory: "scc",
        availablePathwayStages: KNOWN_DIAGNOSIS_STAGES,
        lockedPathology: true,
        hideCurrentProcedureSource: true,
      };

    case "sc_dx_keratoacanthoma": // Well-differentiated SCC variant
      return {
        autoPathwayStage: "histology_known",
        autoPathologyCategory: "scc",
        availablePathwayStages: KNOWN_DIAGNOSIS_STAGES,
        lockedPathology: true,
        hideCurrentProcedureSource: true,
      };

    // ── Melanoma ──
    case "sc_dx_melanoma":
    case "sc_dx_melanoma_primary":
      return {
        autoPathwayStage: "histology_known",
        autoPathologyCategory: "melanoma",
        availablePathwayStages: KNOWN_DIAGNOSIS_STAGES,
        lockedPathology: true,
        hideCurrentProcedureSource: true,
      };

    // ── Rare / Other Malignant ──
    case "sc_dx_merkel_cell":
      return {
        autoPathwayStage: "histology_known",
        autoPathologyCategory: "merkel_cell",
        availablePathwayStages: KNOWN_DIAGNOSIS_STAGES,
        lockedPathology: true,
        hideCurrentProcedureSource: true,
      };

    case "sc_dx_dfsp":
      return {
        autoPathwayStage: "histology_known",
        autoPathologyCategory: "rare_malignant",
        autoRareSubtype: "dfsp",
        availablePathwayStages: KNOWN_DIAGNOSIS_STAGES,
        lockedPathology: true,
        hideCurrentProcedureSource: true,
      };

    case "sc_dx_afx":
      return {
        autoPathwayStage: "histology_known",
        autoPathologyCategory: "rare_malignant",
        autoRareSubtype: "afx",
        availablePathwayStages: KNOWN_DIAGNOSIS_STAGES,
        lockedPathology: true,
        hideCurrentProcedureSource: true,
      };

    // Fallback — inline flow (no diagnosis selected) or unknown
    default:
      return {
        autoPathwayStage: undefined as unknown as SkinCancerPathwayStage,
        availablePathwayStages: [
          "excision_biopsy",
          "histology_known",
        ],
        lockedPathology: false,
        hideCurrentProcedureSource: false,
      };
  }
}

// ═══════════════════════════════════════════════════════════
// CLINICAL PATHWAY ASSIGNMENT
// ═══════════════════════════════════════════════════════════

const MELANOMA_LIKE_TYPES: Set<RareMalignantSubtype> = new Set([
  "sebaceous_carcinoma",
  "porocarcinoma",
  "hidradenocarcinoma",
  "digital_papillary_adenocarcinoma",
  "epithelioid_sarcoma",
]);

const COMPLEX_MDT_TYPES: Set<RareMalignantSubtype> = new Set([
  "dfsp",
  "pleomorphic_dermal_sarcoma",
  "angiosarcoma",
  "cutaneous_leiomyosarcoma",
  "myxofibrosarcoma",
  "empd",
  "cutaneous_lymphoma",
  "cutaneous_metastasis",
]);

export function getClinicalPathway(
  category: SkinCancerPathologyCategory,
  rareSubtype?: RareMalignantSubtype,
): ClinicalPathwayTemplate {
  if (category === "melanoma" || category === "merkel_cell")
    return "melanoma_like";
  if (category === "bcc" || category === "scc") return "bcc_scc_like";
  if (category === "benign" || category === "uncertain") return "bcc_scc_like";
  // rare_malignant — check subtype
  if (rareSubtype) {
    if (MELANOMA_LIKE_TYPES.has(rareSubtype)) return "melanoma_like";
    if (COMPLEX_MDT_TYPES.has(rareSubtype)) return "complex_mdt";
    // AFX, MAC, trichilemmal, mucinous, pilomatrical, adenoid cystic
    return "bcc_scc_like";
  }
  return "bcc_scc_like";
}

// ═══════════════════════════════════════════════════════════
// MARGIN RECOMMENDATIONS
// ═══════════════════════════════════════════════════════════

export function getMarginRecommendation(
  histology: SkinCancerHistology,
): MarginRecommendation | undefined {
  const { pathologyCategory, rareSubtype } = histology;

  if (pathologyCategory === "melanoma") {
    const b = histology.melanomaBreslowMm;
    if (b === undefined) return undefined;
    if (b === 0)
      return {
        recommendedMm: 5,
        guidelineSource: "NCCN",
        guidelineNote: "5mm for melanoma in situ",
      };
    if (b <= 1.0)
      return {
        recommendedMm: 10,
        guidelineSource: "NCCN",
        guidelineNote: "1cm for melanoma \u22641.0mm",
      };
    if (b <= 2.0)
      return {
        recommendedMm: 10,
        guidelineSource: "NCCN",
        guidelineNote: "1\u20132cm for melanoma 1.01\u20132.0mm",
      };
    return {
      recommendedMm: 20,
      guidelineSource: "NCCN",
      guidelineNote: "2cm for melanoma >2.0mm",
    };
  }

  if (pathologyCategory === "bcc") {
    const sub = histology.bccSubtype;
    if (
      sub === "morphoeic" ||
      sub === "infiltrative" ||
      sub === "micronodular"
    ) {
      return {
        recommendedMm: 5,
        guidelineSource: "BAD",
        guidelineNote: "\u22655mm for aggressive BCC subtypes (or Mohs)",
      };
    }
    return {
      recommendedMm: 4,
      guidelineSource: "BAD",
      guidelineNote: "3\u20134mm peripheral for standard BCC",
    };
  }

  if (pathologyCategory === "scc") {
    if (histology.sccRiskLevel === "high") {
      return {
        recommendedMm: 6,
        guidelineSource: "BAD",
        guidelineNote: "6\u201310mm for high-risk SCC",
      };
    }
    return {
      recommendedMm: 5,
      guidelineSource: "BAD",
      guidelineNote: "4\u20136mm for low-risk SCC",
    };
  }

  if (pathologyCategory === "merkel_cell") {
    return {
      recommendedMm: 20,
      guidelineSource: "NCCN",
      guidelineNote: "1\u20132cm to fascia for MCC",
    };
  }

  // Rare types
  if (pathologyCategory === "rare_malignant" && rareSubtype) {
    const RARE_MARGINS: Partial<
      Record<RareMalignantSubtype, MarginRecommendation>
    > = {
      dfsp: {
        recommendedMm: 30,
        guidelineSource: "NCCN",
        guidelineNote: "2\u20133cm or Mohs for DFSP",
      },
      mac: {
        recommendedMm: 20,
        guidelineSource: "EXPERT",
        guidelineNote: "\u22652cm or Mohs (preferred) for MAC",
      },
      pleomorphic_dermal_sarcoma: {
        recommendedMm: 20,
        guidelineSource: "EXPERT",
        guidelineNote: "\u22652cm to fascia for PDS",
      },
      angiosarcoma: {
        recommendedMm: 30,
        guidelineSource: "EXPERT",
        guidelineNote: "\u22653cm (often positive regardless)",
      },
      empd: {
        recommendedMm: 50,
        guidelineSource: "EXPERT",
        guidelineNote: "\u22655cm without Mohs; Mohs mapping preferred",
      },
      sebaceous_carcinoma: {
        recommendedMm: 6,
        guidelineSource: "EXPERT",
        guidelineNote: "5\u20136mm, clear margins critical",
      },
      afx: {
        recommendedMm: 10,
        guidelineSource: "EXPERT",
        guidelineNote: "1\u20132cm for AFX",
      },
      porocarcinoma: {
        recommendedMm: 20,
        guidelineSource: "EXPERT",
        guidelineNote: "\u22652cm for porocarcinoma",
      },
      epithelioid_sarcoma: {
        recommendedMm: 20,
        guidelineSource: "EXPERT",
        guidelineNote: "\u22652cm for epithelioid sarcoma",
      },
      cutaneous_leiomyosarcoma: {
        recommendedMm: 10,
        guidelineSource: "EXPERT",
        guidelineNote: "\u22651cm for cutaneous LMS",
      },
    };
    return (
      RARE_MARGINS[rareSubtype] ?? {
        recommendedMm: null,
        guidelineSource: "EXPERT" as const,
        guidelineNote: "No established margin guideline \u2014 discuss at MDT",
      }
    );
  }

  return undefined;
}

// ═══════════════════════════════════════════════════════════
// SLNB CRITERIA
// ═══════════════════════════════════════════════════════════

export function shouldOfferSLNB(histology: SkinCancerHistology): boolean {
  if (histology.pathologyCategory === "melanoma") {
    if (
      histology.melanomaBreslowMm !== undefined &&
      histology.melanomaBreslowMm > 0.8
    )
      return true;
    if (histology.melanomaUlceration) return true;
    return false;
  }
  if (histology.pathologyCategory === "merkel_cell") return true;
  return false;
}

/** Whether the surgeon should see a manual SLNB toggle (not auto-shown) */
export function canConsiderSLNB(histology: SkinCancerHistology): boolean {
  if (shouldOfferSLNB(histology)) return true;
  if (
    histology.pathologyCategory === "scc" &&
    histology.sccRiskLevel === "high"
  )
    return true;
  const SLNB_CONSIDERABLE_RARE: Set<RareMalignantSubtype> = new Set([
    "porocarcinoma",
    "sebaceous_carcinoma",
    "epithelioid_sarcoma",
    "digital_papillary_adenocarcinoma",
    "hidradenocarcinoma",
  ]);
  if (
    histology.pathologyCategory === "rare_malignant" &&
    histology.rareSubtype &&
    SLNB_CONSIDERABLE_RARE.has(histology.rareSubtype)
  )
    return true;
  return false;
}

// ═══════════════════════════════════════════════════════════
// MARGIN STATUS SYNC (detailed → quick summary)
// ═══════════════════════════════════════════════════════════

export function toQuickMarginStatus(
  detailed: DetailedMarginStatus | undefined,
): LesionInstance["marginStatus"] {
  if (!detailed || detailed === "pending" || detailed === "unknown")
    return "pending";
  if (detailed === "complete") return "clear";
  return "involved"; // 'incomplete' and 'close' both map to 'involved'
}

// ═══════════════════════════════════════════════════════════
// COMPLETION STATE
// ═══════════════════════════════════════════════════════════

export function getSkinCancerCompletion(
  assessment: SkinCancerLesionAssessment | undefined,
): SkinCancerCompletionState {
  if (!assessment) {
    return {
      lesionDetails: "not_started",
      procedure: "not_started",
      histology: "not_started",
      slnb: "not_applicable",
      finalMargins: "not_started",
    };
  }

  const lesionDetails: SectionStatus = assessment.clinicalSuspicion
    ? "complete"
    : "not_started";
  const procedure: SectionStatus = "not_started"; // Determined by parent — procedures array

  let histology: SectionStatus = "not_started";
  if (assessment.pathwayStage === "excision_biopsy") {
    histology =
      assessment.currentHistology?.marginStatus &&
      assessment.currentHistology.marginStatus !== "pending"
        ? "complete"
        : "pending";
  } else if (assessment.priorHistology?.pathologyCategory) {
    histology = "complete";
  }

  let slnb: SectionStatus = "not_applicable";
  const histo = assessment.priorHistology || assessment.currentHistology;
  if (histo && shouldOfferSLNB(histo)) {
    slnb = assessment.slnb?.offered !== undefined ? "complete" : "pending";
  }

  const finalMargins: SectionStatus =
    assessment.currentHistology?.marginStatus &&
    assessment.currentHistology.marginStatus !== "pending"
      ? "complete"
      : assessment.pathwayStage === "excision_biopsy"
        ? "pending"
        : "not_started";

  return { lesionDetails, procedure, histology, slnb, finalMargins };
}

// ═══════════════════════════════════════════════════════════
// PATHWAY BADGE (multi-lesion header)
// ═══════════════════════════════════════════════════════════

/**
 * Returns a compact badge descriptor for the lesion header row
 * in MultiLesionEditor. Reflects pathway stage + margin outcome.
 */
export function getPathwayBadge(
  assessment: SkinCancerLesionAssessment | undefined,
): {
  label: string;
  colorKey: "warning" | "success" | "error" | "info";
} | null {
  if (!assessment?.pathwayStage) return null;
  const histo = assessment.currentHistology || assessment.priorHistology;

  // Excision biopsy with no definitive histology yet
  if (
    assessment.pathwayStage === "excision_biopsy" &&
    (!histo || histo.marginStatus === "pending")
  ) {
    return { label: "Awaiting histo", colorKey: "warning" };
  }

  // Margin outcomes (any pathway)
  if (histo?.marginStatus === "complete") {
    return { label: "Margins clear", colorKey: "success" };
  }
  if (
    histo?.marginStatus === "incomplete" ||
    histo?.marginStatus === "close"
  ) {
    return { label: "Incomplete margins", colorKey: "error" };
  }

  // Stage-specific defaults
  if (assessment.pathwayStage === "histology_known") {
    return { label: "Histology known", colorKey: "info" };
  }

  return null;
}

// ═══════════════════════════════════════════════════════════
// SKIN CANCER CASE BADGE (dashboard card display)
// ═══════════════════════════════════════════════════════════

const CATEGORY_SHORT_LABELS: Record<string, string> = {
  bcc: "BCC",
  scc: "SCC",
  melanoma: "Melanoma",
  merkel_cell: "MCC",
  rare_malignant: "Rare malig.",
  benign: "Benign",
  uncertain: "Uncertain",
};

/**
 * Returns a two-part badge for skin cancer cases on the dashboard:
 * diagnosis label (BCC/SCC/Melanoma/etc) + histology status.
 */
export function getSkinCancerCaseBadge(
  assessment: SkinCancerLesionAssessment | undefined,
): {
  label: string;
  colorKey: "warning" | "success" | "error" | "info";
} | null {
  if (!assessment?.pathwayStage) return null;

  // Determine diagnosis label
  const category =
    assessment.currentHistology?.pathologyCategory ??
    assessment.priorHistology?.pathologyCategory ??
    assessment.clinicalSuspicion;
  const diagLabel = category
    ? (CATEGORY_SHORT_LABELS[category] ?? "Skin lesion")
    : "Skin lesion";

  // Determine histology status
  const current = assessment.currentHistology;

  if (current?.pathologyCategory) {
    // Has definitive histology
    if (
      current.marginStatus === "incomplete" ||
      current.marginStatus === "close"
    ) {
      return {
        label: `${diagLabel} · Incomplete margins`,
        colorKey: "error",
      };
    }
    if (current.marginStatus === "complete") {
      return {
        label: `${diagLabel} · Margins clear`,
        colorKey: "success",
      };
    }
    return { label: `${diagLabel} · Histology ✓`, colorKey: "success" };
  }

  // No current histology
  if (assessment.pathwayStage === "excision_biopsy") {
    return {
      label: `${diagLabel} · Awaiting histology`,
      colorKey: "warning",
    };
  }

  // histology_known pathway but no currentHistology yet
  return { label: diagLabel, colorKey: "info" };
}

// ═══════════════════════════════════════════════════════════
// CASE HISTOLOGY DETECTION
// ═══════════════════════════════════════════════════════════

/**
 * Returns true if a case CAN have histology added/updated.
 * True for any skin cancer case (any pathway) or clinical-only diagnosis.
 * Used for showing "Add Histology" / "Update Histology" buttons.
 */
export function caseCanAddHistology(caseData: Case): boolean {
  for (const g of caseData.diagnosisGroups ?? []) {
    if (g.skinCancerAssessment) return true;
    for (const l of g.lesionInstances ?? []) {
      if (l.skinCancerAssessment) return true;
    }
    if (g.diagnosisCertainty === "clinical") return true;
  }
  return false;
}

/**
 * Returns true if a case needs histology results to be entered.
 * Skin cancer: any lesion on excision_biopsy pathway without currentHistology.
 * Other: diagnosisCertainty === "clinical" and no histologyResult.
 */
export function caseNeedsHistology(caseData: Case): boolean {
  for (const g of caseData.diagnosisGroups ?? []) {
    // Skin cancer single-lesion
    if (g.skinCancerAssessment) {
      if (
        g.skinCancerAssessment.pathwayStage === "excision_biopsy" &&
        !g.skinCancerAssessment.currentHistology?.pathologyCategory
      ) {
        return true;
      }
    }

    // Skin cancer multi-lesion
    for (const l of g.lesionInstances ?? []) {
      if (l.skinCancerAssessment) {
        if (
          l.skinCancerAssessment.pathwayStage === "excision_biopsy" &&
          !l.skinCancerAssessment.currentHistology?.pathologyCategory
        ) {
          return true;
        }
      }
    }

    // General case with clinical-only diagnosis and no histology result
    if (g.diagnosisCertainty === "clinical" && !g.histologyResult) {
      return true;
    }
  }
  return false;
}

/**
 * Returns the index of the first diagnosis group needing histology,
 * along with optional lesion index for multi-lesion skin cancer.
 */
export function getFirstHistologyTarget(
  caseData: Case,
): { groupIndex: number; lesionIndex?: number } | null {
  const groups = caseData.diagnosisGroups ?? [];

  // Pass 1: prioritise groups that actively need histology (pending)
  for (let gi = 0; gi < groups.length; gi++) {
    const g = groups[gi];
    if (!g) continue;

    if (g.skinCancerAssessment) {
      if (
        g.skinCancerAssessment.pathwayStage === "excision_biopsy" &&
        !g.skinCancerAssessment.currentHistology?.pathologyCategory
      ) {
        return { groupIndex: gi };
      }
    }

    const lesions = g.lesionInstances ?? [];
    for (let li = 0; li < lesions.length; li++) {
      const l = lesions[li];
      if (
        l?.skinCancerAssessment?.pathwayStage === "excision_biopsy" &&
        !l.skinCancerAssessment.currentHistology?.pathologyCategory
      ) {
        return { groupIndex: gi, lesionIndex: li };
      }
    }

    if (g.diagnosisCertainty === "clinical" && !g.histologyResult) {
      return { groupIndex: gi };
    }
  }

  // Pass 2: fallback — any group where histology can be added/updated
  for (let gi = 0; gi < groups.length; gi++) {
    const g = groups[gi];
    if (!g) continue;

    if (g.skinCancerAssessment) {
      return { groupIndex: gi };
    }

    const lesions = g.lesionInstances ?? [];
    for (let li = 0; li < lesions.length; li++) {
      if (lesions[li]?.skinCancerAssessment) {
        return { groupIndex: gi, lesionIndex: li };
      }
    }
  }

  return null;
}

// ═══════════════════════════════════════════════════════════
// RARE TYPE METADATA
// ═══════════════════════════════════════════════════════════

export interface RareTypeInfo {
  label: string;
  group: "adnexal" | "sarcoma" | "other";
  icdO3?: string;
  snomedCt?: string;
}

export const RARE_TYPE_METADATA: Record<RareMalignantSubtype, RareTypeInfo> = {
  sebaceous_carcinoma: {
    label: "Sebaceous carcinoma",
    group: "adnexal",
    icdO3: "8410/3",
    snomedCt: "254681003",
  },
  porocarcinoma: {
    label: "Eccrine porocarcinoma",
    group: "adnexal",
    icdO3: "8409/3",
    snomedCt: "403917003",
  },
  mac: {
    label: "Microcystic adnexal carcinoma",
    group: "adnexal",
    icdO3: "8407/3",
    snomedCt: "403913004",
  },
  hidradenocarcinoma: {
    label: "Hidradenocarcinoma",
    group: "adnexal",
    icdO3: "8400/3",
    snomedCt: "403916007",
  },
  spiradenocarcinoma: {
    label: "Spiradenocarcinoma",
    group: "adnexal",
    icdO3: "8403/3",
    snomedCt: "35941009",
  },
  trichilemmal_carcinoma: {
    label: "Trichilemmal carcinoma",
    group: "adnexal",
    icdO3: "8102/3",
    snomedCt: "403909002",
  },
  mucinous_eccrine_carcinoma: {
    label: "Mucinous eccrine carcinoma",
    group: "adnexal",
    icdO3: "8480/3",
    snomedCt: "72495009",
  },
  apocrine_carcinoma: {
    label: "Apocrine carcinoma",
    group: "adnexal",
    icdO3: "8401/3",
    snomedCt: "399739006",
  },
  digital_papillary_adenocarcinoma: {
    label: "Digital papillary adenocarcinoma",
    group: "adnexal",
    icdO3: "8408/3",
  },
  empd: {
    label: "Extramammary Paget's disease",
    group: "adnexal",
    icdO3: "8542/3",
    snomedCt: "8098009",
  },
  adenoid_cystic_cutaneous: {
    label: "Adenoid cystic carcinoma (cutaneous)",
    group: "adnexal",
    icdO3: "8200/3",
    snomedCt: "11671000",
  },
  pilomatrical_carcinoma: {
    label: "Pilomatrical carcinoma",
    group: "adnexal",
    icdO3: "8110/3",
    snomedCt: "403911006",
  },
  other_adnexal: { label: "Other adnexal carcinoma", group: "adnexal" },
  dfsp: {
    label: "DFSP",
    group: "sarcoma",
    icdO3: "8832/3",
    snomedCt: "254709003",
  },
  afx: {
    label: "Atypical fibroxanthoma",
    group: "sarcoma",
    icdO3: "8830/1",
    snomedCt: "403914005",
  },
  pleomorphic_dermal_sarcoma: {
    label: "Pleomorphic dermal sarcoma",
    group: "sarcoma",
    icdO3: "8830/3",
    snomedCt: "404036006",
  },
  angiosarcoma: {
    label: "Angiosarcoma",
    group: "sarcoma",
    icdO3: "9120/3",
    snomedCt: "39000009",
  },
  cutaneous_leiomyosarcoma: {
    label: "Cutaneous leiomyosarcoma",
    group: "sarcoma",
    icdO3: "8890/3",
    snomedCt: "443498003",
  },
  myxofibrosarcoma: {
    label: "Myxofibrosarcoma",
    group: "sarcoma",
    icdO3: "8811/3",
  },
  epithelioid_sarcoma: {
    label: "Epithelioid sarcoma",
    group: "sarcoma",
    icdO3: "8804/3",
  },
  other_sarcoma: { label: "Other cutaneous sarcoma", group: "sarcoma" },
  cutaneous_lymphoma: {
    label: "Cutaneous lymphoma (biopsy)",
    group: "other",
    icdO3: "9700/3",
    snomedCt: "62479008",
  },
  cutaneous_metastasis: { label: "Cutaneous metastasis", group: "other" },
  other_nos: { label: "Other skin malignancy NOS", group: "other" },
};

// ═══════════════════════════════════════════════════════════
// PROCEDURE SUGGESTION ENGINE
// ═══════════════════════════════════════════════════════════

const HEAD_NECK_SITES = new Set([
  "Scalp",
  "Forehead",
  "Temple",
  "Nose",
  "Cheek",
  "Ear",
  "Eyelid",
  "Upper lip",
  "Lower lip",
  "Chin / Jaw",
  "Neck",
]);

/**
 * Returns procedure picklist IDs based on assessment state.
 * Uses clinical suspicion for Pathway A, histology for B/C.
 * Site determines head-neck vs body procedure variants.
 */
export function getSkinCancerProcedureSuggestions(
  assessment: SkinCancerLesionAssessment,
): string[] {
  const hn = !!assessment.site && HEAD_NECK_SITES.has(assessment.site);
  const histo = assessment.priorHistology || assessment.currentHistology;

  // Reconstruction-only: don't suggest excision
  if (
    assessment.indication === "delayed_reconstruction" ||
    assessment.indication === "mohs_reconstruction"
  ) {
    return [];
  }

  const suggestions: string[] = [];

  // Biopsy pathway: biopsy type drives suggestion
  if (assessment.pathwayStage === "excision_biopsy") {
    switch (assessment.biopsyType) {
      case "excision_biopsy":
        suggestions.push("gen_skin_excision_biopsy");
        break;
      case "incisional_biopsy":
        suggestions.push("gen_skin_biopsy_punch");
        break;
      case "shave_biopsy":
        suggestions.push("gen_skin_shave_curette");
        break;
      case "punch_biopsy":
        suggestions.push("gen_skin_biopsy_punch");
        break;
    }
    return suggestions;
  }

  // Histology known: histology drives suggestion
  if (!histo) return suggestions;
  const cat = histo.pathologyCategory;
  if (cat === "bcc")
    suggestions.push(
      hn ? "hn_skin_bcc_excision" : "gen_skin_bcc_excision_body",
    );
  else if (cat === "scc")
    suggestions.push(
      hn ? "hn_skin_scc_excision" : "gen_skin_scc_excision_body",
    );
  else if (cat === "melanoma")
    suggestions.push(hn ? "hn_skin_melanoma_wle" : "gen_mel_wle_body");
  else if (cat === "merkel_cell")
    suggestions.push("gen_mel_merkel_excision");
  else if (cat === "rare_malignant" && histo.rareSubtype === "dfsp")
    suggestions.push("gen_mel_dfsp_excision");

  // SLNB procedure
  if (assessment.slnb?.performed) {
    suggestions.push(hn ? "hn_skin_slnb" : "gen_mel_slnb_body");
  }

  // Site-specific reconstruction options
  const site = assessment.site;
  if (site === "Upper lip" || site === "Lower lip") {
    suggestions.push("hn_recon_lip_wedge", "hn_reg_abbe", "hn_reg_estlander");
  } else if (site === "Ear") {
    suggestions.push("hn_recon_ear_partial");
  } else if (site === "Eyelid") {
    suggestions.push(
      "hn_recon_tenzel",
      "hn_recon_eyelid_upper",
      "hn_recon_eyelid_lower",
    );
  }

  // Coverage / reconstruction options (if not already covered by site-specific above)
  // Most excisions need coverage if not closed primarily — FTSG, STSG, or local flap
  if (suggestions.length > 0 && !assessment.biopsyType) {
    const hasSiteSpecificRecon =
      site === "Upper lip" ||
      site === "Lower lip" ||
      site === "Ear" ||
      site === "Eyelid";

    if (!hasSiteSpecificRecon) {
      if (hn) {
        // Head & neck: FTSG preferred, plus local flap options
        suggestions.push(
          "orth_ftsg",
          "hn_local_advancement",
          "hn_local_rotation",
          "hn_local_bilobed",
          "hn_local_rhomboid",
        );
      } else {
        // Body: FTSG, STSG, and orthoplastic local flaps
        suggestions.push(
          "orth_ftsg",
          "orth_ssg_sheet",
          "orth_local_rotation",
          "orth_local_transposition",
        );
      }
    }
  }

  return suggestions;
}

// ═══════════════════════════════════════════════════════════
// DIAGNOSIS RESOLUTION (inline flow)
// ═══════════════════════════════════════════════════════════

/**
 * Resolved diagnosis info — maps pathology category + context to a
 * diagnosis picklist entry (SNOMED code + display name).
 *
 * Used by the inline skin cancer flow (no DiagnosisPicker) to
 * populate the parent DiagnosisGroup on "Accept".
 */
export interface ResolvedSkinCancerDiagnosis {
  diagnosisPicklistId: string;
  displayName: string;
  snomedCtCode: string;
  snomedCtDisplay: string;
}

/**
 * Resolves a SkinCancerLesionAssessment to a diagnosis picklist entry.
 *
 * Resolution priority:
 * 1. Biopsy pathway without histology → generic skin lesion
 * 2. Use the *best available* histology (prior > current, since prior represents
 *    the confirmed diagnosis that led to this procedure)
 * 3. Map pathology category → SNOMED diagnosis
 * 4. For rare_malignant, check rareSubtype for DFSP/AFX specific entries
 * 5. Fallback: generic skin lesion
 */
export function resolveSkinCancerDiagnosis(
  assessment: SkinCancerLesionAssessment,
): ResolvedSkinCancerDiagnosis | null {
  // Biopsy pathway without histology → generic skin lesion
  if (assessment.pathwayStage === "excision_biopsy") {
    // If clinical suspicion is set, use it to resolve a better diagnosis
    const cat = assessment.clinicalSuspicion;
    if (cat) {
      const resolved = resolveFromPathologyCategory(cat);
      if (resolved) return resolved;
    }
    // Otherwise, generic excision biopsy
    return {
      diagnosisPicklistId: "sc_dx_skin_lesion_excision_biopsy",
      displayName: "Skin lesion — excision biopsy (awaiting histology)",
      snomedCtCode: "95324001",
      snomedCtDisplay: "Skin lesion (finding)",
    };
  }

  // Histology known — use histology (prior first, then current)
  const histo = assessment.priorHistology ?? assessment.currentHistology;
  if (!histo?.pathologyCategory) {
    // No histology available — use clinical suspicion if available
    const cat = assessment.clinicalSuspicion;
    if (cat) {
      const resolved = resolveFromPathologyCategory(cat);
      if (resolved) return resolved;
    }
    return null;
  }

  // Map rare_malignant with specific subtypes
  if (histo.pathologyCategory === "rare_malignant" && histo.rareSubtype) {
    const rareResolved = resolveRareSubtype(histo.rareSubtype);
    if (rareResolved) return rareResolved;
  }

  return resolveFromPathologyCategory(histo.pathologyCategory);
}

/** Maps a pathology category to a standard diagnosis picklist entry */
function resolveFromPathologyCategory(
  category: SkinCancerPathologyCategory,
): ResolvedSkinCancerDiagnosis | null {
  switch (category) {
    case "bcc":
      return {
        diagnosisPicklistId: "sc_dx_bcc",
        displayName: "Basal cell carcinoma (BCC)",
        snomedCtCode: "254701007",
        snomedCtDisplay: "Basal cell carcinoma of skin (disorder)",
      };
    case "scc":
      return {
        diagnosisPicklistId: "sc_dx_scc",
        displayName: "Squamous cell carcinoma (SCC)",
        snomedCtCode: "254651007",
        snomedCtDisplay: "Squamous cell carcinoma of skin (disorder)",
      };
    case "melanoma":
      return {
        diagnosisPicklistId: "sc_dx_melanoma",
        displayName: "Melanoma",
        snomedCtCode: "93655004",
        snomedCtDisplay: "Malignant melanoma of skin (disorder)",
      };
    case "merkel_cell":
      return {
        diagnosisPicklistId: "sc_dx_merkel_cell",
        displayName: "Merkel cell carcinoma (MCC)",
        snomedCtCode: "253001006",
        snomedCtDisplay: "Merkel cell carcinoma of skin (disorder)",
      };
    case "rare_malignant":
      // Generic rare malignant — no specific subtype known
      return {
        diagnosisPicklistId: "sc_dx_skin_lesion_excision_biopsy",
        displayName: "Skin lesion — excision biopsy (awaiting histology)",
        snomedCtCode: "95324001",
        snomedCtDisplay: "Skin lesion (finding)",
      };
    case "benign":
    case "uncertain":
      return {
        diagnosisPicklistId: "sc_dx_skin_lesion_excision_biopsy",
        displayName: "Skin lesion — excision biopsy (awaiting histology)",
        snomedCtCode: "95324001",
        snomedCtDisplay: "Skin lesion (finding)",
      };
    default:
      return null;
  }
}

/** Maps specific rare subtypes to dedicated diagnosis entries */
function resolveRareSubtype(
  subtype: RareMalignantSubtype,
): ResolvedSkinCancerDiagnosis | null {
  switch (subtype) {
    case "dfsp":
      return {
        diagnosisPicklistId: "sc_dx_dfsp",
        displayName: "Dermatofibrosarcoma protuberans (DFSP)",
        snomedCtCode: "404037006",
        snomedCtDisplay: "Dermatofibrosarcoma protuberans (disorder)",
      };
    case "afx":
      return {
        diagnosisPicklistId: "sc_dx_afx",
        displayName: "Atypical fibroxanthoma (AFX)",
        snomedCtCode: "404036002",
        snomedCtDisplay: "Atypical fibroxanthoma (disorder)",
      };
    default:
      // Other rare subtypes don't have dedicated picklist entries
      return null;
  }
}
