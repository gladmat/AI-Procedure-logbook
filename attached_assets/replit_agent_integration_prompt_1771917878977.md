# Replit Agent Task: Procedure Picklist Integration & Legacy Migration

## Context

The file `client/lib/procedurePicklist.ts` has been replaced with an expanded version containing 207 procedures across 3 specialties (Orthoplastic, Hand Surgery, Head & Neck) with 25 subcategories. The file is a drop-in replacement — same interface, same exports, same function signatures. The remaining 5 specialties (Breast, Burns, Aesthetics, Body Contouring, General) will be added in future updates.

## Task 1: Replace the procedure picklist file

Replace `client/lib/procedurePicklist.ts` with the new version that has been uploaded. The new file:
- Has identical exports: `ProcedurePicklistEntry`, `PROCEDURE_PICKLIST`, `getProceduresForSpecialty`, `getSubcategoriesForSpecialty`, `getProceduresForSubcategory`, `findPicklistEntry`, `hasPicklistForSpecialty`
- Has identical type imports: `Specialty`, `ProcedureTag` from `@/types/case`
- No external code changes are needed for this replacement

## Task 2: Deprecate old snomedCt.ts procedure lookup

The file `client/lib/snomedCt.ts` contains an old `SNOMED_PROCEDURES` array and `findSnomedProcedure()` function that predates the new picklist system. It is still referenced in `client/screens/CaseFormScreen.tsx` at approximately line 913:

```typescript
const snomedProcedure = findSnomedProcedure(procedureType, specialty);
```

This legacy code path is used when a case is logged **without** the new procedure picklist (i.e., for specialties that don't yet have picklist entries). 

### What to do:
1. **Do NOT delete `snomedCt.ts`** — it still contains `COUNTRY_CODING_SYSTEMS`, `getCountryCodeFromProfile`, `getCodingSystemForProfile`, and the country mapping exports that are used by `CaseDetailScreen.tsx`, `CaseFormScreen.tsx`, and `SettingsScreen.tsx`.
2. The `SNOMED_PROCEDURES` array and `findSnomedProcedure` function should remain for now as a fallback for specialties without picklist entries (Breast, Burns, Aesthetics, Body Contouring). They can be removed once all 8 specialties are in the picklist.
3. No changes needed to `snomedCt.ts` in this update.

## Task 3: Verify UI integration

The procedure entry flow in `client/components/ProcedureEntryCard.tsx` uses `hasPicklistForSpecialty(procedure.specialty)` (line ~205) to decide whether to show the new subcategory picker or the old free-text/SNOMED search.

After replacing the file, verify that:
- Selecting **Hand Surgery** as specialty now shows the subcategory picker (Fracture & Joint Fixation, Tendon Surgery, Nerve Surgery, etc.) instead of the old free-text entry
- Selecting **Head & Neck** as specialty shows the subcategory picker (Skin Cancer Excision, Local Flaps, Regional Flaps, etc.)
- Selecting **Orthoplastic** continues to work as before
- Selecting **Breast**, **Burns**, **Aesthetics**, **Body Contouring** still falls back to the old entry method (they have no picklist entries yet, except cross-tagged procedures)
- Free flap entries (those with `hasFreeFlap: true`) properly trigger the FreeFlapPicker component

## Task 4: Verify TypeScript compilation

Run `npx tsc --noEmit` to ensure no type errors were introduced. The file uses the same types as before (`Specialty`, `ProcedureTag` from `@/types/case`) so this should compile cleanly.

## Important Notes

- **Do NOT modify the new `procedurePicklist.ts` file** — it was generated with specific SNOMED CT codes and cross-specialty tagging that must be preserved
- **Do NOT create new procedure types or modify `case.ts` types** — the existing `ProcedureTag` and `Specialty` types already support everything in the new picklist
- Some SNOMED CT codes have `// VERIFY` comments — these are flagged for manual verification but are functional placeholder codes. Do not remove or change them.
- The `procedureType: string` field in case.ts remains unchanged — it stores either free text (old path) or the picklist `displayName` (new path). The `picklistEntryId` field stores the stable ID for picklist-selected procedures.
