import React, { useMemo, useState } from "react";
import { View, Pressable, Modal, ScrollView, StyleSheet } from "react-native";
import { Feather } from "@/components/FeatherIcon";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import {
  FormField,
  PickerField,
  SelectField,
  DatePickerField,
} from "@/components/FormField";
import { SectionHeader } from "@/components/SectionHeader";
import { TimeField } from "@/components/TimeField";
import { CollapsibleFormSection } from "./CollapsibleFormSection";
import {
  useCaseFormState,
  useCaseFormDispatch,
} from "@/contexts/CaseFormContext";
import { setField } from "@/hooks/useCaseForm";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { parseDateOnlyValue } from "@/lib/dateValues";
import {
  AdmissionUrgency,
  StayType,
  SmokingStatus,
  ASAScore,
  ASA_GRADE_LABELS,
  ADMISSION_URGENCY_LABELS,
  STAY_TYPE_LABELS,
  SMOKING_STATUS_LABELS,
  COMMON_COMORBIDITIES,
  OperatingTeamRole,
  WoundInfectionRisk,
  AnaestheticType,
  OPERATING_TEAM_ROLE_LABELS,
} from "@/types/case";
import { EncounterClass, ENCOUNTER_CLASS_LABELS } from "@/types/episode";

// ── Constants ──────────────────────────────────────────────────────────────

const ASA_SHORT_LABELS: Record<ASAScore, string> = {
  1: "I",
  2: "II",
  3: "III",
  4: "IV",
  5: "V",
  6: "VI",
};

const ASA_DESCRIPTIONS: Record<ASAScore, string> = {
  1: "A normal healthy patient",
  2: "A patient with mild systemic disease (e.g., well-controlled DM, mild obesity, social drinker)",
  3: "A patient with severe systemic disease (e.g., poorly controlled DM, morbid obesity, active hepatitis, ESRD on dialysis)",
  4: "A patient with severe systemic disease that is a constant threat to life (e.g., recent MI/CVA/TIA, ongoing cardiac ischaemia)",
  5: "A moribund patient who is not expected to survive without the operation (e.g., ruptured AAA, massive trauma)",
  6: "A declared brain-dead patient whose organs are being removed for donor purposes",
};

const ANAESTHETIC_OPTIONS: { value: AnaestheticType; label: string }[] = [
  { value: "general", label: "GA" },
  { value: "local", label: "LA" },
  { value: "sedation_local", label: "Sedation + LA" },
  { value: "walant", label: "WALANT" },
];

const WOUND_RISK_OPTIONS: { value: WoundInfectionRisk; label: string }[] = [
  { value: "clean", label: "Clean" },
  { value: "clean_contaminated", label: "Clean/Contaminated" },
  { value: "contaminated", label: "Contaminated" },
  { value: "dirty", label: "Dirty" },
  { value: "na", label: "N/A" },
];

const TEAM_ROLES: { value: OperatingTeamRole; label: string }[] = [
  { value: "scrub_nurse", label: "Scrub Nurse" },
  { value: "circulating_nurse", label: "Circulating Nurse" },
  { value: "anaesthetist", label: "Anaesthetist" },
  { value: "anaesthetic_registrar", label: "Anaesthetic Registrar" },
  { value: "surgical_assistant", label: "Surgical Assistant" },
  { value: "surgical_registrar", label: "Surgical Registrar" },
  { value: "medical_student", label: "Medical Student" },
];

// ── Component ──────────────────────────────────────────────────────────────

export const OperativeSection = React.memo(function OperativeSection() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { state, showInjuryDate, durationDisplay, calculatedBmi } =
    useCaseFormState();
  const { dispatch, addTeamMember, removeTeamMember } = useCaseFormDispatch();
  const [showAsaInfo, setShowAsaInfo] = useState(false);

  const hasHandTraumaGroup = state.diagnosisGroups.some(
    (group) =>
      group.specialty === "hand_wrist" &&
      Boolean(group.diagnosisClinicalDetails?.handTrauma),
  );

  const asaNum = state.asaScore ? parseInt(state.asaScore) : 0;
  const showComorbidities = asaNum >= 2;

  const filledCount = useMemo(() => {
    let count = 0;
    if (state.admissionUrgency) count++;
    if (state.stayType) count++;
    if (state.anaestheticType) count++;
    if (state.surgeryStartTime) count++;
    return count;
  }, [
    state.admissionUrgency,
    state.stayType,
    state.anaestheticType,
    state.surgeryStartTime,
  ]);

  return (
    <CollapsibleFormSection
      title="Operative Details"
      subtitle="Admission, timing, team, and patient factors"
      filledCount={filledCount}
      totalCount={4}
    >
      {/* ── Admission & Timing ──────────────────────────────────────────── */}

      <SectionHeader title="Admission & Timing" />

      <View style={styles.row}>
        <View style={styles.halfField}>
          <ThemedText
            style={[styles.fieldLabel, { color: theme.textSecondary }]}
          >
            Urgency
          </ThemedText>
          <View
            style={[
              styles.segmentedControl,
              {
                borderColor: theme.border,
                backgroundColor: theme.backgroundDefault,
              },
            ]}
          >
            {(
              Object.entries(ADMISSION_URGENCY_LABELS) as [
                AdmissionUrgency,
                string,
              ][]
            ).map(([value, label]) => {
              const isSelected = state.admissionUrgency === value;
              return (
                <Pressable
                  key={value}
                  testID={`toggle-urgency-${value}`}
                  style={[
                    styles.segmentedButton,
                    isSelected ? { backgroundColor: theme.link } : undefined,
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    dispatch(setField("admissionUrgency", value));
                  }}
                >
                  <ThemedText
                    style={[
                      styles.segmentedButtonText,
                      { color: isSelected ? "#FFFFFF" : theme.textSecondary },
                    ]}
                  >
                    {label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>
        <View style={styles.halfField}>
          <ThemedText
            style={[styles.fieldLabel, { color: theme.textSecondary }]}
          >
            Stay Type
          </ThemedText>
          <View
            style={[
              styles.segmentedControl,
              {
                borderColor: theme.border,
                backgroundColor: theme.backgroundDefault,
              },
            ]}
          >
            {(Object.entries(STAY_TYPE_LABELS) as [StayType, string][]).map(
              ([value, label]) => {
                const isSelected = state.stayType === value;
                return (
                  <Pressable
                    key={value}
                    testID={`toggle-stay-${value}`}
                    style={[
                      styles.segmentedButton,
                      isSelected ? { backgroundColor: theme.link } : undefined,
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      dispatch(setField("stayType", value));
                    }}
                  >
                    <ThemedText
                      style={[
                        styles.segmentedButtonText,
                        { color: isSelected ? "#FFFFFF" : theme.textSecondary },
                      ]}
                    >
                      {label}
                    </ThemedText>
                  </Pressable>
                );
              },
            )}
          </View>
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.halfField}>
          <DatePickerField
            label="Admission Date"
            value={state.admissionDate}
            onChange={(v: string) => dispatch(setField("admissionDate", v))}
            maximumDate={new Date()}
          />
        </View>
        <View style={styles.halfField}>
          <DatePickerField
            label="Discharge Date"
            value={state.dischargeDate}
            onChange={(v: string) => dispatch(setField("dischargeDate", v))}
            minimumDate={parseDateOnlyValue(state.admissionDate) ?? undefined}
            clearable
          />
        </View>
      </View>

      {showInjuryDate && !hasHandTraumaGroup ? (
        <View style={styles.row}>
          <View style={styles.halfField}>
            <DatePickerField
              label="Day of Injury"
              value={state.injuryDate}
              onChange={(v: string) => dispatch(setField("injuryDate", v))}
              placeholder="Select date..."
              maximumDate={new Date()}
            />
          </View>
        </View>
      ) : null}

      {state.episodeId ? (
        <SelectField
          label="Encounter Class"
          value={state.encounterClass}
          options={Object.entries(ENCOUNTER_CLASS_LABELS).map(
            ([value, label]) => ({ value, label }),
          )}
          onSelect={(v: string) =>
            dispatch(setField("encounterClass", v as EncounterClass))
          }
        />
      ) : null}

      <View style={styles.row}>
        <View style={styles.halfField}>
          <TimeField
            label="Start Time"
            value={state.surgeryStartTime}
            onChangeText={(v: string) =>
              dispatch(setField("surgeryStartTime", v))
            }
            placeholder="e.g., 0830"
          />
        </View>
        <View style={styles.halfField}>
          <TimeField
            label="End Time"
            value={state.surgeryEndTime}
            onChangeText={(v: string) =>
              dispatch(setField("surgeryEndTime", v))
            }
            placeholder="e.g., 1415"
          />
        </View>
      </View>

      {durationDisplay ? (
        <View
          style={[
            styles.durationCard,
            { backgroundColor: theme.link + "10" },
          ]}
        >
          <Feather name="clock" size={16} color={theme.link} />
          <ThemedText style={[styles.durationText, { color: theme.link }]}>
            Duration: {durationDisplay}
          </ThemedText>
        </View>
      ) : null}

      {/* ── Team & Anaesthesia ──────────────────────────────────────────── */}

      <SectionHeader title="Team & Anaesthesia" />

      <SelectField
        label="Anaesthetic Type"
        value={state.anaestheticType}
        options={ANAESTHETIC_OPTIONS}
        onSelect={(v: string) =>
          dispatch(setField("anaestheticType", v as AnaestheticType))
        }
      />

      {state.operatingTeam.length > 0 ? (
        <View style={styles.teamList}>
          {state.operatingTeam.map((member) => (
            <View
              key={member.id}
              style={[
                styles.teamMemberCard,
                { backgroundColor: theme.backgroundDefault },
              ]}
            >
              <View style={styles.teamMemberInfo}>
                <ThemedText style={styles.teamMemberName}>
                  {member.name}
                </ThemedText>
                <ThemedText
                  style={[
                    styles.teamMemberRole,
                    { color: theme.textSecondary },
                  ]}
                >
                  {OPERATING_TEAM_ROLE_LABELS[member.role]}
                </ThemedText>
              </View>
              <Pressable
                onPress={() => removeTeamMember(member.id)}
                hitSlop={8}
              >
                <Feather name="x" size={20} color={theme.textTertiary} />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.addTeamMemberContainer}>
        <View style={styles.row}>
          <View style={styles.halfField}>
            <FormField
              label="Name"
              value={state.newTeamMemberName}
              onChangeText={(v: string) =>
                dispatch(setField("newTeamMemberName", v))
              }
              placeholder="Team member name"
            />
          </View>
          <View style={styles.halfField}>
            <PickerField
              label="Role"
              value={state.newTeamMemberRole}
              options={TEAM_ROLES}
              onSelect={(v: string) =>
                dispatch(
                  setField("newTeamMemberRole", v as OperatingTeamRole),
                )
              }
            />
          </View>
        </View>
        <Pressable
          style={[styles.addButton, { backgroundColor: theme.link + "15" }]}
          onPress={addTeamMember}
        >
          <Feather name="plus" size={18} color={theme.link} />
          <ThemedText style={[styles.addButtonText, { color: theme.link }]}>
            Add Team Member
          </ThemedText>
        </Pressable>
      </View>

      {/* ── Surgical Factors ────────────────────────────────────────────── */}

      <SectionHeader title="Surgical Factors" />

      <SelectField
        label="Wound Infection Risk"
        value={state.woundInfectionRisk}
        options={WOUND_RISK_OPTIONS}
        onSelect={(v: string) =>
          dispatch(setField("woundInfectionRisk", v as WoundInfectionRisk))
        }
      />

      <View style={styles.checkboxRow}>
        <Pressable
          style={[
            styles.checkbox,
            {
              backgroundColor: state.antibioticProphylaxis
                ? theme.link + "20"
                : theme.backgroundDefault,
              borderColor: state.antibioticProphylaxis
                ? theme.link
                : theme.border,
            },
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            dispatch(
              setField("antibioticProphylaxis", !state.antibioticProphylaxis),
            );
          }}
        >
          {state.antibioticProphylaxis ? (
            <Feather name="check" size={16} color={theme.link} />
          ) : null}
        </Pressable>
        <ThemedText style={styles.checkboxLabel}>
          Antibiotic Prophylaxis Given
        </ThemedText>
      </View>

      <View style={styles.checkboxRow}>
        <Pressable
          style={[
            styles.checkbox,
            {
              backgroundColor: state.dvtProphylaxis
                ? theme.link + "20"
                : theme.backgroundDefault,
              borderColor: state.dvtProphylaxis ? theme.link : theme.border,
            },
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            dispatch(setField("dvtProphylaxis", !state.dvtProphylaxis));
          }}
        >
          {state.dvtProphylaxis ? (
            <Feather name="check" size={16} color={theme.link} />
          ) : null}
        </Pressable>
        <ThemedText style={styles.checkboxLabel}>
          DVT Prophylaxis Given
        </ThemedText>
      </View>

      {/* ── Patient Factors (collapsed by default) ──────────────────────── */}

      <SectionHeader title="Patient Factors" />

      <View style={styles.labelRow}>
        <ThemedText
          style={[styles.fieldLabel, { color: theme.textSecondary }]}
        >
          ASA Score
        </ThemedText>
        <Pressable
          onPress={() => setShowAsaInfo(true)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="info" size={16} color={theme.textTertiary} />
        </Pressable>
      </View>
      <View
        style={[
          styles.segmentedControl,
          {
            borderColor: theme.border,
            backgroundColor: theme.backgroundDefault,
          },
        ]}
      >
        {(Object.entries(ASA_SHORT_LABELS) as [string, string][]).map(
          ([value, label]) => {
            const isSelected = state.asaScore === value;
            return (
              <Pressable
                key={value}
                style={[
                  styles.segmentedButton,
                  isSelected ? { backgroundColor: theme.link } : undefined,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  dispatch(setField("asaScore", value));
                }}
              >
                <ThemedText
                  style={[
                    styles.segmentedButtonText,
                    { color: isSelected ? "#FFFFFF" : theme.textSecondary },
                  ]}
                >
                  {label}
                </ThemedText>
              </Pressable>
            );
          },
        )}
      </View>
      {state.asaScore ? (
        <ThemedText
          style={[styles.asaDescription, { color: theme.textTertiary }]}
        >
          {ASA_GRADE_LABELS[parseInt(state.asaScore) as ASAScore]}
        </ThemedText>
      ) : null}

      <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>
        Smoking Status
      </ThemedText>
      <View
        style={[
          styles.segmentedControl,
          {
            borderColor: theme.border,
            backgroundColor: theme.backgroundDefault,
          },
        ]}
      >
        {(
          Object.entries(SMOKING_STATUS_LABELS) as [SmokingStatus, string][]
        ).map(([value, label]) => {
          const isSelected = state.smoker === value;
          return (
            <Pressable
              key={value}
              style={[
                styles.segmentedButton,
                isSelected ? { backgroundColor: theme.link } : undefined,
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                dispatch(setField("smoker", value));
              }}
            >
              <ThemedText
                style={[
                  styles.segmentedButtonText,
                  { color: isSelected ? "#FFFFFF" : theme.textSecondary },
                ]}
              >
                {label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.row}>
        <View style={styles.thirdField}>
          <FormField
            label="Height"
            value={state.heightCm}
            onChangeText={(v: string) => dispatch(setField("heightCm", v))}
            placeholder="170"
            keyboardType="decimal-pad"
            unit="cm"
          />
        </View>
        <View style={styles.thirdField}>
          <FormField
            label="Weight"
            value={state.weightKg}
            onChangeText={(v: string) => dispatch(setField("weightKg", v))}
            placeholder="70"
            keyboardType="decimal-pad"
            unit="kg"
          />
        </View>
        <View style={styles.thirdField}>
          <View style={styles.bmiDisplay}>
            <ThemedText
              style={[styles.bmiLabel, { color: theme.textSecondary }]}
            >
              BMI
            </ThemedText>
            <ThemedText
              style={[
                styles.bmiValue,
                { color: calculatedBmi ? theme.text : theme.textTertiary },
              ]}
            >
              {calculatedBmi ? calculatedBmi.toFixed(1) : "--"}
            </ThemedText>
          </View>
        </View>
      </View>

      {showComorbidities ? (
        <>
          <SectionHeader
            title="Co-morbidities"
            subtitle="Select all that apply"
          />

          <View style={styles.comorbidityGrid}>
            {COMMON_COMORBIDITIES.slice(0, 20).map((comorbidity) => {
              const isSelected = state.selectedComorbidities.some(
                (c) => c.snomedCtCode === comorbidity.snomedCtCode,
              );
              return (
                <Pressable
                  key={comorbidity.snomedCtCode}
                  style={[
                    styles.comorbidityChip,
                    {
                      backgroundColor: isSelected
                        ? theme.link + "20"
                        : theme.backgroundDefault,
                      borderColor: isSelected ? theme.link : theme.border,
                    },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    if (isSelected) {
                      dispatch(
                        setField(
                          "selectedComorbidities",
                          state.selectedComorbidities.filter(
                            (c) =>
                              c.snomedCtCode !== comorbidity.snomedCtCode,
                          ),
                        ),
                      );
                    } else {
                      dispatch(
                        setField("selectedComorbidities", [
                          ...state.selectedComorbidities,
                          comorbidity,
                        ]),
                      );
                    }
                  }}
                >
                  <ThemedText
                    style={[
                      styles.comorbidityText,
                      { color: isSelected ? theme.link : theme.text },
                    ]}
                  >
                    {comorbidity.commonName || comorbidity.displayName}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : null}

      {/* ASA Info Modal */}
      <Modal
        visible={showAsaInfo}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAsaInfo(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowAsaInfo(false)}
        >
          <Pressable
            style={[
              styles.modalContent,
              {
                backgroundColor: theme.backgroundElevated,
                paddingBottom: insets.bottom,
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View
              style={[
                styles.modalHeader,
                { borderBottomColor: theme.border },
              ]}
            >
              <ThemedText style={[styles.modalTitle, { color: theme.text }]}>
                ASA Physical Status Classification
              </ThemedText>
              <Pressable
                onPress={() => setShowAsaInfo(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name="x" size={22} color={theme.textSecondary} />
              </Pressable>
            </View>
            <ScrollView style={styles.modalBody}>
              {(Object.entries(ASA_SHORT_LABELS) as [string, string][]).map(
                ([value, roman]) => (
                  <View
                    key={value}
                    style={[
                      styles.asaRow,
                      { borderBottomColor: theme.border },
                    ]}
                  >
                    <View
                      style={[
                        styles.asaBadge,
                        {
                          backgroundColor: theme.link + "15",
                        },
                      ]}
                    >
                      <ThemedText
                        style={[styles.asaBadgeText, { color: theme.link }]}
                      >
                        {roman}
                      </ThemedText>
                    </View>
                    <View style={styles.asaTextContainer}>
                      <ThemedText
                        style={[styles.asaGradeLabel, { color: theme.text }]}
                      >
                        {ASA_GRADE_LABELS[parseInt(value) as ASAScore]}
                      </ThemedText>
                      <ThemedText
                        style={[
                          styles.asaGradeDesc,
                          { color: theme.textSecondary },
                        ]}
                      >
                        {ASA_DESCRIPTIONS[parseInt(value) as ASAScore]}
                      </ThemedText>
                    </View>
                  </View>
                ),
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </CollapsibleFormSection>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  halfField: {
    flex: 1,
  },
  thirdField: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  segmentedControl: {
    flexDirection: "row",
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden" as const,
  },
  segmentedButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  segmentedButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  asaDescription: {
    fontSize: 12,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  durationCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  durationText: {
    fontSize: 14,
    fontWeight: "500",
  },
  teamList: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  teamMemberCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  teamMemberInfo: {
    flex: 1,
  },
  teamMemberName: {
    fontSize: 15,
    fontWeight: "500",
  },
  teamMemberRole: {
    fontSize: 13,
    marginTop: 2,
  },
  addTeamMemberContainer: {
    marginBottom: Spacing.md,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderStyle: "dashed",
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginVertical: Spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.xs,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxLabel: {
    fontSize: 15,
    flex: 1,
  },
  bmiDisplay: {
    paddingTop: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 56,
  },
  bmiLabel: {
    fontSize: 12,
    marginBottom: Spacing.xs,
  },
  bmiValue: {
    fontSize: 20,
    fontWeight: "600",
  },
  comorbidityGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  comorbidityChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  comorbidityText: {
    fontSize: 13,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
  },
  modalContent: {
    borderRadius: BorderRadius.lg,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "600",
    flex: 1,
  },
  modalBody: {
    paddingHorizontal: Spacing.lg,
  },
  asaRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.md,
  },
  asaBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  asaBadgeText: {
    fontSize: 14,
    fontWeight: "700",
  },
  asaTextContainer: {
    flex: 1,
  },
  asaGradeLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  asaGradeDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
});
