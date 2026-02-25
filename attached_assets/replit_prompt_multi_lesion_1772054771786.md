# Replit Agent Prompt: Multi-Lesion Session Feature

## Context

Implementing multi-lesion support so surgeons can log 3-6 skin lesion excisions from one operative session as discrete, auditable entries within a single case. This is a two-part change: data model extension + UI wiring.

A new component (`MultiLesionEditor.tsx`) has already been manually added to `client/components/`. Your job is to:

1. Extend the data model (`client/types/case.ts`)
2. Wire `MultiLesionEditor` into `DiagnosisGroupEditor.tsx`
3. Add helper functions for stats/export pipeline

Do **not** modify `MultiLesionEditor.tsx` — it is complete.

---

## Step 1 — Extend `client/types/case.ts`

### 1a. Add these new types near the existing `SkinLesionExcisionDetails` interface (around line 660):

```typescript
// ─── Multi-Lesion Session Types ─────────────────────────────────────────────

export type LesionPathologyType = "bcc" | "scc" | "melanoma" | "benign" | "other";

export type LesionReconstruction =
  | "primary_closure"
  | "local_flap"
  | "skin_graft"
  | "secondary_healing"
  | "other";

export interface LesionInstance {
  /** Unique ID for React key and update targeting */
  id: string;
  /** Free-text anatomical site, e.g. "Right temple", "Dorsal hand" */
  site: string;
  /** Quick-pick pathology type */
  pathologyType?: LesionPathologyType;
  /** Picklist ID from procedurePicklist.ts, if linked */
  procedurePicklistId?: string;
  /** Display name of excision procedure */
  procedureName?: string;
  /** Reconstruction method */
  reconstruction?: LesionReconstruction;
  /** Lesion dimensions */
  lengthMm?: number;
  widthMm?: number;
  /** Peripheral (lateral) excision margin in mm */
  peripheralMarginMm?: number;
  /** Deep margin in mm */
  deepMarginMm?: number;
  /** Margin status from histology */
  marginStatus?: "clear" | "involved" | "pending";
  /** Whether histology has been entered for this lesion */
  histologyConfirmed?: boolean;
  /** Post-coordinated SNOMED CT site modifier */
  snomedSiteCode?: string;
  snomedSiteDisplay?: string;
}
```

### 1b. Extend the `DiagnosisGroup` interface

Find the `DiagnosisGroup` interface (currently ends around line 730) and add two new optional fields at the end, before the closing `}`:

```typescript
  /** Whether this group is logging multiple lesion excisions in one session */
  isMultiLesion?: boolean;
  /** Individual lesion instances — only populated when isMultiLesion is true */
  lesionInstances?: LesionInstance[];
```

### 1c. Add helper functions at the bottom of `case.ts`, alongside the existing `getAllProcedures`, `getCaseSpecialties`, and `getPrimaryDiagnosisName` helpers:

```typescript
/** Returns all lesion instances across all diagnosis groups in a case */
export function getAllLesionInstances(c: Case): LesionInstance[] {
  return c.diagnosisGroups.flatMap(g => g.lesionInstances ?? []);
}

/** Total count of discrete excisions (lesion instances + procedures not in multi-lesion groups) */
export function getExcisionCount(c: Case): number {
  const lesionCount = getAllLesionInstances(c).length;
  const nonLesionProcedures = c.diagnosisGroups
    .filter(g => !g.isMultiLesion)
    .flatMap(g => g.procedures).length;
  return lesionCount + nonLesionProcedures;
}
```

---

## Step 2 — Wire `MultiLesionEditor` into `DiagnosisGroupEditor.tsx`

### 2a. Add import at the top of `DiagnosisGroupEditor.tsx`

Add these imports alongside the existing imports:

```typescript
import { MultiLesionEditor } from "@/components/MultiLesionEditor";
import type { LesionInstance, LesionPathologyType } from "@/types/case";
```

### 2b. Add state variables

Inside `DiagnosisGroupEditor`, alongside the existing `useState` declarations, add:

```typescript
const [isMultiLesion, setIsMultiLesion] = useState<boolean>(group.isMultiLesion ?? false);
const [lesionInstances, setLesionInstances] = useState<LesionInstance[]>(group.lesionInstances ?? []);
```

### 2c. Include `isMultiLesion` and `lesionInstances` in the assembled group

Find the `assembled: DiagnosisGroup` object construction inside the `useEffect` that assembles and calls `onChangeRef.current(assembled)`. Add these two fields to the assembled object:

```typescript
isMultiLesion,
lesionInstances: isMultiLesion ? lesionInstances : undefined,
```

The assembled object block should end up including all the existing fields plus these two new ones.

### 2d. Add the multi-lesion toggle and editor into the JSX

**Where to insert**: Find the JSX section that renders the procedures area — typically after the `ProcedureSuggestions` component and before or around the existing procedure list and "Add Procedure" button. 

**Condition for showing the toggle**: Only show the multi-lesion toggle when:
- `selectedDiagnosis?.hasEnhancedHistology === true`
- OR the `groupSpecialty` is `"general"` or `"head_neck"`

This scopes the feature to skin cancer workflows without cluttering other specialties.

**Insert this JSX block** where appropriate (replace `<YourThemeColors>` with `theme.link`, `theme.border`, etc. matching the existing component style):

```tsx
{/* ── Multi-lesion toggle — shown for skin cancer diagnosis groups ── */}
{(selectedDiagnosis?.hasEnhancedHistology || groupSpecialty === "general" || groupSpecialty === "head_neck") && (
  <View style={{ marginBottom: 16 }}>
    <Pressable
      onPress={() => {
        const newValue = !isMultiLesion;
        setIsMultiLesion(newValue);
        if (newValue && lesionInstances.length === 0) {
          // Auto-create first lesion when enabling
          const { v4: uuidv4 } = require("uuid");
          setLesionInstances([
            {
              id: uuidv4(),
              site: "",
              pathologyType: deriveDefaultPathologyType(selectedDiagnosis),
              reconstruction: "primary_closure",
              marginStatus: "pending",
              histologyConfirmed: false,
            },
          ]);
        }
      }}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: isMultiLesion ? theme.link : theme.border,
        backgroundColor: isMultiLesion ? theme.link + "10" : theme.backgroundDefault,
      }}
    >
      <Feather
        name={isMultiLesion ? "check-square" : "square"}
        size={18}
        color={isMultiLesion ? theme.link : theme.textSecondary}
      />
      <View style={{ flex: 1 }}>
        <ThemedText
          style={{
            fontSize: 14,
            fontWeight: "600",
            color: isMultiLesion ? theme.link : theme.text,
          }}
        >
          Multiple lesions in this session
        </ThemedText>
        <ThemedText style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2 }}>
          Log each excision site separately
        </ThemedText>
      </View>
    </Pressable>
  </View>
)}

{/* ── Multi-lesion editor OR standard procedure entry ── */}
{isMultiLesion ? (
  <MultiLesionEditor
    lesions={lesionInstances}
    onChange={setLesionInstances}
    defaultPathologyType={deriveDefaultPathologyType(selectedDiagnosis)}
  />
) : (
  /* existing procedures JSX goes here — DO NOT move or change it, 
     just wrap it in this else branch */
  null
)}
```

**Important**: The existing procedure JSX (ProcedureEntryCard list, Add Procedure button, ProcedureSuggestions, DiagnosisSuggestions) should remain intact inside the `else` branch (`isMultiLesion === false`). Do not delete or restructure the existing procedure rendering — just conditionally hide it when multi-lesion mode is active.

### 2e. Add the `deriveDefaultPathologyType` helper inside the component

Place this **before** the `return` statement inside `DiagnosisGroupEditor`:

```typescript
/** Maps diagnosis picklist ID to a default LesionPathologyType for pre-population */
function deriveDefaultPathologyType(
  dx: import("@/types/diagnosis").DiagnosisPicklistEntry | null
): LesionPathologyType {
  if (!dx) return "bcc";
  const id = dx.id.toLowerCase();
  if (id.includes("melanoma")) return "melanoma";
  if (id.includes("scc")) return "scc";
  if (id.includes("bcc")) return "bcc";
  if (id.includes("benign") || id.includes("naevus") || id.includes("cyst")) return "benign";
  return "bcc"; // default for skin cancer groups
}
```

---

## Step 3 — Verify migration backward compatibility

Open `client/lib/migration.ts`. The existing `migrateCase` function should continue to work because:
- `isMultiLesion` and `lesionInstances` are both optional on `DiagnosisGroup`
- Old cases without these fields simply won't have them, which is fine

**No changes needed** to `migration.ts` — just confirm the existing migration handles the new optional fields gracefully (it will, since it copies `group` properties and the new fields aren't present on old data).

---

## Step 4 — TypeScript verification

After making all changes, run:

```bash
npx tsc --noEmit
```

Fix any type errors. Common issues to watch for:
- `LesionInstance` import missing somewhere
- `deriveDefaultPathologyType` defined inside component scope — if TypeScript complains, move it outside the component function but inside the file
- The `require("uuid")` inside the Pressable handler — if TypeScript prefers it, replace with a pre-imported `uuidv4` from the existing `import { v4 as uuidv4 } from "uuid"` at the top of the file (which is already present in DiagnosisGroupEditor.tsx)

---

## Acceptance Criteria

1. `LesionInstance`, `LesionPathologyType`, `LesionReconstruction` types exist in `client/types/case.ts`
2. `DiagnosisGroup` has `isMultiLesion?: boolean` and `lesionInstances?: LesionInstance[]`
3. `getAllLesionInstances` and `getExcisionCount` helpers exist in `client/types/case.ts`
4. In `DiagnosisGroupEditor`, the multi-lesion toggle is visible when specialty is `general` or `head_neck` or diagnosis has `hasEnhancedHistology: true`
5. Toggling on: shows `MultiLesionEditor` and hides the standard procedure entry
6. Toggling off: restores standard procedure entry
7. State (isMultiLesion + lesionInstances) is included in the assembled `DiagnosisGroup` passed to `onChange`
8. `npx tsc --noEmit` passes with no errors
9. Existing cases load without errors (backward compat)
