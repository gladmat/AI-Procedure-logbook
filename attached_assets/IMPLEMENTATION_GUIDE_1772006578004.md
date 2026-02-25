# SNOMED CT Update Package — Implementation Guide

**Date**: 25 February 2026  
**Package version**: 1.0  
**Files in this package**:
- `snomedCodeFixes.ts` — All corrections as typed, importable data structures
- `applySnomedFixes.ts` — Automated patch script for your picklist files
- `IMPLEMENTATION_GUIDE.md` — This file

---

## Quick Start

### Step 1: Review the fixes

Import and inspect the corrections:

```typescript
import { criticalFixes, highFixes, getUpdateSummary } from './snomedCodeFixes';
console.log(getUpdateSummary());
```

### Step 2: Run the patch script

```bash
npx ts-node applySnomedFixes.ts --dry-run          # preview changes
npx ts-node applySnomedFixes.ts                     # apply changes
npx ts-node applySnomedFixes.ts --priority critical  # critical only
```

### Step 3: Verify via Ontoserver

Once network access is restored, run the verification script against all codes:

```bash
# Single code check
curl -s "https://r4.ontoserver.csiro.au/fhir/CodeSystem/\$lookup?system=http://snomed.info/sct&code=442695005" \
  -H "Accept: application/fhir+json" | jq '.parameter[] | select(.name=="display") | .valueString'

# Batch verification (all codes)
npx ts-node applySnomedFixes.ts --verify
```

---

## Change Summary

| Priority | Entries Affected | Key Changes |
|----------|-----------------|-------------|
| **CRITICAL** | ~22 | Botulinum toxin US→INT, dermal filler hierarchy fix, burns codes, LD flap code, cleft palate code reuse |
| **HIGH** | ~20 | Phalanx CRIF/ORIF split, body contouring codes, breast symmetrisation, seroma, Mohs, chest/abdominal wall |
| **MEDIUM** | ~12 | Thread lift, mallet finger, Bennett/Rolando verification, lip flaps, pressure sore site specificity |
| **Diagnosis** | ~10 | Fingertip injury, dermatochalasis, capsular contracture, pressure ulcer sites |
| **Display** | 4 | snomedCtDisplay corrections to match actual SNOMED preferred terms |
| **Cross-map** | 2 | Rhinoplasty and blepharoplasty code alignment in snomedCt.ts |
| **Verify** | ~46 | Codes requiring Ontoserver API validation |

**Total entries affected**: ~70 direct fixes + 46 pending verification

---

## Detailed Change Log by Priority

### CRITICAL (fix before production)

#### 1. Botulinum Toxin — US Extension → International Edition
- **Entries**: `aes_inj_botox_forehead`, `aes_inj_botox_glabella`, `aes_inj_botox_crowsfeet`
- **Change**: `428191000124101` → `442695005`
- **Risk if unfixed**: Code validation failures in NZ SNOMED CT deployment

#### 2. Dermal Filler — Wrong Hierarchy
- **Entries**: 8× `aes_inj_filler_*`
- **Change**: `13413003` (joint injection) → `787876008` (dermal filler injection)
- **Fallback**: `418407000` (injection into skin)
- **Risk if unfixed**: Completely incorrect clinical meaning stored

#### 3. Burns — Debridement → Treatment of Burn
- **Entries**: 6× `burns_site_*`
- **Change**: `36777000` → `89658006` (general), `73553004` (chemical), `409580007` (electrical)
- **Risk if unfixed**: Burns surgery logged as debridement

#### 4. Pedicled LD Flap Code
- **Entry**: `breast_recon_ld_implant`
- **Change**: `234296008` (free LD) → `234281001` (pedicled LD)
- **Risk if unfixed**: Pedicled procedure coded as free flap

#### 5. Cleft Palate Code Reuse
- **Entries**: `hn_cleft_alveolar_bone_graft`, `hn_cleft_velopharyngeal_insufficiency`
- **Change**: `172735006` → `54550001` (bone graft) and `41925006` (pharyngoplasty)
- **Risk if unfixed**: Three different procedures sharing one code

### HIGH (next sprint)

#### 6. Phalanx ORIF vs CRIF
- `hand_fx_phalanx_crif`: `15257006` → `179097006` family

#### 7. Belt Lipectomy & Body Lift
- `bc_lower_belt_lipectomy`, `bc_lower_body_lift`: `302441008` → `72310004`

#### 8. Breast Symmetrisation, Tuberous, Aug-Mastopexy
- 3 entries: `69031006` → `392090004` or `64368001`

#### 9. Seroma Management
- `bc_other_seroma_management`: `174295000` → `69794004`

#### 10. Mohs Defect Reconstruction
- `hn_skin_mohs_defect`: `122465003` → `440299008`

#### 11. Flexor Sheath Washout
- `hand_other_flexor_sheath_washout`: `36777000` → `43289009`

#### 12. Body Contouring Lifts
- 5 entries using `177300000` → site-appropriate codes

#### 13. Oncological Skin Excision
- 2 entries: `177300000` → `287626001`

#### 14. Chest & Abdominal Wall Reconstruction
- `orth_chest_wall_reconstruction`: `122462001` → `234254005`
- `orth_abdominal_wall_reconstruction`: `122462001` → `234256007`

---

## Files to Modify

| Source File | Changes |
|------------|---------|
| `procedurePicklist.ts` | ~55 entry modifications |
| Diagnosis picklist files | ~10 entry modifications |
| `skinCancerDiagnoses.ts` | Review melanoma face code |
| `snomedCt.ts` | 2 cross-map alignment fixes |
| `skinCancerStagingConfigs.ts` | No changes needed (all codes verified correct) |

---

## Testing Checklist

After applying fixes:

- [ ] All modified entries compile without TypeScript errors
- [ ] SNOMED codes render correctly in the UI picklists
- [ ] Layer 2 coded data exports include updated codes
- [ ] Search/filter functionality still works with new codes
- [ ] Melanoma staging pathway unaffected (codes verified correct)
- [ ] Existing logbook entries with old codes are handled gracefully (migration?)
- [ ] Cross-map lookups in `snomedCt.ts` resolve correctly

---

## Data Migration Consideration

Existing logbook entries stored with old SNOMED codes will need a migration strategy:

**Option A — In-place update**: Run a database migration to update stored codes.

**Option B — Code mapping layer**: Maintain a mapping of old → new codes so historical entries remain valid while new entries use correct codes.

**Option C — Dual storage**: Store both the original code and the corrected code with a version flag.

Recommendation: **Option B** is safest for a surgical logbook where historical data integrity is paramount.
