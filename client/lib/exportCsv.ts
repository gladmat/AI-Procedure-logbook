import { Case, SPECIALTY_LABELS, calculateAgeFromDob } from "@/types/case";
import type { DiagnosisGroup } from "@/types/case";
import {
  resolveOperativeRole,
  resolveSupervisionLevel,
  OPERATIVE_ROLE_LABELS,
  SUPERVISION_LABELS,
  toNearestLegacyRole,
} from "@/types/operativeRole";
import { TreatmentEpisode, ENCOUNTER_CLASS_LABELS } from "@/types/episode";
import {
  HAND_INFECTION_TYPE_LABELS,
  SEVERITY_LABELS as HAND_SEVERITY_LABELS,
  HAND_ORGANISM_LABELS,
  HAND_ANTIBIOTIC_LABELS,
  countKanavelSigns,
} from "@/types/handInfection";
import {
  getImplantBearingProcedures,
  getImplantDisplayFields,
} from "@/lib/jointImplant";
import type { BreastAssessmentData } from "@/types/breast";
import {
  BREAST_CLINICAL_CONTEXT_LABELS,
  BREAST_RECON_TIMING_LABELS,
  IMPLANT_SURFACE_LABELS,
  IMPLANT_FILL_LABELS,
  IMPLANT_SHAPE_LABELS,
  IMPLANT_PROFILE_LABELS,
  IMPLANT_PLANE_LABELS,
  IMPLANT_INCISION_LABELS,
  BREAST_RECIPIENT_ARTERY_LABELS,
  HARVEST_TECHNIQUE_LABELS,
} from "@/types/breast";

export interface CsvExportOptions {
  includePatientId: boolean;
  episodeMap?: Map<string, TreatmentEpisode>;
}

/**
 * CSV column layout — one row per case.
 *
 * Primary diagnosis/procedure in dedicated columns;
 * secondary diagnoses/procedures semicolon-delimited.
 * Laterality and staging included per RACS MALT spec.
 */

const CSV_HEADERS = [
  "case_id",
  "patient_id",
  "patient_first_name",
  "patient_last_name",
  "patient_dob",
  "patient_nhi",
  "patient_age",
  "procedure_date",
  "facility",
  "specialty",
  "admission_urgency",
  "stay_type",
  "admission_date",
  "discharge_date",
  "primary_diagnosis",
  "primary_diagnosis_snomed",
  "primary_laterality",
  "primary_staging",
  "primary_procedure",
  "primary_procedure_snomed",
  "primary_procedure_role",
  "responsible_consultant",
  "operative_role",
  "supervision_level",
  "secondary_diagnoses",
  "secondary_procedures",
  "asa_score",
  "bmi",
  "smoker",
  "anaesthetic_type",
  "wound_infection_risk",
  "surgery_duration_minutes",
  "outcome",
  "return_to_theatre",
  "unplanned_icu",
  "has_complications",
  "complication_grades",
  "case_status",
  "episode_id",
  "episode_title",
  "encounter_class",
  "entry_duration_seconds",
  "hand_infection_type",
  "hand_infection_digits",
  "hand_infection_organism",
  "hand_infection_antibiotic",
  "hand_infection_severity",
  "hand_infection_kanavel",
  "implant_system",
  "implant_size",
  "implant_fixation",
  "implant_approach",
  "implant_bearing",
  "implant_joint_type",
  "planned_date",
  // ── Breast module columns ──
  "breast_laterality",
  "breast_L_context",
  "breast_R_context",
  "breast_L_recon_timing",
  "breast_R_recon_timing",
  "breast_L_implant_manufacturer",
  "breast_L_implant_volume_cc",
  "breast_L_implant_surface",
  "breast_L_implant_fill",
  "breast_L_implant_shape",
  "breast_L_implant_profile",
  "breast_L_implant_plane",
  "breast_L_implant_incision",
  "breast_L_adm_used",
  "breast_L_adm_product",
  "breast_R_implant_manufacturer",
  "breast_R_implant_volume_cc",
  "breast_R_implant_surface",
  "breast_R_implant_fill",
  "breast_R_implant_shape",
  "breast_R_implant_profile",
  "breast_R_implant_plane",
  "breast_R_implant_incision",
  "breast_R_adm_used",
  "breast_R_adm_product",
  "breast_L_flap_weight_g",
  "breast_L_perforator_count",
  "breast_L_recipient_artery",
  "breast_R_flap_weight_g",
  "breast_R_perforator_count",
  "breast_R_recipient_artery",
  "breast_L_lipofilling_volume_ml",
  "breast_R_lipofilling_volume_ml",
  "breast_lipofilling_harvest_technique",
  "breast_lipofilling_total_harvested_ml",
  // ── Joint case columns ──
  "joint_case",
  "partner_specialty",
  "partner_consultant",
  "ablative_surgeon",
] as const;

function escapeCsvField(
  value: string | number | boolean | undefined | null,
): string {
  if (value === undefined || value === null) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function formatStagingSelections(
  selections: Record<string, string> | undefined,
): string {
  if (!selections) return "";
  return Object.entries(selections)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}=${v}`)
    .join("|");
}

function getCaseImplantExportFields(c: Case) {
  const implantProcedures = (c.diagnosisGroups ?? []).flatMap((group) =>
    getImplantBearingProcedures(group.procedures ?? []),
  );
  if (implantProcedures.length === 0) {
    return {
      system: "",
      size: "",
      fixation: "",
      approach: "",
      bearing: "",
      jointType: "",
    };
  }

  const displayFields = implantProcedures.map((procedure) =>
    getImplantDisplayFields(procedure.implantDetails),
  );

  return {
    system: displayFields
      .map((fields) => fields.system || "Incomplete")
      .join("; "),
    size: displayFields.map((fields) => fields.size || "-").join("; "),
    fixation: displayFields.map((fields) => fields.fixation || "-").join("; "),
    approach: displayFields.map((fields) => fields.approach || "-").join("; "),
    bearing: displayFields.map((fields) => fields.bearing || "-").join("; "),
    jointType: displayFields
      .map((fields) => fields.jointType || "-")
      .join("; "),
  };
}

function extractBreastCsvFields(
  groups: DiagnosisGroup[],
): (string | number | undefined)[] {
  // Find the first diagnosis group with breast assessment data
  const ba: BreastAssessmentData | undefined = groups.find(
    (g) => g.breastAssessment,
  )?.breastAssessment;

  if (!ba) {
    // Return empty values for all 36 breast columns
    return new Array(36).fill("") as string[];
  }

  const left = ba.sides.left;
  const right = ba.sides.right;
  const lImp = left?.implantDetails;
  const rImp = right?.implantDetails;
  const lFlap = left?.flapDetails;
  const rFlap = right?.flapDetails;

  // Lipofilling can be on either side's lipofilling data (shared harvest)
  const lipofilling = left?.lipofilling ?? right?.lipofilling;

  const mfrLabel = (mfr: string | undefined) => {
    if (!mfr) return "";
    // IMPLANT_MANUFACTURERS is imported from breastConfig — but to avoid
    // a circular-ish import we inline the lookup here by using the id directly.
    return mfr;
  };

  return [
    ba.laterality, // breast_laterality
    left ? BREAST_CLINICAL_CONTEXT_LABELS[left.clinicalContext] : "", // breast_L_context
    right ? BREAST_CLINICAL_CONTEXT_LABELS[right.clinicalContext] : "", // breast_R_context
    left?.reconstructionTiming
      ? BREAST_RECON_TIMING_LABELS[left.reconstructionTiming]
      : "", // breast_L_recon_timing
    right?.reconstructionTiming
      ? BREAST_RECON_TIMING_LABELS[right.reconstructionTiming]
      : "", // breast_R_recon_timing

    // Left implant
    mfrLabel(lImp?.manufacturer), // breast_L_implant_manufacturer
    lImp?.volumeCc ?? "", // breast_L_implant_volume_cc
    lImp?.shellSurface ? IMPLANT_SURFACE_LABELS[lImp.shellSurface] : "", // breast_L_implant_surface
    lImp?.fillMaterial ? IMPLANT_FILL_LABELS[lImp.fillMaterial] : "", // breast_L_implant_fill
    lImp?.shape ? IMPLANT_SHAPE_LABELS[lImp.shape] : "", // breast_L_implant_shape
    lImp?.profile ? IMPLANT_PROFILE_LABELS[lImp.profile] : "", // breast_L_implant_profile
    lImp?.implantPlane ? IMPLANT_PLANE_LABELS[lImp.implantPlane] : "", // breast_L_implant_plane
    lImp?.incisionSite ? IMPLANT_INCISION_LABELS[lImp.incisionSite] : "", // breast_L_implant_incision
    lImp?.admUsed ? "Yes" : lImp?.admUsed === false ? "No" : "", // breast_L_adm_used
    lImp?.admDetails?.productName ?? "", // breast_L_adm_product

    // Right implant
    mfrLabel(rImp?.manufacturer), // breast_R_implant_manufacturer
    rImp?.volumeCc ?? "", // breast_R_implant_volume_cc
    rImp?.shellSurface ? IMPLANT_SURFACE_LABELS[rImp.shellSurface] : "", // breast_R_implant_surface
    rImp?.fillMaterial ? IMPLANT_FILL_LABELS[rImp.fillMaterial] : "", // breast_R_implant_fill
    rImp?.shape ? IMPLANT_SHAPE_LABELS[rImp.shape] : "", // breast_R_implant_shape
    rImp?.profile ? IMPLANT_PROFILE_LABELS[rImp.profile] : "", // breast_R_implant_profile
    rImp?.implantPlane ? IMPLANT_PLANE_LABELS[rImp.implantPlane] : "", // breast_R_implant_plane
    rImp?.incisionSite ? IMPLANT_INCISION_LABELS[rImp.incisionSite] : "", // breast_R_implant_incision
    rImp?.admUsed ? "Yes" : rImp?.admUsed === false ? "No" : "", // breast_R_adm_used
    rImp?.admDetails?.productName ?? "", // breast_R_adm_product

    // Flap details per side
    lFlap?.flapWeightGrams ?? "", // breast_L_flap_weight_g
    lFlap?.perforators?.length ?? "", // breast_L_perforator_count
    lFlap?.recipientArtery
      ? BREAST_RECIPIENT_ARTERY_LABELS[lFlap.recipientArtery]
      : "", // breast_L_recipient_artery
    rFlap?.flapWeightGrams ?? "", // breast_R_flap_weight_g
    rFlap?.perforators?.length ?? "", // breast_R_perforator_count
    rFlap?.recipientArtery
      ? BREAST_RECIPIENT_ARTERY_LABELS[rFlap.recipientArtery]
      : "", // breast_R_recipient_artery

    // Lipofilling
    lipofilling?.injectionLeft?.volumeInjectedMl ?? "", // breast_L_lipofilling_volume_ml
    lipofilling?.injectionRight?.volumeInjectedMl ?? "", // breast_R_lipofilling_volume_ml
    lipofilling?.harvestTechnique
      ? HARVEST_TECHNIQUE_LABELS[lipofilling.harvestTechnique]
      : "", // breast_lipofilling_harvest_technique
    lipofilling?.totalVolumeHarvestedMl ?? "", // breast_lipofilling_total_harvested_ml
  ];
}

function caseToRow(c: Case, options: CsvExportOptions): string {
  const groups = c.diagnosisGroups || [];
  const primaryGroup = groups[0];
  const secondaryGroups = groups.slice(1);
  const primaryProc = primaryGroup?.procedures[0];

  const secondaryDiagnoses = secondaryGroups
    .map((g) => g.diagnosis?.displayName)
    .filter(Boolean)
    .join("; ");

  const allSecondaryProcs = [
    ...(primaryGroup?.procedures.slice(1) || []),
    ...secondaryGroups.flatMap((g) => g.procedures),
  ];
  const secondaryProcedures = allSecondaryProcs
    .map((p) => p.procedureName)
    .filter(Boolean)
    .join("; ");

  const complicationGrades = (c.complications || [])
    .map((comp) => comp.clavienDindoGrade)
    .filter(Boolean)
    .join("; ");

  const episodeTitle = c.episodeId
    ? (options.episodeMap?.get(c.episodeId)?.title ?? "")
    : "";
  const encounterClassLabel = c.encounterClass
    ? ENCOUNTER_CLASS_LABELS[c.encounterClass]
    : "";

  // Hand infection data (from primary group)
  const handInfection = primaryGroup?.handInfectionDetails;

  const implantFields = getCaseImplantExportFields(c);
  const breastFields = extractBreastCsvFields(groups);

  const values: (string | number | boolean | undefined | null)[] = [
    c.id,
    options.includePatientId ? c.patientIdentifier : undefined,
    options.includePatientId ? c.patientFirstName : undefined,
    options.includePatientId ? c.patientLastName : undefined,
    options.includePatientId ? c.patientDateOfBirth : undefined,
    options.includePatientId ? c.patientNhi : undefined,
    options.includePatientId
      ? (calculateAgeFromDob(c.patientDateOfBirth) ?? c.age)
      : undefined,
    c.procedureDate,
    c.facility,
    SPECIALTY_LABELS[c.specialty] || c.specialty,
    c.admissionUrgency,
    c.stayType,
    c.admissionDate,
    c.dischargeDate,
    primaryGroup?.diagnosis?.displayName,
    primaryGroup?.diagnosis?.snomedCtCode,
    primaryGroup?.diagnosisClinicalDetails?.laterality ?? "",
    formatStagingSelections(primaryGroup?.diagnosisStagingSelections),
    primaryProc?.procedureName,
    primaryProc?.snomedCtCode,
    // primary_procedure_role — backward compat (legacy code)
    (() => {
      const role = resolveOperativeRole(
        primaryProc?.operativeRoleOverride,
        c.defaultOperativeRole,
      );
      const sup = resolveSupervisionLevel(
        primaryProc?.supervisionLevelOverride,
        c.defaultSupervisionLevel,
        role,
      );
      return toNearestLegacyRole(role, sup);
    })(),
    // responsible_consultant
    c.responsibleConsultantName ?? "",
    // operative_role
    (() => {
      const role = resolveOperativeRole(
        primaryProc?.operativeRoleOverride,
        c.defaultOperativeRole,
      );
      return OPERATIVE_ROLE_LABELS[role];
    })(),
    // supervision_level
    (() => {
      const role = resolveOperativeRole(
        primaryProc?.operativeRoleOverride,
        c.defaultOperativeRole,
      );
      const sup = resolveSupervisionLevel(
        primaryProc?.supervisionLevelOverride,
        c.defaultSupervisionLevel,
        role,
      );
      return SUPERVISION_LABELS[sup];
    })(),
    secondaryDiagnoses,
    secondaryProcedures,
    c.asaScore,
    c.bmi,
    c.smoker,
    c.anaestheticType,
    c.woundInfectionRisk,
    c.surgeryTiming?.durationMinutes,
    c.outcome,
    c.returnToTheatre,
    c.unplannedICU,
    c.hasComplications,
    complicationGrades,
    c.caseStatus,
    c.episodeId ?? "",
    episodeTitle,
    encounterClassLabel,
    c.entryDurationSeconds,
    handInfection
      ? HAND_INFECTION_TYPE_LABELS[handInfection.infectionType]
      : "",
    handInfection?.affectedDigits?.join("; ") ?? "",
    handInfection?.organism ? HAND_ORGANISM_LABELS[handInfection.organism] : "",
    handInfection?.empiricalAntibiotic
      ? HAND_ANTIBIOTIC_LABELS[handInfection.empiricalAntibiotic]
      : "",
    handInfection ? HAND_SEVERITY_LABELS[handInfection.severity] : "",
    handInfection?.kanavelSigns
      ? `${countKanavelSigns(handInfection.kanavelSigns)}/4`
      : "",
    implantFields.system,
    implantFields.size,
    implantFields.fixation,
    implantFields.approach,
    implantFields.bearing,
    implantFields.jointType,
    c.plannedDate ?? "",
    // ── Breast module ──
    ...breastFields,
    // ── Joint case ──
    c.jointCaseContext?.isJointCase ? "Yes" : "",
    c.jointCaseContext?.partnerSpecialty ?? "",
    c.jointCaseContext?.partnerConsultantName ?? "",
    c.jointCaseContext?.ablativeSurgeon ?? "",
  ];

  return values.map(escapeCsvField).join(",");
}

export function exportCasesAsCsv(
  cases: Case[],
  options: CsvExportOptions = { includePatientId: true },
): string {
  const PATIENT_ID_HEADERS = new Set([
    "patient_id",
    "patient_first_name",
    "patient_last_name",
    "patient_dob",
    "patient_nhi",
    "patient_age",
  ]);
  const headers = options.includePatientId
    ? CSV_HEADERS
    : CSV_HEADERS.filter((h) => !PATIENT_ID_HEADERS.has(h));

  const headerRow = headers.join(",");
  const dataRows = cases.map((c) => caseToRow(c, options));
  return [headerRow, ...dataRows].join("\n");
}
