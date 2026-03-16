/**
 * DupuytrenAssessment — inline per-ray joint-level contracture assessment.
 *
 * Renders inside HandElectiveAssessment's Classification section when
 * the selected diagnosis has `hasDupuytrenAssessment: true`.
 *
 * Layout:
 *   Finger chip row (multi-select → adds ray cards)
 *   Per-finger cards (MCP/PIP steppers + auto Tubiana)
 *   First web space toggle
 *   Previous treatment (recurrent only, collapsible)
 *   Diathesis features (Tier 3, collapsible)
 */

import React, { useState, useCallback } from "react";
import { View, Pressable, LayoutAnimation, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { Feather } from "@/components/FeatherIcon";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import {
  buildRayAssessment,
  updateRayJointDeficit,
  calculateDupuytrenSummary,
  calculateDiathesisScore,
  FINGER_ORDER,
  COMMON_DUPUYTREN_FINGERS,
  getFingerLabel,
} from "@/lib/dupuytrenHelpers";
import type {
  DupuytrenAssessment as DupuytrenAssessmentType,
  DupuytrenFingerId,
  DupuytrenRayAssessment,
  DupuytrenDiathesis,
  DupuytrenPreviousTreatment,
  TubianaStage,
} from "@/types/dupuytren";
import { PREVIOUS_TREATMENT_LABELS } from "@/types/dupuytren";

// ── Props ────────────────────────────────────────────────────────────────────

interface DupuytrenAssessmentProps {
  value: DupuytrenAssessmentType | undefined;
  onChange: (assessment: DupuytrenAssessmentType) => void;
  laterality: "left" | "right" | undefined;
  isRevision: boolean;
}

// ── Stepper Component ────────────────────────────────────────────────────────

function DegreeStepper({
  label,
  value,
  onChange,
  step = 5,
  min = 0,
  max = 180,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
}) {
  const { theme } = useTheme();

  const decrement = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(Math.max(min, value - step));
  };
  const increment = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(Math.min(max, value + step));
  };

  return (
    <View style={styles.stepperRow}>
      <ThemedText
        style={[styles.stepperLabel, { color: theme.textSecondary }]}
        numberOfLines={1}
      >
        {label}
      </ThemedText>
      <View style={styles.stepperControls}>
        <Pressable
          onPress={decrement}
          style={[
            styles.stepperButton,
            { backgroundColor: theme.backgroundTertiary },
          ]}
          disabled={value <= min}
        >
          <ThemedText
            style={{
              color: value <= min ? theme.textTertiary : theme.text,
              fontSize: 16,
              fontWeight: "700",
            }}
          >
            −
          </ThemedText>
        </Pressable>
        <View
          style={[
            styles.stepperValue,
            { backgroundColor: theme.backgroundSecondary },
          ]}
        >
          <ThemedText
            style={{
              color: theme.text,
              fontSize: 15,
              fontWeight: "600",
              fontVariant: ["tabular-nums"],
            }}
          >
            {value}°
          </ThemedText>
        </View>
        <Pressable
          onPress={increment}
          style={[
            styles.stepperButton,
            { backgroundColor: theme.backgroundTertiary },
          ]}
          disabled={value >= max}
        >
          <ThemedText
            style={{
              color: value >= max ? theme.textTertiary : theme.text,
              fontSize: 16,
              fontWeight: "700",
            }}
          >
            +
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

// ── Tubiana Stage Badge ──────────────────────────────────────────────────────

function TubianaBadge({ stage, total }: { stage: TubianaStage; total: number }) {
  const { theme } = useTheme();
  const isZero = stage === "N";
  return (
    <View
      style={[
        styles.tubianaBadge,
        {
          backgroundColor: isZero
            ? theme.backgroundTertiary
            : `${theme.link}18`,
          borderColor: isZero ? theme.border : theme.link,
        },
      ]}
    >
      <ThemedText
        style={{
          fontSize: 12,
          fontWeight: "600",
          color: isZero ? theme.textSecondary : theme.link,
        }}
      >
        Tubiana {stage} ({total}°)
      </ThemedText>
    </View>
  );
}

// ── Ray Card ─────────────────────────────────────────────────────────────────

function RayCard({
  ray,
  onUpdate,
}: {
  ray: DupuytrenRayAssessment;
  onUpdate: (updated: DupuytrenRayAssessment) => void;
}) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.rayCard,
        {
          backgroundColor: theme.backgroundSecondary,
          borderColor: theme.border,
        },
      ]}
    >
      <View style={styles.rayHeader}>
        <ThemedText style={[styles.rayTitle, { color: theme.text }]}>
          {getFingerLabel(ray.fingerId)}
        </ThemedText>
        <TubianaBadge
          stage={ray.tubianaStage}
          total={ray.totalExtensionDeficit}
        />
      </View>
      <DegreeStepper
        label="MCP deficit"
        value={ray.mcpExtensionDeficit}
        onChange={(v) => onUpdate(updateRayJointDeficit(ray, "mcp", v))}
      />
      <DegreeStepper
        label="PIP deficit"
        value={ray.pipExtensionDeficit}
        onChange={(v) => onUpdate(updateRayJointDeficit(ray, "pip", v))}
      />
    </View>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export const DupuytrenAssessment = React.memo(function DupuytrenAssessment({
  value,
  onChange,
  laterality,
  isRevision,
}: DupuytrenAssessmentProps) {
  const { theme } = useTheme();
  const [showPreviousTreatment, setShowPreviousTreatment] = useState(
    !!(value?.previousTreatment?.procedureType),
  );
  const [showDiathesis, setShowDiathesis] = useState(
    !!(
      value?.diathesis &&
      (value.diathesis.familyHistory ||
        value.diathesis.bilateralDisease ||
        value.diathesis.ectopicLesions ||
        value.diathesis.onsetBeforeAge50)
    ),
  );

  const assessment: DupuytrenAssessmentType = value ?? {
    rays: [],
    isRevision,
  };

  const selectedFingerIds = new Set(assessment.rays.map((r) => r.fingerId));

  const emitChange = useCallback(
    (next: DupuytrenAssessmentType) => {
      const summary = calculateDupuytrenSummary(next);
      onChange({ ...next, ...summary });
    },
    [onChange],
  );

  // ── Finger toggle ──────────────────────────────────────────────────

  const toggleFinger = (fingerId: DupuytrenFingerId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    if (selectedFingerIds.has(fingerId)) {
      emitChange({
        ...assessment,
        rays: assessment.rays.filter((r) => r.fingerId !== fingerId),
      });
    } else {
      const newRay = buildRayAssessment(fingerId, 0, 0);
      const newRays = [...assessment.rays, newRay].sort(
        (a, b) => FINGER_ORDER.indexOf(a.fingerId) - FINGER_ORDER.indexOf(b.fingerId),
      );
      emitChange({ ...assessment, rays: newRays });
    }
  };

  // ── Ray update ─────────────────────────────────────────────────────

  const updateRay = (updated: DupuytrenRayAssessment) => {
    emitChange({
      ...assessment,
      rays: assessment.rays.map((r) =>
        r.fingerId === updated.fingerId ? updated : r,
      ),
    });
  };

  // ── First web space ────────────────────────────────────────────────

  const toggleWebSpace = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const isAffected = !assessment.firstWebSpace?.isAffected;
    emitChange({
      ...assessment,
      firstWebSpace: isAffected ? { isAffected: true } : undefined,
    });
  };

  // ── Previous treatment ─────────────────────────────────────────────

  const updatePreviousTreatment = (pt: DupuytrenPreviousTreatment) => {
    emitChange({ ...assessment, previousTreatment: pt });
  };

  // ── Diathesis ──────────────────────────────────────────────────────

  const updateDiathesis = (d: DupuytrenDiathesis) => {
    emitChange({ ...assessment, diathesis: d });
  };

  const diathesisScore = assessment.diathesis
    ? calculateDiathesisScore(assessment.diathesis)
    : 0;

  // ── Render ─────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* Finger chips */}
      <View style={styles.section}>
        <ThemedText
          style={[styles.sectionLabel, { color: theme.textSecondary }]}
        >
          AFFECTED FINGERS
        </ThemedText>
        <ThemedText
          style={[styles.sectionHint, { color: theme.textTertiary }]}
        >
          Tap to add rays
        </ThemedText>
        <View style={styles.chipRow}>
          {FINGER_ORDER.map((id) => {
            const isSelected = selectedFingerIds.has(id);
            const isCommon = COMMON_DUPUYTREN_FINGERS.includes(id);
            return (
              <Pressable
                key={id}
                onPress={() => toggleFinger(id)}
                style={[
                  styles.fingerChip,
                  {
                    backgroundColor: isSelected
                      ? theme.link
                      : theme.backgroundTertiary,
                    borderColor: isSelected
                      ? theme.link
                      : isCommon
                        ? `${theme.link}40`
                        : theme.border,
                  },
                ]}
              >
                <ThemedText
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: isSelected ? theme.buttonText : theme.text,
                  }}
                >
                  {getFingerLabel(id)}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Per-finger ray cards */}
      {assessment.rays.map((ray) => (
        <RayCard key={ray.fingerId} ray={ray} onUpdate={updateRay} />
      ))}

      {/* First web space toggle */}
      <Pressable onPress={toggleWebSpace} style={styles.toggleRow}>
        <Feather
          name={
            assessment.firstWebSpace?.isAffected
              ? "check-square"
              : "square"
          }
          size={18}
          color={
            assessment.firstWebSpace?.isAffected
              ? theme.link
              : theme.textSecondary
          }
        />
        <ThemedText
          style={{
            fontSize: 14,
            color: assessment.firstWebSpace?.isAffected
              ? theme.text
              : theme.textSecondary,
          }}
        >
          First web space involved
        </ThemedText>
      </Pressable>

      {/* Previous treatment (recurrent only) */}
      {isRevision ? (
        <View style={styles.section}>
          <Pressable
            onPress={() => {
              LayoutAnimation.configureNext(
                LayoutAnimation.Presets.easeInEaseOut,
              );
              setShowPreviousTreatment((p) => !p);
            }}
            style={styles.collapsibleHeader}
          >
            <ThemedText
              style={[
                styles.collapsibleTitle,
                { color: theme.textSecondary },
              ]}
            >
              Previous treatment
            </ThemedText>
            <Feather
              name={showPreviousTreatment ? "chevron-up" : "chevron-down"}
              size={16}
              color={theme.textSecondary}
            />
          </Pressable>
          {showPreviousTreatment ? (
            <View style={styles.collapsibleContent}>
              <ThemedText
                style={[styles.fieldLabel, { color: theme.textSecondary }]}
              >
                Procedure type
              </ThemedText>
              <View style={styles.chipRow}>
                {(
                  Object.entries(PREVIOUS_TREATMENT_LABELS) as [
                    NonNullable<DupuytrenPreviousTreatment["procedureType"]>,
                    string,
                  ][]
                ).map(([key, label]) => {
                  const isSelected =
                    assessment.previousTreatment?.procedureType === key;
                  return (
                    <Pressable
                      key={key}
                      onPress={() => {
                        Haptics.impactAsync(
                          Haptics.ImpactFeedbackStyle.Light,
                        );
                        updatePreviousTreatment({
                          ...assessment.previousTreatment,
                          procedureType: isSelected ? undefined : key,
                        });
                      }}
                      style={[
                        styles.smallChip,
                        {
                          backgroundColor: isSelected
                            ? `${theme.link}18`
                            : theme.backgroundTertiary,
                          borderColor: isSelected
                            ? theme.link
                            : theme.border,
                        },
                      ]}
                    >
                      <ThemedText
                        style={{
                          fontSize: 12,
                          fontWeight: isSelected ? "600" : "400",
                          color: isSelected ? theme.link : theme.text,
                        }}
                      >
                        {label}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Diathesis features (Tier 3, collapsible) */}
      <View style={styles.section}>
        <Pressable
          onPress={() => {
            LayoutAnimation.configureNext(
              LayoutAnimation.Presets.easeInEaseOut,
            );
            setShowDiathesis((p) => !p);
          }}
          style={styles.collapsibleHeader}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <ThemedText
              style={[
                styles.collapsibleTitle,
                { color: theme.textSecondary },
              ]}
            >
              Diathesis features
            </ThemedText>
            {diathesisScore > 0 ? (
              <View
                style={[
                  styles.scoreBadge,
                  { backgroundColor: `${theme.link}18` },
                ]}
              >
                <ThemedText
                  style={{
                    fontSize: 11,
                    fontWeight: "600",
                    color: theme.link,
                  }}
                >
                  {diathesisScore}/4
                </ThemedText>
              </View>
            ) : null}
          </View>
          <Feather
            name={showDiathesis ? "chevron-up" : "chevron-down"}
            size={16}
            color={theme.textSecondary}
          />
        </Pressable>
        {showDiathesis ? (
          <View style={styles.collapsibleContent}>
            {(
              [
                ["familyHistory", "Family history"],
                ["bilateralDisease", "Bilateral disease"],
                ["ectopicLesions", "Ectopic lesions (Garrod / Peyronie / Ledderhose)"],
                ["onsetBeforeAge50", "Onset before age 50"],
              ] as const
            ).map(([key, label]) => {
              const isChecked =
                !!(assessment.diathesis as any)?.[key];
              return (
                <Pressable
                  key={key}
                  onPress={() => {
                    Haptics.impactAsync(
                      Haptics.ImpactFeedbackStyle.Light,
                    );
                    updateDiathesis({
                      ...(assessment.diathesis ?? {}),
                      [key]: !isChecked,
                    });
                  }}
                  style={styles.toggleRow}
                >
                  <Feather
                    name={isChecked ? "check-square" : "square"}
                    size={18}
                    color={isChecked ? theme.link : theme.textSecondary}
                  />
                  <ThemedText
                    style={{
                      fontSize: 14,
                      color: isChecked ? theme.text : theme.textSecondary,
                    }}
                  >
                    {label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </View>
    </View>
  );
});

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
  },
  section: {
    gap: Spacing.xs,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "500",
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  sectionHint: {
    fontSize: 12,
    marginBottom: 2,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  fingerChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    minHeight: 36,
    justifyContent: "center",
  },
  smallChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
  },
  rayCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    gap: Spacing.xs,
  },
  rayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  rayTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  tubianaBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 36,
  },
  stepperLabel: {
    fontSize: 13,
    flex: 1,
  },
  stepperControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  stepperButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.xs,
    justifyContent: "center",
    alignItems: "center",
  },
  stepperValue: {
    width: 52,
    height: 36,
    borderRadius: BorderRadius.xs,
    justifyContent: "center",
    alignItems: "center",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: 4,
  },
  collapsibleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  collapsibleTitle: {
    fontSize: 13,
    fontWeight: "500",
  },
  collapsibleContent: {
    gap: Spacing.xs,
    paddingTop: 4,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 2,
  },
  scoreBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
});
