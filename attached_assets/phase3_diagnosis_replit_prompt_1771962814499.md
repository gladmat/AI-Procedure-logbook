# Phase 3: Diagnosis Improvement — Head & Neck + Orthoplastic

## Overview

This is Phase 3 of the diagnosis picklist improvement. Phases 1 and 2 (Hand Surgery, Burns, Body Contouring, Breast, Aesthetics, General) are already deployed and working.

Phase 3 adds the final two specialties:
- **Head & Neck** — 25 structured diagnoses across 4 subcategories
- **Orthoplastic** — 14 structured diagnoses across 3 subcategories

After this, all 8 specialties will have structured diagnosis picklists.

## Changes Required

### 1. ADD two new diagnosis picklist files

Create these two files from the code provided below:

**`client/lib/diagnosisPicklists/headNeckDiagnoses.ts`** — 25 diagnoses in 4 subcategories:
- Skin Cancer (8 site-specific entries with site-appropriate reconstruction suggestions)
- Facial Fractures (8 entries — highly deterministic 1:1 mappings)
- Cleft / Craniofacial (4 entries)
- Facial Nerve & Other (5 entries — intentionally LOOSE suggestions for complex reconstruction)

**`client/lib/diagnosisPicklists/orthoplasticDiagnoses.ts`** — 14 diagnoses in 3 subcategories:
- Trauma / Open Fractures (4 entries — Gustilo staging drives conditional suggestions)
- Chronic Wounds / Infection (5 entries — Wagner classification for diabetic foot)
- Complex Reconstruction (5 entries — broad flap suggestions, surgeon refines)

### 2. UPDATE the index file

In `client/lib/diagnosisPicklists/index.ts`, make these changes:

**a) Uncomment the Phase 3 imports (near line 52):**
```typescript
// CHANGE FROM:
// import { HEAD_NECK_DIAGNOSES } from "./headNeckDiagnoses";
// import { ORTHOPLASTIC_DIAGNOSES } from "./orthoplasticDiagnoses";

// CHANGE TO:
import { HEAD_NECK_DIAGNOSES } from "./headNeckDiagnoses";
import { ORTHOPLASTIC_DIAGNOSES } from "./orthoplasticDiagnoses";
```

**b) Uncomment the Phase 3 re-exports (near line 32). Add these two lines after the GENERAL_DIAGNOSES export:**
```typescript
export { HEAD_NECK_DIAGNOSES } from "./headNeckDiagnoses";
export { ORTHOPLASTIC_DIAGNOSES } from "./orthoplasticDiagnoses";
```

**c) Uncomment the Phase 3 entries in ALL_DIAGNOSES array (near line 69):**
```typescript
// CHANGE FROM:
  // ...HEAD_NECK_DIAGNOSES,
  // ...ORTHOPLASTIC_DIAGNOSES,

// CHANGE TO:
  ...HEAD_NECK_DIAGNOSES,
  ...ORTHOPLASTIC_DIAGNOSES,
```

**d) Uncomment the Phase 3 entries in SPECIALTY_MAP (near line 84):**
```typescript
// CHANGE FROM:
  // head_neck: HEAD_NECK_DIAGNOSES,
  // orthoplastic: ORTHOPLASTIC_DIAGNOSES,

// CHANGE TO:
  head_neck: HEAD_NECK_DIAGNOSES,
  orthoplastic: ORTHOPLASTIC_DIAGNOSES,
```

**e) Update the file header comment (line 9):**
```typescript
// CHANGE FROM:
 * Phase 3 (TODO): Head & Neck, Orthoplastic

// CHANGE TO:
 * Phase 3: Head & Neck, Orthoplastic ✓
```

### 3. ADD new staging configurations

In `server/diagnosisStagingConfig.ts`, add these new staging system entries to the `STAGING_CONFIGS` array:

**a) House-Brackmann Grade (for facial nerve palsy):**
```typescript
  // House-Brackmann Grade — Facial Nerve Palsy
  {
    snomedCtCodes: [
      "280816001", // Facial nerve palsy
    ],
    keywords: ["facial nerve palsy", "facial palsy", "Bell's palsy", "facial nerve injury"],
    stagingSystems: [
      {
        name: "House-Brackmann Grade",
        description: "Facial nerve function grading",
        options: [
          { value: "I", label: "Grade I", description: "Normal function" },
          { value: "II", label: "Grade II", description: "Slight dysfunction — slight weakness noticeable on close inspection" },
          { value: "III", label: "Grade III", description: "Moderate dysfunction — obvious but not disfiguring; complete eye closure with effort" },
          { value: "IV", label: "Grade IV", description: "Moderately severe — obvious weakness; incomplete eye closure" },
          { value: "V", label: "Grade V", description: "Severe — barely perceptible motion; incomplete eye closure" },
          { value: "VI", label: "Grade VI", description: "Total paralysis — no movement" },
        ],
      },
    ],
  },
```

**b) Wagner Classification (for diabetic foot ulcer):**
```typescript
  // Wagner Classification — Diabetic Foot
  {
    snomedCtCodes: [
      "280137006", // Diabetic foot ulcer
    ],
    keywords: ["diabetic foot", "diabetic ulcer", "Wagner", "neuropathic ulcer"],
    stagingSystems: [
      {
        name: "Wagner Grade",
        description: "Diabetic foot ulcer classification — guides surgical management",
        options: [
          { value: "0", label: "Grade 0", description: "Intact skin; bony deformity (pre-ulcerative)" },
          { value: "1", label: "Grade 1", description: "Superficial ulcer (epidermis ± dermis)" },
          { value: "2", label: "Grade 2", description: "Deep ulcer to tendon / bone / joint" },
          { value: "3", label: "Grade 3", description: "Deep ulcer + abscess / osteomyelitis" },
          { value: "4", label: "Grade 4", description: "Partial foot gangrene (toe / forefoot)" },
          { value: "5", label: "Grade 5", description: "Whole foot gangrene — amputation usually required" },
        ],
      },
    ],
  },
```

**c) Le Fort Classification (for Le Fort fractures):**
```typescript
  // Le Fort Classification — Midface Fractures
  {
    snomedCtCodes: [
      "263175007", // Le Fort fracture
    ],
    keywords: ["Le Fort", "LeFort", "midface fracture", "maxillary fracture"],
    stagingSystems: [
      {
        name: "Le Fort Classification",
        description: "Midface fracture pattern classification",
        options: [
          { value: "I", label: "Le Fort I", description: "Horizontal maxillary — alveolar process separation" },
          { value: "II", label: "Le Fort II", description: "Pyramidal — maxilla + nasal bones; infraorbital involvement" },
          { value: "III", label: "Le Fort III", description: "Craniofacial disjunction — complete separation of facial skeleton from cranial base" },
        ],
      },
    ],
  },
```

### 4. VERIFY procedure IDs

All procedure suggestion IDs in the new diagnosis files reference existing entries in `client/lib/procedurePicklist.ts`. The following IDs are used — verify they all exist:

**Head & Neck procedure IDs used:**
- `hn_skin_bcc_excision`, `hn_skin_scc_excision`, `hn_skin_melanoma_wle`, `hn_skin_mohs_defect`, `hn_skin_slnb`
- `hn_local_advancement`, `hn_local_rotation`, `hn_local_transposition`, `hn_local_bilobed`
- `hn_reg_paramedian_forehead`, `hn_reg_abbe`, `hn_reg_karapandzic`
- `hn_recon_nose_partial`, `hn_recon_ear_partial`, `hn_recon_ear_total`, `hn_recon_ear_prosthetic`
- `hn_recon_eyelid_upper`, `hn_recon_eyelid_lower`
- `hn_fx_mandible_orif`, `hn_fx_mandible_imf`, `hn_fx_zygoma_orif`, `hn_fx_zygoma_gillies`
- `hn_fx_orbital_floor`, `hn_fx_nasal`, `hn_fx_lefort`, `hn_fx_frontal_sinus`, `hn_fx_noe`, `hn_fx_panfacial`
- `hn_cleft_lip_unilateral`, `hn_cleft_lip_bilateral`, `hn_cleft_palate`, `hn_cleft_alveolar_bone_graft`
- `hn_cleft_velopharyngeal_insufficiency`
- `hn_fn_primary_repair`, `hn_fn_cable_graft`, `hn_fn_cross_face`, `hn_fn_masseteric_transfer`
- `hn_fn_free_gracilis`, `hn_fn_static_sling`, `hn_fn_gold_weight`
- `hn_other_neck_dissection`, `hn_other_parotidectomy`
- `hn_recon_oral_tongue_floor`, `hn_recon_mandible`, `hn_recon_lip`
- Cross-specialty: `orth_ff_rfff`, `orth_ff_fibula`, `orth_ff_alt`

**Orthoplastic procedure IDs used:**
- `orth_debride_surgical`, `orth_washout`, `orth_npwt`, `orth_sequestrectomy`
- `orth_ssg_meshed`, `orth_ssg_sheet`, `orth_wound_closure_delayed`
- `orth_ped_gastrocnemius_medial`, `orth_ped_soleus`, `orth_ped_ld`
- `orth_ped_propeller`, `orth_ped_reversed_sural`, `orth_ped_vy_fasciocutaneous`
- `orth_ff_alt`, `orth_ff_gracilis`, `orth_ff_ld`, `orth_ff_fibula`
- `orth_local_rotation`
- `orth_bka`, `orth_ray_amputation`, `orth_stump_revision`
- `orth_pressure_sore_flap`, `orth_chest_wall_reconstruction`
- Cross-specialty: `hn_reg_pectoralis_major`

## Verification Checklist

After deploying, verify:

- [ ] **Head & Neck specialty**: selecting "head_neck" in the case form shows the diagnosis picker with 4 subcategories
- [ ] **Orthoplastic specialty**: selecting "orthoplastic" shows the diagnosis picker with 3 subcategories
- [ ] **Type-ahead search**: searching "mandible" in H&N returns "Mandible fracture"; searching "Gustilo" in Orthoplastic returns "Open fracture — lower leg"
- [ ] **Procedure suggestions**: selecting "Open fracture — lower leg" auto-selects debridement + washout; changing Gustilo to IIIb reveals flap options
- [ ] **Diabetic foot Wagner staging**: selecting "Diabetic foot ulcer" shows Wagner grade picker; setting Grade 5 shows amputation suggestion
- [ ] **Le Fort staging**: selecting "Le Fort fracture" shows Le Fort I/II/III picker
- [ ] **House-Brackmann staging**: selecting "Facial nerve palsy" shows H-B grade picker
- [ ] **Cross-specialty procedure IDs resolve**: H&N oral SCC suggests `orth_ff_rfff` (cross-tagged from Orthoplastic), and it renders correctly
- [ ] **Fallback to SNOMED search**: the "Search all SNOMED diagnoses" fallback still works below the picklist
- [ ] **Existing Phase 1–2 specialties unaffected**: Hand Surgery, Burns, Body Contouring, Breast, Aesthetics, General all still work

## File Summary

| File | Action | Lines |
|------|--------|-------|
| `client/lib/diagnosisPicklists/headNeckDiagnoses.ts` | **CREATE** | ~580 |
| `client/lib/diagnosisPicklists/orthoplasticDiagnoses.ts` | **CREATE** | ~480 |
| `client/lib/diagnosisPicklists/index.ts` | **EDIT** (5 changes) | ~295 |
| `server/diagnosisStagingConfig.ts` | **EDIT** (add 3 staging systems) | +60 |

Total: 2 new files + 2 edits. No schema changes, no new components, no new dependencies. This is purely data — the UI and evaluation engine already handle everything.
