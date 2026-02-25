/**
 * SNOMED CT Code Update Package
 * Generated: 25 February 2026
 * Based on: SNOMED CT Code Audit — Surgical Logbook App
 *
 * This file contains all corrections identified in the audit.
 * Apply these changes to procedurePicklist.ts, diagnosis picklist files,
 * skinCancerDiagnoses.ts, skinCancerStagingConfigs.ts, and snomedCt.ts.
 *
 * Priority levels:
 *   CRITICAL — fix before production (data integrity / interoperability risk)
 *   HIGH     — fix in next sprint
 *   MEDIUM   — improve when capacity allows
 */

// ============================================================================
// TYPES
// ============================================================================

interface SnomedCodeFix {
  entryId: string | string[];
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  category: string;
  description: string;
  current: {
    code: string;
    display: string;
  };
  replacement: {
    code: string;
    display: string;
    alternativeCode?: string;
    alternativeDisplay?: string;
  };
  notes?: string;
}

interface DisplayMismatchFix {
  entryId: string;
  code: string;
  currentDisplay: string;
  correctDisplay: string;
  notes?: string;
}

interface CrossMapFix {
  file: string;
  field: string;
  currentCode: string;
  correctCode: string;
  notes: string;
}

// ============================================================================
// PART 1: CRITICAL FIXES (apply before production)
// ============================================================================

export const criticalFixes: SnomedCodeFix[] = [
  // ── 1. Botulinum toxin: US Extension → International Edition ──
  {
    entryId: ['aes_inj_botox_forehead', 'aes_inj_botox_glabella', 'aes_inj_botox_crowsfeet'],
    priority: 'CRITICAL',
    category: 'Aesthetics — Injectables',
    description:
      'US Extension concept (428191000124101) will fail in NZ/UK/CH SNOMED deployments. ' +
      'Replace with International Edition concept.',
    current: {
      code: '428191000124101',
      display: 'Injection of botulinum toxin',
    },
    replacement: {
      code: '442695005',
      display: 'Injection of botulinum toxin',
      alternativeCode: '404909007',
      alternativeDisplay: 'Injection of neurotoxin into muscle',
    },
    notes: 'Affects 3 entries. Top priority for NZ deployment.',
  },

  // ── 2. Dermal filler: Joint injection → Skin injection ──
  {
    entryId: [
      'aes_inj_filler_lips',
      'aes_inj_filler_nasolabial',
      'aes_inj_filler_marionette',
      'aes_inj_filler_cheeks',
      'aes_inj_filler_chin',
      'aes_inj_filler_jawline',
      'aes_inj_filler_tear_trough',
      'aes_inj_filler_temple',
    ],
    priority: 'CRITICAL',
    category: 'Aesthetics — Injectables',
    description:
      'Code 13413003 is "Injection into joint" — WRONG hierarchy entirely. ' +
      'Dermal filler is not a joint injection.',
    current: {
      code: '13413003',
      display: 'Injection into joint',
    },
    replacement: {
      code: '787876008',
      display: 'Injection of dermal filler',
      alternativeCode: '418407000',
      alternativeDisplay: 'Injection into skin',
    },
    notes:
      'Highest-impact single error (8 entries). ' +
      'If 787876008 is not in your target edition, fall back to 418407000 ' +
      'or use 271807003 |Injection of substance| with post-coordinated substance.',
  },

  // ── 3. Burns: Debridement → Treatment of burn ──
  {
    entryId: [
      'burns_site_hand',
      'burns_site_face',
      'burns_site_perineal',
      'burns_site_chemical',
      'burns_site_electrical',
      'burns_site_other',
    ],
    priority: 'CRITICAL',
    category: 'Burns',
    description:
      'Code 36777000 is "Debridement (procedure)" — not burns surgery. ' +
      'Using one debridement code for all site-specific burns loses clinical specificity.',
    current: {
      code: '36777000',
      display: 'Debridement (procedure)',
    },
    replacement: {
      code: '89658006',
      display: 'Treatment of burn',
    },
    notes:
      'For chemical burns use 73553004 |Treatment of chemical burn|. ' +
      'For electrical burns use 409580007 |Treatment of electrical burn|. ' +
      'For site-specific: post-coordinate 89658006 with body site.',
  },

  // ── 4. Pedicled LD flap: Free flap code → Pedicled flap code ──
  {
    entryId: ['breast_recon_ld_implant'],
    priority: 'CRITICAL',
    category: 'Breast Reconstruction',
    description:
      'Using free LD flap code 234296008 for pedicled LD flap with implant.',
    current: {
      code: '234296008',
      display: 'Free latissimus dorsi flap',
    },
    replacement: {
      code: '234281001',
      display: 'Pedicled latissimus dorsi flap',
    },
    notes: 'Display also needs correction — was "Pedicled LD flap with implant".',
  },

  // ── 5. Cleft palate code reuse ──
  {
    entryId: ['hn_cleft_alveolar_bone_graft'],
    priority: 'CRITICAL',
    category: 'Head & Neck — Cleft',
    description:
      '172735006 is "Repair of cleft palate" — wrong procedure for alveolar bone grafting.',
    current: {
      code: '172735006',
      display: 'Alveolar bone graft',
    },
    replacement: {
      code: '54550001',
      display: 'Bone graft of alveolar ridge',
      alternativeCode: '39575007',
      alternativeDisplay: 'Bone graft to maxilla',
    },
  },
  {
    entryId: ['hn_cleft_velopharyngeal_insufficiency'],
    priority: 'CRITICAL',
    category: 'Head & Neck — Cleft',
    description:
      'Same cleft palate repair code 172735006 reused for pharyngoplasty — different procedure.',
    current: {
      code: '172735006',
      display: 'Pharyngoplasty for VPI',
    },
    replacement: {
      code: '41925006',
      display: 'Pharyngoplasty',
    },
  },
];

// ============================================================================
// PART 2: HIGH-PRIORITY FIXES (next sprint)
// ============================================================================

export const highFixes: SnomedCodeFix[] = [
  // ── 6. Phalanx ORIF vs CRIF ──
  {
    entryId: ['hand_fx_phalanx_crif'],
    priority: 'HIGH',
    category: 'Hand Surgery — Fractures',
    description:
      'Code 15257006 FSN is "Open reduction of fracture of phalanx" — ' +
      'using the same code for CRIF is incorrect.',
    current: {
      code: '15257006',
      display: 'Closed reduction of fracture of phalanx with IF',
    },
    replacement: {
      code: '179097006',
      display: 'Closed reduction of fracture with internal fixation',
    },
    notes:
      'Search 179097006 family for a phalanx-specific closed reduction concept. ' +
      'Keep 15257006 for ORIF of phalanx only.',
  },

  // ── 7. Belt lipectomy & body lift: Liposuction → Excisional procedure ──
  {
    entryId: ['bc_lower_belt_lipectomy'],
    priority: 'HIGH',
    category: 'Body Contouring',
    description:
      'Code 302441008 is "Liposuction" — belt lipectomy is an excisional procedure.',
    current: {
      code: '302441008',
      display: 'Liposuction (procedure)',
    },
    replacement: {
      code: '72310004',
      display: 'Abdominoplasty',
    },
    notes:
      'Abdominoplasty is the closest parent concept. ' +
      'Search for body contouring / circumferential body lift concept if available.',
  },
  {
    entryId: ['bc_lower_body_lift'],
    priority: 'HIGH',
    category: 'Body Contouring',
    description: 'Same liposuction code issue for lower body lift.',
    current: {
      code: '302441008',
      display: 'Liposuction (procedure)',
    },
    replacement: {
      code: '72310004',
      display: 'Abdominoplasty',
    },
    notes: 'Same as belt lipectomy — closest available excisional body contouring concept.',
  },

  // ── 8. Breast symmetrisation & tuberous correction ──
  {
    entryId: ['breast_onco_contralateral_symmetrisation'],
    priority: 'HIGH',
    category: 'Breast — Oncoplastic',
    description:
      'Code 69031006 "Insertion of prosthesis" is wrong — ' +
      'symmetrisation includes reduction and mastopexy, not just implant.',
    current: {
      code: '69031006',
      display: 'Insertion of prosthesis (procedure)',
    },
    replacement: {
      code: '64368001',
      display: 'Reduction mammoplasty',
    },
    notes:
      'If the actual procedure is always a reduction, use 64368001. ' +
      'If mixed (sometimes augmentation, sometimes reduction), ' +
      'consider a parent concept like 392090004 or procedure-level branching.',
  },
  {
    entryId: ['breast_rev_tuberous_correction'],
    priority: 'HIGH',
    category: 'Breast — Revision',
    description:
      'Tuberous breast correction is not primarily prosthesis insertion.',
    current: {
      code: '69031006',
      display: 'Insertion of prosthesis (procedure)',
    },
    replacement: {
      code: '392090004',
      display: 'Operative procedure on breast',
    },
    notes:
      'Verify 392090004 via Ontoserver. Tuberous correction involves ' +
      'parenchymal scoring, expansion, and potentially implant — ' +
      'a generic breast procedure code is more accurate than pure implant insertion.',
  },
  {
    entryId: ['breast_aes_augmentation_mastopexy'],
    priority: 'HIGH',
    category: 'Breast — Aesthetic',
    description:
      'Augmentation-mastopexy is not just prosthesis insertion.',
    current: {
      code: '69031006',
      display: 'Insertion of prosthesis (procedure)',
    },
    replacement: {
      code: '392090004',
      display: 'Operative procedure on breast',
    },
    notes:
      'This is a combined procedure. If no single SNOMED concept covers aug-mastopexy, ' +
      'use 392090004 as parent or post-coordinate.',
  },

  // ── 9. Seroma management: Abscess I&D → Aspiration ──
  {
    entryId: ['bc_other_seroma_management'],
    priority: 'HIGH',
    category: 'Body Contouring — Complications',
    description:
      'Code 174295000 is "Incision and drainage of abscess" — ' +
      'a seroma is NOT an abscess.',
    current: {
      code: '174295000',
      display: 'Incision and drainage of abscess',
    },
    replacement: {
      code: '69794004',
      display: 'Aspiration procedure',
      alternativeCode: '129128005',
      alternativeDisplay: 'Drainage of seroma',
    },
  },

  // ── 10. Mohs defect reconstruction ──
  {
    entryId: ['hn_skin_mohs_defect'],
    priority: 'HIGH',
    category: 'Head & Neck — Skin Cancer',
    description:
      'Code 122465003 is far too generic ("Reconstruction procedure").',
    current: {
      code: '122465003',
      display: 'Reconstruction procedure (procedure)',
    },
    replacement: {
      code: '440299008',
      display: 'Mohs micrographic surgery',
    },
    notes:
      'If the entry represents the reconstruction AFTER Mohs (not the Mohs itself), ' +
      'post-coordinate: reconstruction + post-Mohs context.',
  },

  // ── 11. Hand washout procedures ──
  {
    entryId: ['hand_other_flexor_sheath_washout'],
    priority: 'HIGH',
    category: 'Hand Surgery — Infection',
    description:
      'Generic debridement code 36777000 for flexor sheath washout.',
    current: {
      code: '36777000',
      display: 'Debridement (procedure)',
    },
    replacement: {
      code: '43289009',
      display: 'Drainage of tendon sheath',
    },
  },

  // ── 12. Body contouring entries using skin excision code ──
  {
    entryId: [
      'bc_upper_bra_line_lift',
      'bc_upper_axillary_roll',
      'bc_buttock_lift',
      'bc_lower_knee_lift',
      'bc_postbar_mons_lift',
    ],
    priority: 'HIGH',
    category: 'Body Contouring',
    description:
      'Code 177300000 "Excision of lesion of skin" is wrong for body contouring lifts.',
    current: {
      code: '177300000',
      display: 'Excision of lesion of skin (procedure)',
    },
    replacement: {
      code: '119954001',
      display: 'Brachioplasty',
    },
    notes:
      'Use 119954001 for arm-related lifts. For other sites, ' +
      'search for specific excisional body contouring concepts or use 286553006 ' +
      '|Plastic operation| post-coordinated with anatomical site. ' +
      'Each entry should ideally have a site-appropriate code.',
  },

  // ── 13. Oncological skin excision specificity ──
  {
    entryId: ['gen_mel_merkel_excision', 'gen_mel_dfsp_excision'],
    priority: 'HIGH',
    category: 'Skin Cancer',
    description:
      'Using generic skin excision (177300000) for oncological excisions.',
    current: {
      code: '177300000',
      display: 'Excision of lesion of skin (procedure)',
    },
    replacement: {
      code: '287626001',
      display: 'Excision of malignant neoplasm of skin',
    },
  },

  // ── 14. Chest wall & abdominal wall reconstruction ──
  {
    entryId: ['orth_chest_wall_reconstruction'],
    priority: 'HIGH',
    category: 'Ortho-plastic',
    description:
      'Using generic flap code 122462001 — specific code exists.',
    current: {
      code: '122462001',
      display: 'Flap reconstruction (procedure)',
    },
    replacement: {
      code: '234254005',
      display: 'Reconstruction of chest wall',
    },
  },
  {
    entryId: ['orth_abdominal_wall_reconstruction'],
    priority: 'HIGH',
    category: 'Ortho-plastic',
    description:
      'Using generic flap code 122462001 — specific code exists.',
    current: {
      code: '122462001',
      display: 'Flap reconstruction (procedure)',
    },
    replacement: {
      code: '234256007',
      display: 'Reconstruction of abdominal wall',
    },
  },
];

// ============================================================================
// PART 3: MEDIUM-PRIORITY FIXES
// ============================================================================

export const mediumFixes: SnomedCodeFix[] = [
  // ── Thread lift ──
  {
    entryId: ['aes_face_thread_lift'],
    priority: 'MEDIUM',
    category: 'Aesthetics — Face',
    description:
      'Code 54516008 is "Rhytidectomy" (surgical facelift). Thread lift is different.',
    current: {
      code: '54516008',
      display: 'Thread lift of face',
    },
    replacement: {
      code: '286553006',
      display: 'Plastic operation on face',
    },
    notes:
      'No ideal pre-coordinated concept exists for thread lift. ' +
      'Use 286553006 with post-coordinated method qualifier, ' +
      'or flag as needing application-level extension.',
  },

  // ── Mallet finger repair ──
  {
    entryId: ['hand_tend_mallet_finger'],
    priority: 'MEDIUM',
    category: 'Hand Surgery — Tendons',
    description:
      'Code 239248002 may be a finding/disorder concept, not a procedure.',
    current: {
      code: '239248002',
      display: 'Repair of mallet finger',
    },
    replacement: {
      code: '178730002',
      display: 'Repair of mallet deformity',
    },
    notes: 'Verify 178730002 via Ontoserver before applying.',
  },

  // ── Bennett / Rolando fracture fixation ──
  {
    entryId: ['hand_fx_bennett', 'hand_fx_rolando'],
    priority: 'MEDIUM',
    category: 'Hand Surgery — Fractures',
    description:
      'Code 263135001 may be ORIF of metacarpal (2nd–5th), not 1st metacarpal.',
    current: {
      code: '263135001',
      display: 'Fixation of fracture of first metacarpal',
    },
    replacement: {
      code: '263135001',
      display: 'Fixation of fracture of first metacarpal',
    },
    notes:
      'Verify via Ontoserver that 263135001 specifically includes 1st metacarpal. ' +
      'If not, use 73994004 family with metacarpal 1 qualifier.',
  },

  // ── Lip reconstruction flaps ──
  {
    entryId: ['hn_reg_karapandzic', 'hn_reg_estlander'],
    priority: 'MEDIUM',
    category: 'Head & Neck — Regional Flaps',
    description:
      'Lip-specific flaps using generic flap code 122462001.',
    current: {
      code: '122462001',
      display: 'Flap reconstruction (procedure)',
    },
    replacement: {
      code: '13372005',
      display: 'Reconstruction of lip',
    },
  },

  // ── Pressure sore flaps — add anatomical specificity ──
  {
    entryId: [
      'gen_ps_sacral_flap',
      'gen_ps_ischial_flap',
      'gen_ps_trochanteric_flap',
      'gen_ps_heel_flap',
    ],
    priority: 'MEDIUM',
    category: 'General Plastic Surgery — Pressure Sores',
    description:
      'All using generic flap code 122462001. Should post-coordinate with site.',
    current: {
      code: '122462001',
      display: 'Flap reconstruction (procedure)',
    },
    replacement: {
      code: '122462001',
      display: 'Flap reconstruction (procedure)',
    },
    notes:
      'Keep base code but add post-coordination with anatomical site: ' +
      'sacral (64688005), ischial (85710004), trochanteric (71341001), heel (76853006). ' +
      'This improves specificity without requiring new pre-coordinated concepts.',
  },

  // ── Breast SSM/NSM — verify International Edition ──
  {
    entryId: ['breast_onco_ssm'],
    priority: 'MEDIUM',
    category: 'Breast — Oncological',
    description:
      'Code 428564008 may not exist in International Edition.',
    current: {
      code: '428564008',
      display: 'Skin-sparing mastectomy',
    },
    replacement: {
      code: '428564008',
      display: 'Skin-sparing mastectomy',
    },
    notes:
      'Verify via Ontoserver. Fallback: 172043006 |Mastectomy| ' +
      'with post-coordinated skin-sparing qualifier.',
  },
  {
    entryId: ['breast_onco_nsm'],
    priority: 'MEDIUM',
    category: 'Breast — Oncological',
    description:
      'Code 726429001 may be a newer concept — verify International Edition.',
    current: {
      code: '726429001',
      display: 'Nipple-sparing mastectomy',
    },
    replacement: {
      code: '726429001',
      display: 'Nipple-sparing mastectomy',
    },
    notes:
      'Verify via Ontoserver. Fallback: 172043006 |Mastectomy| ' +
      'with post-coordinated nipple-sparing qualifier.',
  },
];

// ============================================================================
// PART 4: DISPLAY NAME CORRECTIONS
// ============================================================================

export const displayFixes: DisplayMismatchFix[] = [
  {
    entryId: 'hn_skin_melanoma_wle',
    code: '177306006',
    currentDisplay: 'Wide excision of malignant melanoma',
    correctDisplay: 'Excision of malignant melanoma of skin',
    notes: 'PT is "Excision of malignant melanoma of skin" — same code covers narrow and wide excision.',
  },
  {
    entryId: 'breast_recon_ld_implant',
    code: '234281001',
    currentDisplay: 'Pedicled LD flap with implant',
    correctDisplay: 'Pedicled latissimus dorsi flap',
    notes: 'After fixing the code from 234296008 → 234281001, update display to match new PT.',
  },
  {
    entryId: 'aes_face_mini_facelift',
    code: '54516008',
    currentDisplay: 'Minimal access cranial suspension lift',
    correctDisplay: 'Rhytidectomy',
    notes: 'MACS lift is a valid variant but the snomedCtDisplay should reflect the actual SNOMED PT.',
  },
  {
    entryId: 'hand_tend_fpl_repair',
    code: '41727003',
    currentDisplay: 'FPL repair',
    correctDisplay: 'Repair of tendon of hand',
    notes: 'Layer 1 display name can say "FPL repair" but snomedCtDisplay must match the SNOMED PT.',
  },
];

// ============================================================================
// PART 5: CROSS-MAP FILE FIXES (snomedCt.ts)
// ============================================================================

export const crossMapFixes: CrossMapFix[] = [
  {
    file: 'snomedCt.ts',
    field: 'rhinoplasty',
    currentCode: '62480006',
    correctCode: '62961003',
    notes:
      'procedurePicklist.ts uses 62961003 for rhinoplasty. ' +
      'Both codes exist but the picklist code should be canonical. Align cross-map.',
  },
  {
    file: 'snomedCt.ts',
    field: 'blepharoplasty',
    currentCode: '41899006',
    correctCode: '75732000',
    notes:
      'Cross-map uses generic blepharoplasty 41899006. ' +
      'Picklist correctly uses 75732000 (upper) and 23420007 (lower). ' +
      'Cross-map should reference the specific codes, not just the parent.',
  },
];

// ============================================================================
// PART 6: DIAGNOSIS CODE FIXES
// ============================================================================

export const diagnosisFixes: SnomedCodeFix[] = [
  {
    entryId: ['hand_dx_fingertip_injury'],
    priority: 'HIGH',
    category: 'Hand Surgery — Diagnosis',
    description:
      'Code 212978003 is "Crushing injury of finger" — too specific. ' +
      'Not all fingertip injuries are crushing.',
    current: {
      code: '212978003',
      display: 'Crushing injury of finger',
    },
    replacement: {
      code: '284003005',
      display: 'Injury of finger',
      alternativeCode: '238376009',
      alternativeDisplay: 'Fingertip injury',
    },
  },
  {
    entryId: ['aes_dx_upper_eyelid_dermatochalasis'],
    priority: 'HIGH',
    category: 'Aesthetics — Diagnosis',
    description:
      'Code 422413001 is likely "Baggy eyelids" — generic. ' +
      'Dermatochalasis has its own specific code.',
    current: {
      code: '422413001',
      display: 'Baggy eyelids',
    },
    replacement: {
      code: '53441006',
      display: 'Dermatochalasis',
    },
  },
  {
    entryId: ['breast_dx_capsular_contracture'],
    priority: 'HIGH',
    category: 'Breast — Diagnosis',
    description:
      'Code 236507001 used for 3 different implant complications. ' +
      'Capsular contracture has its own specific code.',
    current: {
      code: '236507001',
      display: 'Complication of breast implant',
    },
    replacement: {
      code: '267639000',
      display: 'Capsular contracture of breast',
    },
    notes:
      'Keep 236507001 for generic implant complication. ' +
      'Use specific codes: 267639000 for capsular contracture, ' +
      'and find specific codes for rupture and BII.',
  },
  {
    entryId: [
      'gen_ps_dx_sacral',
      'gen_ps_dx_ischial',
      'gen_ps_dx_trochanteric',
      'gen_ps_dx_heel',
    ],
    priority: 'MEDIUM',
    category: 'Pressure Injuries — Diagnosis',
    description:
      'Code 399912005 "Pressure ulcer" used for 4 different anatomical sites.',
    current: {
      code: '399912005',
      display: 'Pressure ulcer',
    },
    replacement: {
      code: '399912005',
      display: 'Pressure ulcer',
    },
    notes:
      'Post-coordinate with anatomical site, or use site-specific concepts: ' +
      '1163215007 |Pressure injury of sacral region| for sacral, etc.',
  },
];

// ============================================================================
// PART 7: BURNS — SITE-SPECIFIC REPLACEMENT MAP
// ============================================================================

/** Detailed replacement map for the 6 burns entries */
export const burnsReplacementMap: Record<string, { code: string; display: string }> = {
  burns_site_hand:       { code: '89658006', display: 'Treatment of burn' },
  burns_site_face:       { code: '89658006', display: 'Treatment of burn' },
  burns_site_perineal:   { code: '89658006', display: 'Treatment of burn' },
  burns_site_chemical:   { code: '73553004', display: 'Treatment of chemical burn' },
  burns_site_electrical: { code: '409580007', display: 'Treatment of electrical burn' },
  burns_site_other:      { code: '89658006', display: 'Treatment of burn' },
};

// ============================================================================
// PART 8: BODY CONTOURING — SITE-SPECIFIC REPLACEMENT MAP
// ============================================================================

/** 
 * Site-appropriate codes for body contouring lifts 
 * currently all using 177300000 (Excision of lesion of skin)
 */
export const bodyContouringReplacementMap: Record<string, { code: string; display: string; notes: string }> = {
  bc_upper_bra_line_lift:  { code: '119954001', display: 'Brachioplasty',   notes: 'Closest available; verify if specific bra-line lift concept exists' },
  bc_upper_axillary_roll:  { code: '119954001', display: 'Brachioplasty',   notes: 'Axillary excision — brachioplasty is closest parent' },
  bc_buttock_lift:         { code: '72310004',  display: 'Abdominoplasty',  notes: 'Use abdominoplasty family for lower trunk/buttock lifts' },
  bc_lower_knee_lift:      { code: '286553006', display: 'Plastic operation', notes: 'No specific concept; post-coordinate with knee site' },
  bc_postbar_mons_lift:    { code: '286553006', display: 'Plastic operation', notes: 'No specific concept; post-coordinate with mons site' },
  bc_buttock_auto_augmentation: { code: '72310004', display: 'Abdominoplasty', notes: 'Should not use flap code 122462001' },
};

// ============================================================================
// PART 9: CODES REQUIRING ONTOSERVER VERIFICATION
// ============================================================================

/** 
 * These // VERIFY-tagged codes could not be confirmed without API access.
 * First batch to check when Ontoserver connectivity is restored.
 * 
 * Run:
 * curl -s "https://r4.ontoserver.csiro.au/fhir/CodeSystem/$lookup?system=http://snomed.info/sct&code=CODE" \
 *   -H "Accept: application/fhir+json" | jq '.parameter[] | select(.name=="display") | .valueString'
 */
export const codesToVerify = {
  handSurgery: [
    '302191005', '263135001', '263136000', '41585002', '53363003',
    '239248002', '240360007', '74589006', '34380001', '76916001',
    '42191004', '56625009', '81003001', '24837003', '54936004', '178728004',
  ],
  headAndNeck: [
    '53410002',  // Abbe flap
    '13895006',  // Cleft lip revision
    '274038009', // Craniosynostosis
    '59782002',  // Le Fort
    '431548006', // Distraction
  ],
  breast: [
    '384692006', '392090004', '428564008', '726429001', '285183003',
    '39853008', '172158009', '172230009', '45187007',
  ],
  burns: ['61218004', '122456005', '91602001'],
  aesthetics: ['239124000', '31956003', '79250004', '176275007'],
  bodyContouring: ['392022003'],
  general: ['234262008', '63697000', '274029008', '37834008'],
};

// ============================================================================
// UTILITY: Generate summary statistics
// ============================================================================

export function getUpdateSummary() {
  const critical = criticalFixes.reduce(
    (acc, f) => acc + (Array.isArray(f.entryId) ? f.entryId.length : 1), 0
  );
  const high = highFixes.reduce(
    (acc, f) => acc + (Array.isArray(f.entryId) ? f.entryId.length : 1), 0
  );
  const medium = mediumFixes.reduce(
    (acc, f) => acc + (Array.isArray(f.entryId) ? f.entryId.length : 1), 0
  );
  const dx = diagnosisFixes.reduce(
    (acc, f) => acc + (Array.isArray(f.entryId) ? f.entryId.length : 1), 0
  );

  return {
    totalEntriesAffected: critical + high + medium + dx,
    byPriority: { critical, high, medium },
    diagnosisFixCount: dx,
    displayFixCount: displayFixes.length,
    crossMapFixCount: crossMapFixes.length,
    codesToVerifyCount: Object.values(codesToVerify).flat().length,
  };
}
