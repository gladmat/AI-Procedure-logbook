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

// ═══════════════════════════════════════════════════════════════════════════
// ORTHOPLASTIC (~45 procedures)
// ═══════════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════════════
// HAND SURGERY (~100 procedures across 9 subcategories)
// ═══════════════════════════════════════════════════════════════════════════

const HAND_FRACTURE_FIXATION: ProcedurePicklistEntry[] = [
  {
    id: "hand_fx_distal_radius_orif",
    displayName: "Distal radius ORIF (volar plate)",
    snomedCtCode: "73994004",
    snomedCtDisplay: "Open reduction of fracture of radius with internal fixation (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Fracture & Joint Fixation",
    tags: ["trauma"],
    sortOrder: 1,
  },
  {
    id: "hand_fx_distal_radius_crif",
    displayName: "Distal radius CRIF (K-wires)",
    snomedCtCode: "179097006",
    snomedCtDisplay: "Closed reduction of fracture of radius with internal fixation (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Fracture & Joint Fixation",
    tags: ["trauma"],
    sortOrder: 2,
  },
  {
    id: "hand_fx_distal_radius_exfix",
    displayName: "Distal radius external fixation",
    snomedCtCode: "302191005", // VERIFY
    snomedCtDisplay: "Application of external fixator to radius (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Fracture & Joint Fixation",
    tags: ["trauma"],
    sortOrder: 3,
  },
  {
    id: "hand_fx_metacarpal_orif",
    displayName: "Metacarpal fracture ORIF",
    snomedCtCode: "263135001", // VERIFY
    snomedCtDisplay: "Open reduction of fracture of metacarpal with internal fixation (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Fracture & Joint Fixation",
    tags: ["trauma"],
    sortOrder: 4,
  },
  {
    id: "hand_fx_metacarpal_crif",
    displayName: "Metacarpal fracture CRIF (K-wires)",
    snomedCtCode: "263136000", // VERIFY
    snomedCtDisplay: "Closed reduction of fracture of metacarpal with internal fixation (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Fracture & Joint Fixation",
    tags: ["trauma"],
    sortOrder: 5,
  },
  {
    id: "hand_fx_phalanx_orif",
    displayName: "Phalangeal fracture ORIF",
    snomedCtCode: "15257006",
    snomedCtDisplay: "Open reduction of fracture of phalanx with internal fixation (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Fracture & Joint Fixation",
    tags: ["trauma"],
    sortOrder: 6,
  },
  {
    id: "hand_fx_phalanx_crif",
    displayName: "Phalangeal fracture CRIF (K-wires)",
    snomedCtCode: "15257006", // VERIFY — may share parent
    snomedCtDisplay: "Closed reduction of fracture of phalanx with internal fixation (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Fracture & Joint Fixation",
    tags: ["trauma"],
    sortOrder: 7,
  },
  {
    id: "hand_fx_scaphoid_orif",
    displayName: "Scaphoid fracture ORIF (headless screw)",
    snomedCtCode: "41585002",
    snomedCtDisplay: "Open reduction of fracture of carpal bone with internal fixation (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Fracture & Joint Fixation",
    tags: ["trauma"],
    sortOrder: 8,
  },
  {
    id: "hand_fx_scaphoid_percutaneous",
    displayName: "Scaphoid fracture percutaneous fixation",
    snomedCtCode: "41585002", // VERIFY
    snomedCtDisplay: "Fixation of fracture of carpal bone (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Fracture & Joint Fixation",
    tags: ["trauma"],
    sortOrder: 9,
  },
  {
    id: "hand_fx_bennett",
    displayName: "Bennett's fracture fixation",
    snomedCtCode: "263135001", // VERIFY — metacarpal parent
    snomedCtDisplay: "Fixation of fracture of first metacarpal (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Fracture & Joint Fixation",
    tags: ["trauma"],
    sortOrder: 10,
  },
  {
    id: "hand_fx_rolando",
    displayName: "Rolando's fracture fixation",
    snomedCtCode: "263135001", // VERIFY
    snomedCtDisplay: "Fixation of fracture of first metacarpal (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Fracture & Joint Fixation",
    tags: ["trauma"],
    sortOrder: 11,
  },
  {
    id: "hand_fx_carpal_other",
    displayName: "Carpal fracture fixation — other",
    snomedCtCode: "41585002",
    snomedCtDisplay: "Open reduction of fracture of carpal bone with internal fixation (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Fracture & Joint Fixation",
    tags: ["trauma"],
    sortOrder: 12,
  },
  {
    id: "hand_fx_corrective_osteotomy",
    displayName: "Corrective osteotomy (malunion)",
    snomedCtCode: "178728004", // VERIFY
    snomedCtDisplay: "Corrective osteotomy of hand (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Fracture & Joint Fixation",
    tags: ["revision"],
    sortOrder: 13,
  },
  {
    id: "hand_fx_scaphoid_nonunion_graft",
    displayName: "Scaphoid non-union bone graft",
    snomedCtCode: "41585002", // VERIFY
    snomedCtDisplay: "Bone graft to scaphoid (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Fracture & Joint Fixation",
    tags: ["revision"],
    sortOrder: 14,
  },
];

const HAND_TENDON_SURGERY: ProcedurePicklistEntry[] = [
  {
    id: "hand_tend_flexor_primary",
    displayName: "Flexor tendon primary repair",
    snomedCtCode: "41727003",
    snomedCtDisplay: "Repair of tendon of hand (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Tendon Surgery",
    tags: ["tendon_repair", "trauma"],
    sortOrder: 1,
  },
  {
    id: "hand_tend_flexor_delayed",
    displayName: "Flexor tendon delayed primary repair",
    snomedCtCode: "41727003",
    snomedCtDisplay: "Repair of tendon of hand (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Tendon Surgery",
    tags: ["tendon_repair", "trauma"],
    sortOrder: 2,
  },
  {
    id: "hand_tend_flexor_graft",
    displayName: "Flexor tendon graft (staged or single-stage)",
    snomedCtCode: "53363003", // VERIFY
    snomedCtDisplay: "Tendon graft to hand (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Tendon Surgery",
    tags: ["tendon_repair"],
    sortOrder: 3,
  },
  {
    id: "hand_tend_extensor_primary",
    displayName: "Extensor tendon primary repair",
    snomedCtCode: "41727003",
    snomedCtDisplay: "Repair of tendon of hand (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Tendon Surgery",
    tags: ["tendon_repair", "trauma"],
    sortOrder: 4,
  },
  {
    id: "hand_tend_extensor_central_slip",
    displayName: "Central slip reconstruction",
    snomedCtCode: "41727003", // VERIFY
    snomedCtDisplay: "Reconstruction of extensor mechanism of finger (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Tendon Surgery",
    tags: ["tendon_repair"],
    sortOrder: 5,
  },
  {
    id: "hand_tend_mallet_finger",
    displayName: "Mallet finger repair / splintage",
    snomedCtCode: "239248002", // VERIFY
    snomedCtDisplay: "Repair of mallet finger (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Tendon Surgery",
    tags: ["tendon_repair", "trauma"],
    sortOrder: 6,
  },
  {
    id: "hand_tend_boutonniere_reconstruction",
    displayName: "Boutonnière reconstruction",
    snomedCtCode: "41727003", // VERIFY
    snomedCtDisplay: "Reconstruction of extensor mechanism of finger (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Tendon Surgery",
    tags: ["tendon_repair"],
    sortOrder: 7,
  },
  {
    id: "hand_tend_swan_neck_correction",
    displayName: "Swan-neck deformity correction",
    snomedCtCode: "41727003", // VERIFY
    snomedCtDisplay: "Correction of swan-neck deformity (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Tendon Surgery",
    tags: ["tendon_repair"],
    sortOrder: 8,
  },
  {
    id: "hand_tend_tendon_transfer",
    displayName: "Tendon transfer",
    snomedCtCode: "28778006",
    snomedCtDisplay: "Transfer of tendon of hand (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Tendon Surgery",
    tags: ["tendon_repair"],
    sortOrder: 9,
  },
  {
    id: "hand_tend_tenolysis",
    displayName: "Tenolysis (flexor or extensor)",
    snomedCtCode: "240360007", // VERIFY
    snomedCtDisplay: "Tenolysis of hand (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Tendon Surgery",
    tags: ["tendon_repair", "revision"],
    sortOrder: 10,
  },
  {
    id: "hand_tend_fpl_repair",
    displayName: "FPL tendon repair",
    snomedCtCode: "41727003",
    snomedCtDisplay: "Repair of tendon of hand (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Tendon Surgery",
    tags: ["tendon_repair", "trauma"],
    sortOrder: 11,
  },
  {
    id: "hand_tend_epl_rupture_repair",
    displayName: "EPL rupture — EIP transfer",
    snomedCtCode: "28778006",
    snomedCtDisplay: "Transfer of tendon of hand (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Tendon Surgery",
    tags: ["tendon_repair"],
    sortOrder: 12,
  },
];

const HAND_NERVE_SURGERY: ProcedurePicklistEntry[] = [
  {
    id: "hand_nerve_digital_repair",
    displayName: "Digital nerve repair",
    snomedCtCode: "69505002",
    snomedCtDisplay: "Repair of nerve of hand (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Nerve Surgery",
    tags: ["nerve_repair", "microsurgery", "trauma"],
    sortOrder: 1,
  },
  {
    id: "hand_nerve_median_repair",
    displayName: "Median nerve repair",
    snomedCtCode: "44946003",
    snomedCtDisplay: "Repair of median nerve (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Nerve Surgery",
    tags: ["nerve_repair", "microsurgery", "trauma"],
    sortOrder: 2,
  },
  {
    id: "hand_nerve_ulnar_repair",
    displayName: "Ulnar nerve repair",
    snomedCtCode: "51825000",
    snomedCtDisplay: "Repair of ulnar nerve (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Nerve Surgery",
    tags: ["nerve_repair", "microsurgery", "trauma"],
    sortOrder: 3,
  },
  {
    id: "hand_nerve_radial_repair",
    displayName: "Radial nerve / PIN / SRN repair",
    snomedCtCode: "74561000",
    snomedCtDisplay: "Repair of radial nerve (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Nerve Surgery",
    tags: ["nerve_repair", "microsurgery", "trauma"],
    sortOrder: 4,
  },
  {
    id: "hand_nerve_graft",
    displayName: "Nerve graft",
    snomedCtCode: "7428004",
    snomedCtDisplay: "Nerve graft (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Nerve Surgery",
    tags: ["nerve_repair", "microsurgery"],
    sortOrder: 5,
  },
  {
    id: "hand_nerve_conduit",
    displayName: "Nerve conduit repair",
    snomedCtCode: "7428004", // VERIFY
    snomedCtDisplay: "Nerve conduit repair (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Nerve Surgery",
    tags: ["nerve_repair", "microsurgery"],
    sortOrder: 6,
  },
  {
    id: "hand_nerve_transfer",
    displayName: "Nerve transfer (distal)",
    snomedCtCode: "56625009", // VERIFY
    snomedCtDisplay: "Transfer of nerve (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Nerve Surgery",
    tags: ["nerve_repair", "microsurgery"],
    sortOrder: 7,
  },
  {
    id: "hand_nerve_neuroma_excision",
    displayName: "Neuroma excision ± TMR / RPNI",
    snomedCtCode: "81003001", // VERIFY
    snomedCtDisplay: "Excision of neuroma (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Nerve Surgery",
    tags: ["nerve_repair"],
    sortOrder: 8,
  },
];

const HAND_JOINT_PROCEDURES: ProcedurePicklistEntry[] = [
  {
    id: "hand_joint_trapeziectomy",
    displayName: "Trapeziectomy ± LRTI",
    snomedCtCode: "60645001",
    snomedCtDisplay: "Excision of trapezium (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Joint Procedures",
    tags: ["elective"],
    sortOrder: 1,
  },
  {
    id: "hand_joint_cmc1_prosthesis",
    displayName: "CMC1 joint prosthesis (e.g., Ivory / Touch / Maïa)",
    snomedCtCode: "74589006", // VERIFY
    snomedCtDisplay: "Arthroplasty of carpometacarpal joint of thumb (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Joint Procedures",
    tags: ["elective"],
    sortOrder: 2,
  },
  {
    id: "hand_joint_pip_arthroplasty",
    displayName: "PIP joint arthroplasty",
    snomedCtCode: "34380001", // VERIFY
    snomedCtDisplay: "Arthroplasty of proximal interphalangeal joint (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Joint Procedures",
    tags: ["elective"],
    sortOrder: 3,
  },
  {
    id: "hand_joint_mcp_arthroplasty",
    displayName: "MCP joint arthroplasty",
    snomedCtCode: "76916001", // VERIFY
    snomedCtDisplay: "Arthroplasty of metacarpophalangeal joint (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Joint Procedures",
    tags: ["elective"],
    sortOrder: 4,
  },
  {
    id: "hand_joint_dip_arthrodesis",
    displayName: "DIP joint arthrodesis",
    snomedCtCode: "42191004", // VERIFY
    snomedCtDisplay: "Arthrodesis of distal interphalangeal joint (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Joint Procedures",
    tags: ["elective"],
    sortOrder: 5,
  },
  {
    id: "hand_joint_pip_arthrodesis",
    displayName: "PIP joint arthrodesis",
    snomedCtCode: "51459001", // VERIFY
    snomedCtDisplay: "Arthrodesis of proximal interphalangeal joint (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Joint Procedures",
    tags: ["elective"],
    sortOrder: 6,
  },
  {
    id: "hand_joint_wrist_arthrodesis",
    displayName: "Wrist arthrodesis (total or partial)",
    snomedCtCode: "45484004",
    snomedCtDisplay: "Arthrodesis of wrist (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Joint Procedures",
    tags: ["elective"],
    sortOrder: 7,
  },
  {
    id: "hand_joint_wrist_arthroscopy_diag",
    displayName: "Wrist arthroscopy — diagnostic",
    snomedCtCode: "80372005",
    snomedCtDisplay: "Arthroscopy of wrist (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Joint Procedures",
    tags: ["elective"],
    sortOrder: 8,
  },
  {
    id: "hand_joint_wrist_arthroscopy_ther",
    displayName: "Wrist arthroscopy — therapeutic (debridement / repair)",
    snomedCtCode: "80372005",
    snomedCtDisplay: "Arthroscopy of wrist (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Joint Procedures",
    tags: ["elective"],
    sortOrder: 9,
  },
  {
    id: "hand_joint_tfcc_repair",
    displayName: "TFCC repair / debridement",
    snomedCtCode: "80372005", // VERIFY
    snomedCtDisplay: "Repair of triangular fibrocartilage complex (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Joint Procedures",
    tags: ["trauma", "elective"],
    sortOrder: 10,
  },
  {
    id: "hand_joint_prc",
    displayName: "Proximal row carpectomy",
    snomedCtCode: "15484003",
    snomedCtDisplay: "Proximal row carpectomy (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Joint Procedures",
    tags: ["elective"],
    sortOrder: 11,
  },
  {
    id: "hand_joint_wrist_denervation",
    displayName: "Wrist denervation",
    snomedCtCode: "34508009", // VERIFY
    snomedCtDisplay: "Denervation of wrist joint (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Joint Procedures",
    tags: ["elective"],
    sortOrder: 12,
  },
  {
    id: "hand_joint_sl_ligament_repair",
    displayName: "Scapholunate ligament repair / reconstruction",
    snomedCtCode: "80372005", // VERIFY
    snomedCtDisplay: "Repair of ligament of wrist (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Joint Procedures",
    tags: ["trauma", "elective"],
    sortOrder: 13,
  },
  {
    id: "hand_joint_mcp_collateral_repair",
    displayName: "MCP / UCL collateral ligament repair",
    snomedCtCode: "239227006", // VERIFY
    snomedCtDisplay: "Repair of collateral ligament of finger joint (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Joint Procedures",
    tags: ["trauma"],
    sortOrder: 14,
  },
];

const HAND_COMPRESSION_NEUROPATHY: ProcedurePicklistEntry[] = [
  {
    id: "hand_comp_ctr_open",
    displayName: "Carpal tunnel release — open",
    snomedCtCode: "83579003",
    snomedCtDisplay: "Decompression of carpal tunnel (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Compression Neuropathies",
    tags: ["elective"],
    sortOrder: 1,
  },
  {
    id: "hand_comp_ctr_endoscopic",
    displayName: "Carpal tunnel release — endoscopic",
    snomedCtCode: "83579003",
    snomedCtDisplay: "Decompression of carpal tunnel (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Compression Neuropathies",
    tags: ["elective"],
    sortOrder: 2,
  },
  {
    id: "hand_comp_cubital_insitu",
    displayName: "Cubital tunnel decompression — in situ",
    snomedCtCode: "36048009",
    snomedCtDisplay: "Decompression of ulnar nerve at elbow (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Compression Neuropathies",
    tags: ["elective"],
    sortOrder: 3,
  },
  {
    id: "hand_comp_cubital_transposition",
    displayName: "Cubital tunnel — anterior transposition",
    snomedCtCode: "3953006",
    snomedCtDisplay: "Anterior transposition of ulnar nerve (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Compression Neuropathies",
    tags: ["elective"],
    sortOrder: 4,
  },
  {
    id: "hand_comp_dequervain",
    displayName: "De Quervain's release",
    snomedCtCode: "78617001",
    snomedCtDisplay: "Release of first dorsal compartment (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Compression Neuropathies",
    tags: ["elective"],
    sortOrder: 5,
  },
  {
    id: "hand_comp_trigger_finger",
    displayName: "Trigger finger release (A1 pulley)",
    snomedCtCode: "18268001",
    snomedCtDisplay: "Release of trigger finger (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Compression Neuropathies",
    tags: ["elective"],
    sortOrder: 6,
  },
  {
    id: "hand_comp_trigger_thumb",
    displayName: "Trigger thumb release",
    snomedCtCode: "18268001",
    snomedCtDisplay: "Release of trigger finger (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Compression Neuropathies",
    tags: ["elective"],
    sortOrder: 7,
  },
  {
    id: "hand_comp_guyon",
    displayName: "Guyon's canal release",
    snomedCtCode: "36048009", // VERIFY
    snomedCtDisplay: "Decompression of ulnar nerve at wrist (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Compression Neuropathies",
    tags: ["elective"],
    sortOrder: 8,
  },
];

const HAND_DUPUYTREN: ProcedurePicklistEntry[] = [
  {
    id: "hand_dup_limited_fasciectomy",
    displayName: "Dupuytren's limited fasciectomy",
    snomedCtCode: "43107005",
    snomedCtDisplay: "Fasciectomy of hand (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Dupuytren's Disease",
    tags: ["elective"],
    sortOrder: 1,
  },
  {
    id: "hand_dup_radical_fasciectomy",
    displayName: "Dupuytren's radical fasciectomy",
    snomedCtCode: "43107005",
    snomedCtDisplay: "Fasciectomy of hand (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Dupuytren's Disease",
    tags: ["elective"],
    sortOrder: 2,
  },
  {
    id: "hand_dup_needle_fasciotomy",
    displayName: "Needle aponeurotomy / fasciotomy",
    snomedCtCode: "446701009", // VERIFY
    snomedCtDisplay: "Percutaneous needle fasciotomy for Dupuytren contracture (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Dupuytren's Disease",
    tags: ["elective"],
    sortOrder: 3,
  },
  {
    id: "hand_dup_dermofasciectomy",
    displayName: "Dermofasciectomy + FTSG",
    snomedCtCode: "43107005", // VERIFY
    snomedCtDisplay: "Dermofasciectomy of hand (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Dupuytren's Disease",
    tags: ["elective", "skin_graft"],
    sortOrder: 4,
  },
  {
    id: "hand_dup_collagenase",
    displayName: "Collagenase injection (Xiapex)",
    snomedCtCode: "450509001", // VERIFY
    snomedCtDisplay: "Injection of collagenase into palmar fascia (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Dupuytren's Disease",
    tags: ["elective"],
    sortOrder: 5,
  },
];

const HAND_SOFT_TISSUE_COVERAGE: ProcedurePicklistEntry[] = [
  {
    id: "hand_cov_cross_finger",
    displayName: "Cross-finger flap",
    snomedCtCode: "122462001", // VERIFY
    snomedCtDisplay: "Flap reconstruction (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Soft Tissue Coverage",
    tags: ["local_flap", "trauma"],
    sortOrder: 1,
  },
  {
    id: "hand_cov_moberg",
    displayName: "Moberg advancement flap",
    snomedCtCode: "122462001", // VERIFY
    snomedCtDisplay: "Flap reconstruction (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Soft Tissue Coverage",
    tags: ["local_flap", "trauma"],
    sortOrder: 2,
  },
  {
    id: "hand_cov_vy_advancement",
    displayName: "V-Y advancement flap (fingertip)",
    snomedCtCode: "122462001", // VERIFY
    snomedCtDisplay: "Flap reconstruction (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Soft Tissue Coverage",
    tags: ["local_flap", "trauma"],
    sortOrder: 3,
  },
  {
    id: "hand_cov_homodigital_island",
    displayName: "Homodigital island flap",
    snomedCtCode: "122462001", // VERIFY
    snomedCtDisplay: "Flap reconstruction (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Soft Tissue Coverage",
    tags: ["local_flap", "trauma"],
    sortOrder: 4,
  },
  {
    id: "hand_cov_fdma_foucher",
    displayName: "First dorsal metacarpal artery flap (Foucher)",
    snomedCtCode: "122462001", // VERIFY
    snomedCtDisplay: "Flap reconstruction (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Soft Tissue Coverage",
    tags: ["pedicled_flap", "trauma"],
    sortOrder: 5,
  },
  {
    id: "hand_cov_reverse_radial_forearm",
    displayName: "Reverse radial forearm flap (pedicled)",
    snomedCtCode: "122462001", // VERIFY
    snomedCtDisplay: "Flap reconstruction (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Soft Tissue Coverage",
    tags: ["pedicled_flap", "trauma"],
    sortOrder: 6,
  },
  {
    id: "hand_cov_posterior_interosseous",
    displayName: "Posterior interosseous artery flap",
    snomedCtCode: "122462001", // VERIFY
    snomedCtDisplay: "Flap reconstruction (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Soft Tissue Coverage",
    tags: ["pedicled_flap", "trauma"],
    sortOrder: 7,
  },
  {
    id: "hand_cov_groin_flap",
    displayName: "Groin flap (pedicled, staged)",
    snomedCtCode: "122462001", // VERIFY
    snomedCtDisplay: "Flap reconstruction (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Soft Tissue Coverage",
    tags: ["pedicled_flap", "trauma"],
    sortOrder: 8,
  },
  {
    id: "hand_cov_free_flap",
    displayName: "Free flap to hand (specify type in notes)",
    snomedCtCode: "122462001",
    snomedCtDisplay: "Flap reconstruction (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Soft Tissue Coverage",
    tags: ["free_flap", "microsurgery", "trauma"],
    hasFreeFlap: true,
    sortOrder: 9,
  },
  {
    id: "hand_cov_skin_graft",
    displayName: "Skin graft to hand (STSG / FTSG)",
    snomedCtCode: "14413003",
    snomedCtDisplay: "Skin graft to hand (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Soft Tissue Coverage",
    tags: ["skin_graft", "trauma"],
    sortOrder: 10,
  },
  {
    id: "hand_cov_nail_bed_repair",
    displayName: "Nail bed repair",
    snomedCtCode: "7131001", // VERIFY
    snomedCtDisplay: "Repair of nail bed (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Soft Tissue Coverage",
    tags: ["trauma"],
    sortOrder: 11,
  },
  {
    id: "hand_cov_replantation",
    displayName: "Digital replantation",
    snomedCtCode: "46989001",
    snomedCtDisplay: "Replantation of finger (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Soft Tissue Coverage",
    tags: ["replant", "microsurgery", "trauma"],
    sortOrder: 12,
  },
  {
    id: "hand_cov_revascularisation",
    displayName: "Digital revascularisation",
    snomedCtCode: "46989001", // VERIFY
    snomedCtDisplay: "Revascularisation of finger (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Soft Tissue Coverage",
    tags: ["microsurgery", "trauma"],
    sortOrder: 13,
  },
  {
    id: "hand_cov_toe_to_thumb",
    displayName: "Toe-to-thumb transfer",
    snomedCtCode: "31946009",
    snomedCtDisplay: "Toe-to-thumb transfer (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Soft Tissue Coverage",
    tags: ["free_flap", "microsurgery"],
    hasFreeFlap: true,
    sortOrder: 14,
  },
  {
    id: "hand_cov_pollicisation",
    displayName: "Pollicisation",
    snomedCtCode: "22169001",
    snomedCtDisplay: "Pollicisation of finger (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Soft Tissue Coverage",
    tags: ["elective"],
    sortOrder: 15,
  },
];

const HAND_CONGENITAL: ProcedurePicklistEntry[] = [
  {
    id: "hand_cong_syndactyly",
    displayName: "Syndactyly release",
    snomedCtCode: "178751001",
    snomedCtDisplay: "Release of syndactyly (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Congenital Hand",
    tags: ["elective"],
    sortOrder: 1,
  },
  {
    id: "hand_cong_polydactyly",
    displayName: "Polydactyly excision",
    snomedCtCode: "51975008",
    snomedCtDisplay: "Excision of supernumerary digit (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Congenital Hand",
    tags: ["elective"],
    sortOrder: 2,
  },
  {
    id: "hand_cong_radial_deficiency",
    displayName: "Radial longitudinal deficiency — centralisation / radialisation",
    snomedCtCode: "178751001", // VERIFY
    snomedCtDisplay: "Reconstruction for radial deficiency (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Congenital Hand",
    tags: ["elective"],
    sortOrder: 3,
  },
  {
    id: "hand_cong_thumb_hypoplasia",
    displayName: "Thumb hypoplasia reconstruction",
    snomedCtCode: "178751001", // VERIFY
    snomedCtDisplay: "Reconstruction of hypoplastic thumb (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Congenital Hand",
    tags: ["elective"],
    sortOrder: 4,
  },
  {
    id: "hand_cong_clinodactyly",
    displayName: "Clinodactyly / camptodactyly correction",
    snomedCtCode: "178728004", // VERIFY
    snomedCtDisplay: "Corrective osteotomy of hand (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Congenital Hand",
    tags: ["elective"],
    sortOrder: 5,
  },
  {
    id: "hand_cong_cleft_hand",
    displayName: "Cleft hand reconstruction",
    snomedCtCode: "178751001", // VERIFY
    snomedCtDisplay: "Reconstruction of hand (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Congenital Hand",
    tags: ["elective"],
    sortOrder: 6,
  },
];

const HAND_OTHER: ProcedurePicklistEntry[] = [
  {
    id: "hand_other_ganglion",
    displayName: "Ganglion excision (wrist / hand)",
    snomedCtCode: "88867009",
    snomedCtDisplay: "Excision of ganglion (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Other Hand",
    tags: ["elective"],
    sortOrder: 1,
  },
  {
    id: "hand_other_gct_excision",
    displayName: "Giant cell tumour of tendon sheath excision",
    snomedCtCode: "24837003", // VERIFY
    snomedCtDisplay: "Excision of tumour of tendon sheath of hand (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Other Hand",
    tags: ["elective", "oncological"],
    sortOrder: 2,
  },
  {
    id: "hand_other_tumour_excision",
    displayName: "Hand tumour excision — other",
    snomedCtCode: "24837003", // VERIFY
    snomedCtDisplay: "Excision of tumour of hand (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Other Hand",
    tags: ["oncological"],
    sortOrder: 3,
  },
  {
    id: "hand_other_rheumatoid",
    displayName: "Rheumatoid hand surgery (synovectomy / reconstruction)",
    snomedCtCode: "54936004", // VERIFY
    snomedCtDisplay: "Synovectomy of hand (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Other Hand",
    tags: ["elective"],
    sortOrder: 4,
  },
  {
    id: "hand_other_amputation",
    displayName: "Finger amputation (primary)",
    snomedCtCode: "81723002",
    snomedCtDisplay: "Amputation of finger (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Other Hand",
    tags: ["trauma"],
    sortOrder: 5,
  },
  {
    id: "hand_other_amputation_revision",
    displayName: "Finger amputation — revision / stump plasty",
    snomedCtCode: "81723002", // VERIFY
    snomedCtDisplay: "Revision of amputation stump of finger (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Other Hand",
    tags: ["revision"],
    sortOrder: 6,
  },
  {
    id: "hand_other_infection_washout",
    displayName: "Hand infection — washout / debridement",
    snomedCtCode: "36777000",
    snomedCtDisplay: "Debridement (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Other Hand",
    tags: ["trauma"],
    sortOrder: 7,
  },
  {
    id: "hand_other_flexor_sheath_washout",
    displayName: "Flexor sheath washout (septic flexor tenosynovitis)",
    snomedCtCode: "36777000", // VERIFY
    snomedCtDisplay: "Drainage of flexor tendon sheath of hand (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Other Hand",
    tags: ["trauma"],
    sortOrder: 8,
  },
  {
    id: "hand_other_steroid_injection",
    displayName: "Steroid injection (hand / wrist)",
    snomedCtCode: "91602001", // VERIFY
    snomedCtDisplay: "Injection of steroid into joint (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Other Hand",
    tags: ["elective"],
    sortOrder: 9,
  },
  {
    id: "hand_other_fasciotomy",
    displayName: "Fasciotomy — forearm / hand (compartment syndrome)",
    snomedCtCode: "81121007",
    snomedCtDisplay: "Fasciotomy (procedure)",
    specialties: ["hand_surgery"],
    subcategory: "Other Hand",
    tags: ["trauma"],
    sortOrder: 10,
  },
  {
    id: "hand_other_foreign_body",
    displayName: "Foreign body removal (hand / wrist)",
    snomedCtCode: "68526006",
    snomedCtDisplay: "Removal of foreign body from hand (procedure)",
    specialties: ["hand_surgery", "general"],
    subcategory: "Other Hand",
    tags: ["trauma"],
    sortOrder: 11,
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// HEAD & NECK (~85 procedures across 9 subcategories)
// ═══════════════════════════════════════════════════════════════════════════

const HEAD_NECK_SKIN_CANCER: ProcedurePicklistEntry[] = [
  {
    id: "hn_skin_bcc_excision",
    displayName: "BCC excision — face / head / neck",
    snomedCtCode: "177302008",
    snomedCtDisplay: "Excision of basal cell carcinoma of skin (procedure)",
    specialties: ["head_neck", "general"],
    subcategory: "Skin Cancer Excision",
    tags: ["oncological"],
    sortOrder: 1,
  },
  {
    id: "hn_skin_scc_excision",
    displayName: "SCC excision — face / head / neck",
    snomedCtCode: "177304009",
    snomedCtDisplay: "Excision of squamous cell carcinoma of skin (procedure)",
    specialties: ["head_neck", "general"],
    subcategory: "Skin Cancer Excision",
    tags: ["oncological"],
    sortOrder: 2,
  },
  {
    id: "hn_skin_melanoma_excision",
    displayName: "Melanoma excision — face / head / neck",
    snomedCtCode: "177306006",
    snomedCtDisplay: "Excision of malignant melanoma of skin (procedure)",
    specialties: ["head_neck", "general"],
    subcategory: "Skin Cancer Excision",
    tags: ["oncological"],
    sortOrder: 3,
  },
  {
    id: "hn_skin_melanoma_wle",
    displayName: "Melanoma wide local excision — face / head / neck",
    snomedCtCode: "177306006",
    snomedCtDisplay: "Wide excision of malignant melanoma of skin (procedure)",
    specialties: ["head_neck", "general"],
    subcategory: "Skin Cancer Excision",
    tags: ["oncological"],
    sortOrder: 4,
  },
  {
    id: "hn_skin_mohs_defect",
    displayName: "Mohs defect reconstruction",
    snomedCtCode: "122465003", // VERIFY — Reconstruction procedure
    snomedCtDisplay: "Reconstruction of defect after Mohs surgery (procedure)",
    specialties: ["head_neck"],
    subcategory: "Skin Cancer Excision",
    tags: ["oncological"],
    sortOrder: 5,
  },
  {
    id: "hn_skin_excision_other",
    displayName: "Skin lesion excision — face / head / neck — other",
    snomedCtCode: "177300000",
    snomedCtDisplay: "Excision of lesion of skin (procedure)",
    specialties: ["head_neck", "general"],
    subcategory: "Skin Cancer Excision",
    tags: ["oncological"],
    sortOrder: 6,
  },
  {
    id: "hn_skin_slnb",
    displayName: "Sentinel lymph node biopsy — head / neck",
    snomedCtCode: "396487001",
    snomedCtDisplay: "Sentinel lymph node biopsy (procedure)",
    specialties: ["head_neck", "general"],
    subcategory: "Skin Cancer Excision",
    tags: ["oncological"],
    sortOrder: 7,
  },
];

const HEAD_NECK_LOCAL_FLAPS: ProcedurePicklistEntry[] = [
  {
    id: "hn_local_advancement",
    displayName: "Advancement flap — face",
    snomedCtCode: "122462001",
    snomedCtDisplay: "Flap reconstruction (procedure)",
    specialties: ["head_neck"],
    subcategory: "Local Flaps",
    tags: ["local_flap"],
    sortOrder: 1,
  },
  {
    id: "hn_local_rotation",
    displayName: "Rotation flap — face / scalp",
    snomedCtCode: "122462001",
    snomedCtDisplay: "Flap reconstruction (procedure)",
    specialties: ["head_neck"],
    subcategory: "Local Flaps",
    tags: ["local_flap"],
    sortOrder: 2,
  },
  {
    id: "hn_local_transposition",
    displayName: "Transposition flap — face",
    snomedCtCode: "122462001",
    snomedCtDisplay: "Flap reconstruction (procedure)",
    specialties: ["head_neck"],
    subcategory: "Local Flaps",
    tags: ["local_flap"],
    sortOrder: 3,
  },
  {
    id: "hn_local_bilobed",
    displayName: "Bilobed flap (nose / cheek)",
    snomedCtCode: "122462001",
    snomedCtDisplay: "Flap reconstruction (procedure)",
    specialties: ["head_neck"],
    subcategory: "Local Flaps",
    tags: ["local_flap"],
    sortOrder: 4,
  },
  {
    id: "hn_local_rhomboid",
    displayName: "Rhomboid / Limberg flap",
    snomedCtCode: "122462001",
    snomedCtDisplay: "Flap reconstruction (procedure)",
    specialties: ["head_neck", "general"],
    subcategory: "Local Flaps",
    tags: ["local_flap"],
    sortOrder: 5,
  },
  {
    id: "hn_local_vy",
    displayName: "V-Y advancement flap — face",
    snomedCtCode: "122462001",
    snomedCtDisplay: "Flap reconstruction (procedure)",
    specialties: ["head_neck"],
    subcategory: "Local Flaps",
    tags: ["local_flap"],
    sortOrder: 6,
  },
  {
    id: "hn_local_nasolabial",
    displayName: "Nasolabial flap",
    snomedCtCode: "122462001",
    snomedCtDisplay: "Flap reconstruction (procedure)",
    specialties: ["head_neck"],
    subcategory: "Local Flaps",
    tags: ["local_flap"],
    sortOrder: 7,
  },
  {
    id: "hn_local_zplasty",
    displayName: "Z-plasty (scar revision / contracture release)",
    snomedCtCode: "13760004",
    snomedCtDisplay: "Z-plasty (procedure)",
    specialties: ["head_neck", "general"],
    subcategory: "Local Flaps",
    tags: ["local_flap", "revision"],
    sortOrder: 8,
  },
];

const HEAD_NECK_REGIONAL_FLAPS: ProcedurePicklistEntry[] = [
  {
    id: "hn_reg_paramedian_forehead",
    displayName: "Paramedian forehead flap",
    snomedCtCode: "122462001",
    snomedCtDisplay: "Flap reconstruction (procedure)",
    specialties: ["head_neck"],
    subcategory: "Regional Flaps",
    tags: ["pedicled_flap"],
    sortOrder: 1,
  },
  {
    id: "hn_reg_cervicofacial",
    displayName: "Cervicofacial advancement flap",
    snomedCtCode: "122462001",
    snomedCtDisplay: "Flap reconstruction (procedure)",
    specialties: ["head_neck"],
    subcategory: "Regional Flaps",
    tags: ["pedicled_flap"],
    sortOrder: 2,
  },
  {
    id: "hn_reg_abbe",
    displayName: "Abbe flap (lip switch)",
    snomedCtCode: "53410002", // VERIFY
    snomedCtDisplay: "Abbe flap reconstruction of lip (procedure)",
    specialties: ["head_neck"],
    subcategory: "Regional Flaps",
    tags: ["pedicled_flap"],
    sortOrder: 3,
  },
  {
    id: "hn_reg_karapandzic",
    displayName: "Karapandzic flap",
    snomedCtCode: "122462001", // VERIFY
    snomedCtDisplay: "Flap reconstruction of lip (procedure)",
    specialties: ["head_neck"],
    subcategory: "Regional Flaps",
    tags: ["pedicled_flap"],
    sortOrder: 4,
  },
  {
    id: "hn_reg_estlander",
    displayName: "Estlander flap",
    snomedCtCode: "122462001", // VERIFY
    snomedCtDisplay: "Flap reconstruction of lip (procedure)",
    specialties: ["head_neck"],
    subcategory: "Regional Flaps",
    tags: ["pedicled_flap"],
    sortOrder: 5,
  },
  {
    id: "hn_reg_submental_island",
    displayName: "Submental island flap",
    snomedCtCode: "122462001", // VERIFY
    snomedCtDisplay: "Flap reconstruction (procedure)",
    specialties: ["head_neck"],
    subcategory: "Regional Flaps",
    tags: ["pedicled_flap"],
    sortOrder: 6,
  },
  {
    id: "hn_reg_supraclavicular",
    displayName: "Supraclavicular flap",
    snomedCtCode: "122462001", // VERIFY
    snomedCtDisplay: "Flap reconstruction (procedure)",
    specialties: ["head_neck"],
    subcategory: "Regional Flaps",
    tags: ["pedicled_flap"],
    sortOrder: 7,
  },
  {
    id: "hn_reg_deltopectoral",
    displayName: "Deltopectoral flap",
    snomedCtCode: "122462001", // VERIFY
    snomedCtDisplay: "Flap reconstruction (procedure)",
    specialties: ["head_neck"],
    subcategory: "Regional Flaps",
    tags: ["pedicled_flap"],
    sortOrder: 8,
  },
  {
    id: "hn_reg_pectoralis_major",
    displayName: "Pectoralis major flap (PMMC)",
    snomedCtCode: "234281001", // VERIFY
    snomedCtDisplay: "Pedicled pectoralis major flap (procedure)",
    specialties: ["head_neck"],
    subcategory: "Regional Flaps",
    tags: ["pedicled_flap"],
    sortOrder: 9,
  },
];

// Note: Head & Neck free flaps reuse Orthoplastic entries via specialty tagging.
// These are H&N-specific free flaps NOT already covered by orthoplastic.
const HEAD_NECK_FREE_FLAPS: ProcedurePicklistEntry[] = [
  {
    id: "hn_ff_vram",
    displayName: "Free VRAM flap (Vertical Rectus Abdominis Myocutaneous)",
    snomedCtCode: "446078000", // VERIFY — TRAM parent
    snomedCtDisplay: "Free vertical rectus abdominis myocutaneous flap (procedure)",
    specialties: ["head_neck", "general"],
    subcategory: "Free Flap — Head & Neck",
    tags: ["free_flap", "microsurgery"],
    hasFreeFlap: true,
    sortOrder: 1,
  },
  {
    id: "hn_ff_jejunal",
    displayName: "Free jejunal flap",
    snomedCtCode: "234290004", // VERIFY
    snomedCtDisplay: "Free jejunal flap transfer (procedure)",
    specialties: ["head_neck"],
    subcategory: "Free Flap — Head & Neck",
    tags: ["free_flap", "microsurgery"],
    hasFreeFlap: true,
    sortOrder: 2,
  },
  {
    id: "hn_ff_iliac_crest",
    displayName: "Free iliac crest (DCIA) flap",
    snomedCtCode: "234291003", // VERIFY
    snomedCtDisplay: "Free iliac crest flap transfer (procedure)",
    specialties: ["head_neck"],
    subcategory: "Free Flap — Head & Neck",
    tags: ["free_flap", "microsurgery"],
    hasFreeFlap: true,
    sortOrder: 3,
  },
];

const HEAD_NECK_SITE_RECONSTRUCTION: ProcedurePicklistEntry[] = [
  {
    id: "hn_recon_nose_partial",
    displayName: "Nasal reconstruction — partial",
    snomedCtCode: "54002009", // VERIFY
    snomedCtDisplay: "Reconstruction of nose (procedure)",
    specialties: ["head_neck"],
    subcategory: "Site-Specific Reconstruction",
    tags: ["oncological"],
    sortOrder: 1,
  },
  {
    id: "hn_recon_nose_total",
    displayName: "Nasal reconstruction — total / subtotal",
    snomedCtCode: "54002009", // VERIFY
    snomedCtDisplay: "Total reconstruction of nose (procedure)",
    specialties: ["head_neck"],
    subcategory: "Site-Specific Reconstruction",
    tags: ["oncological"],
    sortOrder: 2,
  },
  {
    id: "hn_recon_lip",
    displayName: "Lip reconstruction (primary closure / flap)",
    snomedCtCode: "83891000", // VERIFY
    snomedCtDisplay: "Reconstruction of lip (procedure)",
    specialties: ["head_neck"],
    subcategory: "Site-Specific Reconstruction",
    tags: ["oncological"],
    sortOrder: 3,
  },
  {
    id: "hn_recon_ear_partial",
    displayName: "Ear reconstruction — partial / wedge",
    snomedCtCode: "287777008", // VERIFY
    snomedCtDisplay: "Reconstruction of external ear (procedure)",
    specialties: ["head_neck"],
    subcategory: "Site-Specific Reconstruction",
    tags: ["oncological"],
    sortOrder: 4,
  },
  {
    id: "hn_recon_ear_total",
    displayName: "Ear reconstruction — total (rib framework / Medpor)",
    snomedCtCode: "287777008", // VERIFY
    snomedCtDisplay: "Total reconstruction of external ear (procedure)",
    specialties: ["head_neck"],
    subcategory: "Site-Specific Reconstruction",
    tags: ["elective"],
    sortOrder: 5,
  },
  {
    id: "hn_recon_ear_prosthetic",
    displayName: "Ear reconstruction — osseointegrated prosthesis",
    snomedCtCode: "287777008", // VERIFY
    snomedCtDisplay: "Reconstruction of ear with prosthesis (procedure)",
    specialties: ["head_neck"],
    subcategory: "Site-Specific Reconstruction",
    tags: ["elective"],
    sortOrder: 6,
  },
  {
    id: "hn_recon_eyelid_upper",
    displayName: "Eyelid reconstruction — upper",
    snomedCtCode: "274883006", // VERIFY
    snomedCtDisplay: "Reconstruction of upper eyelid (procedure)",
    specialties: ["head_neck"],
    subcategory: "Site-Specific Reconstruction",
    tags: ["oncological"],
    sortOrder: 7,
  },
  {
    id: "hn_recon_eyelid_lower",
    displayName: "Eyelid reconstruction — lower",
    snomedCtCode: "274884000", // VERIFY
    snomedCtDisplay: "Reconstruction of lower eyelid (procedure)",
    specialties: ["head_neck"],
    subcategory: "Site-Specific Reconstruction",
    tags: ["oncological"],
    sortOrder: 8,
  },
  {
    id: "hn_recon_scalp",
    displayName: "Scalp reconstruction (flap / graft / tissue expansion)",
    snomedCtCode: "122465003", // VERIFY
    snomedCtDisplay: "Reconstruction of scalp (procedure)",
    specialties: ["head_neck"],
    subcategory: "Site-Specific Reconstruction",
    tags: ["oncological", "complex_wound"],
    sortOrder: 9,
  },
  {
    id: "hn_recon_oral_tongue_floor",
    displayName: "Oral cavity / tongue / floor of mouth reconstruction",
    snomedCtCode: "122465003", // VERIFY
    snomedCtDisplay: "Reconstruction of oral cavity (procedure)",
    specialties: ["head_neck"],
    subcategory: "Site-Specific Reconstruction",
    tags: ["oncological", "free_flap"],
    sortOrder: 10,
  },
  {
    id: "hn_recon_mandible",
    displayName: "Mandible reconstruction (plate / fibula / flap)",
    snomedCtCode: "66567009", // VERIFY
    snomedCtDisplay: "Reconstruction of mandible (procedure)",
    specialties: ["head_neck"],
    subcategory: "Site-Specific Reconstruction",
    tags: ["oncological", "free_flap"],
    sortOrder: 11,
  },
  {
    id: "hn_recon_maxilla",
    displayName: "Maxillary / midface reconstruction",
    snomedCtCode: "122465003", // VERIFY
    snomedCtDisplay: "Reconstruction of maxilla (procedure)",
    specialties: ["head_neck"],
    subcategory: "Site-Specific Reconstruction",
    tags: ["oncological"],
    sortOrder: 12,
  },
  {
    id: "hn_recon_pharynx",
    displayName: "Pharyngeal / oesophageal reconstruction",
    snomedCtCode: "122465003", // VERIFY
    snomedCtDisplay: "Reconstruction of pharynx (procedure)",
    specialties: ["head_neck"],
    subcategory: "Site-Specific Reconstruction",
    tags: ["oncological", "free_flap"],
    sortOrder: 13,
  },
];

const HEAD_NECK_FACIAL_NERVE: ProcedurePicklistEntry[] = [
  {
    id: "hn_fn_primary_repair",
    displayName: "Facial nerve primary repair",
    snomedCtCode: "22649006",
    snomedCtDisplay: "Repair of facial nerve (procedure)",
    specialties: ["head_neck"],
    subcategory: "Facial Nerve & Reanimation",
    tags: ["nerve_repair", "microsurgery", "trauma"],
    sortOrder: 1,
  },
  {
    id: "hn_fn_cable_graft",
    displayName: "Facial nerve cable graft",
    snomedCtCode: "7428004",
    snomedCtDisplay: "Nerve graft (procedure)",
    specialties: ["head_neck"],
    subcategory: "Facial Nerve & Reanimation",
    tags: ["nerve_repair", "microsurgery"],
    sortOrder: 2,
  },
  {
    id: "hn_fn_cross_face",
    displayName: "Cross-face nerve graft (CFNG)",
    snomedCtCode: "7428004", // VERIFY
    snomedCtDisplay: "Cross-face nerve graft (procedure)",
    specialties: ["head_neck"],
    subcategory: "Facial Nerve & Reanimation",
    tags: ["nerve_repair", "microsurgery"],
    sortOrder: 3,
  },
  {
    id: "hn_fn_masseteric_transfer",
    displayName: "Masseteric nerve transfer to facial nerve",
    snomedCtCode: "56625009", // VERIFY
    snomedCtDisplay: "Nerve transfer to facial nerve (procedure)",
    specialties: ["head_neck"],
    subcategory: "Facial Nerve & Reanimation",
    tags: ["nerve_repair", "microsurgery"],
    sortOrder: 4,
  },
  {
    id: "hn_fn_free_gracilis",
    displayName: "Free gracilis transfer for facial reanimation",
    snomedCtCode: "234297004",
    snomedCtDisplay: "Free gracilis flap (procedure)",
    specialties: ["head_neck"],
    subcategory: "Facial Nerve & Reanimation",
    tags: ["free_flap", "microsurgery"],
    hasFreeFlap: true,
    sortOrder: 5,
  },
  {
    id: "hn_fn_static_sling",
    displayName: "Static sling (fascia lata / alloplastic)",
    snomedCtCode: "122465003", // VERIFY
    snomedCtDisplay: "Static sling procedure for facial palsy (procedure)",
    specialties: ["head_neck"],
    subcategory: "Facial Nerve & Reanimation",
    tags: ["elective"],
    sortOrder: 6,
  },
  {
    id: "hn_fn_gold_weight",
    displayName: "Upper eyelid gold / platinum weight",
    snomedCtCode: "274883006", // VERIFY
    snomedCtDisplay: "Insertion of eyelid weight (procedure)",
    specialties: ["head_neck"],
    subcategory: "Facial Nerve & Reanimation",
    tags: ["elective"],
    sortOrder: 7,
  },
];

const HEAD_NECK_CLEFT_CRANIOFACIAL: ProcedurePicklistEntry[] = [
  {
    id: "hn_cleft_lip_unilateral",
    displayName: "Cleft lip repair — unilateral",
    snomedCtCode: "13895006",
    snomedCtDisplay: "Repair of cleft lip (procedure)",
    specialties: ["head_neck"],
    subcategory: "Cleft & Craniofacial",
    tags: ["elective"],
    sortOrder: 1,
  },
  {
    id: "hn_cleft_lip_bilateral",
    displayName: "Cleft lip repair — bilateral",
    snomedCtCode: "13895006",
    snomedCtDisplay: "Repair of cleft lip (procedure)",
    specialties: ["head_neck"],
    subcategory: "Cleft & Craniofacial",
    tags: ["elective"],
    sortOrder: 2,
  },
  {
    id: "hn_cleft_palate",
    displayName: "Cleft palate repair",
    snomedCtCode: "172735006",
    snomedCtDisplay: "Repair of cleft palate (procedure)",
    specialties: ["head_neck"],
    subcategory: "Cleft & Craniofacial",
    tags: ["elective"],
    sortOrder: 3,
  },
  {
    id: "hn_cleft_alveolar_bone_graft",
    displayName: "Alveolar bone graft",
    snomedCtCode: "172735006", // VERIFY
    snomedCtDisplay: "Alveolar bone graft (procedure)",
    specialties: ["head_neck"],
    subcategory: "Cleft & Craniofacial",
    tags: ["elective"],
    sortOrder: 4,
  },
  {
    id: "hn_cleft_lip_revision",
    displayName: "Cleft lip / nose revision",
    snomedCtCode: "13895006", // VERIFY
    snomedCtDisplay: "Revision of cleft lip repair (procedure)",
    specialties: ["head_neck"],
    subcategory: "Cleft & Craniofacial",
    tags: ["revision"],
    sortOrder: 5,
  },
  {
    id: "hn_cleft_velopharyngeal_insufficiency",
    displayName: "VPI surgery (pharyngoplasty / pharyngeal flap)",
    snomedCtCode: "172735006", // VERIFY
    snomedCtDisplay: "Pharyngoplasty for velopharyngeal insufficiency (procedure)",
    specialties: ["head_neck"],
    subcategory: "Cleft & Craniofacial",
    tags: ["elective"],
    sortOrder: 6,
  },
  {
    id: "hn_craniosynostosis",
    displayName: "Craniosynostosis surgery (cranial vault remodelling)",
    snomedCtCode: "274038009", // VERIFY
    snomedCtDisplay: "Craniosynostosis repair (procedure)",
    specialties: ["head_neck"],
    subcategory: "Cleft & Craniofacial",
    tags: ["elective"],
    sortOrder: 7,
  },
  {
    id: "hn_lefort_osteotomy",
    displayName: "Le Fort osteotomy (I / II / III)",
    snomedCtCode: "59782002", // VERIFY
    snomedCtDisplay: "Le Fort osteotomy (procedure)",
    specialties: ["head_neck"],
    subcategory: "Cleft & Craniofacial",
    tags: ["elective"],
    sortOrder: 8,
  },
  {
    id: "hn_distraction_osteogenesis",
    displayName: "Distraction osteogenesis — craniofacial",
    snomedCtCode: "431548006", // VERIFY
    snomedCtDisplay: "Distraction osteogenesis (procedure)",
    specialties: ["head_neck"],
    subcategory: "Cleft & Craniofacial",
    tags: ["elective"],
    sortOrder: 9,
  },
];

const HEAD_NECK_FACIAL_FRACTURES: ProcedurePicklistEntry[] = [
  {
    id: "hn_fx_mandible_orif",
    displayName: "Mandible fracture ORIF",
    snomedCtCode: "24529004",
    snomedCtDisplay: "Open reduction of fracture of mandible with internal fixation (procedure)",
    specialties: ["head_neck"],
    subcategory: "Facial Fractures",
    tags: ["trauma"],
    sortOrder: 1,
  },
  {
    id: "hn_fx_mandible_imf",
    displayName: "Mandible fracture — IMF / closed reduction",
    snomedCtCode: "24529004", // VERIFY — may have closed-specific code
    snomedCtDisplay: "Closed reduction of fracture of mandible (procedure)",
    specialties: ["head_neck"],
    subcategory: "Facial Fractures",
    tags: ["trauma"],
    sortOrder: 2,
  },
  {
    id: "hn_fx_zygoma_orif",
    displayName: "Zygoma fracture ORIF",
    snomedCtCode: "50528002",
    snomedCtDisplay: "Open reduction of fracture of zygoma (procedure)",
    specialties: ["head_neck"],
    subcategory: "Facial Fractures",
    tags: ["trauma"],
    sortOrder: 3,
  },
  {
    id: "hn_fx_zygoma_gillies",
    displayName: "Zygoma reduction — Gillies approach",
    snomedCtCode: "50528002", // VERIFY
    snomedCtDisplay: "Closed reduction of fracture of zygoma (procedure)",
    specialties: ["head_neck"],
    subcategory: "Facial Fractures",
    tags: ["trauma"],
    sortOrder: 4,
  },
  {
    id: "hn_fx_orbital_floor",
    displayName: "Orbital floor fracture repair",
    snomedCtCode: "359634005",
    snomedCtDisplay: "Repair of fracture of orbital floor (procedure)",
    specialties: ["head_neck"],
    subcategory: "Facial Fractures",
    tags: ["trauma"],
    sortOrder: 5,
  },
  {
    id: "hn_fx_lefort",
    displayName: "Le Fort fracture ORIF (I / II / III)",
    snomedCtCode: "50528002", // VERIFY
    snomedCtDisplay: "Open reduction of Le Fort fracture (procedure)",
    specialties: ["head_neck"],
    subcategory: "Facial Fractures",
    tags: ["trauma"],
    sortOrder: 6,
  },
  {
    id: "hn_fx_frontal_sinus",
    displayName: "Frontal sinus fracture repair",
    snomedCtCode: "50528002", // VERIFY
    snomedCtDisplay: "Repair of fracture of frontal sinus (procedure)",
    specialties: ["head_neck"],
    subcategory: "Facial Fractures",
    tags: ["trauma"],
    sortOrder: 7,
  },
  {
    id: "hn_fx_nasal",
    displayName: "Nasal fracture reduction (closed / open)",
    snomedCtCode: "36070001",
    snomedCtDisplay: "Reduction of nasal fracture (procedure)",
    specialties: ["head_neck"],
    subcategory: "Facial Fractures",
    tags: ["trauma"],
    sortOrder: 8,
  },
  {
    id: "hn_fx_noe",
    displayName: "Naso-orbito-ethmoidal (NOE) fracture repair",
    snomedCtCode: "50528002", // VERIFY
    snomedCtDisplay: "Repair of naso-orbito-ethmoidal fracture (procedure)",
    specialties: ["head_neck"],
    subcategory: "Facial Fractures",
    tags: ["trauma"],
    sortOrder: 9,
  },
  {
    id: "hn_fx_panfacial",
    displayName: "Panfacial fracture reconstruction",
    snomedCtCode: "50528002", // VERIFY
    snomedCtDisplay: "Repair of panfacial fracture (procedure)",
    specialties: ["head_neck"],
    subcategory: "Facial Fractures",
    tags: ["trauma"],
    sortOrder: 10,
  },
];

const HEAD_NECK_OTHER: ProcedurePicklistEntry[] = [
  {
    id: "hn_other_neck_dissection",
    displayName: "Neck dissection (selective / modified radical / radical)",
    snomedCtCode: "24994004",
    snomedCtDisplay: "Neck dissection (procedure)",
    specialties: ["head_neck"],
    subcategory: "Other Head & Neck",
    tags: ["oncological"],
    sortOrder: 1,
  },
  {
    id: "hn_other_parotidectomy",
    displayName: "Parotidectomy (superficial / total)",
    snomedCtCode: "33482003",
    snomedCtDisplay: "Parotidectomy (procedure)",
    specialties: ["head_neck"],
    subcategory: "Other Head & Neck",
    tags: ["oncological"],
    sortOrder: 2,
  },
  {
    id: "hn_other_tracheostomy",
    displayName: "Tracheostomy",
    snomedCtCode: "48387007",
    snomedCtDisplay: "Tracheostomy (procedure)",
    specialties: ["head_neck", "burns"],
    subcategory: "Other Head & Neck",
    tags: ["trauma"],
    sortOrder: 3,
  },
  {
    id: "hn_other_tissue_expansion",
    displayName: "Tissue expansion — head / neck",
    snomedCtCode: "61218004", // VERIFY
    snomedCtDisplay: "Tissue expansion (procedure)",
    specialties: ["head_neck"],
    subcategory: "Other Head & Neck",
    tags: ["elective"],
    sortOrder: 4,
  },
  {
    id: "hn_other_dermoid_excision",
    displayName: "Dermoid cyst excision — face / scalp",
    snomedCtCode: "177300000", // VERIFY
    snomedCtDisplay: "Excision of dermoid cyst (procedure)",
    specialties: ["head_neck"],
    subcategory: "Other Head & Neck",
    tags: ["elective"],
    sortOrder: 5,
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// MASTER PICKLIST — combine all arrays
// ═══════════════════════════════════════════════════════════════════════════

export const PROCEDURE_PICKLIST: ProcedurePicklistEntry[] = [
  // Orthoplastic
  ...ORTHOPLASTIC_FREE_FLAP,
  ...ORTHOPLASTIC_PEDICLED_FLAP,
  ...ORTHOPLASTIC_LOCAL_FLAP,
  ...ORTHOPLASTIC_SKIN_GRAFT,
  ...ORTHOPLASTIC_WOUND,
  ...ORTHOPLASTIC_LIMB_SALVAGE,
  ...ORTHOPLASTIC_COMPLEX_RECONSTRUCTION,
  // Hand Surgery
  ...HAND_FRACTURE_FIXATION,
  ...HAND_TENDON_SURGERY,
  ...HAND_NERVE_SURGERY,
  ...HAND_JOINT_PROCEDURES,
  ...HAND_COMPRESSION_NEUROPATHY,
  ...HAND_DUPUYTREN,
  ...HAND_SOFT_TISSUE_COVERAGE,
  ...HAND_CONGENITAL,
  ...HAND_OTHER,
  // Head & Neck
  ...HEAD_NECK_SKIN_CANCER,
  ...HEAD_NECK_LOCAL_FLAPS,
  ...HEAD_NECK_REGIONAL_FLAPS,
  ...HEAD_NECK_FREE_FLAPS,
  ...HEAD_NECK_SITE_RECONSTRUCTION,
  ...HEAD_NECK_FACIAL_NERVE,
  ...HEAD_NECK_CLEFT_CRANIOFACIAL,
  ...HEAD_NECK_FACIAL_FRACTURES,
  ...HEAD_NECK_OTHER,
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
