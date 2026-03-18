/**
 * Modal sheet for unified hand trauma assessment.
 * Wraps HandTraumaAssessment with local Save/Cancel semantics and optional
 * diagnosis auto-resolution callback.
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import * as Haptics from "expo-haptics";
import { DetailModuleSheet } from "./DetailModuleSheet";
import {
  HandTraumaAssessment,
  type HandTraumaAssessmentAcceptPayload,
} from "@/components/hand-trauma/HandTraumaAssessment";
import {
  resolveTraumaDiagnosis,
  type InjuryCategory,
  type TraumaMappingResult,
} from "@/lib/handTraumaMapping";
import type {
  CaseProcedure,
  FractureEntry,
  HandTraumaDetails,
  HandTraumaStructure,
} from "@/types/case";
import type { DiagnosisPicklistEntry } from "@/types/diagnosis";

export interface HandTraumaDiagnosisResolution {
  mappingResult: TraumaMappingResult;
  fractures: FractureEntry[];
  handTrauma: HandTraumaDetails;
  procedures: CaseProcedure[];
  selectedSuggestedProcedureIds?: string[];
}

interface HandTraumaSheetProps {
  visible: boolean;
  onClose: () => void;
  onSave: (
    details: HandTraumaDetails,
    procedures: CaseProcedure[],
    fractures: FractureEntry[],
  ) => void;
  onDiagnosisResolved?: (resolution: HandTraumaDiagnosisResolution) => void;
  initialDetails: HandTraumaDetails;
  selectedDiagnosis?: DiagnosisPicklistEntry;
  initialProcedures: CaseProcedure[];
  initialFractures: FractureEntry[];
  onFracturesChange?: (fractures: FractureEntry[]) => void;
}

function deriveActiveCategories(
  details: HandTraumaDetails,
  fractures: FractureEntry[],
): InjuryCategory[] {
  const categories = new Set<InjuryCategory>();
  const injuredStructures: HandTraumaStructure[] =
    details.injuredStructures ?? [];
  const dislocations = details.dislocations ?? [];

  if (fractures.length > 0) categories.add("fracture");
  if (dislocations.length > 0) categories.add("dislocation");

  if (
    injuredStructures.some(
      (s) => s.category === "flexor_tendon" || s.category === "extensor_tendon",
    )
  ) {
    categories.add("tendon");
  }
  if (injuredStructures.some((s) => s.category === "nerve"))
    categories.add("nerve");
  if (injuredStructures.some((s) => s.category === "artery"))
    categories.add("vessel");

  if (
    details.isHighPressureInjection ||
    details.isFightBite ||
    details.isCompartmentSyndrome ||
    details.isRingAvulsion ||
    (details.digitAmputations && details.digitAmputations.length > 0) ||
    injuredStructures.some(
      (s) => s.category === "ligament" || s.category === "other",
    )
  ) {
    categories.add("soft_tissue");
  }

  return Array.from(categories);
}

export function HandTraumaSheet({
  visible,
  onClose,
  onSave,
  onDiagnosisResolved,
  initialDetails,
  selectedDiagnosis,
  initialProcedures,
  initialFractures,
  onFracturesChange,
}: HandTraumaSheetProps) {
  const [localDetails, setLocalDetails] =
    useState<HandTraumaDetails>(initialDetails);
  const [localProcedures, setLocalProcedures] =
    useState<CaseProcedure[]>(initialProcedures);
  const [localFractures, setLocalFractures] =
    useState<FractureEntry[]>(initialFractures);

  useEffect(() => {
    if (!visible) return;
    setLocalDetails(initialDetails);
    setLocalProcedures(initialProcedures);
    setLocalFractures(initialFractures);
  }, [visible, initialDetails, initialProcedures, initialFractures]);

  const activeCategories = useMemo(
    () => deriveActiveCategories(localDetails, localFractures),
    [localDetails, localFractures],
  );

  const resolveMapping = useCallback(() => {
    return resolveTraumaDiagnosis({
      affectedDigits: localDetails.affectedDigits ?? [],
      activeCategories,
      fractures: localFractures,
      dislocations: localDetails.dislocations,
      injuredStructures: localDetails.injuredStructures,
      isHighPressureInjection: localDetails.isHighPressureInjection,
      isFightBite: localDetails.isFightBite,
      isCompartmentSyndrome: localDetails.isCompartmentSyndrome,
      isRingAvulsion: localDetails.isRingAvulsion,
      digitAmputations: localDetails.digitAmputations,
    });
  }, [activeCategories, localDetails, localFractures]);

  const handleSave = useCallback(
    (accepted?: HandTraumaAssessmentAcceptPayload) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onSave(localDetails, localProcedures, localFractures);
      onFracturesChange?.(localFractures);

      if (onDiagnosisResolved) {
        const mappingResult = accepted?.mappingResult ?? resolveMapping();

        if (mappingResult) {
          onDiagnosisResolved({
            mappingResult,
            fractures: localFractures,
            handTrauma: localDetails,
            procedures: localProcedures,
            selectedSuggestedProcedureIds: accepted?.selectedProcedureIds,
          });
        }
      }

      onClose();
    },
    [
      onClose,
      onSave,
      onDiagnosisResolved,
      onFracturesChange,
      localDetails,
      localFractures,
      localProcedures,
      resolveMapping,
    ],
  );

  const handleAssessmentAccept = useCallback(
    (payload: HandTraumaAssessmentAcceptPayload) => {
      handleSave(payload);
    },
    [handleSave],
  );

  const handleProceduresChange = useCallback(
    (updater: (prev: CaseProcedure[]) => CaseProcedure[]) => {
      setLocalProcedures(updater);
    },
    [],
  );

  return (
    <DetailModuleSheet
      visible={visible}
      title="Hand Trauma Assessment"
      subtitle="Injuries, classification & procedures"
      onSave={handleSave}
      onCancel={onClose}
    >
      <HandTraumaAssessment
        value={localDetails}
        onChange={setLocalDetails}
        fractures={localFractures}
        onFracturesChange={setLocalFractures}
        procedures={localProcedures}
        onProceduresChange={handleProceduresChange}
        selectedDiagnosis={selectedDiagnosis}
        onAccept={handleAssessmentAccept}
      />
    </DetailModuleSheet>
  );
}
