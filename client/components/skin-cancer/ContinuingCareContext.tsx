/**
 * ContinuingCareContext
 * ═════════════════════
 * Pathway C context fields — captures what happened before
 * this surgeon's involvement. Only rendered in continuing_care pathway.
 */

import React, { useState, useCallback, useMemo } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getClinicalPathway } from "@/lib/skinCancerConfig";
import type { SkinCancerLesionAssessment } from "@/types/skinCancer";

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

const PRIOR_PROCEDURE_OPTIONS: { value: string; label: string }[] = [
  { value: "excision_biopsy", label: "Excision biopsy" },
  { value: "incisional_biopsy", label: "Incisional biopsy" },
  { value: "shave_biopsy", label: "Shave biopsy" },
  { value: "punch_biopsy", label: "Punch biopsy" },
  { value: "incomplete_excision", label: "Incomplete excision" },
  { value: "mohs", label: "Mohs" },
];

const INDICATION_OPTIONS: {
  value: NonNullable<SkinCancerLesionAssessment["indication"]>;
  label: string;
}[] = [
  { value: "incomplete_margins", label: "Incomplete margins" },
  { value: "wider_excision", label: "Wider excision" },
  { value: "slnb", label: "SLNB" },
  { value: "delayed_reconstruction", label: "Delayed recon" },
  { value: "local_recurrence", label: "Local recurrence" },
  { value: "mohs_reconstruction", label: "Mohs recon" },
  { value: "mdt_decision", label: "MDT decision" },
];

const MDT_OPTIONS: {
  value: NonNullable<SkinCancerLesionAssessment["mdtReferral"]>;
  label: string;
}[] = [
  { value: "ssmdt", label: "SSMDT" },
  { value: "sarcoma_mdt", label: "Sarcoma MDT" },
  { value: "haematology_mdt", label: "Haematology MDT" },
  { value: "other", label: "Other" },
  { value: "none", label: "None" },
];

// ═══════════════════════════════════════════════════════════════
// Props
// ═══════════════════════════════════════════════════════════════

interface ContinuingCareContextProps {
  assessment: SkinCancerLesionAssessment;
  onChange: (partial: Partial<SkinCancerLesionAssessment>) => void;
}

// ═══════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════

export function ContinuingCareContext({
  assessment,
  onChange,
}: ContinuingCareContextProps) {
  const { theme } = useTheme();
  const [showMdtManual, setShowMdtManual] = useState(false);

  // MDT row auto-visible for complex_mdt pathway types
  const autoShowMdt = useMemo(() => {
    const histo = assessment.priorHistology;
    if (!histo?.pathologyCategory) return false;
    return (
      getClinicalPathway(histo.pathologyCategory, histo.rareSubtype) ===
      "complex_mdt"
    );
  }, [assessment.priorHistology]);

  const showMdtRow =
    autoShowMdt ||
    assessment.indication === "mdt_decision" ||
    showMdtManual ||
    assessment.mdtReferral !== undefined;

  const handlePriorProcedure = useCallback(
    (value: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onChange({
        priorProcedureType:
          assessment.priorProcedureType === value ? undefined : value,
      });
    },
    [assessment.priorProcedureType, onChange],
  );

  const handleIndication = useCallback(
    (value: NonNullable<SkinCancerLesionAssessment["indication"]>) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onChange({
        indication: assessment.indication === value ? undefined : value,
      });
    },
    [assessment.indication, onChange],
  );

  const handleMdt = useCallback(
    (value: NonNullable<SkinCancerLesionAssessment["mdtReferral"]>) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onChange({
        mdtReferral: assessment.mdtReferral === value ? undefined : value,
      });
    },
    [assessment.mdtReferral, onChange],
  );

  return (
    <View style={styles.container}>
      {/* Prior procedure */}
      <View style={styles.section}>
        <ThemedText
          style={[styles.sectionLabel, { color: theme.textSecondary }]}
        >
          PRIOR PROCEDURE
        </ThemedText>
        <View style={styles.chipRow}>
          {PRIOR_PROCEDURE_OPTIONS.map((opt) => {
            const isSelected = assessment.priorProcedureType === opt.value;
            return (
              <Pressable
                key={opt.value}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isSelected
                      ? theme.link
                      : theme.backgroundTertiary,
                    borderColor: isSelected ? theme.link : theme.border,
                  },
                ]}
                onPress={() => handlePriorProcedure(opt.value)}
              >
                <ThemedText
                  style={[
                    styles.chipText,
                    { color: isSelected ? theme.buttonText : theme.text },
                  ]}
                >
                  {opt.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Indication */}
      <View style={styles.section}>
        <ThemedText
          style={[styles.sectionLabel, { color: theme.textSecondary }]}
        >
          INDICATION
        </ThemedText>
        <View style={styles.chipRow}>
          {INDICATION_OPTIONS.map((opt) => {
            const isSelected = assessment.indication === opt.value;
            return (
              <Pressable
                key={opt.value}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isSelected
                      ? theme.link
                      : theme.backgroundTertiary,
                    borderColor: isSelected ? theme.link : theme.border,
                  },
                ]}
                onPress={() => handleIndication(opt.value)}
              >
                <ThemedText
                  style={[
                    styles.chipText,
                    { color: isSelected ? theme.buttonText : theme.text },
                  ]}
                >
                  {opt.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* MDT referral — conditional */}
      {showMdtRow ? (
        <View style={styles.section}>
          <ThemedText
            style={[styles.sectionLabel, { color: theme.textSecondary }]}
          >
            MDT REFERRAL
          </ThemedText>
          <View style={styles.chipRow}>
            {MDT_OPTIONS.map((opt) => {
              const isSelected = assessment.mdtReferral === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: isSelected
                        ? theme.link + "14"
                        : theme.backgroundElevated,
                      borderColor: isSelected ? theme.link : theme.border,
                    },
                  ]}
                  onPress={() => handleMdt(opt.value)}
                >
                  <ThemedText
                    style={[
                      styles.chipText,
                      { color: isSelected ? theme.buttonText : theme.text },
                    ]}
                  >
                    {opt.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : (
        <Pressable onPress={() => setShowMdtManual(true)}>
          <ThemedText style={[styles.showMdtLink, { color: theme.link }]}>
            Show MDT referral
          </ThemedText>
        </Pressable>
      )}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════
// Styles
// ═══════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    gap: Spacing.lg,
  },
  section: {
    gap: Spacing.sm,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 14,
    fontWeight: "500",
  },
  showMdtLink: {
    fontSize: 14,
    fontWeight: "500",
  },
});
