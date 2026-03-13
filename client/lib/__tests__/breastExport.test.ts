import { describe, expect, it } from "vitest";
import { exportCasesAsCsv } from "@/lib/exportCsv";
import { exportSingleCaseAsFhir } from "@/lib/exportFhir";
import { buildPdfHtml } from "@/lib/exportPdfHtml";
import { generateBreastSummary } from "@/lib/moduleSummary";
import type { BreastAssessmentData } from "@/types/breast";

// ─── Test fixtures ────────────────────────────────────────────────────────

const baseCase = {
  id: "breast-case-1",
  patientIdentifier: "PAT-B1",
  procedureDate: "2026-03-10",
  facility: "Test Hospital",
  specialty: "breast",
  ownerId: "owner-1",
  caseStatus: "active" as const,
};

const implantCase = {
  ...baseCase,
  diagnosisGroups: [
    {
      id: "group-1",
      specialty: "breast",
      diagnosis: {
        displayName: "Breast reconstruction with implant",
        snomedCtCode: "234001",
      },
      procedures: [
        {
          id: "proc-1",
          sequenceOrder: 1,
          procedureName: "Breast implant insertion",
          surgeonRole: "PS",
        },
      ],
      breastAssessment: {
        laterality: "bilateral",
        sides: {
          left: {
            clinicalContext: "reconstructive",
            reconstructionTiming: "immediate",
            implantDetails: {
              deviceType: "permanent_implant",
              manufacturer: "allergan",
              volumeCc: 350,
              shellSurface: "smooth",
              fillMaterial: "silicone_standard",
              shape: "round",
              profile: "moderate_plus",
              implantPlane: "dual_plane",
              incisionSite: "inframammary",
              admUsed: true,
              admDetails: { productName: "strattice" },
            },
          },
          right: {
            clinicalContext: "reconstructive",
            reconstructionTiming: "immediate",
            implantDetails: {
              deviceType: "permanent_implant",
              manufacturer: "mentor",
              volumeCc: 370,
              shellSurface: "microtextured",
              fillMaterial: "silicone_highly_cohesive",
              shape: "anatomical",
              profile: "high",
              implantPlane: "subpectoral",
              incisionSite: "mastectomy_wound",
              admUsed: false,
            },
          },
        },
      } satisfies BreastAssessmentData,
    },
  ],
};

const flapCase = {
  ...baseCase,
  id: "breast-case-2",
  diagnosisGroups: [
    {
      id: "group-2",
      specialty: "breast",
      diagnosis: {
        displayName: "DIEP flap breast reconstruction",
        snomedCtCode: "234002",
      },
      procedures: [
        {
          id: "proc-2",
          sequenceOrder: 1,
          procedureName: "DIEP free flap",
          surgeonRole: "PS",
        },
      ],
      breastAssessment: {
        laterality: "left",
        sides: {
          left: {
            clinicalContext: "reconstructive",
            reconstructionTiming: "delayed",
            flapDetails: {
              flapType: "DIEP",
              flapWeightGrams: 485,
              recipientArtery: "ima",
              perforators: [
                { name: "Lateral row", dopplered: true },
                { name: "Medial row", dopplered: false },
              ],
            },
          },
        },
      } satisfies BreastAssessmentData,
    },
  ],
};

const lipofillingCase = {
  ...baseCase,
  id: "breast-case-3",
  diagnosisGroups: [
    {
      id: "group-3",
      specialty: "breast",
      diagnosis: {
        displayName: "Breast lipofilling",
        snomedCtCode: "234003",
      },
      procedures: [
        {
          id: "proc-3",
          sequenceOrder: 1,
          procedureName: "Autologous fat transfer to breast",
          surgeonRole: "PS",
        },
      ],
      breastAssessment: {
        laterality: "bilateral",
        sides: {
          left: {
            clinicalContext: "aesthetic",
            lipofilling: {
              harvestTechnique: "coleman_syringe",
              totalVolumeHarvestedMl: 600,
              injectionLeft: { volumeInjectedMl: 180 },
              injectionRight: { volumeInjectedMl: 200 },
            },
          },
          right: {
            clinicalContext: "aesthetic",
          },
        },
      } satisfies BreastAssessmentData,
    },
  ],
};

const nonBreastCase = {
  ...baseCase,
  id: "non-breast-case",
  specialty: "general",
  diagnosisGroups: [
    {
      id: "group-gen",
      specialty: "general",
      diagnosis: {
        displayName: "Hernia repair",
        snomedCtCode: "12345",
      },
      procedures: [
        {
          id: "proc-gen",
          sequenceOrder: 1,
          procedureName: "Hernia repair",
          surgeonRole: "PS",
        },
      ],
    },
  ],
};

const chestMascCase = {
  ...baseCase,
  id: "breast-case-4",
  diagnosisGroups: [
    {
      id: "group-4",
      specialty: "breast",
      diagnosis: {
        displayName: "Gender dysphoria - transmasculine",
        snomedCtCode: "234004",
      },
      procedures: [
        {
          id: "proc-4",
          sequenceOrder: 1,
          procedureName: "Mastectomy - chest masculinisation",
          surgeonRole: "PS",
        },
      ],
      breastAssessment: {
        laterality: "bilateral",
        sides: {
          left: {
            clinicalContext: "gender_affirming",
            chestMasculinisation: {
              technique: "double_incision_fng",
              specimenWeightLeftGrams: 320,
            },
          },
          right: {
            clinicalContext: "gender_affirming",
            chestMasculinisation: {
              technique: "double_incision_fng",
              specimenWeightRightGrams: 310,
            },
          },
        },
      } satisfies BreastAssessmentData,
    },
  ],
};

// ─── CSV Tests ────────────────────────────────────────────────────────────

describe("Breast CSV export", () => {
  it("exports breast implant data into correct columns", () => {
    const csv = exportCasesAsCsv([implantCase as any], {
      includePatientId: true,
    });
    const lines = csv.split("\n");
    expect(lines).toHaveLength(2);

    const headers = lines[0]!.split(",");
    const values = lines[1]!.split(",");

    // Find column indices
    const lateralityIdx = headers.indexOf("breast_laterality");
    expect(lateralityIdx).toBeGreaterThan(-1);
    expect(values[lateralityIdx]).toBe("bilateral");

    const lContextIdx = headers.indexOf("breast_L_context");
    expect(values[lContextIdx]).toBe("Reconstructive");

    const lVolumeIdx = headers.indexOf("breast_L_implant_volume_cc");
    expect(values[lVolumeIdx]).toBe("350");

    const rVolumeIdx = headers.indexOf("breast_R_implant_volume_cc");
    expect(values[rVolumeIdx]).toBe("370");

    const lSurfaceIdx = headers.indexOf("breast_L_implant_surface");
    expect(values[lSurfaceIdx]).toBe("Smooth");

    const rSurfaceIdx = headers.indexOf("breast_R_implant_surface");
    expect(values[rSurfaceIdx]).toBe("Microtextured");

    const lAdmIdx = headers.indexOf("breast_L_adm_used");
    expect(values[lAdmIdx]).toBe("Yes");

    const rAdmIdx = headers.indexOf("breast_R_adm_used");
    expect(values[rAdmIdx]).toBe("No");
  });

  it("exports bilateral implant data per-side", () => {
    const csv = exportCasesAsCsv([implantCase as any], {
      includePatientId: true,
    });
    const headers = csv.split("\n")[0]!.split(",");
    const values = csv.split("\n")[1]!.split(",");

    const lMfrIdx = headers.indexOf("breast_L_implant_manufacturer");
    const rMfrIdx = headers.indexOf("breast_R_implant_manufacturer");
    expect(values[lMfrIdx]).toBe("allergan");
    expect(values[rMfrIdx]).toBe("mentor");

    const lPlaneIdx = headers.indexOf("breast_L_implant_plane");
    const rPlaneIdx = headers.indexOf("breast_R_implant_plane");
    expect(values[lPlaneIdx]).toBe("Dual Plane");
    expect(values[rPlaneIdx]).toBe("Subpectoral (total submuscular)");
  });

  it("exports non-breast case with empty breast columns", () => {
    const csv = exportCasesAsCsv([nonBreastCase as any], {
      includePatientId: true,
    });
    const headers = csv.split("\n")[0]!.split(",");
    const values = csv.split("\n")[1]!.split(",");

    const lateralityIdx = headers.indexOf("breast_laterality");
    expect(values[lateralityIdx]).toBe("");

    const lVolumeIdx = headers.indexOf("breast_L_implant_volume_cc");
    expect(values[lVolumeIdx]).toBe("");
  });

  it("exports flap details per-side", () => {
    const csv = exportCasesAsCsv([flapCase as any], {
      includePatientId: true,
    });
    const headers = csv.split("\n")[0]!.split(",");
    const values = csv.split("\n")[1]!.split(",");

    const lWeightIdx = headers.indexOf("breast_L_flap_weight_g");
    expect(values[lWeightIdx]).toBe("485");

    const lPerfIdx = headers.indexOf("breast_L_perforator_count");
    expect(values[lPerfIdx]).toBe("2");

    const lArteryIdx = headers.indexOf("breast_L_recipient_artery");
    expect(values[lArteryIdx]).toBe("Internal Mammary Artery");

    // Right side should be empty (unilateral left)
    const rWeightIdx = headers.indexOf("breast_R_flap_weight_g");
    expect(values[rWeightIdx]).toBe("");
  });

  it("exports lipofilling volumes correctly", () => {
    const csv = exportCasesAsCsv([lipofillingCase as any], {
      includePatientId: true,
    });
    const headers = csv.split("\n")[0]!.split(",");
    const values = csv.split("\n")[1]!.split(",");

    const lLipoIdx = headers.indexOf("breast_L_lipofilling_volume_ml");
    expect(values[lLipoIdx]).toBe("180");

    const rLipoIdx = headers.indexOf("breast_R_lipofilling_volume_ml");
    expect(values[rLipoIdx]).toBe("200");

    const harvestIdx = headers.indexOf("breast_lipofilling_harvest_technique");
    expect(values[harvestIdx]).toContain("Coleman Syringe");

    const totalIdx = headers.indexOf("breast_lipofilling_total_harvested_ml");
    expect(values[totalIdx]).toBe("600");
  });

  it("includes all 36 breast column headers", () => {
    const csv = exportCasesAsCsv([], { includePatientId: true });
    const headers = csv.split("\n")[0]!;
    expect(headers).toContain("breast_laterality");
    expect(headers).toContain("breast_L_context");
    expect(headers).toContain("breast_R_context");
    expect(headers).toContain("breast_L_implant_volume_cc");
    expect(headers).toContain("breast_R_implant_volume_cc");
    expect(headers).toContain("breast_L_flap_weight_g");
    expect(headers).toContain("breast_R_flap_weight_g");
    expect(headers).toContain("breast_lipofilling_total_harvested_ml");
  });
});

// ─── FHIR Tests ───────────────────────────────────────────────────────────

describe("Breast FHIR export", () => {
  it("creates Device resources for breast implants with correct SNOMED coding", () => {
    const bundle = JSON.parse(
      exportSingleCaseAsFhir(implantCase as any),
    );
    const devices = bundle.entry.filter(
      (e: any) => e.resource.resourceType === "Device",
    );

    // Bilateral implants → 2 Device resources
    expect(devices.length).toBe(2);

    const firstDevice = devices[0].resource;
    expect(firstDevice.type.coding[0].code).toBe("303608005");
    expect(firstDevice.type.coding[0].display).toBe(
      "Breast implant (physical object)",
    );
  });

  it("includes manufacturer on breast Device resources", () => {
    const bundle = JSON.parse(
      exportSingleCaseAsFhir(implantCase as any),
    );
    const devices = bundle.entry.filter(
      (e: any) => e.resource.resourceType === "Device",
    );

    const manufacturers = devices.map((e: any) => e.resource.manufacturer);
    expect(manufacturers).toContain("allergan");
    expect(manufacturers).toContain("mentor");
  });

  it("includes volume property on breast Device resources", () => {
    const bundle = JSON.parse(
      exportSingleCaseAsFhir(implantCase as any),
    );
    const devices = bundle.entry.filter(
      (e: any) => e.resource.resourceType === "Device",
    );

    const volumeProps = devices.flatMap((e: any) =>
      (e.resource.property ?? []).filter(
        (p: any) => p.type?.text === "volumeCc",
      ),
    );
    expect(volumeProps).toHaveLength(2);
    const volumes = volumeProps.map(
      (p: any) => p.valueQuantity?.[0]?.value,
    );
    expect(volumes).toContain(350);
    expect(volumes).toContain(370);
  });

  it("includes side property on breast Device resources", () => {
    const bundle = JSON.parse(
      exportSingleCaseAsFhir(implantCase as any),
    );
    const devices = bundle.entry.filter(
      (e: any) => e.resource.resourceType === "Device",
    );

    const sideProps = devices.flatMap((e: any) =>
      (e.resource.property ?? []).filter(
        (p: any) => p.type?.text === "side",
      ),
    );
    expect(sideProps).toHaveLength(2);
    const sides = sideProps.map((p: any) => p.valueCode?.[0]?.text);
    expect(sides).toContain("Left");
    expect(sides).toContain("Right");
  });

  it("does not create breast Device resources for non-breast cases", () => {
    const bundle = JSON.parse(
      exportSingleCaseAsFhir(nonBreastCase as any),
    );
    const devices = bundle.entry.filter(
      (e: any) => e.resource.resourceType === "Device",
    );
    expect(devices).toHaveLength(0);
  });

  it("adds breast laterality extension on Procedure resource", () => {
    const bundle = JSON.parse(
      exportSingleCaseAsFhir(implantCase as any),
    );
    const procedures = bundle.entry.filter(
      (e: any) => e.resource.resourceType === "Procedure",
    );

    const breastExtension = procedures
      .flatMap((e: any) => e.resource.extension ?? [])
      .find((ext: any) => ext.url === "urn:opus:breast-laterality");
    expect(breastExtension).toBeDefined();
    expect(breastExtension.valueString).toBe("bilateral");
  });
});

// ─── PDF Tests ────────────────────────────────────────────────────────────

describe("Breast PDF export", () => {
  it("includes breast implant summary in implant column", () => {
    const html = buildPdfHtml([implantCase as any], {
      includePatientId: true,
    });
    // Should contain per-side summaries
    expect(html).toContain("L:");
    expect(html).toContain("350cc");
  });

  it("includes breast flap summary in implant column", () => {
    const html = buildPdfHtml([flapCase as any], {
      includePatientId: true,
    });
    expect(html).toContain("L:");
    expect(html).toContain("485g");
  });

  it("includes chest masculinisation summary in implant column", () => {
    const html = buildPdfHtml([chestMascCase as any], {
      includePatientId: true,
    });
    expect(html).toContain("L:");
    expect(html).toContain("R:");
  });
});

// ─── Module Summary Tests ─────────────────────────────────────────────────

describe("generateBreastSummary", () => {
  it("returns null for undefined assessment", () => {
    expect(generateBreastSummary(undefined)).toBeNull();
  });

  it("returns null for assessment with no side data", () => {
    expect(
      generateBreastSummary({ laterality: "left", sides: {} }),
    ).toBeNull();
  });

  it("generates implant summary for unilateral case", () => {
    const result = generateBreastSummary(
      implantCase.diagnosisGroups[0]!.breastAssessment,
    );
    expect(result).not.toBeNull();
    expect(result).toContain("L:");
    expect(result).toContain("350cc");
    expect(result).toContain("R:");
    expect(result).toContain("370cc");
  });

  it("generates flap summary", () => {
    const result = generateBreastSummary(
      flapCase.diagnosisGroups[0]!.breastAssessment,
    );
    expect(result).not.toBeNull();
    expect(result).toContain("L:");
    expect(result).toContain("485g");
  });

  it("generates chest masculinisation summary", () => {
    const result = generateBreastSummary(
      chestMascCase.diagnosisGroups[0]!.breastAssessment,
    );
    expect(result).not.toBeNull();
    expect(result).toContain("L:");
    expect(result).toContain("R:");
  });

  it("generates lipofilling summary when no other module data", () => {
    const assessment: BreastAssessmentData = {
      laterality: "left",
      sides: {
        left: {
          clinicalContext: "aesthetic",
          lipofilling: {
            harvestTechnique: "liposuction_manual",
            totalVolumeHarvestedMl: 400,
            injectionLeft: { volumeInjectedMl: 150 },
          },
        },
      },
    };
    const result = generateBreastSummary(assessment);
    expect(result).not.toBeNull();
    expect(result).toContain("L:");
  });
});
