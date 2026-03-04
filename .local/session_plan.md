# Objective

Fix three issues: (1) app blocks interaction until all case thumbnails decrypt, (2) wrong order of hand surgery trauma sections, (3) SLNB basin picker needs redesign as paired left/right buttons.

---

# Tasks

### T001: Fix app startup blocking — parallel case loading + non-blocking dashboard
- **Blocked By**: []
- **Details**:
  - **Root cause**: `getCases()` in `client/lib/storage.ts` decrypts cases serially with `await` inside a `for` loop. The dashboard `DashboardScreen.tsx` returns a full-screen spinner (`if (loading) return <ActivityIndicator>`) at line 349, blocking the FAB (Add Case button) and all interaction until every case decrypts.
  - **Fix A — `client/lib/storage.ts`**: Replace the serial `for` loop in `getCases()` with `Promise.all`:
    ```ts
    // BEFORE:
    for (const entry of index) {
      const caseData = await getCase(entry.id);
      if (caseData) cases.push(caseData);
    }
    // AFTER:
    const results = await Promise.all(index.map((entry) => getCase(entry.id)));
    return results.filter((c): c is Case => c !== null);
    ```
    This decrypts all cases concurrently — for 10 cases the wait goes from serial 10× to parallel ~1× the slowest single case.
  - **Fix B — `client/screens/DashboardScreen.tsx`**: Replace the blocking full-screen `if (loading) return` pattern. Instead:
    - Render the full screen immediately (FAB, header, greeting all visible)
    - Show a compact inline skeleton/spinner only in the recent cases section while `loading === true`
    - The FAB (Add Case button) must always be interactive regardless of loading state
    - The existing skeleton style can use a simple `ActivityIndicator` with a "Loading cases..." caption inside the cases list area
  - Files: `client/lib/storage.ts`, `client/screens/DashboardScreen.tsx`
  - Acceptance: Tapping Add Case works immediately on app open; case list shows a loading indicator in-place while decrypting; no full-screen block

### T002: Reorder hand surgery trauma pathway — HandTraumaPicker first
- **Blocked By**: []
- **Details**:
  - **Current order** in `client/components/DiagnosisGroupEditor.tsx` (trauma pathway):
    1. Case type selector
    2. AO Classification section
    3. Primary Diagnosis (card or picker)
    4. Staging fields
    5. HandTraumaStructurePicker ← **wrong position**
    6. DiagnosisClinicalFields
    7. Procedures
  - **Required order** (user wants injured structures first, then AO, then diagnosis):
    1. Case type selector
    2. **HandTraumaStructurePicker** ← move here (immediately after case type)
    3. AO Classification section (optional, collapsible)
    4. Primary Diagnosis (card or picker, auto-resolved from AO or manually picked)
    5. Staging / DiagnosisClinicalFields
    6. Procedures
  - **Change**: Move the JSX block for HandTraumaStructurePicker (currently around line 789–801) to immediately after the case type selector block (currently around line 598–639), before the AO section block (line 642+).
  - The condition stays identical: `groupSpecialty === "hand_surgery" && handCaseType === "trauma"`
  - Files: `client/components/DiagnosisGroupEditor.tsx`
  - Acceptance: In hand surgery trauma case, injured structures picker appears first; AO classifier below it; diagnosis auto-resolves below AO; no functional change to any logic

### T003: Redesign SLNB basin picker as paired left/right button grid
- **Blocked By**: []
- **Details**:
  - **Current UI**: "Add Basin" dashed button → opens a list; each tap adds one basin and closes picker.
  - **New UI**: Always-visible paired button grid. Five anatomical rows, each showing Left and Right toggle buttons (except Other which is a single full-width toggle):
    ```
    CERVICAL / PAROTID    [Left]  [Right]
    AXILLA                [Left]  [Right]
    GROIN                 [Left]  [Right]
    POPLITEAL             [Left]  [Right]
    OTHER                 [    Other    ]
    ```
  - Each button is a toggle: active = link colour fill + border, inactive = backgroundElevated + border. Tapping an active button removes that basin from the list (calls `removeBasin`). Tapping an inactive button adds it (calls `addBasin`).
  - The existing `SlnbBasinCard` components rendered below the grid are unchanged — they still show nodes removed, nodes positive, largest deposit, extranodal extension chips, and basin note.
  - The 9 `SlnbBasin` values map to this grid as follows:
    - "Cervical / Parotid" row: `"right_cervical_parotid"` | `"left_cervical_parotid"`
    - "Axilla" row: `"right_axilla"` | `"left_axilla"`
    - "Groin" row: `"right_groin"` | `"left_groin"`
    - "Popliteal" row: `"right_popliteal"` | `"left_popliteal"`
    - "Other" row: `"other"` (full-width)
  - Remove the `showBasinPicker` state, `addBasinBtn` pressable, `basinPickerPanel`, and `basinPickerRow` JSX entirely — they are replaced by the always-visible grid.
  - The `addBasin` and `removeBasin` logic functions remain unchanged.
  - Grid layout: `View` with rows; each row is `flexDirection:"row"`, label on left in `flex:1`, two buttons on right with fixed width ~70 each. Use `BorderRadius.full` like admission type buttons. Row gap `Spacing.sm`.
  - Styles: new `slnbStyles` entries: `basinGrid`, `basinGridRow`, `basinGridLabel`, `basinSideBtn`, `basinSideBtnText`, `basinOtherBtn`
  - Files: `client/components/ProcedureClinicalDetails.tsx`
  - Acceptance: SLNB form shows five rows with paired buttons; tapping Right Axilla adds it and highlights the button; tapping again removes it; basin cards still appear below with input fields; no "Add Basin" button visible

### T004: TypeScript check
- **Blocked By**: [T001, T002, T003]
- **Details**:
  - Run `npx tsc --noEmit` — fix any errors introduced by the three changes
  - Files: read-only
  - Acceptance: Zero new TypeScript errors
