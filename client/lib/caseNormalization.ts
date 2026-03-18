import { Case } from "@/types/case";
import { normalizeDateOnlyValue } from "@/lib/dateValues";
import type { SkinCancerHistology } from "@/types/skinCancer";
import { normalizeBreastAssessment } from "@/lib/breastState";

function normalizeStoredDateOnlyValue(value?: string): string | undefined {
  if (value === undefined) return undefined;
  return normalizeDateOnlyValue(value) ?? value;
}

function normalizeSkinCancerHistology(
  histology?: SkinCancerHistology,
): SkinCancerHistology | undefined {
  if (!histology) return histology;

  const reportDate = normalizeStoredDateOnlyValue(histology.reportDate);
  if (reportDate === histology.reportDate) {
    return histology;
  }

  return {
    ...histology,
    reportDate,
  };
}

export function normalizeCaseDateOnlyFields(c: Case): Case {
  let changed = false;

  const procedureDate = normalizeStoredDateOnlyValue(c.procedureDate);
  const admissionDate = normalizeStoredDateOnlyValue(c.admissionDate);
  const dischargeDate = normalizeStoredDateOnlyValue(c.dischargeDate);
  const injuryDate = normalizeStoredDateOnlyValue(c.injuryDate);

  if (procedureDate !== c.procedureDate) changed = true;
  if (admissionDate !== c.admissionDate) changed = true;
  if (dischargeDate !== c.dischargeDate) changed = true;
  if (injuryDate !== c.injuryDate) changed = true;

  const diagnosisGroups = c.diagnosisGroups.map((group) => {
    let groupChanged = false;

    let skinCancerAssessment = group.skinCancerAssessment;
    if (group.skinCancerAssessment) {
      const priorHistology = normalizeSkinCancerHistology(
        group.skinCancerAssessment.priorHistology,
      );
      const currentHistology = normalizeSkinCancerHistology(
        group.skinCancerAssessment.currentHistology,
      );

      if (
        priorHistology !== group.skinCancerAssessment.priorHistology ||
        currentHistology !== group.skinCancerAssessment.currentHistology
      ) {
        skinCancerAssessment = {
          ...group.skinCancerAssessment,
          priorHistology,
          currentHistology,
        };
        groupChanged = true;
      }
    }

    const lesionInstances = group.lesionInstances?.map((lesion) => {
      if (!lesion.skinCancerAssessment) {
        return lesion;
      }

      const priorHistology = normalizeSkinCancerHistology(
        lesion.skinCancerAssessment.priorHistology,
      );
      const currentHistology = normalizeSkinCancerHistology(
        lesion.skinCancerAssessment.currentHistology,
      );

      if (
        priorHistology === lesion.skinCancerAssessment.priorHistology &&
        currentHistology === lesion.skinCancerAssessment.currentHistology
      ) {
        return lesion;
      }

      groupChanged = true;
      return {
        ...lesion,
        skinCancerAssessment: {
          ...lesion.skinCancerAssessment,
          priorHistology,
          currentHistology,
        },
      };
    });

    if (!groupChanged) {
      return group;
    }

    changed = true;
    return {
      ...group,
      skinCancerAssessment,
      lesionInstances,
    };
  });

  if (!changed) {
    return c;
  }

  return {
    ...c,
    procedureDate: procedureDate ?? c.procedureDate,
    admissionDate,
    dischargeDate,
    injuryDate,
    diagnosisGroups,
  };
}

export function normalizeCaseBreastFields(c: Case): Case {
  const diagnosisGroups = c.diagnosisGroups.map((group) => {
    if (!group.breastAssessment) return group;

    return {
      ...group,
      breastAssessment: normalizeBreastAssessment(group.breastAssessment),
    };
  });

  return {
    ...c,
    diagnosisGroups,
  };
}
