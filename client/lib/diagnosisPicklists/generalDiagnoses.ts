/**
 * General Plastics Diagnosis Picklist
 *
 * ~18 structured diagnoses (excluding skin cancer — handled by skinCancerDiagnoses.ts)
 * covering ~80% of general plastics non-skin-cancer cases.
 *
 * Includes staging-conditional logic for:
 * - Pressure injuries (NPUAP staging — already in diagnosisStagingConfig.ts)
 * - Hidradenitis suppurativa (Hurley staging — NEW)
 * - Lymphoedema (ISL staging — NEW)
 *
 * SNOMED CT codes are from the Clinical Finding hierarchy (<<404684003).
 * Procedure suggestion IDs reference ProcedurePicklistEntry.id values.
 */

import type { DiagnosisPicklistEntry } from "@/types/diagnosis";

// ═══════════════════════════════════════════════════════════════════════════════
// BENIGN LESIONS
// ═══════════════════════════════════════════════════════════════════════════════

const GEN_DX_BENIGN: DiagnosisPicklistEntry[] = [
  {
    id: "gen_dx_lipoma",
    displayName: "Lipoma",
    snomedCtCode: "93163002",
    snomedCtDisplay: "Lipoma (disorder)",
    specialty: "general",
    subcategory: "Benign Lesions",
    clinicalGroup: "elective",
    hasStaging: false,
    searchSynonyms: ["lipoma", "fatty lump", "subcutaneous lump"],
    suggestedProcedures: [
      {
        procedurePicklistId: "gen_skin_lipoma",
        displayName: "Lipoma excision",
        isDefault: true,
        sortOrder: 1,
      },
    ],
    sortOrder: 1,
  },
  {
    id: "gen_dx_sebaceous_cyst",
    displayName: "Sebaceous / epidermoid cyst",
    shortName: "Cyst",
    snomedCtCode: "419201005",
    snomedCtDisplay: "Sebaceous cyst (disorder)",
    specialty: "general",
    subcategory: "Benign Lesions",
    clinicalGroup: "elective",
    hasStaging: false,
    searchSynonyms: ["sebaceous cyst", "epidermoid cyst", "pilar cyst", "trichilemmal"],
    suggestedProcedures: [
      {
        procedurePicklistId: "gen_skin_sebaceous_cyst",
        displayName: "Sebaceous / epidermal cyst excision",
        isDefault: true,
        sortOrder: 1,
      },
    ],
    sortOrder: 2,
  },
  {
    id: "gen_dx_benign_lesion",
    displayName: "Benign skin lesion — other",
    shortName: "Benign lesion",
    snomedCtCode: "92384003",
    snomedCtDisplay: "Benign neoplasm of skin (disorder)",
    specialty: "general",
    subcategory: "Benign Lesions",
    clinicalGroup: "elective",
    hasStaging: false,
    searchSynonyms: ["mole", "naevus", "seborrhoeic keratosis", "dermatofibroma", "benign lesion"],
    suggestedProcedures: [
      {
        procedurePicklistId: "gen_skin_benign_lesion",
        displayName: "Benign skin lesion excision",
        isDefault: true,
        sortOrder: 1,
      },
      {
        procedurePicklistId: "gen_skin_biopsy_punch",
        displayName: "Skin biopsy — punch / incisional",
        isDefault: false,
        sortOrder: 2,
      },
      {
        procedurePicklistId: "gen_skin_shave_curette",
        displayName: "Shave excision / curettage",
        isDefault: false,
        sortOrder: 3,
      },
    ],
    sortOrder: 3,
  },
  {
    id: "gen_dx_naevus_excision",
    displayName: "Benign naevus — excision biopsy",
    shortName: "Naevus biopsy",
    snomedCtCode: "398049005",
    snomedCtDisplay: "Melanocytic naevus (disorder)",
    specialty: "general",
    subcategory: "Benign Lesions",
    clinicalGroup: "elective",
    hasStaging: false,
    searchSynonyms: ["mole excision", "atypical naevus", "dysplastic naevus", "changing mole"],
    suggestedProcedures: [
      {
        procedurePicklistId: "gen_skin_benign_lesion",
        displayName: "Benign skin lesion excision",
        isDefault: true,
        sortOrder: 1,
      },
      {
        procedurePicklistId: "gen_skin_biopsy_punch",
        displayName: "Skin biopsy — punch / incisional",
        isDefault: false,
        sortOrder: 2,
      },
    ],
    sortOrder: 4,
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// SCAR / WOUND
// ═══════════════════════════════════════════════════════════════════════════════

const GEN_DX_SCAR_WOUND: DiagnosisPicklistEntry[] = [
  {
    id: "gen_dx_hypertrophic_scar",
    displayName: "Hypertrophic scar",
    shortName: "Hypertrophic scar",
    snomedCtCode: "76742009",
    snomedCtDisplay: "Hypertrophic scar (disorder)",
    specialty: "general",
    subcategory: "Scar & Wound",
    clinicalGroup: "elective",
    hasStaging: false,
    searchSynonyms: ["hypertrophic scar", "raised scar", "red scar", "scar revision"],
    suggestedProcedures: [
      {
        procedurePicklistId: "gen_scar_revision",
        displayName: "Scar revision (excision + direct closure)",
        isDefault: true,
        sortOrder: 1,
      },
      {
        procedurePicklistId: "gen_scar_steroid_injection",
        displayName: "Intralesional steroid injection",
        isDefault: false,
        sortOrder: 2,
      },
    ],
    sortOrder: 1,
  },
  {
    id: "gen_dx_keloid",
    displayName: "Keloid scar",
    shortName: "Keloid",
    snomedCtCode: "49564006",
    snomedCtDisplay: "Keloid scar (disorder)",
    specialty: "general",
    subcategory: "Scar & Wound",
    clinicalGroup: "elective",
    hasStaging: false,
    searchSynonyms: ["keloid", "keloid scar", "ear keloid", "chest keloid"],
    suggestedProcedures: [
      {
        procedurePicklistId: "gen_scar_steroid_injection",
        displayName: "Intralesional steroid injection",
        isDefault: true,
        sortOrder: 1,
      },
      {
        procedurePicklistId: "gen_scar_revision",
        displayName: "Scar revision (excision ± adjuvant)",
        isDefault: false,
        sortOrder: 2,
      },
    ],
    sortOrder: 2,
  },
  {
    id: "gen_dx_chronic_wound",
    displayName: "Chronic non-healing wound",
    shortName: "Chronic wound",
    snomedCtCode: "13954005",
    snomedCtDisplay: "Non-healing wound (disorder)",
    specialty: "general",
    subcategory: "Scar & Wound",
    clinicalGroup: "trauma",
    hasStaging: false,
    searchSynonyms: ["chronic wound", "non-healing", "leg ulcer", "venous ulcer", "wound"],
    suggestedProcedures: [
      {
        procedurePicklistId: "orth_debride_surgical",
        displayName: "Surgical debridement",
        isDefault: true,
        sortOrder: 1,
      },
      {
        procedurePicklistId: "orth_npwt",
        displayName: "Negative pressure wound therapy (NPWT)",
        isDefault: false,
        sortOrder: 2,
      },
      {
        procedurePicklistId: "orth_ssg_meshed",
        displayName: "STSG — meshed",
        isDefault: false,
        sortOrder: 3,
      },
    ],
    sortOrder: 3,
  },
  {
    id: "gen_dx_pilonidal",
    displayName: "Pilonidal sinus",
    shortName: "Pilonidal",
    snomedCtCode: "47639008",
    snomedCtDisplay: "Pilonidal cyst (disorder)",
    specialty: "general",
    subcategory: "Scar & Wound",
    clinicalGroup: "elective",
    hasStaging: false,
    searchSynonyms: ["pilonidal", "sacral sinus", "natal cleft", "pilonidal cyst"],
    suggestedProcedures: [
      {
        procedurePicklistId: "gen_other_pilonidal",
        displayName: "Pilonidal sinus excision + closure / flap",
        isDefault: true,
        sortOrder: 1,
      },
    ],
    sortOrder: 4,
  },
  {
    id: "gen_dx_abscess",
    displayName: "Abscess (soft tissue)",
    shortName: "Abscess",
    snomedCtCode: "128477000",
    snomedCtDisplay: "Abscess (disorder)",
    specialty: "general",
    subcategory: "Scar & Wound",
    clinicalGroup: "trauma",
    hasStaging: false,
    searchSynonyms: ["abscess", "collection", "I&D", "incision and drainage"],
    suggestedProcedures: [
      {
        procedurePicklistId: "gen_abscess_id",
        displayName: "Abscess incision and drainage",
        isDefault: true,
        sortOrder: 1,
      },
    ],
    sortOrder: 5,
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// PRESSURE INJURY — with NPUAP staging conditional logic
// ═══════════════════════════════════════════════════════════════════════════════

const GEN_DX_PRESSURE: DiagnosisPicklistEntry[] = [
  {
    id: "gen_dx_pressure_sacral",
    displayName: "Pressure injury — sacral",
    shortName: "Sacral PI",
    snomedCtCode: "399912005",
    snomedCtDisplay: "Pressure injury of sacral region (disorder)",
    specialty: "general",
    subcategory: "Pressure Injury",
    clinicalGroup: "reconstructive",
    hasStaging: true, // NPUAP staging in diagnosisStagingConfig
    searchSynonyms: ["sacral pressure sore", "sacral pressure ulcer", "bed sore sacrum", "decubitus sacral"],
    suggestedProcedures: [
      {
        procedurePicklistId: "orth_debride_surgical",
        displayName: "Surgical debridement",
        isDefault: true,
        sortOrder: 1,
      },
      {
        procedurePicklistId: "gen_ps_sacral_flap",
        displayName: "Sacral pressure sore — flap closure",
        isDefault: false,
        isConditional: true,
        conditionDescription: "For Stage 3–4 or unstageable",
        conditionStagingMatch: {
          stagingSystemName: "NPUAP Stage",
          matchValues: ["3", "4", "unstageable"],
        },
        sortOrder: 2,
      },
      {
        procedurePicklistId: "orth_npwt",
        displayName: "NPWT",
        isDefault: false,
        sortOrder: 3,
      },
    ],
    sortOrder: 1,
  },
  {
    id: "gen_dx_pressure_ischial",
    displayName: "Pressure injury — ischial",
    shortName: "Ischial PI",
    snomedCtCode: "399912005",
    snomedCtDisplay: "Pressure injury of ischial region (disorder)",
    specialty: "general",
    subcategory: "Pressure Injury",
    clinicalGroup: "reconstructive",
    hasStaging: true,
    searchSynonyms: ["ischial pressure sore", "ischial tuberosity", "sitting sore"],
    suggestedProcedures: [
      {
        procedurePicklistId: "orth_debride_surgical",
        displayName: "Surgical debridement",
        isDefault: true,
        sortOrder: 1,
      },
      {
        procedurePicklistId: "gen_ps_ischial_flap",
        displayName: "Ischial pressure sore — flap closure",
        isDefault: false,
        isConditional: true,
        conditionDescription: "For Stage 3–4 or unstageable",
        conditionStagingMatch: {
          stagingSystemName: "NPUAP Stage",
          matchValues: ["3", "4", "unstageable"],
        },
        sortOrder: 2,
      },
      {
        procedurePicklistId: "orth_npwt",
        displayName: "NPWT",
        isDefault: false,
        sortOrder: 3,
      },
    ],
    sortOrder: 2,
  },
  {
    id: "gen_dx_pressure_trochanteric",
    displayName: "Pressure injury — trochanteric",
    shortName: "Trochanteric PI",
    snomedCtCode: "399912005",
    snomedCtDisplay: "Pressure injury of trochanteric region (disorder)",
    specialty: "general",
    subcategory: "Pressure Injury",
    clinicalGroup: "reconstructive",
    hasStaging: true,
    searchSynonyms: ["trochanteric pressure sore", "hip sore", "lateral hip pressure"],
    suggestedProcedures: [
      {
        procedurePicklistId: "orth_debride_surgical",
        displayName: "Surgical debridement",
        isDefault: true,
        sortOrder: 1,
      },
      {
        procedurePicklistId: "gen_ps_trochanteric_flap",
        displayName: "Trochanteric pressure sore — flap closure",
        isDefault: false,
        isConditional: true,
        conditionDescription: "For Stage 3–4 or unstageable",
        conditionStagingMatch: {
          stagingSystemName: "NPUAP Stage",
          matchValues: ["3", "4", "unstageable"],
        },
        sortOrder: 2,
      },
      {
        procedurePicklistId: "orth_npwt",
        displayName: "NPWT",
        isDefault: false,
        sortOrder: 3,
      },
    ],
    sortOrder: 3,
  },
  {
    id: "gen_dx_pressure_heel",
    displayName: "Pressure injury — heel",
    shortName: "Heel PI",
    snomedCtCode: "399912005",
    snomedCtDisplay: "Pressure injury of heel (disorder)",
    specialty: "general",
    subcategory: "Pressure Injury",
    clinicalGroup: "reconstructive",
    hasStaging: true,
    searchSynonyms: ["heel pressure sore", "heel ulcer", "calcaneal pressure"],
    suggestedProcedures: [
      {
        procedurePicklistId: "orth_debride_surgical",
        displayName: "Surgical debridement",
        isDefault: true,
        sortOrder: 1,
      },
      {
        procedurePicklistId: "orth_ssg_meshed",
        displayName: "STSG — meshed",
        isDefault: false,
        isConditional: true,
        conditionDescription: "For Stage 3–4",
        conditionStagingMatch: {
          stagingSystemName: "NPUAP Stage",
          matchValues: ["3", "4"],
        },
        sortOrder: 2,
      },
      {
        procedurePicklistId: "orth_npwt",
        displayName: "NPWT",
        isDefault: false,
        sortOrder: 3,
      },
    ],
    sortOrder: 4,
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// SPECIALIST CONDITIONS
// ═══════════════════════════════════════════════════════════════════════════════

const GEN_DX_SPECIALIST: DiagnosisPicklistEntry[] = [
  {
    id: "gen_dx_hidradenitis",
    displayName: "Hidradenitis suppurativa",
    shortName: "HS",
    snomedCtCode: "59393003",
    snomedCtDisplay: "Hidradenitis suppurativa (disorder)",
    specialty: "general",
    subcategory: "Specialist Conditions",
    clinicalGroup: "elective",
    hasStaging: true, // Hurley staging — NEW staging config needed
    searchSynonyms: ["HS", "hidradenitis", "acne inversa", "axilla abscess recurrent", "groin abscess recurrent"],
    suggestedProcedures: [
      {
        procedurePicklistId: "gen_hs_deroofing",
        displayName: "Deroofing / unroofing",
        isDefault: true,
        sortOrder: 1,
      },
      {
        procedurePicklistId: "gen_hs_excision_axilla",
        displayName: "HS excision — axilla",
        isDefault: false,
        sortOrder: 2,
      },
      {
        procedurePicklistId: "gen_hs_excision_groin",
        displayName: "HS excision — groin / perineal",
        isDefault: false,
        sortOrder: 3,
      },
      {
        procedurePicklistId: "gen_hs_excision_other",
        displayName: "HS excision — other site",
        isDefault: false,
        sortOrder: 4,
      },
      {
        procedurePicklistId: "orth_ssg_meshed",
        displayName: "STSG — meshed (defect coverage)",
        isDefault: false,
        isConditional: true,
        conditionDescription: "For Hurley III (wide excision)",
        conditionStagingMatch: {
          stagingSystemName: "Hurley Stage",
          matchValues: ["III"],
        },
        sortOrder: 5,
      },
    ],
    sortOrder: 1,
  },
  {
    id: "gen_dx_lymphoedema",
    displayName: "Lymphoedema (primary or secondary)",
    shortName: "Lymphoedema",
    snomedCtCode: "234097001",
    snomedCtDisplay: "Lymphedema (disorder)",
    specialty: "general",
    subcategory: "Specialist Conditions",
    clinicalGroup: "elective",
    hasStaging: true, // ISL staging — NEW staging config needed
    searchSynonyms: ["lymphoedema", "lymphedema", "arm swelling post-cancer", "leg swelling", "LVA", "VLNT"],
    suggestedProcedures: [
      {
        procedurePicklistId: "gen_lymph_lva",
        displayName: "Lymphovenous anastomosis (LVA)",
        isDefault: true,
        sortOrder: 1,
      },
      {
        procedurePicklistId: "gen_lymph_vlnt",
        displayName: "Vascularised lymph node transfer (VLNT)",
        isDefault: false,
        sortOrder: 2,
      },
      {
        procedurePicklistId: "gen_lymph_liposuction",
        displayName: "Liposuction for lymphoedema",
        isDefault: false,
        isConditional: true,
        conditionDescription: "For ISL Stage II–III (non-pitting / fibrotic)",
        conditionStagingMatch: {
          stagingSystemName: "ISL Stage",
          matchValues: ["II", "IIb", "III"],
        },
        sortOrder: 3,
      },
      {
        procedurePicklistId: "gen_lymph_debulking",
        displayName: "Debulking / Charles procedure",
        isDefault: false,
        isConditional: true,
        conditionDescription: "For ISL Stage III (elephantiasis)",
        conditionStagingMatch: {
          stagingSystemName: "ISL Stage",
          matchValues: ["III"],
        },
        sortOrder: 4,
      },
    ],
    sortOrder: 2,
  },
  {
    id: "gen_dx_vasc_malformation_low_flow",
    displayName: "Vascular malformation — low flow (venous / lymphatic)",
    shortName: "Low-flow VM",
    snomedCtCode: "234143007",
    snomedCtDisplay: "Vascular malformation (disorder)",
    specialty: "general",
    subcategory: "Specialist Conditions",
    clinicalGroup: "elective",
    hasStaging: false,
    searchSynonyms: ["venous malformation", "lymphatic malformation", "low flow", "VM", "cystic hygroma"],
    suggestedProcedures: [
      {
        procedurePicklistId: "gen_vasc_excision",
        displayName: "Vascular malformation excision",
        isDefault: true,
        sortOrder: 1,
      },
      {
        procedurePicklistId: "gen_vasc_sclerotherapy",
        displayName: "Sclerotherapy",
        isDefault: false,
        sortOrder: 2,
      },
      {
        procedurePicklistId: "gen_vasc_laser",
        displayName: "Laser treatment",
        isDefault: false,
        sortOrder: 3,
      },
    ],
    sortOrder: 3,
  },
  {
    id: "gen_dx_vasc_malformation_high_flow",
    displayName: "Vascular malformation — high flow (arteriovenous)",
    shortName: "High-flow AVM",
    snomedCtCode: "234143007",
    snomedCtDisplay: "Arteriovenous malformation (disorder)",
    specialty: "general",
    subcategory: "Specialist Conditions",
    clinicalGroup: "elective",
    hasStaging: false,
    searchSynonyms: ["AVM", "arteriovenous malformation", "high flow", "pulsatile"],
    suggestedProcedures: [
      {
        procedurePicklistId: "gen_vasc_excision",
        displayName: "Vascular malformation excision",
        isDefault: true,
        sortOrder: 1,
      },
    ],
    sortOrder: 4,
  },
  {
    id: "gen_dx_gender_affirming_chest",
    displayName: "Gender dysphoria — chest masculinisation",
    shortName: "Top surgery FTM",
    snomedCtCode: "93461009",
    snomedCtDisplay: "Gender dysphoria (disorder)",
    specialty: "general",
    subcategory: "Specialist Conditions",
    clinicalGroup: "elective",
    hasStaging: false,
    searchSynonyms: ["top surgery", "FTM", "chest masculinisation", "transgender", "gender affirming"],
    suggestedProcedures: [
      {
        procedurePicklistId: "gen_ga_chest_masculinisation",
        displayName: "Chest masculinisation (top surgery — FTM)",
        isDefault: true,
        sortOrder: 1,
      },
    ],
    sortOrder: 5,
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export const GENERAL_DIAGNOSES: DiagnosisPicklistEntry[] = [
  ...GEN_DX_BENIGN,
  ...GEN_DX_SCAR_WOUND,
  ...GEN_DX_PRESSURE,
  ...GEN_DX_SPECIALIST,
];

export function getGeneralSubcategories(): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const dx of GENERAL_DIAGNOSES) {
    if (!seen.has(dx.subcategory)) {
      seen.add(dx.subcategory);
      result.push(dx.subcategory);
    }
  }
  return result;
}

export function getGeneralDiagnosesForSubcategory(
  subcategory: string
): DiagnosisPicklistEntry[] {
  return GENERAL_DIAGNOSES.filter((dx) => dx.subcategory === subcategory);
}
