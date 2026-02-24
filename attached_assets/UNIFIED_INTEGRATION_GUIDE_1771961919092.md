# Unified Integration Guide — Diagnosis & Procedure Suggestion System

## Overview

This guide covers deploying **all** diagnosis-related files in one pass:

1. **Structured skin cancer diagnosis system** (from prior work)
2. **Diagnosis picklists with procedure suggestions** for 6 specialties
3. **New staging configurations** (Baker, Hurley, ISL, House-Brackmann)

After integration, the case entry flow becomes:

```
Specialty → Diagnosis (structured picklist OR SNOMED search)
         → Staging fields auto-appear (if applicable)
         → Procedures auto-suggested (defaults pre-checked, conditionals activate with staging)
         → Surgeon confirms / modifies
```

---

## Files to Copy

### A. Types (1 file)

```
client/types/diagnosis.ts
```

Shared types: `DiagnosisPicklistEntry`, `ProcedureSuggestion`, `EvaluatedSuggestion`, `StagingSelections`.

### B. Diagnosis Picklists (7 files)

```
client/lib/diagnosisPicklists/
├── index.ts                      ← Master index + lookup + search + evaluation engine
├── handSurgeryDiagnoses.ts       ← 43 diagnoses (Phase 1)
├── burnsDiagnoses.ts             ← 11 diagnoses (Phase 1)
├── bodyContouringDiagnoses.ts    ← 12 diagnoses (Phase 1)
├── breastDiagnoses.ts            ← 20 diagnoses (Phase 2)
├── aestheticsDiagnoses.ts        ← 18 diagnoses (Phase 2)
└── generalDiagnoses.ts           ← 18 diagnoses (Phase 2)
```

### C. Skin Cancer System (4 files — from prior delivery)

```
client/lib/skinCancerDiagnoses.ts         ← 9 cancer types, 19 SNOMED codes, OCR matching
client/lib/melanomaStaging.ts             ← AJCC 8th Edition staging engine
client/types/skinCancer.ts                ← EnhancedSkinLesionDetails interface
server/skinCancerStagingConfigs.ts        ← 5 staging configs (melanoma, BCC, SCC, Merkel, dysplastic)
```

### D. New Staging Configurations (1 file — merge into existing)

```
server/newStagingConfigs.ts
```

Contains Baker, Hurley, ISL, and House-Brackmann classifications to **merge into** the existing `server/diagnosisStagingConfig.ts`.

---

## What Each Specialty Gets

| Specialty | Diagnoses | Procedure Suggestions | Conditional | Staging Systems |
|---|---|---|---|---|
| Hand Surgery | 43 | 70 | 1 | Tubiana (existing), Quinnell (existing), CTS severity (existing) |
| Burns | 11 | 46 | 14 | Depth + TBSA% (existing) |
| Body Contouring | 12 | 23 | 0 | — |
| Breast | 20 | 42 | 2 | Baker (**NEW**), TNM (existing) |
| Aesthetics | 18 | 30 | 0 | — |
| General | 18 | 36 | 7 | NPUAP (existing), Hurley (**NEW**), ISL (**NEW**) |
| **TOTAL** | **122** | **247** | **24** | |

Plus the skin cancer system adds 9 structured cancer types with AJCC staging, OCR auto-matching, and histological subtype capture.

Head & Neck and Orthoplastic (Phase 3) are stubbed in the index — `hasDiagnosisPicklist()` returns `false` for those, so they fall through to the existing SNOMED search.

---

## Integration Steps

### Step 1: Copy All New Files

Drop the files into the project matching the paths above. No existing files are overwritten.

### Step 2: Merge Staging Configs

Open `server/diagnosisStagingConfig.ts` and add the 4 new staging systems from `server/newStagingConfigs.ts`:

```typescript
// ADD to the staging systems registry (however your existing config is structured):

// Baker Classification — for capsular contracture
// Hurley Stage — for hidradenitis suppurativa
// ISL Stage — for lymphoedema
// House-Brackmann Grade — for facial nerve palsy (Phase 3 prep)
```

The staging system `name` fields must match exactly what the diagnosis files reference in `conditionStagingMatch.stagingSystemName`:

- `"Baker Classification"` — used by `breast_dx_capsular_contracture`
- `"Hurley Stage"` — used by `gen_dx_hidradenitis`
- `"ISL Stage"` — used by `gen_dx_lymphoedema`
- `"Depth"` — used by burns diagnoses (already exists)
- `"TBSA %"` — used by burns diagnoses (already exists)
- `"NPUAP Stage"` — used by pressure injury diagnoses (already exists)
- `"Tubiana Stage"` — used by Dupuytren diagnosis (already exists)
- `"House-Brackmann Grade"` — Phase 3 prep (not yet referenced)

### Step 3: Add Diagnosis Picker to Case Form

In `client/screens/CaseFormScreen.tsx`, add the diagnosis picker **above** the procedure section.

**Imports:**

```tsx
import {
  hasDiagnosisPicklist,
  getDiagnosesForSpecialty,
  getDiagnosisSubcategories,
  getDiagnosesForSubcategory,
  searchDiagnoses,
  evaluateSuggestions,
  getActiveProcedureIds,
  findDiagnosisById,
} from "@/lib/diagnosisPicklists";
import type { DiagnosisPicklistEntry, StagingSelections } from "@/types/diagnosis";
```

**State:**

```tsx
const [selectedDiagnosis, setSelectedDiagnosis] = useState<DiagnosisPicklistEntry | null>(null);
const [diagnosisSearchQuery, setDiagnosisSearchQuery] = useState("");
const [stagingSelections, setStagingSelections] = useState<StagingSelections>({});
```

**Core handler — when a diagnosis is selected:**

```tsx
function handleDiagnosisSelect(dx: DiagnosisPicklistEntry) {
  setSelectedDiagnosis(dx);
  setDiagnosisSearchQuery(""); // clear search

  // 1. Set diagnosis fields on case
  setCaseData((prev) => ({
    ...prev,
    finalDiagnosis: dx.displayName,
    finalDiagnosisSnomedCode: dx.snomedCtCode,
    finalDiagnosisSnomedDisplay: dx.snomedCtDisplay,
    diagnosisPicklistId: dx.id,
  }));

  // 2. Auto-populate default procedures
  const activeIds = getActiveProcedureIds(dx, {});
  autoPopulateProcedures(activeIds);
}
```

**When staging changes — re-evaluate conditionals:**

```tsx
function handleStagingChange(systemName: string, value: string) {
  const newSelections = { ...stagingSelections, [systemName]: value };
  setStagingSelections(newSelections);

  if (selectedDiagnosis) {
    const activeIds = getActiveProcedureIds(selectedDiagnosis, newSelections);
    autoPopulateProcedures(activeIds);
  }
}
```

### Step 4: Render Procedure Suggestions as Chips

Below staging fields, render evaluated suggestions:

```tsx
{selectedDiagnosis && (
  <View>
    <SectionHeader title="Suggested Procedures" />
    {evaluateSuggestions(selectedDiagnosis, stagingSelections).map((sug) => {
      const isConditionalInactive = sug.isConditional && !sug.isActive;
      const isSelected = caseData.procedures?.some(
        (p) => p.picklistId === sug.procedurePicklistId
      );

      return (
        <TouchableOpacity
          key={sug.procedurePicklistId}
          onPress={() => toggleProcedureSuggestion(sug)}
          disabled={isConditionalInactive}
          style={[
            styles.chip,
            isSelected && styles.chipSelected,
            isConditionalInactive && styles.chipDisabled,
          ]}
        >
          <Text>{isSelected ? "✓ " : ""}{sug.displayName}</Text>
          {sug.isConditional && sug.conditionDescription && (
            <Text style={styles.conditionHint}>{sug.conditionDescription}</Text>
          )}
        </TouchableOpacity>
      );
    })}
  </View>
)}
```

### Step 5: Wire Skin Cancer System

The skin cancer diagnoses (`client/lib/skinCancerDiagnoses.ts`) work alongside the general diagnosis picklist. For the `general` specialty, the flow is:

1. If the case involves a skin lesion → enhanced skin cancer picker (histology, subtype, OCR matching)
2. If the case involves a non-skin-cancer diagnosis → diagnosis picklist (from `generalDiagnoses.ts`)

Both paths end at the same procedure suggestion system.

For skin cancers specifically, the `melanomaStaging.ts` engine handles AJCC 8th Edition staging, which can feed into the same `handleStagingChange()` pipeline for conditional procedure logic (e.g., melanoma >1mm → SLNB suggested).

### Step 6: Update Case Type

In `client/types/case.ts`, add optional fields:

```typescript
// ADD to the Case interface (all optional — backward compatible)
diagnosisPicklistId?: string;
diagnosisStagingSelections?: Record<string, string>;
procedureSuggestionSource?: "picklist" | "skinCancer" | "manual";
```

### Step 7: AI Smart Capture Integration

The AI-parsed operation note can now auto-match diagnoses:

```typescript
import { searchDiagnoses } from "@/lib/diagnosisPicklists";
import { findMatchingSkinCancerDiagnosis } from "@/lib/skinCancerDiagnoses";

function matchExtractedDiagnosis(extractedText: string, specialty: Specialty) {
  // Try skin cancer match first (for general / head_neck)
  const skinCancerMatch = findMatchingSkinCancerDiagnosis(extractedText);
  if (skinCancerMatch) return { type: "skinCancer", match: skinCancerMatch };

  // Then try structured picklist
  const picklistMatches = searchDiagnoses(extractedText, specialty, 1);
  if (picklistMatches.length > 0) return { type: "picklist", match: picklistMatches[0] };

  // Fallback: free SNOMED search
  return { type: "freeText", match: null };
}
```

---

## Staging-Conditional Logic Examples

### Burns: Depth → Procedure

```
Thermal burn + Depth: "Superficial"     → wound dressing only
Thermal burn + Depth: "Deep partial"    → + tangential excision + STSG
Thermal burn + Depth: "Full thickness"  → + fascial excision + dermal substitute
Thermal burn + TBSA: ">50%"             → + Meek + xenograft + CEA
```

### Breast: Baker Grade → Capsulectomy Type

```
Capsular contracture + Baker II–III  → capsulotomy option activates
Capsular contracture + Baker IV      → en bloc capsulectomy activates
```

### Pressure Injury: NPUAP → Flap Coverage

```
Sacral PI + Stage 1–2    → debridement + NPWT only
Sacral PI + Stage 3–4    → + sacral flap closure activates
```

### Lymphoedema: ISL Stage → Procedure Escalation

```
Lymphoedema + ISL I          → LVA (default), VLNT available
Lymphoedema + ISL II/IIb     → + liposuction activates
Lymphoedema + ISL III        → + debulking/Charles activates
```

### Hidradenitis: Hurley → Extent of Surgery

```
HS + Hurley I–II   → deroofing default, site-specific excision available
HS + Hurley III    → + STSG coverage activates (wide excision)
```

### Dupuytren: Tubiana → Radical Fasciectomy

```
Dupuytren + Tubiana 1–2  → limited fasciectomy default
Dupuytren + Tubiana 3–4  → + radical fasciectomy activates
```

---

## What Stays Unchanged

- **Procedure picklist** (`procedurePicklist.ts`) — completely untouched. Diagnosis suggestions reference procedure IDs only.
- **Existing staging configs** — Burns Depth/TBSA, NPUAP, Tubiana, Quinnell, CTS severity/EMG all stay as-is. Only new configs are added.
- **Free SNOMED search** — still available as fallback for any diagnosis not in the picklist.
- **Manual procedure selection** — surgeon can always override suggestions.
- **Existing case data** — all new fields are optional. Old cases display normally.
- **Ontoserver integration** — used for Tier 2 free SNOMED search when picklist doesn't cover the diagnosis.

---

## Testing Checklist

### Hand Surgery
- [ ] "Distal radius fracture" → ORIF default, CRIF available
- [ ] "Carpal tunnel syndrome" → staging appears, CTR open default
- [ ] "Dupuytren's" → Tubiana staging; at 3–4 radical fasciectomy activates
- [ ] Type "CTS" → carpal tunnel via synonym
- [ ] "Fingertip injury" → V-Y default + cross-finger + Moberg + graft

### Burns
- [ ] "Thermal burn" → Depth + TBSA staging
- [ ] Depth = "Superficial" → wound dressing only
- [ ] Depth = "Deep partial" → tangential excision + STSG activate
- [ ] Depth = "Full thickness" → fascial excision + dermal substitute activate
- [ ] TBSA = ">50%" → Meek + xenograft + CEA activate
- [ ] "Electrical burn" → fasciotomy default

### Body Contouring
- [ ] "Abdominal excess" → full abdominoplasty default + variants
- [ ] "Post-bariatric trunk" → circumferential body lift default

### Breast
- [ ] "Breast cancer invasive" → SSM default + NSM + DIEP + expander options
- [ ] "Capsular contracture" → Baker staging; Baker IV → en bloc activates
- [ ] "BIA-ALCL" → en bloc + removal both default
- [ ] "Macromastia" → Wise reduction default + vertical + superomedial

### Aesthetics
- [ ] "Facial ageing lower" → SMAS facelift default + deep plane + mini
- [ ] "Dynamic wrinkles" → Botox upper face default
- [ ] "Prominent ears" → otoplasty default
- [ ] Type "Botox" → dynamic wrinkles via synonym

### General
- [ ] "Lipoma" → lipoma excision default
- [ ] "Sacral pressure injury" → NPUAP staging; Stage 3–4 → sacral flap activates
- [ ] "Hidradenitis" → Hurley staging; Hurley III → STSG activates
- [ ] "Lymphoedema" → ISL staging; ISL III → debulking activates
- [ ] "Keloid" → steroid injection default (not scar revision)

### Skin Cancer (from prior work)
- [ ] BCC → structured histology picker + SNOMED auto-mapping
- [ ] Melanoma → AJCC 8th staging engine → SLNB suggestion if >1mm

### Cross-cutting
- [ ] Head & Neck → `hasDiagnosisPicklist()` returns false → falls to SNOMED search
- [ ] Orthoplastic → same fallback behaviour
- [ ] Old cases without `diagnosisPicklistId` display normally
- [ ] Free SNOMED search accessible from all specialties
- [ ] Manually added procedures not removed when diagnosis changes

---

## Phase 3 (Future)

When ready:

1. Create `headNeckDiagnoses.ts` (~25 diagnoses) — House-Brackmann staging already prepped
2. Create `orthoplasticDiagnoses.ts` (~14 diagnoses) — add Wagner classification for diabetic foot
3. Uncomment the imports and SPECIALTY_MAP entries in `index.ts`
4. Add Wagner classification to `diagnosisStagingConfig.ts`

Estimated effort: ~2 hours per specialty file.
