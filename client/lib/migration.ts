import { Case, DiagnosisGroup } from "@/types/case";
import { v4 as uuidv4 } from "uuid";

export function migrateCase(raw: any): Case {
  if (Array.isArray(raw.diagnosisGroups) && raw.diagnosisGroups.length > 0) {
    return raw as Case;
  }

  const oldDiagnosis = raw.preManagementDiagnosis || raw.finalDiagnosis;

  const group: DiagnosisGroup = {
    id: uuidv4(),
    sequenceOrder: 1,
    specialty: raw.specialty || "general",
    diagnosis: oldDiagnosis
      ? { snomedCtCode: oldDiagnosis.snomedCtCode, displayName: oldDiagnosis.displayName, date: oldDiagnosis.date }
      : undefined,
    diagnosisPicklistId: raw.diagnosisPicklistId || undefined,
    diagnosisStagingSelections: raw.diagnosisStagingSelections || undefined,
    diagnosisClinicalDetails: oldDiagnosis?.clinicalDetails || undefined,
    procedureSuggestionSource: raw.procedureSuggestionSource || undefined,
    pathologicalDiagnosis: raw.pathologicalDiagnosis || undefined,
    fractures: raw.fractures || undefined,
    procedures: raw.procedures || [],
  };

  const migrated: any = { ...raw, diagnosisGroups: [group] };
  delete migrated.preManagementDiagnosis;
  delete migrated.finalDiagnosis;
  delete migrated.pathologicalDiagnosis;
  delete migrated.diagnosisPicklistId;
  delete migrated.diagnosisStagingSelections;
  delete migrated.procedureSuggestionSource;
  delete migrated.fractures;
  delete migrated.procedures;

  return migrated as Case;
}
