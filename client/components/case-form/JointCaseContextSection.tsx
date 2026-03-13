import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { FormField, PickerField } from "@/components/FormField";
import { Spacing } from "@/constants/theme";
import { CollapsibleFormSection } from "@/components/case-form/CollapsibleFormSection";
import {
  useCaseFormState,
  useCaseFormDispatch,
} from "@/contexts/CaseFormContext";
import { setField } from "@/hooks/useCaseForm";
import {
  JOINT_CASE_PARTNER_SPECIALTY_LABELS,
  type JointCaseContext,
  type JointCasePartnerSpecialty,
} from "@/types/case";

/**
 * Case-level joint case context for H&N free flap cases.
 * Captures ENT/OMFS/neurosurgery collaboration details.
 * Visible when head_neck specialty + flap procedure.
 */
export const JointCaseContextSection = React.memo(
  function JointCaseContextSection() {
    const { state } = useCaseFormState();
    const { dispatch } = useCaseFormDispatch();

    const ctx = state.jointCaseContext;

    const update = (partial: Partial<JointCaseContext>) => {
      dispatch(
        setField("jointCaseContext", {
          isJointCase: true,
          ...ctx,
          ...partial,
        }),
      );
    };

    const filledCount = useMemo(() => {
      if (!ctx?.isJointCase) return 0;
      let count = 0;
      if (ctx.partnerSpecialty) count++;
      if (ctx.partnerConsultantName) count++;
      if (ctx.ablativeSurgeon) count++;
      if (ctx.reconstructionSequence) count++;
      return count;
    }, [ctx]);

    const isJoint = ctx?.isJointCase ?? false;

    return (
      <CollapsibleFormSection
        title="Joint Case"
        subtitle="Multi-team collaboration"
        filledCount={isJoint ? filledCount : 0}
        totalCount={4}
        defaultExpanded={false}
      >
        <View style={styles.content}>
          <PickerField
            label="Joint case with another team?"
            value={isJoint ? "yes" : "no"}
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            onSelect={(v) => {
              if (v === "yes") {
                update({ isJointCase: true });
              } else {
                dispatch(setField("jointCaseContext", undefined));
              }
            }}
          />

          {isJoint ? (
            <>
              <PickerField
                label="Partner Specialty"
                value={ctx?.partnerSpecialty || ""}
                options={Object.entries(
                  JOINT_CASE_PARTNER_SPECIALTY_LABELS,
                ).map(([value, label]) => ({ value, label }))}
                onSelect={(v) =>
                  update({
                    partnerSpecialty: v as JointCasePartnerSpecialty,
                  })
                }
              />

              <FormField
                label="Partner Consultant Name"
                value={ctx?.partnerConsultantName || ""}
                onChangeText={(text) =>
                  update({ partnerConsultantName: text || undefined })
                }
                placeholder="e.g., Mr Smith"
              />

              <PickerField
                label="Ablative Surgeon"
                value={ctx?.ablativeSurgeon || ""}
                options={[
                  { value: "partner", label: "Partner team" },
                  { value: "self", label: "Self" },
                ]}
                onSelect={(v) =>
                  update({
                    ablativeSurgeon: v as "partner" | "self",
                  })
                }
              />

              <PickerField
                label="Reconstruction Sequence"
                value={ctx?.reconstructionSequence || ""}
                options={[
                  { value: "immediate", label: "Immediate" },
                  { value: "delayed", label: "Delayed" },
                ]}
                onSelect={(v) =>
                  update({
                    reconstructionSequence: v as "immediate" | "delayed",
                  })
                }
              />
            </>
          ) : null}
        </View>
      </CollapsibleFormSection>
    );
  },
);

const styles = StyleSheet.create({
  content: {
    gap: Spacing.sm,
  },
});
