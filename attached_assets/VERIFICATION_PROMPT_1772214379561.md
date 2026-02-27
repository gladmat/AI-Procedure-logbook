# VERIFICATION PROMPT — Hand Surgery UX Overhaul

Run this after implementing the changes from `REPLIT_PROMPT.md` and `IMPLEMENTATION_SPEC.md`.

## Automated checks

### 1. TypeScript compilation
```bash
npx tsc --noEmit
```
Should complete with zero errors. If there are pre-existing errors, note them separately.

### 2. New file exists
```bash
ls -la client/lib/aoToDiagnosisMapping.ts
```
Should exist and contain the `AO_DIAGNOSIS_MAPPINGS` array and `resolveAOToDiagnosis` function.

### 3. Data integrity check
Run this verification script to ensure all AO mappings point to valid diagnoses:

```typescript
// Create as scripts/verifyAOMapping.ts and run with tsx
import { AO_DIAGNOSIS_MAPPINGS } from "../client/lib/aoToDiagnosisMapping";
import { getDiagnosisById } from "../client/lib/diagnosisPicklists/index";

let errors = 0;
for (const mapping of AO_DIAGNOSIS_MAPPINGS) {
  const dx = getDiagnosisById(mapping.diagnosisPicklistId);
  if (!dx) {
    console.error(`❌ AO family ${mapping.aoFamilyCode} (${mapping.boneName}) maps to missing diagnosis: ${mapping.diagnosisPicklistId}`);
    errors++;
  } else {
    console.log(`✅ AO ${mapping.aoFamilyCode} (${mapping.boneName}) → ${dx.displayName}`);
  }
  
  if (mapping.refinements) {
    for (const ref of mapping.refinements) {
      const refDx = getDiagnosisById(ref.overrideDiagnosisId);
      if (!refDx) {
        console.error(`❌ Refinement "${ref.description}" maps to missing diagnosis: ${ref.overrideDiagnosisId}`);
        errors++;
      }
    }
  }
  
  if (mapping.procedureHints) {
    for (const hint of mapping.procedureHints) {
      for (const procId of hint.promoteToDefault) {
        // Check procedure exists in procedurePicklist
        // (would need import of procedure lookup)
        console.log(`  Hint: ${hint.description} → promotes ${procId}`);
      }
    }
  }
}

console.log(`\n${errors === 0 ? '✅ All mappings valid' : `❌ ${errors} errors found`}`);
```

### 4. Clinical group assignments check
Verify the reclassifications were made:

```typescript
import { HAND_SURGERY_DIAGNOSES } from "../client/lib/diagnosisPicklists/handSurgeryDiagnoses";

// These should be "reconstructive", not "trauma"
const scaphoidNonunion = HAND_SURGERY_DIAGNOSES.find(d => d.id === "hand_dx_scaphoid_nonunion");
console.assert(scaphoidNonunion?.clinicalGroup === "reconstructive", 
  `❌ Scaphoid nonunion should be "reconstructive", got "${scaphoidNonunion?.clinicalGroup}"`);

const malunion = HAND_SURGERY_DIAGNOSES.find(d => d.id === "hand_dx_malunion");
console.assert(malunion?.clinicalGroup === "reconstructive",
  `❌ Malunion should be "reconstructive", got "${malunion?.clinicalGroup}"`);

// These should still be "trauma"
const ucl = HAND_SURGERY_DIAGNOSES.find(d => d.id === "hand_dx_ucl_thumb");
console.assert(ucl?.clinicalGroup === "trauma",
  `❌ UCL thumb should be "trauma", got "${ucl?.clinicalGroup}"`);

// Filtering check
const traumaDx = HAND_SURGERY_DIAGNOSES.filter(d => d.clinicalGroup === "trauma");
const electiveDx = HAND_SURGERY_DIAGNOSES.filter(d => d.clinicalGroup !== "trauma");
console.log(`Trauma diagnoses: ${traumaDx.length}`);
console.log(`Elective/other diagnoses: ${electiveDx.length}`);
console.log(`Total: ${HAND_SURGERY_DIAGNOSES.length}`);
```

### 5. New procedures exist
Check that the new procedure entries were added to `procedurePicklist.ts`:

```bash
grep -c "hand_fx_phalanx_crif_ccs\|hand_fx_phalanx_exfix\|hand_fx_metacarpal_crif_ccs\|hand_fx_metacarpal_exfix" client/lib/procedurePicklist.ts
```
Should return at least 4 matches (one definition per entry).

### 6. Phalanx fracture procedure suggestions include new options
```bash
grep -A 30 "hand_dx_phalanx_fracture" client/lib/diagnosisPicklists/handSurgeryDiagnoses.ts | grep "procedurePicklistId"
```
Should show at least 4 procedure suggestions including ORIF, CRIF (K-wire), CRIF (CCS), and exfix.

## Manual testing checklist

### Feature 1: Diagnosis Collapse

Open the app and navigate to Add Case → any specialty:

- [ ] Select a diagnosis from the picklist
- [ ] Verify the picklist collapses to a compact card showing diagnosis name + SNOMED code
- [ ] Verify the subcategory tabs, search field, and other diagnoses are hidden
- [ ] Tap the ✕ button — picker should re-expand
- [ ] Previously selected diagnosis should still be highlighted/checkmarked
- [ ] Re-select the same diagnosis — should collapse again
- [ ] Test with a SNOMED CT free-search diagnosis (type something unusual)
- [ ] Verify staging fields appear below the collapsed card when applicable
- [ ] Test across at least 3 different specialties (e.g., Burns, Breast, Hand)

### Feature 2: Procedure Filtering

- [ ] Select a diagnosis that has suggested procedures (e.g., "Phalangeal fracture")
- [ ] Verify ONLY the suggested procedures are shown (no subcategory tabs, no browse)
- [ ] Verify "Show all procedures" link appears below
- [ ] Tap "Show all procedures" — full picker should expand
- [ ] Select a procedure from the full picker — it should be added alongside suggestions
- [ ] Clear the diagnosis — full procedure picker should return
- [ ] Test with a diagnosis that has staging-conditional procedures (e.g., open fracture with Gustilo)
- [ ] Change staging → conditional procedures should activate/deactivate

### Feature 3: Trauma/Elective Branching

Navigate to Add Case → Hand Surgery:

**Case type selector:**
- [ ] Segmented control appears with "Trauma" / "Elective"
- [ ] Neither is pre-selected initially
- [ ] Selecting "Trauma" reveals AO classifier + injured structures
- [ ] Selecting "Elective" hides AO classifier + injured structures
- [ ] Switching from Trauma → Elective clears diagnosis and AO data

**Trauma pathway:**
- [ ] AO Classification section appears (collapsed by default)
- [ ] Tapping it expands the AO picker
- [ ] Classifying a phalanx fracture (e.g., 78.2.1.3C) auto-sets diagnosis to "Phalangeal fracture"
- [ ] Diagnosis card shows "Diagnosis set from AO" indicator
- [ ] Procedure suggestions show ORIF promoted as default for articular fractures
- [ ] Diagnosis picklist (if AO not used) shows only trauma diagnoses
- [ ] "Fractures", "Tendon Injuries", "Nerve Injuries", "Soft Tissue Injuries" tabs visible
- [ ] Compression Neuropathies, Dupuytren's tabs NOT visible

**Elective pathway:**
- [ ] Diagnosis picklist shows only elective/reconstructive diagnoses
- [ ] Scaphoid nonunion and Malunion appear here
- [ ] UCL thumb does NOT appear here
- [ ] "Compression Neuropathies", "Dupuytren's", "Joint & Degenerative" tabs visible
- [ ] "Fractures", "Tendon Injuries" tabs NOT visible (or only show non-trauma entries if any)
- [ ] No AO picker visible
- [ ] No Injured Structures visible

**AO-specific:**
- [ ] Metacarpal thumb base, partial articular → Bennett's fracture auto-selected
- [ ] Metacarpal thumb base, complete articular → Rolando's fracture auto-selected
- [ ] Metacarpal shaft simple → both K-wire and ORIF shown as default
- [ ] Phalanx articular (B or C) → ORIF promoted as default
- [ ] Phalanx shaft simple → K-wire promoted as default
- [ ] Clearing AO classification clears the auto-set diagnosis

**Regression testing:**
- [ ] Breast surgery cases work identically to before
- [ ] Burns cases work identically (with staging-conditional logic)
- [ ] Head & Neck cases work identically
- [ ] General cases with skin cancer staging work correctly
- [ ] Editing an existing hand surgery case loads with correct pathway selected
- [ ] Multi-diagnosis-group cases work correctly
- [ ] Procedure-first (reverse) entry flow still works
- [ ] Case draft save/restore works with new state
- [ ] Dashboard statistics not affected
