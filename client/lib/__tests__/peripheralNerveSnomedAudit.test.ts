/**
 * Peripheral Nerve SNOMED CT Audit tests
 *
 * Validates:
 *   - All diagnosis IDs are unique
 *   - All SNOMED codes are non-empty numeric strings
 *   - No remaining VERIFY comments (handled at file level)
 *   - All suggestedProcedures cross-reference to existing procedures
 *   - SNOMED display text is non-empty
 */

import { describe, it, expect } from "vitest";
import { PERIPHERAL_NERVE_DIAGNOSES } from "@/lib/diagnosisPicklists/peripheralNerveDiagnoses";
import { PROCEDURE_PICKLIST } from "@/lib/procedurePicklist";

describe("Peripheral nerve SNOMED CT audit", () => {
  it("all diagnosis IDs are unique", () => {
    const ids = PERIPHERAL_NERVE_DIAGNOSES.map((d) => d.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("all diagnoses have non-empty SNOMED CT codes matching numeric pattern", () => {
    for (const dx of PERIPHERAL_NERVE_DIAGNOSES) {
      expect(dx.snomedCtCode, `${dx.id} should have snomedCtCode`).toBeTruthy();
      expect(
        /^\d+$/.test(dx.snomedCtCode ?? ""),
        `${dx.id} snomedCtCode "${dx.snomedCtCode}" should be numeric`,
      ).toBe(true);
    }
  });

  it("all diagnoses have non-empty SNOMED display text", () => {
    for (const dx of PERIPHERAL_NERVE_DIAGNOSES) {
      expect(
        dx.snomedCtDisplay,
        `${dx.id} should have snomedCtDisplay`,
      ).toBeTruthy();
      expect(
        (dx.snomedCtDisplay ?? "").length,
        `${dx.id} snomedCtDisplay should not be empty`,
      ).toBeGreaterThan(0);
    }
  });

  it("all suggested procedures reference existing procedure picklist entries", () => {
    const procedureIds = new Set(PROCEDURE_PICKLIST.map((p) => p.id));

    for (const dx of PERIPHERAL_NERVE_DIAGNOSES) {
      if (dx.suggestedProcedures) {
        for (const sp of dx.suggestedProcedures) {
          expect(
            procedureIds.has(sp.procedurePicklistId),
            `${dx.id} references procedure "${sp.procedurePicklistId}" which does not exist in the procedure picklist`,
          ).toBe(true);
        }
      }
    }
  });

  it("all diagnoses have peripheralNerveModule: true", () => {
    for (const dx of PERIPHERAL_NERVE_DIAGNOSES) {
      expect(
        dx.peripheralNerveModule,
        `${dx.id} should have peripheralNerveModule: true`,
      ).toBe(true);
    }
  });

  it("brachial plexus diagnoses have brachialPlexusModule: true", () => {
    const bpDiagnoses = PERIPHERAL_NERVE_DIAGNOSES.filter((d) =>
      d.id.startsWith("pn_dx_bp_"),
    );
    expect(bpDiagnoses.length).toBeGreaterThan(0);
    for (const dx of bpDiagnoses) {
      expect(
        dx.brachialPlexusModule,
        `${dx.id} should have brachialPlexusModule: true`,
      ).toBe(true);
    }
  });

  it("neuroma diagnoses have neuromaModule: true", () => {
    const neuromaDiagnoses = PERIPHERAL_NERVE_DIAGNOSES.filter(
      (d) =>
        d.id.startsWith("pn_dx_neuroma_") || d.id === "pn_dx_morton_neuroma",
    );
    expect(neuromaDiagnoses.length).toBeGreaterThan(0);
    for (const dx of neuromaDiagnoses) {
      expect(dx.neuromaModule, `${dx.id} should have neuromaModule: true`).toBe(
        true,
      );
    }
  });
});
