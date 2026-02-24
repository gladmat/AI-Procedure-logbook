# Implementation Guide — Procedure Taxonomy Overhaul + Free Flap Module

## Overview

This update implements the three-layer terminology architecture. 10 files change;
1 new file is created. Everything is backward-compatible — existing cases logged
with the old flat picker continue to display correctly.

---

## Files to Replace (drop-in replacements)

### 1. `client/types/case.ts`
**Changes:**
- `CaseProcedure` gains `picklistEntryId?: string` and `subcategory?: string`
- `FreeFlapDetails` gains `recipientSiteSnomedCode/Display`, `flapSnomedDisplay`,
  `skinIsland?: boolean` (for gracilis/TUG/serratus muscle flaps)
- `FreeFlap` type expands from 9 to 17 members: tug, siea, sgap, igap, pap,
  tdap, parascapular, serratus_anterior added
- `FREE_FLAP_LABELS` updated to match
- `AnatomicalRegion` adds `breast_chest` for IMA/thoracodorsal recipient vessels
- `ANATOMICAL_REGION_LABELS` updated
- New exports: `FLAP_SNOMED_MAP` and `RECIPIENT_SITE_SNOMED_MAP` — these drive
  automatic SNOMED code population when a surgeon selects flap type or
  recipient site, eliminating dependence on live API calls

### 2. `client/lib/procedurePicklist.ts` (NEW FILE)
**Purpose:** Layer 1 of the three-layer architecture — the canonical procedure
pick-list with embedded SNOMED CT codes.

Each `ProcedurePicklistEntry` has:
- `id` — stable identifier (never changes once set)
- `displayName` — surgeon-colloquial label
- `snomedCtCode` + `snomedCtDisplay` — canonical SNOMED concept, pre-mapped
- `specialties[]` — which specialties this procedure appears under
- `subcategory` — grouping within specialty (drives the 2-level UI)
- `hasFreeFlap?: boolean` — if true, FreeFlapClinicalFields renders automatically

**Currently contains:** ~40 orthoplastic procedures across 6 subcategories.
Other specialties are scaffolded and ready to be populated next.

**Entries marked `// VERIFY`** should be confirmed at
https://browser.ihtsdotools.org/ — the concept IDs in the 234xxx range for
named free flaps are high-confidence but the pedicled flap entries use the
parent `122462001` as a placeholder pending specific code lookup.

### 3. `client/components/ProcedureSubcategoryPicker.tsx` (NEW FILE)
**Purpose:** The new 2-level UI picker — replaces the flat single dropdown.

Renders:
1. Horizontal scrollable subcategory chips at the top
2. A procedure list below that updates when chip is tapped
3. Each procedure row shows name + badge tags (Free flap, Microsurgery, Pedicled)

Used automatically in `ProcedureEntryCard` when the selected specialty has
picklist data. Specialties without picklist data still use the legacy
`PROCEDURE_TYPES` flat picker.

### 4. `client/components/ProcedureEntryCard.tsx`
**Changes:**
- `handleSpecialtyChange` now clears `picklistEntryId`, `subcategory`, and
  SNOMED fields on specialty change
- New `handlePicklistSelect(entry)` — called by new picker, auto-populates
  `picklistEntryId`, `subcategory`, `tags`, `snomedCtCode`, `snomedCtDisplay`
- Procedure picker area is now conditional:
  - If `hasPicklistForSpecialty(specialty)` → renders `ProcedureSubcategoryPicker`
  - Otherwise → falls back to legacy `PROCEDURE_TYPES` flat `PickerField`
- Passes `picklistEntryId` through to `ProcedureClinicalDetails`

### 5. `client/components/ProcedureClinicalDetails.tsx`
**Changes:**
- `ProcedureClinicalDetailsProps` adds `picklistEntryId?: string`
- Free flap detection now uses `picklistEntry?.hasFreeFlap` first (reliable),
  with legacy string-matching fallback for old records
- `FreeFlapClinicalFields` gets two new handlers:
  - `handleFlapTypeChange` — auto-populates `flapSnomedCode/Display` from
    `FLAP_SNOMED_MAP` when surgeon picks a flap
  - `handleRecipientSiteChange` — auto-populates `recipientSiteSnomedCode/Display`
    from `RECIPIENT_SITE_SNOMED_MAP` when recipient site is selected
- `DEFAULT_DONOR_VESSELS` expanded from 9 to 17 entries (all new flap types)
- Skin island toggle renders for gracilis, TUG, serratus, PAP, LD — where
  muscle ± skin paddle is a real intraoperative decision
- `FLAPS_WITH_SKIN_ISLAND` constant controls which flaps show the toggle

### 6. `client/components/FreeFlapPicker.tsx`
**Changes:**
- Flat list of 9 flaps replaced with grouped layout:
  - Fasciocutaneous / Perforator: ALT, RFFF, SCIP, SIEA, TDAP, Parascapular, MSAP
  - Muscle ± Skin: Gracilis, TUG, LD, Serratus, PAP
  - Osteocutaneous: Fibula
  - Breast / Perforator: DIEP, SGAP, IGAP
  - Other
- `NON_ALT_ELEVATION_PLANES` removed — all non-ALT flaps use `["subfascial", "suprafascial"]`
- ALT hint text updated for clarity

### 7. `client/components/AnastomosisEntryCard.tsx`
**Bug fix:** Veins were hard-coded to "end-to-end (standard for veins)" with no
UI to change it. This is clinically incorrect — end-to-side venous anastomosis
is common, especially for IJV in head & neck reconstruction.

**Fix:** Configuration picker (end-to-end / end-to-side / other) now shows for
**both** arteries and veins. The artery technique remains labelled
"Hand-sewn (standard)" but is not locked.

### 8. `client/components/RecipientSiteSelector.tsx`
**Change:** `breast_chest` added to `REGION_ORDER` (positioned second, after
head_neck) — required for breast reconstruction cases.

### 9. `client/lib/snomedApi.ts`
**Change:** `RECIPIENT_VESSEL_PRESETS` gains `breast_chest` entry:
- Arteries: IMA, thoracodorsal, lateral thoracic, thoracoacromial
- Veins: IMV, thoracodorsal vein, cephalic vein

Also: lingual artery and retromandibular vein added to head_neck presets.

### 10. `server/seedData.ts`
**Bug fixes (3 duplicate/wrong SNOMED codes):**

| Row | Was | Should be |
|-----|-----|-----------|
| Superior thyroid artery | 17137000 (brachial artery!) | 74805009 |
| Transverse cervical artery | 17137000 (brachial artery!) | 57591007 |
| First dorsal metacarpal artery | 62944002 (proper palmar digital) | 13351009 |

**Addition:** `breast_chest` vessel block added (IMA, thoracodorsal artery/vein,
lateral thoracic artery, thoracoacromial artery, cephalic vein).

---

## Replit: After Replacing Files

1. The app will immediately use the new hierarchical picker for Orthoplastic
2. All other specialties continue to use the legacy flat picker (no regression)
3. After replacing `seedData.ts`, run the seed endpoint to update vessel data:
   `POST /api/seed-snomed-ref` — or restart with a fresh DB seed

---

## Next Steps (not in this batch)

- **Expand picklist to remaining 7 specialties** — start with Hand Surgery
  (~100 procedures) and General (~75 procedures) as highest clinical volume
- **Verify SNOMED codes marked `// VERIFY`** — particularly the pedicled flap
  entries using parent code `122462001` as placeholder
- **Post-coordinated expression assembly** — `flapSnomedCode` +
  `recipientSiteSnomedCode` are now stored separately; build a utility function
  that assembles the full SNOMED post-coordinated expression for export:
  `{procedure}: {405813007|Procedure site| = recipientSiteCode}`
- **OPCS-4 mapping layer** — once SNOMED codes are clean, add the NHS England
  TRUD cross-map for NZ/UK reporting

---

## Architecture Reference

```
ProcedureEntryCard
  └─ ProcedureSubcategoryPicker (new — specialties with picklist)
      └─ on select → sets picklistEntryId, snomedCtCode, hasFreeFlap
  └─ legacy PickerField (fallback — specialties not yet in picklist)
  └─ ProcedureClinicalDetails
      └─ if picklistEntry.hasFreeFlap → FreeFlapClinicalFields
          ├─ FreeFlapPicker
          │   └─ on flapType change → auto-sets flapSnomedCode (FLAP_SNOMED_MAP)
          ├─ [skinIsland toggle — gracilis/TUG/serratus/PAP/LD only]
          ├─ RecipientSiteSelector
          │   └─ on region change → auto-sets recipientSiteSnomedCode
          └─ AnastomosisEntryCard (×N)
              └─ vessels cascade from recipientSiteRegion
              └─ configuration picker for both artery AND vein (bug fixed)
```
