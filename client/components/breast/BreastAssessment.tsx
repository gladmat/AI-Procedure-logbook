/**
 * BreastAssessment — Main orchestrator for breast surgery module.
 *
 * Renders inline in DiagnosisGroupEditor when specialty === "breast".
 * Manages laterality selection and delegates per-side data to BreastSideCard.
 */

import React, { useCallback } from "react";
import { View, Pressable, LayoutAnimation, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { BreastSideCard } from "./BreastSideCard";
import { LiposuctionCard } from "./LiposuctionCard";
import type {
  BreastAssessmentData,
  BreastLaterality,
  BreastSideAssessment,
  LiposuctionData,
} from "@/types/breast";
import type { BreastModuleFlags } from "@/lib/breastConfig";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  value: BreastAssessmentData;
  onChange: (data: BreastAssessmentData) => void;
  moduleFlags: BreastModuleFlags;
}

type LateralityOption = "left" | "right" | "bilateral";

const LATERALITY_OPTIONS: { key: LateralityOption; label: string }[] = [
  { key: "left", label: "Left" },
  { key: "right", label: "Right" },
  { key: "bilateral", label: "Bilateral" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export const BreastAssessment = React.memo(function BreastAssessment({
  value,
  onChange,
  moduleFlags,
}: Props) {
  const { theme } = useTheme();

  // ── Laterality ──────────────────────────────────────────────────────────

  const handleLateralityChange = useCallback(
    (option: LateralityOption) => {
      if (option === value.laterality) return;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

      const next: BreastAssessmentData = { ...value, laterality: option, sides: { ...value.sides } };

      // Initialise sides that should exist, preserve those that already do
      if (option === "left" || option === "bilateral") {
        if (!next.sides.left) {
          next.sides.left = { side: "left", clinicalContext: "reconstructive" };
        }
      }
      if (option === "right" || option === "bilateral") {
        if (!next.sides.right) {
          next.sides.right = { side: "right", clinicalContext: "reconstructive" };
        }
      }

      // Clean up sides no longer active
      if (option === "left") {
        delete next.sides.right;
      } else if (option === "right") {
        delete next.sides.left;
      }

      onChange(next);
    },
    [value, onChange],
  );

  // ── Per-side change ─────────────────────────────────────────────────────

  const handleSideChange = useCallback(
    (side: BreastLaterality, sideData: BreastSideAssessment) => {
      onChange({
        ...value,
        sides: { ...value.sides, [side]: sideData },
      });
    },
    [value, onChange],
  );

  // ── Copy to other side ──────────────────────────────────────────────────

  const handleCopy = useCallback(
    (fromSide: BreastLaterality) => {
      const toSide: BreastLaterality = fromSide === "left" ? "right" : "left";
      const source = value.sides[fromSide];
      if (!source) return;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

      const copied: BreastSideAssessment = {
        ...JSON.parse(JSON.stringify(source)),
        side: toSide,
      };

      onChange({
        ...value,
        sides: { ...value.sides, [toSide]: copied },
      });
    },
    [value, onChange],
  );

  // ── Render ──────────────────────────────────────────────────────────────

  const activeSides: BreastLaterality[] = [];
  if (value.laterality === "left" || value.laterality === "bilateral") activeSides.push("left");
  if (value.laterality === "right" || value.laterality === "bilateral") activeSides.push("right");

  const isBilateral = value.laterality === "bilateral";

  return (
    <View style={styles.container}>
      {/* Section header */}
      <ThemedText type="h4" style={{ marginBottom: Spacing.sm }}>
        Breast Assessment
      </ThemedText>

      {/* Laterality chips */}
      <View style={styles.chipRow}>
        {LATERALITY_OPTIONS.map(({ key, label }) => {
          const selected = value.laterality === key;
          return (
            <Pressable
              key={key}
              onPress={() => handleLateralityChange(key)}
              style={[
                styles.chip,
                {
                  backgroundColor: selected
                    ? theme.link
                    : theme.backgroundSecondary,
                  borderColor: selected ? theme.link : theme.border,
                },
              ]}
            >
              <ThemedText
                type="small"
                style={{
                  color: selected ? theme.buttonText : theme.text,
                  fontWeight: selected ? "600" : "400",
                }}
              >
                {label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      {/* Case-level liposuction — shown when lipofilling is active */}
      {moduleFlags.showLipofilling && (
        <LiposuctionCard
          value={value.liposuction ?? {}}
          onChange={(liposuction: LiposuctionData) =>
            onChange({ ...value, liposuction })
          }
        />
      )}

      {/* Per-side cards */}
      {activeSides.map((side) => {
        const sideData = value.sides[side];
        if (!sideData) return null;

        // Show copy button only in bilateral mode when the OTHER side is empty/default
        const otherSide: BreastLaterality = side === "left" ? "right" : "left";
        const otherData = value.sides[otherSide];
        const showCopy =
          isBilateral &&
          sideData.clinicalContext !== undefined &&
          (!otherData || !otherData.reconstructionTiming);

        return (
          <BreastSideCard
            key={side}
            side={side}
            value={sideData}
            onChange={(updated) => handleSideChange(side, updated)}
            moduleFlags={moduleFlags}
            showCopyButton={showCopy}
            onCopy={() => handleCopy(side)}
          />
        );
      })}
    </View>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.lg,
  },
  chipRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    minWidth: 64,
    alignItems: "center",
  },
});
