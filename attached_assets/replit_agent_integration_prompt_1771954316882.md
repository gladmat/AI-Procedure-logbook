# Replit Agent Integration — Complete 8-Specialty Procedure Picklist

## Task 1: Replace procedurePicklist.ts

Replace `client/lib/procedurePicklist.ts` with the new version (drop-in replacement).

- **No interface changes** — same `ProcedurePicklistEntry` type, same exported functions
- Same 5 exported helper functions: `getProceduresForSpecialty`, `getSubcategoriesForSpecialty`, `getProceduresForSubcategory`, `findPicklistEntry`, `hasPicklistForSpecialty`
- File grew from ~2,300 lines to ~4,370 lines (added 5 new specialties)

## Task 2: Verify all 8 specialties activate the new picker UI

`hasPicklistForSpecialty()` is dynamic — it returns `true` when a specialty has entries in `PROCEDURE_PICKLIST`. All 8 now have entries:

| Specialty | Visible Procedures | Dedicated | Cross-Tagged | Subcategories |
|---|---|---|---|---|
| Orthoplastic | 43 | 43 | 0 | 7 |
| Hand Surgery | 94 | 93 | 1 | 9 |
| Head & Neck | 85 | 71 | 14 | 9 |
| General | 74 | 42 | 32 | 9 |
| Breast | 47 | 44 | 3 | 6 |
| Burns | 34 | 28 | 6 | 5 |
| Aesthetics | 53 | 49 | 4 | 7 |
| Body Contouring | 31 | 28 | 3 | 6 |
| **TOTAL UNIQUE** | — | **398** | — | — |

**What to verify in the UI:**
- Every specialty now shows the subcategory picker (grouped procedure list) instead of the old free-text entry
- Previously only Orthoplastic, Hand Surgery, and Head & Neck had picklist entries
- Now ALL specialties use the new UI — the old free-text fallback via `snomedCt.ts` should no longer be needed

## Task 3: Deprecate old snomedCt.ts procedure lookup

- Do **NOT** delete `client/lib/snomedCt.ts` — it still contains:
  - `COUNTRY_CODING_SYSTEMS` — used by CaseDetailScreen, CaseFormScreen, SettingsScreen
  - `getCountryCodeFromProfile()` — used by multiple screens
- The `SNOMED_PROCEDURES` array and `findSnomedProcedure()` function are now fully superseded by the picklist
- These can be removed in a future cleanup pass, but are harmless to leave in place

## Task 4: Verify TypeScript compilation

```bash
npx tsc --noEmit
```

No type changes — should compile cleanly.

## Task 5: Verify free flap entries trigger FreeFlapPicker

Entries with `hasFreeFlap: true` exist in:
- Orthoplastic (14 free flaps)
- Breast (DIEP, free TRAM, SGAP, IGAP, SIEA, stacked, SCIP = 7 entries)
- Burns (contracture release — free flap = 1 entry)
- General (VLNT = 1 entry)
- Head & Neck (3 dedicated + 14 cross-tagged from Orthoplastic)

These should all trigger the `FreeFlapPicker` component when selected.

## Cross-Specialty Tagging Summary

Procedures that appear in multiple specialties exist once in the database:
- Skin grafts (STSG/FTSG) → Orthoplastic + Burns + General + H&N
- Local flaps → Orthoplastic + General
- Wound management → Orthoplastic + Burns + General
- Free flaps → Orthoplastic + H&N + General
- Breast aesthetics → Breast + Aesthetics
- Liposuction/BBL → Aesthetics + Body Contouring
- Body scar revision → Aesthetics + General
