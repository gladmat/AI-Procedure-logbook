import { resolveTraumaDiagnosis } from "@/lib/handTraumaMapping";
import type { FractureEntry } from "@/types/case";

function createMetacarpalFracture(
  id: string,
  digit: "II" | "III" | "IV" | "V",
  aoCode: string,
  options: Partial<FractureEntry["details"]> = {},
): FractureEntry {
  return {
    id,
    boneId: `mc-${digit}`,
    boneName: `${digit} metacarpal`,
    aoCode,
    details: {
      familyCode: "77",
      finger:
        digit === "II"
          ? "2"
          : digit === "III"
            ? "3"
            : digit === "IV"
              ? "4"
              : "5",
      segment: "2",
      ...options,
    },
  };
}

describe("hand trauma mapping pairs", () => {
  it("marks fracture pairs as single-select with one default option", () => {
    const result = resolveTraumaDiagnosis({
      laterality: "right",
      injuryMechanism: "crush",
      affectedDigits: ["III"],
      activeCategories: ["fracture"],
      fractures: [createMetacarpalFracture("fx-1", "III", "77.3.2C")],
    });

    const fracturePair = result?.pairs.find((pair) => pair.source === "fracture");
    expect(fracturePair?.selectionMode).toBe("single");
    expect(
      fracturePair?.suggestedProcedures.filter((procedure) => procedure.isDefault),
    ).toHaveLength(1);
  });

  it("marks thumb UCL reconstruction choices as single-select alternatives", () => {
    const result = resolveTraumaDiagnosis({
      laterality: "left",
      affectedDigits: ["I"],
      activeCategories: ["soft_tissue"],
      injuredStructures: [
        {
          category: "ligament",
          structureId: "mcp1_ucl",
          displayName: "Thumb MCP UCL",
          digit: "I",
        },
      ],
    });

    const uclPair = result?.pairs.find((pair) =>
      pair.key.startsWith("soft_tissue:ucl:"),
    );

    expect(uclPair?.selectionMode).toBe("single");
    expect(uclPair?.suggestedProcedures.map((procedure) => procedure.isDefault)).toEqual([
      true,
      false,
    ]);
  });

  it("keeps vascular repair and revascularisation complementary when perfusion is impaired", () => {
    const result = resolveTraumaDiagnosis({
      laterality: "right",
      affectedDigits: ["III"],
      activeCategories: ["vessel"],
      injuredStructures: [
        {
          category: "artery",
          structureId: "A5",
          displayName: "Radial digital artery",
          digit: "III",
          side: "radial",
        },
      ],
      perfusionStatuses: [{ digit: "III", status: "impaired" }],
    });

    const vesselPair = result?.pairs.find((pair) => pair.source === "vessel");
    expect(vesselPair?.selectionMode).toBe("multiple");
    expect(
      vesselPair?.suggestedProcedures.map((procedure) => procedure.procedurePicklistId),
    ).toEqual(
      expect.arrayContaining([
        "hand_cov_revascularisation",
        "hand_vasc_digital_artery_repair",
      ]),
    );
  });

  it("keeps PIN and SRN as separate proximal nerve selections", () => {
    const result = resolveTraumaDiagnosis({
      laterality: "left",
      activeCategories: ["nerve"],
      affectedDigits: [],
      injuredStructures: [
        {
          category: "nerve",
          structureId: "pin",
          displayName: "Posterior interosseous nerve (PIN)",
        },
        {
          category: "nerve",
          structureId: "srn",
          displayName: "Superficial radial nerve (SRN)",
        },
      ],
    });

    const nervePairs = result?.pairs.filter((pair) => pair.source === "nerve") ?? [];

    expect(nervePairs).toHaveLength(2);
    expect(nervePairs.map((pair) => pair.diagnosis.displayName)).toEqual(
      expect.arrayContaining([
        "Posterior interosseous nerve (PIN) injury at wrist level",
        "Superficial radial nerve (SRN) injury at wrist level",
      ]),
    );
  });

  it("attaches generic coding references to mapped diagnoses and procedures", () => {
    const result = resolveTraumaDiagnosis({
      laterality: "right",
      injuryMechanism: "crush",
      affectedDigits: ["III"],
      activeCategories: ["fracture"],
      fractures: [createMetacarpalFracture("fx-1", "III", "77.3.2C")],
    });

    const fracturePair = result?.pairs.find((pair) => pair.source === "fracture");

    expect(fracturePair?.diagnosis.codes?.[0]).toMatchObject({
      system: "SNOMED_CT",
    });
    expect(fracturePair?.suggestedProcedures[0]?.codes?.[0]).toMatchObject({
      system: "SNOMED_CT",
    });
  });
});
