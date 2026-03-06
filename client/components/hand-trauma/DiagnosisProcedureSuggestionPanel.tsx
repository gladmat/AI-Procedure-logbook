/**
 * Auto-resolved diagnosis + suggested procedures panel.
 * Sticky at bottom of HandTraumaAssessment. Shows what the mapping engine
 * figured out from the surgeon's selections.
 *
 * - Diagnosis header (readonly — auto-resolved)
 * - Procedure checkboxes (default-checked, surgeon can toggle)
 * - "Accept & Continue" button
 */

import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { Feather } from "@/components/FeatherIcon";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Fonts } from "@/constants/theme";
import type { TraumaMappingResult } from "@/lib/handTraumaMapping";

interface DiagnosisProcedureSuggestionPanelProps {
  /** Resolved mapping result from handTraumaMapping engine */
  mappingResult: TraumaMappingResult | null;
  /** Which suggested procedures the surgeon has selected */
  selectedProcedureIds: Set<string>;
  /** Toggle a procedure selection */
  onToggleProcedure: (procedureId: string) => void;
  /** Accept the suggestions and continue */
  onAccept: (selectedProcedureIds: string[]) => void;
  /** Optional action to switch to manual diagnosis picker */
  onEditDiagnosis?: () => void;
  /** Optional action to add a manual procedure row */
  onAddProcedureManual?: () => void;
  /** Whether there are any structure-generated procedures (from tendon/nerve/vessel sections) */
  hasStructureProcedures?: boolean;
  /** Count of structure-generated procedures */
  structureProcedureCount?: number;
}

export function DiagnosisProcedureSuggestionPanel({
  mappingResult,
  selectedProcedureIds,
  onToggleProcedure,
  onAccept,
  onEditDiagnosis,
  onAddProcedureManual,
  hasStructureProcedures,
  structureProcedureCount = 0,
}: DiagnosisProcedureSuggestionPanelProps) {
  const { theme } = useTheme();

  const hasDiagnosis = mappingResult !== null;
  const hasProcedures =
    (mappingResult?.suggestedProcedures.length ?? 0) > 0 ||
    hasStructureProcedures;

  const isEmpty = !hasDiagnosis && !hasStructureProcedures;

  if (isEmpty) return null;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.backgroundSecondary,
          borderColor: theme.border,
        },
      ]}
    >
      {/* Diagnosis header */}
      {mappingResult ? (
        <View style={styles.diagnosisSection}>
          <View style={styles.diagnosisHeader}>
            <Feather name="target" size={16} color={theme.link} />
            <ThemedText
              style={[styles.diagnosisLabel, { color: theme.textSecondary }]}
            >
              SUGGESTED DIAGNOSIS
            </ThemedText>
          </View>
          <ThemedText
            style={[styles.diagnosisName, { color: theme.text }]}
            numberOfLines={2}
          >
            {mappingResult.primaryDiagnosis.displayName}
          </ThemedText>
          {mappingResult.primaryDiagnosis.snomedCtCode ? (
            <ThemedText
              style={[
                styles.snomedCode,
                { color: theme.textTertiary, fontFamily: Fonts?.mono },
              ]}
            >
              SNOMED {mappingResult.primaryDiagnosis.snomedCtCode}
            </ThemedText>
          ) : null}

          {onEditDiagnosis ? (
            <Pressable
              style={styles.editDiagnosisLink}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onEditDiagnosis();
              }}
            >
              <Feather name="edit-3" size={13} color={theme.link} />
              <ThemedText
                style={[styles.editDiagnosisLinkText, { color: theme.link }]}
              >
                Change diagnosis manually
              </ThemedText>
            </Pressable>
          ) : null}

          {/* Additional diagnoses */}
          {mappingResult.additionalDiagnoses &&
          mappingResult.additionalDiagnoses.length > 0 ? (
            <View style={styles.additionalDiagnoses}>
              {mappingResult.additionalDiagnoses.map((d) => (
                <ThemedText
                  key={d.diagnosisPicklistId}
                  style={[styles.additionalDx, { color: theme.textSecondary }]}
                >
                  + {d.displayName}
                </ThemedText>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Divider */}
      {mappingResult && hasProcedures ? (
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
      ) : null}

      {/* Suggested procedures */}
      {mappingResult && mappingResult.suggestedProcedures.length > 0 ? (
        <View style={styles.proceduresSection}>
          <ThemedText
            style={[styles.proceduresLabel, { color: theme.textSecondary }]}
          >
            SUGGESTED PROCEDURES
          </ThemedText>
          {mappingResult.suggestedProcedures.map((proc) => {
            const isChecked = selectedProcedureIds.has(
              proc.procedurePicklistId,
            );
            return (
              <Pressable
                key={proc.procedurePicklistId}
                style={styles.procedureRow}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onToggleProcedure(proc.procedurePicklistId);
                }}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      borderColor: isChecked ? theme.link : theme.textTertiary,
                      backgroundColor: isChecked ? theme.link : "transparent",
                    },
                  ]}
                >
                  {isChecked ? (
                    <Feather name="check" size={12} color={theme.buttonText} />
                  ) : null}
                </View>
                <View style={styles.procedureTextGroup}>
                  <ThemedText
                    style={[styles.procedureName, { color: theme.text }]}
                    numberOfLines={2}
                  >
                    {proc.displayName}
                  </ThemedText>
                  {proc.reason ? (
                    <ThemedText
                      style={[
                        styles.procedureReason,
                        { color: theme.textTertiary },
                      ]}
                      numberOfLines={1}
                    >
                      {proc.reason}
                    </ThemedText>
                  ) : null}
                </View>
              </Pressable>
            );
          })}
          {onAddProcedureManual ? (
            <Pressable
              style={styles.addProcedureLink}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onAddProcedureManual();
              }}
            >
              <Feather name="plus" size={13} color={theme.link} />
              <ThemedText
                style={[styles.addProcedureLinkText, { color: theme.link }]}
              >
                Add procedure manually
              </ThemedText>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {/* Structure procedure count */}
      {hasStructureProcedures ? (
        <View style={styles.structureNote}>
          <Feather name="layers" size={14} color={theme.textSecondary} />
          <ThemedText
            style={[styles.structureNoteText, { color: theme.textSecondary }]}
          >
            {structureProcedureCount} procedure
            {structureProcedureCount !== 1 ? "s" : ""} from structure selections
          </ThemedText>
        </View>
      ) : null}

      {/* Accept button */}
      <Pressable
        style={[styles.acceptButton, { backgroundColor: theme.link }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onAccept(Array.from(selectedProcedureIds));
        }}
      >
        <Feather name="check" size={18} color={theme.buttonText} />
        <ThemedText
          style={[styles.acceptButtonText, { color: theme.buttonText }]}
        >
          Accept & Continue
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  diagnosisSection: {
    gap: 4,
  },
  diagnosisHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  diagnosisLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  diagnosisName: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 22,
  },
  snomedCode: {
    fontSize: 12,
  },
  additionalDiagnoses: {
    marginTop: 4,
    gap: 2,
  },
  editDiagnosisLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: Spacing.xs,
  },
  editDiagnosisLinkText: {
    fontSize: 13,
    fontWeight: "500",
  },
  additionalDx: {
    fontSize: 13,
  },
  divider: {
    height: 1,
  },
  proceduresSection: {
    gap: Spacing.sm,
  },
  proceduresLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  procedureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    paddingVertical: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  procedureTextGroup: {
    flex: 1,
    gap: 1,
  },
  procedureName: {
    fontSize: 14,
    lineHeight: 20,
  },
  procedureReason: {
    fontSize: 12,
  },
  addProcedureLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: Spacing.xs,
  },
  addProcedureLinkText: {
    fontSize: 13,
    fontWeight: "500",
  },
  structureNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
  },
  structureNoteText: {
    fontSize: 13,
  },
  acceptButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
