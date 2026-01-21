import React, { useState } from "react";
import { View, StyleSheet, Pressable, TextInput } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { FractureClassificationWizard } from "@/components/FractureClassificationWizard";
import { 
  type Diagnosis, 
  type DiagnosisClinicalDetails, 
  type Laterality,
  type FractureEntry,
  type Specialty 
} from "@/types/case";

const LATERALITY_OPTIONS: { value: Laterality; label: string }[] = [
  { value: "left", label: "Left" },
  { value: "right", label: "Right" },
  { value: "bilateral", label: "Bilateral" },
  { value: "na", label: "N/A" },
];

interface DiagnosisClinicalFieldsProps {
  diagnosis: Diagnosis;
  onDiagnosisChange: (diagnosis: Diagnosis) => void;
  specialty?: Specialty;
  fractures?: FractureEntry[];
  onFracturesChange?: (fractures: FractureEntry[]) => void;
}

export function DiagnosisClinicalFields({
  diagnosis,
  onDiagnosisChange,
  specialty,
  fractures = [],
  onFracturesChange,
}: DiagnosisClinicalFieldsProps) {
  const { theme } = useTheme();
  const [showFractureWizard, setShowFractureWizard] = useState(false);

  const clinicalDetails = diagnosis.clinicalDetails || {};
  const isHandSurgery = specialty === "hand_surgery";
  const hasFractureDiagnosis = diagnosis.displayName?.toLowerCase().includes("fracture");

  const updateClinicalDetails = (updates: Partial<DiagnosisClinicalDetails>) => {
    onDiagnosisChange({
      ...diagnosis,
      clinicalDetails: { ...clinicalDetails, ...updates },
    });
  };

  const handleFractureSave = (newFractures: FractureEntry[]) => {
    onFracturesChange?.(newFractures);
    setShowFractureWizard(false);
  };

  const removeFracture = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onFracturesChange?.(fractures.filter((f) => f.id !== id));
  };

  return (
    <View style={styles.container}>
      <View style={styles.lateralitySection}>
        <ThemedText style={[styles.fieldLabel, { color: theme.text }]}>
          Laterality
        </ThemedText>
        <View style={styles.lateralityOptions}>
          {LATERALITY_OPTIONS.map((option) => {
            const isSelected = clinicalDetails.laterality === option.value;
            return (
              <Pressable
                key={option.value}
                style={[
                  styles.lateralityOption,
                  {
                    backgroundColor: isSelected ? theme.link : theme.backgroundSecondary,
                    borderColor: isSelected ? theme.link : theme.border,
                  },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  updateClinicalDetails({ laterality: option.value });
                }}
              >
                <ThemedText
                  style={[
                    styles.lateralityOptionText,
                    { color: isSelected ? "#FFF" : theme.text },
                  ]}
                >
                  {option.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </View>

      {isHandSurgery && (
        <>
          <View style={styles.fieldContainer}>
            <ThemedText style={[styles.fieldLabel, { color: theme.text }]}>
              Injury Mechanism
            </ThemedText>
            <TextInput
              style={[
                styles.textInput,
                { 
                  backgroundColor: theme.backgroundSecondary,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              value={clinicalDetails.injuryMechanism || ""}
              onChangeText={(text) => updateClinicalDetails({ injuryMechanism: text })}
              placeholder="e.g., Fall, crush, saw injury"
              placeholderTextColor={theme.textTertiary}
            />
          </View>

          <View style={styles.fieldContainer}>
            <ThemedText style={[styles.fieldLabel, { color: theme.text }]}>
              Nerve Status
            </ThemedText>
            <TextInput
              style={[
                styles.textInput,
                { 
                  backgroundColor: theme.backgroundSecondary,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              value={clinicalDetails.nerveStatus || ""}
              onChangeText={(text) => updateClinicalDetails({ nerveStatus: text })}
              placeholder="e.g., Digital nerves intact"
              placeholderTextColor={theme.textTertiary}
            />
          </View>

          <View style={styles.fieldContainer}>
            <ThemedText style={[styles.fieldLabel, { color: theme.text }]}>
              Tendon Injuries
            </ThemedText>
            <TextInput
              style={[
                styles.textInput,
                { 
                  backgroundColor: theme.backgroundSecondary,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              value={clinicalDetails.tendonInjuries || ""}
              onChangeText={(text) => updateClinicalDetails({ tendonInjuries: text })}
              placeholder="e.g., FDP zone 2"
              placeholderTextColor={theme.textTertiary}
            />
          </View>
        </>
      )}

      {hasFractureDiagnosis && onFracturesChange && (
        <View style={styles.fractureSection}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <Feather name="activity" size={18} color={theme.link} />
              <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
                AO/OTA Fracture Classification
              </ThemedText>
            </View>
            <Pressable
              style={[styles.addButton, { backgroundColor: theme.link }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowFractureWizard(true);
              }}
            >
              <Feather name="plus" size={16} color="#FFF" />
              <ThemedText style={styles.addButtonText}>Add</ThemedText>
            </Pressable>
          </View>

          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            Classify hand fractures using the AO/OTA 2018 system
          </ThemedText>

          {fractures.length > 0 ? (
            <View style={styles.fractureList}>
              {fractures.map((fracture) => (
                <View
                  key={fracture.id}
                  style={[styles.fractureCard, { backgroundColor: theme.backgroundTertiary }]}
                >
                  <View style={styles.fractureCardContent}>
                    <ThemedText style={[styles.fractureBoneName, { color: theme.text }]}>
                      {fracture.boneName}
                    </ThemedText>
                    <View style={[styles.aoCodeBadge, { backgroundColor: theme.link }]}>
                      <ThemedText style={styles.aoCodeBadgeText}>
                        {fracture.aoCode}
                      </ThemedText>
                    </View>
                  </View>
                  <Pressable onPress={() => removeFracture(fracture.id)} hitSlop={8}>
                    <Feather name="x-circle" size={20} color={theme.error} />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : (
            <Pressable
              style={[styles.emptyCard, { borderColor: theme.border }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowFractureWizard(true);
              }}
            >
              <Feather name="activity" size={28} color={theme.textTertiary} />
              <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
                Tap to classify fracture using AO/OTA system
              </ThemedText>
            </Pressable>
          )}

          <FractureClassificationWizard
            visible={showFractureWizard}
            onClose={() => setShowFractureWizard(false)}
            onSave={handleFractureSave}
            initialFractures={fractures}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
  },
  lateralitySection: {
    marginBottom: Spacing.md,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: Spacing.sm,
  },
  lateralityOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  lateralityOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  lateralityOptionText: {
    fontSize: 14,
    fontWeight: "500",
  },
  fieldContainer: {
    marginBottom: Spacing.md,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 16,
  },
  fractureSection: {
    marginTop: Spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 13,
    marginBottom: Spacing.md,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  addButtonText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "600",
  },
  fractureList: {
    gap: Spacing.sm,
  },
  fractureCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  fractureCardContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  fractureBoneName: {
    fontSize: 15,
    fontWeight: "500",
    flex: 1,
  },
  aoCodeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  aoCodeBadgeText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "monospace",
  },
  emptyCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  emptyText: {
    fontSize: 14,
  },
});
