# Hand Surgery UX Overhaul — Implementation Spec

## Overview

Three interconnected improvements to the Hand Surgery case entry flow:

1. **Collapse diagnosis list after selection** — hide the full picklist once a diagnosis is chosen
2. **Strict procedure filtering** — only show procedures suggested for the selected diagnosis
3. **Trauma/Elective branching** — split hand surgery into two pathways with optional AO classifier

All changes are **Hand Surgery only** (specialty === "hand_surgery"). Other specialties continue working exactly as before.

---

## Feature 1: Collapse Diagnosis After Selection

### Current behavior
When the surgeon selects a diagnosis from the picklist, the full list remains visible with the selected item highlighted (blue border + checkmark). The subcategory tabs, search field, and all other diagnosis options stay on screen.

### New behavior
Once a diagnosis is selected:
- **Hide**: subcategory tabs, search field, all unselected diagnosis items, and the "Search all SNOMED diagnoses" fallback
- **Show**: a compact "selected diagnosis card" displaying:
  - Diagnosis displayName
  - SNOMED CT code (subtle, smaller text)
  - An ✕ button (or "Change" link) to clear the selection and re-expand the full picker
- When the user taps ✕/Change, the full picker re-expands with the previously selected item still highlighted for context

### Implementation notes
- This is a UI state change in `DiagnosisPicker.tsx` (or wherever the diagnosis list is rendered within `DiagnosisGroupEditor.tsx`)
- Add a state variable: `isDiagnosisCollapsed: boolean` — set to `true` when a diagnosis is selected, `false` when cleared
- When collapsed, render only the `SelectedDiagnosisCard` component
- **Applies to ALL specialties**, not just hand surgery (it's a general UX improvement)
- Make sure the SNOMED CT free-search diagnosis also collapses when selected (Tier 2 diagnoses)

### Component: SelectedDiagnosisCard
```tsx
// Compact card shown when diagnosis is selected and picklist is collapsed
<View style={styles.selectedDiagnosisCard}>
  <View style={styles.selectedDiagnosisInfo}>
    <ThemedText style={styles.selectedDiagnosisName}>
      {diagnosis.displayName}
    </ThemedText>
    <ThemedText style={styles.selectedDiagnosisSnomedCode}>
      SNOMED CT: {diagnosis.snomedCtCode}
    </ThemedText>
  </View>
  <Pressable onPress={onClearDiagnosis}>
    <Feather name="x-circle" size={20} color={theme.textSecondary} />
  </Pressable>
</View>
```

---

## Feature 2: Strict Procedure Filtering

### Current behavior
After a diagnosis is selected, "Suggested Procedures" appear as chips (from `evaluateSuggestions()`). But the full procedure picker/subcategory browser is also available, showing ALL procedures for the specialty.

### New behavior
When a diagnosis is selected AND that diagnosis has `suggestedProcedures.length > 0`:
- **Only show** the suggested procedures for that diagnosis
- **Hide** the full procedure picker (subcategory tabs, search, browse)
- Add a "Show all procedures" expandable link at the bottom for edge cases
- When "Show all procedures" is tapped, expand the full procedure picker below the suggestions

When a diagnosis is selected but has `suggestedProcedures.length === 0` (rare, Tier 2 diagnoses):
- Show the full procedure picker as before (no filtering)

### Procedure display within the filtered view
- Show suggested procedures as tappable cards (not just chips), each showing:
  - Procedure name
  - Filled circle (●) if active/default, empty circle (○) if available but not selected
  - Any conditional status text (e.g., "For Gustilo IIIb/IIIc")
- The surgeon taps to toggle selection on/off
- No subcategory tabs or search needed in this filtered view — the list is short enough (1-6 items typically)

### Adding procedures not in suggestions
- "Show all procedures" link expands the full picker
- Any procedure added from the full picker gets appended to the procedure list alongside the suggested ones
- The "Show all procedures" link can also serve as an escape hatch for unusual cases

### Implementation notes
- Modify the procedure section in `DiagnosisGroupEditor.tsx`
- The existing `evaluateSuggestions()` function already returns the right data
- Add state: `showAllProcedures: boolean` — defaults to `false`, toggled by the link
- When `false` AND diagnosis has suggestions: render only `ProcedureSuggestionCards`
- When `true` OR no suggestions: render the full procedure picker

---

## Feature 3: Trauma/Elective Branching (Hand Surgery Only)

### Concept
Add a binary selector at the top of the hand surgery form that splits the workflow:

**Trauma pathway:**
- Optional AO fracture classifier
- Injured structures picker (existing component)
- Diagnosis auto-resolved from AO (if used) or from filtered trauma-only diagnosis picklist
- Procedures tightly filtered

**Elective pathway:**
- Diagnosis picklist showing only elective/oncological/reconstructive diagnoses
- No AO classifier, no injured structures picker
- Standard procedure suggestions

### UI Flow

#### Step 1: Case Type Selector
Immediately after specialty is confirmed as "Hand Surgery", show:
```
Case Type *
[  🔴 Trauma  ] [  🔵 Elective  ]
```
- Styled as a segmented control (matching the existing urgency selector style)
- Neither is pre-selected — surgeon must choose
- This determines which UI elements appear below

#### Step 2a: Trauma Pathway

**Show these elements in order:**
1. **AO Fracture Classification** (optional, collapsible)
   - Header: "AO Classification (optional)"
   - Collapsed by default, with a tap-to-expand control
   - When expanded, shows the existing AO picker (bone → segment → type)
   - When an AO code is completed:
     a. Auto-resolve to a diagnosis using `resolveAOToDiagnosis()` from `aoToDiagnosisMapping.ts`
     b. Set the diagnosis automatically (with the collapsed card from Feature 1)
     c. Apply any procedure hints to modify default selections
     d. Show a small label: "Diagnosis set from AO: [Phalangeal fracture]" on the collapsed card
   - If the surgeon clears the AO classification, clear the auto-set diagnosis too

2. **Injured Structures** (existing component, already shown for hand trauma)
   - Affected digits, Flexor Tendons, Extensor Tendons, Nerves, Arteries, Ligaments

3. **Diagnosis** (conditionally shown)
   - If already set by AO → show collapsed card (Feature 1)
   - If NOT set by AO → show diagnosis picker filtered to `clinicalGroup === "trauma"` only
   - Subcategory tabs: only "Fractures", "Tendon Injuries", "Nerve Injuries", "Soft Tissue Injuries", "Vascular"
   - The diagnosis picklist data already has `clinicalGroup` on every entry, so filtering is straightforward

4. **Suggested Procedures** (Feature 2 applies — only show matching procedures)

5. **Auto-set urgency tag** → When trauma is selected, auto-set the case tag to "Trauma" (the tag selector from image 3)

#### Step 2b: Elective Pathway

**Show these elements in order:**
1. **Diagnosis** — picklist filtered to `clinicalGroup !== "trauma"` 
   - Shows: "Compression Neuropathies", "Dupuytren's", "Joint & Degenerative", "Tendon (Elective)", "Other / Tumours"
   - Includes the "Post-traumatic Reconstruction" subcategory:
     - Scaphoid nonunion (clinicalGroup: "elective" or "reconstructive")
     - Malunion of hand/wrist
     - Corrective osteotomy indications
     - Tenolysis
     - Secondary nerve reconstruction
   - NO injured structures picker
   - NO AO classifier

2. **Suggested Procedures** (Feature 2 applies)

3. **Auto-set urgency tag** → Default to "Elective" (can be changed to "Revision" etc.)

### Data changes needed

#### Reclassify some diagnoses
Check `handSurgeryDiagnoses.ts` — some diagnoses that are currently `clinicalGroup: "trauma"` may need updating:

- `hand_dx_scaphoid_nonunion` → should be `"reconstructive"` (it's elective surgery for old trauma)
- `hand_dx_malunion` → should be `"reconstructive"`
- `hand_dx_ucl_thumb` → stays `"trauma"` (acute injury, even though some are subacute)

#### Add missing diagnosis for the AO mapper
The AO mapper references `hand_dx_carpal_fracture_other` and `hand_dx_crush_injury` which may not exist yet. Add these if missing:

```typescript
// Add to handSurgeryDiagnoses.ts if not present:
{
  id: "hand_dx_carpal_fracture_other",
  displayName: "Carpal fracture (other than scaphoid)",
  shortName: "Other carpal #",
  snomedCtCode: "33173003", // Fracture of carpal bone (disorder)
  snomedCtDisplay: "Fracture of carpal bone (disorder)",
  specialty: "hand_surgery",
  subcategory: "Fractures",
  clinicalGroup: "trauma",
  hasStaging: false,
  searchSynonyms: ["lunate", "capitate", "hamate", "trapezium", "triquetrum", "pisiform"],
  suggestedProcedures: [
    {
      procedurePicklistId: "hand_fx_carpal_orif",  // May need new procedure entry
      displayName: "Carpal fracture ORIF",
      isDefault: true,
      sortOrder: 1,
    },
    {
      procedurePicklistId: "hand_fx_carpal_crif",
      displayName: "Carpal fracture CRIF (K-wires)",
      isDefault: false,
      sortOrder: 2,
    },
  ],
  sortOrder: 10,
}
```

#### Add missing procedure entries
For the phalanx fracture, add CCS (headless compression screw) and external fixator options. Check if these exist in `procedurePicklist.ts`:

```typescript
// Add to HAND_FRACTURE_FIXATION in procedurePicklist.ts if not present:
{
  id: "hand_fx_phalanx_crif_ccs",
  displayName: "Phalangeal fracture CRIF (headless compression screw)",
  snomedCtCode: "VERIFY",
  snomedCtDisplay: "Closed reduction of fracture of phalanx with internal fixation using compression screw (procedure)",
  specialties: ["hand_surgery"],
  subcategory: "Fracture & Joint Fixation",
  tags: ["trauma"],
  sortOrder: 3,
},
{
  id: "hand_fx_phalanx_exfix",
  displayName: "Phalangeal fracture external fixation",
  snomedCtCode: "VERIFY",
  snomedCtDisplay: "Application of external fixation to phalanx (procedure)",
  specialties: ["hand_surgery"],
  subcategory: "Fracture & Joint Fixation",
  tags: ["trauma"],
  sortOrder: 4,
},
```

Then update `hand_dx_phalanx_fracture` in `handSurgeryDiagnoses.ts` to include these in suggestedProcedures:

```typescript
suggestedProcedures: [
  { procedurePicklistId: "hand_fx_phalanx_orif", displayName: "Phalangeal fracture ORIF", isDefault: true, sortOrder: 1 },
  { procedurePicklistId: "hand_fx_phalanx_crif", displayName: "Phalangeal fracture CRIF (K-wires)", isDefault: false, sortOrder: 2 },
  { procedurePicklistId: "hand_fx_phalanx_crif_ccs", displayName: "Phalangeal fracture CRIF (headless compression screw)", isDefault: false, sortOrder: 3 },
  { procedurePicklistId: "hand_fx_phalanx_exfix", displayName: "Phalangeal fracture external fixation", isDefault: false, sortOrder: 4 },
],
```

Similarly for other fracture types — add CCS and exfix options where clinically appropriate.

### New file: `aoToDiagnosisMapping.ts`

**Copy the file provided at `/home/claude/aoToDiagnosisMapping.ts` to `client/lib/aoToDiagnosisMapping.ts`**

This contains:
- `AO_DIAGNOSIS_MAPPINGS` — maps each AO familyCode to a diagnosis picklist ID
- `resolveAOToDiagnosis()` — given AO params, returns the diagnosis ID + procedure hints
- `applyProcedureHints()` — modifies suggestion defaults based on AO classification
- `getAOMappableDiagnosisIds()` — lists all diagnoses the AO picker can auto-set

### State management in DiagnosisGroupEditor

Add to the group state (or local component state):

```typescript
// New state for hand surgery branching
const [handCaseType, setHandCaseType] = useState<"trauma" | "elective" | null>(null);
const [aoClassification, setAoClassification] = useState<AOFractureEntry | null>(null);
const [isDiagnosisFromAO, setIsDiagnosisFromAO] = useState(false);
const [showAllProcedures, setShowAllProcedures] = useState(false);
const [isDiagnosisCollapsed, setIsDiagnosisCollapsed] = useState(false);
```

### Conditional rendering logic

```tsx
// In DiagnosisGroupEditor render:

{/* HAND SURGERY ONLY: Case type selector */}
{specialty === "hand_surgery" && (
  <HandCaseTypeSelector
    value={handCaseType}
    onChange={(type) => {
      setHandCaseType(type);
      // Clear diagnosis if switching between trauma/elective
      clearDiagnosis();
      setAoClassification(null);
      setIsDiagnosisFromAO(false);
      // Auto-set urgency tag
      if (type === "trauma") setUrgencyTag("trauma");
      if (type === "elective") setUrgencyTag("elective");
    }}
  />
)}

{/* TRAUMA PATH: Optional AO + Injured Structures */}
{specialty === "hand_surgery" && handCaseType === "trauma" && (
  <>
    <AOClassificationSection
      collapsed={!!aoClassification}
      value={aoClassification}
      onChange={(aoEntry) => {
        setAoClassification(aoEntry);
        if (aoEntry) {
          const result = resolveAOToDiagnosis(aoEntry);
          if (result) {
            const dx = getDiagnosisById(result.diagnosisPicklistId);
            if (dx) {
              setDiagnosis(dx);
              setIsDiagnosisFromAO(true);
              setIsDiagnosisCollapsed(true);
              // Apply procedure hints...
            }
          }
        } else {
          if (isDiagnosisFromAO) {
            clearDiagnosis();
            setIsDiagnosisFromAO(false);
          }
        }
      }}
    />
    <InjuredStructuresSection />
  </>
)}

{/* DIAGNOSIS PICKER (filtered by case type for hand surgery) */}
{isDiagnosisCollapsed && selectedDiagnosis ? (
  <SelectedDiagnosisCard
    diagnosis={selectedDiagnosis}
    isFromAO={isDiagnosisFromAO}
    onClear={() => {
      setIsDiagnosisCollapsed(false);
      if (isDiagnosisFromAO) {
        // Don't clear AO, just allow re-picking diagnosis manually
        setIsDiagnosisFromAO(false);
      }
    }}
  />
) : (
  <DiagnosisPicker
    specialty={specialty}
    clinicalGroupFilter={
      specialty === "hand_surgery" && handCaseType === "trauma" ? "trauma" :
      specialty === "hand_surgery" && handCaseType === "elective" ? "non-trauma" :
      undefined // No filter for non-hand specialties
    }
    // ... existing props
  />
)}

{/* PROCEDURES: filtered by diagnosis suggestions */}
{selectedDiagnosis && (
  <>
    <ProcedureSuggestionCards
      diagnosis={selectedDiagnosis}
      stagingSelections={stagingSelections}
      aoHints={isDiagnosisFromAO ? aoHints : []}
      selectedProcedureIds={selectedProcedureIds}
      onToggle={handleToggleProcedure}
    />
    {!showAllProcedures && selectedDiagnosis.suggestedProcedures.length > 0 && (
      <Pressable onPress={() => setShowAllProcedures(true)}>
        <ThemedText style={styles.showAllLink}>
          Show all procedures
        </ThemedText>
      </Pressable>
    )}
    {showAllProcedures && (
      <FullProcedurePicker /> // Existing full picker
    )}
  </>
)}
```

---

## Diagnosis Filtering in DiagnosisPicker

Add a new prop to `DiagnosisPicker` (or the equivalent component):

```typescript
interface DiagnosisPickerProps {
  // ... existing props
  
  /**
   * Filter diagnoses by clinical group.
   * - "trauma": only clinicalGroup === "trauma"
   * - "non-trauma": clinicalGroup !== "trauma" (elective, oncological, reconstructive, congenital)
   * - undefined: no filter (all diagnoses shown)
   */
  clinicalGroupFilter?: "trauma" | "non-trauma";
}
```

In the filtering logic:
```typescript
const filteredDiagnoses = allDiagnoses.filter(dx => {
  if (!clinicalGroupFilter) return true;
  if (clinicalGroupFilter === "trauma") return dx.clinicalGroup === "trauma";
  if (clinicalGroupFilter === "non-trauma") return dx.clinicalGroup !== "trauma";
  return true;
});
```

This also affects which subcategory tabs are shown — only tabs with at least one matching diagnosis should appear.

---

## What NOT to change

- **Other specialties**: No changes to any specialty except hand_surgery for Feature 3. Features 1 and 2 apply to all specialties.
- **Data model / schema**: No database changes needed. All new state is UI-only.
- **Existing components**: The AO picker component, injured structures picker, staging system — all continue working as-is.
- **Procedure-first flow**: The reverse entry flow (pick procedure → suggest diagnosis) should continue working. If the surgeon uses procedure-first entry, the case type selector can be skipped.
- **Multi-group cases**: The case type selector is per diagnosis group, not per case. A polytrauma case with multiple groups can have different types.

---

## Files to modify

| File | Changes |
|------|---------|
| `client/components/DiagnosisGroupEditor.tsx` | Add case type selector, AO integration, collapse state, procedure filtering |
| `client/components/DiagnosisPicker.tsx` | Add `clinicalGroupFilter` prop, collapse behavior |
| `client/components/ProcedureSuggestions.tsx` | Update to show as tappable cards, support "Show all" toggle |
| `client/lib/diagnosisPicklists/handSurgeryDiagnoses.ts` | Reclassify scaphoid nonunion/malunion, add missing diagnoses |
| `client/lib/procedurePicklist.ts` | Add CCS and exfix procedure entries |

## New files to create

| File | Purpose |
|------|---------|
| `client/lib/aoToDiagnosisMapping.ts` | AO → Diagnosis auto-resolution engine (provided) |
| `client/components/SelectedDiagnosisCard.tsx` | Compact card for collapsed diagnosis display |
| `client/components/HandCaseTypeSelector.tsx` | Trauma/Elective segmented control |

---

## Edge Cases to Handle

1. **User switches from Trauma → Elective after selecting a diagnosis**: Clear the diagnosis, AO classification, and injured structures. Ask for confirmation if data would be lost.
2. **AO sets diagnosis, then user clears it manually**: Keep AO classification visible but allow manual diagnosis re-pick.
3. **Procedure-first entry**: If the surgeon adds a procedure before selecting a diagnosis, skip the case type selector requirement. The reverse-diagnosis suggestion system should still work.
4. **Non-hand specialties**: Features 1 and 2 apply to all. Feature 3 is hand-surgery only. Ensure no regressions.
5. **Editing existing cases**: When loading a saved case, set the UI state appropriately (e.g., if the case has `clinicalGroup: "trauma"` diagnosis, auto-select Trauma pathway).

---

## Verification Checklist

### Feature 1: Diagnosis Collapse
- [ ] Selecting a diagnosis collapses the picklist to a compact card
- [ ] Card shows diagnosis name and SNOMED code
- [ ] ✕ button re-expands the full picker
- [ ] Previously selected item is highlighted when re-expanded
- [ ] Works for all 8 specialties
- [ ] Works for SNOMED CT free-search (Tier 2) diagnoses
- [ ] Staging fields still appear below the collapsed card

### Feature 2: Procedure Filtering
- [ ] After selecting a diagnosis with suggestions, only suggested procedures are shown
- [ ] "Show all procedures" link appears and works
- [ ] Toggling a suggested procedure on/off works correctly
- [ ] Conditional procedures show their condition text
- [ ] Works correctly with staging-conditional activation
- [ ] Adding a procedure from "Show all" appends it to the list
- [ ] No regression: cases with no diagnosis still show full procedure picker

### Feature 3: Trauma/Elective Branching
- [ ] Case type selector appears only for hand surgery
- [ ] Selecting "Trauma" shows AO + Injured Structures + filtered diagnosis
- [ ] Selecting "Elective" shows only elective diagnoses, no AO/injured structures
- [ ] AO classification correctly auto-resolves to diagnosis
- [ ] AO procedure hints modify default selections
- [ ] Switching case type clears diagnosis appropriately
- [ ] Urgency tag auto-sets based on case type
- [ ] Scaphoid nonunion, malunion appear in Elective pathway
- [ ] UCL thumb injury appears in Trauma pathway
- [ ] New CCS and exfix procedures appear for phalanx fractures
- [ ] Existing cases load correctly with appropriate pathway selected
- [ ] Other specialties are completely unaffected
