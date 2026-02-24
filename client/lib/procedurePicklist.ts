/**
 * Procedure Picklist — Layer 1 of the three-layer terminology architecture
 *
 * Each entry maps surgeon-colloquial display names to canonical SNOMED CT
 * concept IDs. SNOMED codes marked // VERIFY should be confirmed in
 * https://browser.ihtsdotools.org/ before production use.
 *
 * Specialties sharing procedures (e.g. skin grafting) use a single entry
 * tagged to multiple specialties — context comes from case metadata,
 * not duplicate entries.
 */

import type { Specialty, ProcedureTag } from "@/types/case";

export interface ProcedurePicklistEntry {
  id: string;
  displayName: string;
  snomedCtCode: string;
  snomedCtDisplay: string;
  specialties: Specialty[];
  subcategory: string;
  tags: ProcedureTag[];
  hasFreeFlap?: boolean;
  sortOrder: number;
}

const ORTHOPLASTIC_FREE_FLAP: ProcedurePicklistEntry[] = [
  {
    id: "orth_ff_alt",
    displayName: "Free ALT flap",
    snomedCtCode: "234298008",
    snomedCtDisplay: "Anterolateral thigh free flap (procedure)",
    specialties: ["orthoplastic", "head_neck", "general"],
    subcategory: "Free Flap Coverage",
    tags: ["free_flap", "microsurgery"],
    hasFreeFlap: true,
    sortOrder: 1,
  },
  {
    id: "orth_ff_gracilis",
    displayName: "Free Gracilis flap",
    snomedCtCode: "234297004",
    snomedCtDisplay: "Free gracilis flap (procedure)",
    specialties: ["orthoplastic", "head_neck", "general"],
    subcategory: "Free Flap Coverage",
    tags: ["free_flap", "microsurgery"],
    hasFreeFlap: true,
    sortOrder: 2,
  },
  {
    id: "orth_ff_tug",
    displayName: "TUG flap (Transverse Upper Gracilis)",
    snomedCtCode: "234297004",
    snomedCtDisplay: "Free gracilis flap (procedure)",
    specialties: ["orthoplastic", "breast"],
    subcategory: "Free Flap Coverage",
    tags: ["free_flap", "microsurgery"],
    hasFreeFlap: true,
    sortOrder: 3,
  },
  {
    id: "orth_ff_rfff",
    displayName: "Free Radial Forearm Flap (RFFF)",
    snomedCtCode: "234295007",
    snomedCtDisplay: "Free radial forearm flap (procedure)",
    specialties: ["orthoplastic", "head_neck", "general"],
    subcategory: "Free Flap Coverage",
    tags: ["free_flap", "microsurgery"],
    hasFreeFlap: true,
    sortOrder: 4,
  },
  {
    id: "orth_ff_fibula",
    displayName: "Free Fibula osteocutaneous flap",
    snomedCtCode: "234289000",
    snomedCtDisplay: "Free fibula flap (procedure)",
    specialties: ["orthoplastic", "head_neck"],
    subcategory: "Free Flap Coverage",
    tags: ["free_flap", "microsurgery"],
    hasFreeFlap: true,
    sortOrder: 5,
  },
  {
    id: "orth_ff_ld",
    displayName: "Free Latissimus Dorsi (LD) flap",
    snomedCtCode: "234296008",
    snomedCtDisplay: "Free latissimus dorsi flap (procedure)",
    specialties: ["orthoplastic", "head_neck", "breast"],
    subcategory: "Free Flap Coverage",
    tags: ["free_flap", "microsurgery"],
    hasFreeFlap: true,
    sortOrder: 6,
  },
  {
    id: "orth_ff_msap",
    displayName: "Free MSAP flap (Medial Sural Artery Perforator)",
    snomedCtCode: "234306008",
    snomedCtDisplay: "Free medial sural artery perforator flap (procedure)",
    specialties: ["orthoplastic", "head_neck"],
    subcategory: "Free Flap Coverage",
    tags: ["free_flap", "microsurgery"],
    hasFreeFlap: true,
    sortOrder: 7,
  },
  {
    id: "orth_ff_tdap",
    displayName: "Free TDAP flap (Thoracodorsal Artery Perforator)",
    snomedCtCode: "234307004",
    snomedCtDisplay: "Free thoracodorsal artery perforator flap (procedure)",
    specialties: ["orthoplastic", "head_neck"],
    subcategory: "Free Flap Coverage",
    tags: ["free_flap", "microsurgery"],
    hasFreeFlap: true,
    sortOrder: 8,
  },
  {
    id: "orth_ff_pap",
    displayName: "Free PAP flap (Profunda Artery Perforator)",
    snomedCtCode: "234308009",
    snomedCtDisplay: "Free profunda artery perforator flap (procedure)",
    specialties: ["orthoplastic", "breast"],
    subcategory: "Free Flap Coverage",
    tags: ["free_flap", "microsurgery"],
    hasFreeFlap: true,
    sortOrder: 9,
  },
  {
    id: "orth_ff_scapular",
    displayName: "Free Scapular flap",
    snomedCtCode: "234303000",
    snomedCtDisplay: "Free scapular flap (procedure)",
    specialties: ["orthoplastic", "head_neck"],
    subcategory: "Free Flap Coverage",
    tags: ["free_flap", "microsurgery"],
    hasFreeFlap: true,
    sortOrder: 10,
  },
  {
    id: "orth_ff_parascapular",
    displayName: "Free Parascapular flap",
    snomedCtCode: "234304006",
    snomedCtDisplay: "Free parascapular flap (procedure)",
    specialties: ["orthoplastic", "head_neck"],
    subcategory: "Free Flap Coverage",
    tags: ["free_flap", "microsurgery"],
    hasFreeFlap: true,
    sortOrder: 11,
  },
  {
    id: "orth_ff_serratus",
    displayName: "Free Serratus Anterior flap",
    snomedCtCode: "234305007",
    snomedCtDisplay: "Free serratus anterior flap (procedure)",
    specialties: ["orthoplastic"],
    subcategory: "Free Flap Coverage",
    tags: ["free_flap", "microsurgery"],
    hasFreeFlap: true,
    sortOrder: 12,
  },
  {
    id: "orth_ff_scip",
    displayName: "Free SCIP flap (Superficial Circumflex Iliac Perforator)",
    snomedCtCode: "234299000",
    snomedCtDisplay: "Free superficial circumflex iliac artery flap (procedure)",
    specialties: ["orthoplastic", "head_neck"],
    subcategory: "Free Flap Coverage",
    tags: ["free_flap", "microsurgery"],
    hasFreeFlap: true,
    sortOrder: 13,
  },
  {
    id: "orth_ff_other",
    displayName: "Free flap — other (specify in notes)",
    snomedCtCode: "122462001",
    snomedCtDisplay: "Flap reconstruction (procedure)",
    specialties: ["orthoplastic", "head_neck", "general"],
    subcategory: "Free Flap Coverage",
    tags: ["free_flap", "microsurgery"],
    hasFreeFlap: true,
    sortOrder: 14,
  },
];

const ORTHOPLASTIC_PEDICLED_FLAP: ProcedurePicklistEntry[] = [
  {
    id: "orth_ped_gastrocnemius_medial",
    displayName: "Pedicled Gastrocnemius flap — medial head",
    snomedCtCode: "122462001",
    snomedCtDisplay: "Flap reconstruction (procedure)",
    specialties: ["orthoplastic"],
    subcategory: "Pedicled Flap Coverage",
    tags: ["pedicled_flap"],
    sortOrder: 1,
  },
  {
    id: "orth_ped_gastrocnemius_lateral",
    displayName: "Pedicled Gastrocnemius flap — lateral head",
    snomedCtCode: "122462001",
    snomedCtDisplay: "Flap reconstruction (procedure)",
    specialties: ["orthoplastic"],
    subcategory: "Pedicled Flap Coverage",
    tags: ["pedicled_flap"],
    sortOrder: 2,
  },
  {
    id: "orth_ped_soleus",
    displayName: "Pedicled Soleus flap",
    snomedCtCode: "122462001",
    snomedCtDisplay: "Flap reconstruction (procedure)",
    specialties: ["orthoplastic"],
    subcategory: "Pedicled Flap Coverage",
    tags: ["pedicled_flap"],
    sortOrder: 3,
  },
  {
    id: "orth_ped_propeller",
    displayName: "Propeller perforator flap (pedicled)",
    snomedCtCode: "122462001",
    snomedCtDisplay: "Flap reconstruction (procedure)",
    specialties: ["orthoplastic", "general"],
    subcategory: "Pedicled Flap Coverage",
    tags: ["pedicled_flap"],
    sortOrder: 4,
  },
  {
    id: "orth_ped_reversed_sural",
    displayName: "Reversed sural artery flap",
    snomedCtCode: "122462001",
    snomedCtDisplay: "Flap reconstruction (procedure)",
    specialties: ["orthoplastic"],
    subcategory: "Pedicled Flap Coverage",
    tags: ["pedicled_flap"],
    sortOrder: 5,
  },
  {
    id: "orth_ped_ld",
    displayName: "Pedicled Latissimus Dorsi flap",
    snomedCtCode: "122462001",
    snomedCtDisplay: "Flap reconstruction (procedure)",
    specialties: ["orthoplastic", "general"],
    subcategory: "Pedicled Flap Coverage",
    tags: ["pedicled_flap"],
    sortOrder: 6,
  },
  {
    id: "orth_ped_vy_fasciocutaneous",
    displayName: "V-Y fasciocutaneous advancement flap",
    snomedCtCode: "122462001",
    snomedCtDisplay: "Flap reconstruction (procedure)",
    specialties: ["orthoplastic", "general"],
    subcategory: "Pedicled Flap Coverage",
    tags: ["pedicled_flap", "local_flap"],
    sortOrder: 7,
  },
  {
    id: "orth_ped_alt_pedicled",
    displayName: "Pedicled ALT flap (islanded)",
    snomedCtCode: "122462001",
    snomedCtDisplay: "Flap reconstruction (procedure)",
    specialties: ["orthoplastic"],
    subcategory: "Pedicled Flap Coverage",
    tags: ["pedicled_flap"],
    sortOrder: 8,
  },
];

const ORTHOPLASTIC_LOCAL_FLAP: ProcedurePicklistEntry[] = [
  {
    id: "orth_local_rotation",
    displayName: "Rotation fasciocutaneous flap",
    snomedCtCode: "122462001",
    snomedCtDisplay: "Flap reconstruction (procedure)",
    specialties: ["orthoplastic", "general"],
    subcategory: "Local Flap Coverage",
    tags: ["local_flap"],
    sortOrder: 1,
  },
  {
    id: "orth_local_transposition",
    displayName: "Transposition fasciocutaneous flap",
    snomedCtCode: "122462001",
    snomedCtDisplay: "Flap reconstruction (procedure)",
    specialties: ["orthoplastic", "general"],
    subcategory: "Local Flap Coverage",
    tags: ["local_flap"],
    sortOrder: 2,
  },
  {
    id: "orth_local_bipedicle",
    displayName: "Bipedicle advancement flap",
    snomedCtCode: "122462001",
    snomedCtDisplay: "Flap reconstruction (procedure)",
    specialties: ["orthoplastic", "general"],
    subcategory: "Local Flap Coverage",
    tags: ["local_flap"],
    sortOrder: 3,
  },
];

const ORTHOPLASTIC_SKIN_GRAFT: ProcedurePicklistEntry[] = [
  {
    id: "orth_ssg_meshed",
    displayName: "Split-thickness skin graft (STSG) — meshed",
    snomedCtCode: "14413003",
    snomedCtDisplay: "Split-thickness skin graft (procedure)",
    specialties: ["orthoplastic", "burns", "general", "head_neck"],
    subcategory: "Skin Grafting",
    tags: ["skin_graft"],
    sortOrder: 1,
  },
  {
    id: "orth_ssg_sheet",
    displayName: "Split-thickness skin graft (STSG) — sheet",
    snomedCtCode: "14413003",
    snomedCtDisplay: "Split-thickness skin graft (procedure)",
    specialties: ["orthoplastic", "burns", "general", "head_neck"],
    subcategory: "Skin Grafting",
    tags: ["skin_graft"],
    sortOrder: 2,
  },
  {
    id: "orth_ftsg",
    displayName: "Full-thickness skin graft (FTSG)",
    snomedCtCode: "265336007",
    snomedCtDisplay: "Full-thickness skin graft (procedure)",
    specialties: ["orthoplastic", "general", "head_neck"],
    subcategory: "Skin Grafting",
    tags: ["skin_graft"],
    sortOrder: 3,
  },
  {
    id: "orth_dermal_substitute",
    displayName: "Dermal substitute ± STSG (staged reconstruction)",
    snomedCtCode: "14413003",
    snomedCtDisplay: "Split-thickness skin graft (procedure)",
    specialties: ["orthoplastic", "burns"],
    subcategory: "Skin Grafting",
    tags: ["skin_graft", "complex_wound"],
    sortOrder: 4,
  },
];

const ORTHOPLASTIC_WOUND: ProcedurePicklistEntry[] = [
  {
    id: "orth_debride_surgical",
    displayName: "Surgical debridement",
    snomedCtCode: "36777000",
    snomedCtDisplay: "Debridement (procedure)",
    specialties: ["orthoplastic", "burns", "general"],
    subcategory: "Wound Management",
    tags: ["complex_wound"],
    sortOrder: 1,
  },
  {
    id: "orth_npwt",
    displayName: "Negative pressure wound therapy (NPWT / VAC)",
    snomedCtCode: "229070002",
    snomedCtDisplay: "Negative pressure wound therapy (procedure)",
    specialties: ["orthoplastic", "burns", "general"],
    subcategory: "Wound Management",
    tags: ["complex_wound"],
    sortOrder: 2,
  },
  {
    id: "orth_washout",
    displayName: "Wound washout + debridement",
    snomedCtCode: "36777000",
    snomedCtDisplay: "Debridement (procedure)",
    specialties: ["orthoplastic", "general"],
    subcategory: "Wound Management",
    tags: ["complex_wound"],
    sortOrder: 3,
  },
  {
    id: "orth_sequestrectomy",
    displayName: "Sequestrectomy (bone debridement)",
    snomedCtCode: "87085001",
    snomedCtDisplay: "Sequestrectomy (procedure)",
    specialties: ["orthoplastic"],
    subcategory: "Wound Management",
    tags: ["complex_wound"],
    sortOrder: 4,
  },
  {
    id: "orth_wound_closure_delayed",
    displayName: "Delayed primary wound closure",
    snomedCtCode: "36777000",
    snomedCtDisplay: "Debridement (procedure)",
    specialties: ["orthoplastic", "general"],
    subcategory: "Wound Management",
    tags: ["complex_wound"],
    sortOrder: 5,
  },
];

const ORTHOPLASTIC_LIMB_SALVAGE: ProcedurePicklistEntry[] = [
  {
    id: "orth_acute_reconstruction_gustilo_iiib",
    displayName: "Acute orthoplastic reconstruction — Gustilo IIIb/IIIc",
    snomedCtCode: "122462001",
    snomedCtDisplay: "Flap reconstruction (procedure)",
    specialties: ["orthoplastic"],
    subcategory: "Limb Salvage",
    tags: ["free_flap", "microsurgery", "trauma", "complex_wound"],
    hasFreeFlap: true,
    sortOrder: 1,
  },
  {
    id: "orth_bka",
    displayName: "Below-knee amputation (BKA)",
    snomedCtCode: "84367004",
    snomedCtDisplay: "Amputation below knee (procedure)",
    specialties: ["orthoplastic"],
    subcategory: "Limb Salvage",
    tags: ["trauma"],
    sortOrder: 2,
  },
  {
    id: "orth_aka",
    displayName: "Above-knee amputation (AKA)",
    snomedCtCode: "13771000",
    snomedCtDisplay: "Amputation above knee (procedure)",
    specialties: ["orthoplastic"],
    subcategory: "Limb Salvage",
    tags: ["trauma"],
    sortOrder: 3,
  },
  {
    id: "orth_ray_amputation",
    displayName: "Ray amputation",
    snomedCtCode: "71906001",
    snomedCtDisplay: "Ray amputation of finger (procedure)",
    specialties: ["orthoplastic", "hand_surgery"],
    subcategory: "Limb Salvage",
    tags: ["trauma"],
    sortOrder: 4,
  },
  {
    id: "orth_stump_revision",
    displayName: "Amputation stump revision",
    snomedCtCode: "122462001",
    snomedCtDisplay: "Flap reconstruction (procedure)",
    specialties: ["orthoplastic"],
    subcategory: "Limb Salvage",
    tags: ["revision"],
    sortOrder: 5,
  },
];

const ORTHOPLASTIC_COMPLEX_RECONSTRUCTION: ProcedurePicklistEntry[] = [
  {
    id: "orth_pressure_sore_flap",
    displayName: "Pressure sore flap reconstruction",
    snomedCtCode: "122462001",
    snomedCtDisplay: "Flap reconstruction (procedure)",
    specialties: ["orthoplastic", "general"],
    subcategory: "Complex Reconstruction",
    tags: ["pedicled_flap", "complex_wound"],
    sortOrder: 1,
  },
  {
    id: "orth_perineal_reconstruction",
    displayName: "Perineal / pelvic reconstruction",
    snomedCtCode: "122462001",
    snomedCtDisplay: "Flap reconstruction (procedure)",
    specialties: ["orthoplastic", "general"],
    subcategory: "Complex Reconstruction",
    tags: ["free_flap", "pedicled_flap", "complex_wound"],
    sortOrder: 2,
  },
  {
    id: "orth_chest_wall_reconstruction",
    displayName: "Chest wall reconstruction",
    snomedCtCode: "122462001",
    snomedCtDisplay: "Flap reconstruction (procedure)",
    specialties: ["orthoplastic", "general"],
    subcategory: "Complex Reconstruction",
    tags: ["pedicled_flap", "complex_wound"],
    sortOrder: 3,
  },
  {
    id: "orth_abdominal_wall_reconstruction",
    displayName: "Abdominal wall reconstruction",
    snomedCtCode: "122462001",
    snomedCtDisplay: "Flap reconstruction (procedure)",
    specialties: ["orthoplastic", "general"],
    subcategory: "Complex Reconstruction",
    tags: ["pedicled_flap", "complex_wound"],
    sortOrder: 4,
  },
];

export const PROCEDURE_PICKLIST: ProcedurePicklistEntry[] = [
  ...ORTHOPLASTIC_FREE_FLAP,
  ...ORTHOPLASTIC_PEDICLED_FLAP,
  ...ORTHOPLASTIC_LOCAL_FLAP,
  ...ORTHOPLASTIC_SKIN_GRAFT,
  ...ORTHOPLASTIC_WOUND,
  ...ORTHOPLASTIC_LIMB_SALVAGE,
  ...ORTHOPLASTIC_COMPLEX_RECONSTRUCTION,
];

export function getProceduresForSpecialty(
  specialty: Specialty
): ProcedurePicklistEntry[] {
  return PROCEDURE_PICKLIST.filter((p) => p.specialties.includes(specialty));
}

export function getSubcategoriesForSpecialty(specialty: Specialty): string[] {
  const entries = getProceduresForSpecialty(specialty);
  const seen = new Set<string>();
  const result: string[] = [];
  for (const e of entries) {
    if (!seen.has(e.subcategory)) {
      seen.add(e.subcategory);
      result.push(e.subcategory);
    }
  }
  return result;
}

export function getProceduresForSubcategory(
  specialty: Specialty,
  subcategory: string
): ProcedurePicklistEntry[] {
  return getProceduresForSpecialty(specialty).filter(
    (p) => p.subcategory === subcategory
  );
}

export function findPicklistEntry(id: string): ProcedurePicklistEntry | undefined {
  return PROCEDURE_PICKLIST.find((p) => p.id === id);
}

export function hasPicklistForSpecialty(specialty: Specialty): boolean {
  return getProceduresForSpecialty(specialty).length > 0;
}
