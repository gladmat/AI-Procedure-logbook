import React from "react";
import { DiagnosisProcedureSection } from "@/components/case-form/DiagnosisProcedureSection";
import { TreatmentContextSection } from "@/components/case-form/TreatmentContextSection";
import { JointCaseContextSection } from "@/components/case-form/JointCaseContextSection";
import { useCaseFormState } from "@/contexts/CaseFormContext";
import {
  caseHasFlapProcedure,
  caseNeedsJointContext,
} from "@/lib/moduleVisibility";

interface CaseSectionProps {
  scrollViewRef: React.RefObject<any>;
  scrollPositionRef: React.MutableRefObject<number>;
}

export const CaseSection = React.memo(function CaseSection({
  scrollViewRef,
  scrollPositionRef,
}: CaseSectionProps) {
  const { state, specialty } = useCaseFormState();

  return (
    <>
      <DiagnosisProcedureSection
        scrollViewRef={scrollViewRef}
        scrollPositionRef={scrollPositionRef}
      />
      {caseHasFlapProcedure(state.diagnosisGroups) ? (
        <TreatmentContextSection />
      ) : null}
      {caseNeedsJointContext(specialty, state.diagnosisGroups) ? (
        <JointCaseContextSection />
      ) : null}
    </>
  );
});
