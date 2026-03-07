import type { Case, DiagnosisGroup } from "@/types/case";
import { getHandTraumaCaseTitle } from "@/lib/handTraumaDiagnosis";

export function getDiagnosisGroupTitle(
  group: DiagnosisGroup | undefined,
): string | undefined {
  if (!group) return undefined;
  return getHandTraumaCaseTitle(group) ?? group.diagnosis?.displayName;
}

export function getCasePrimaryTitle(caseData: Case): string | undefined {
  return getDiagnosisGroupTitle(caseData.diagnosisGroups?.[0]);
}
