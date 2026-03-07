/**
 * Soft-tissue subsections for the unified Hand Trauma Assessment.
 *
 * Covers:
 * - Soft-tissue coverage descriptors
 * - Special injury flags: HPI, fight bite, compartment syndrome, ring avulsion
 */

import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { Feather } from "@/components/FeatherIcon";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import type { DigitId } from "@/types/case";

export interface SoftTissueState {
  isHighPressureInjection: boolean;
  isFightBite: boolean;
  isCompartmentSyndrome: boolean;
  isRingAvulsion: boolean;
  hasSoftTissueDefect: boolean;
  hasSoftTissueLoss: boolean;
  hasDegloving: boolean;
  hasGrossContamination: boolean;
  softTissueSurfaces: ("palmar" | "dorsal")[];
}

interface SoftTissueSectionProps {
  value: SoftTissueState;
  onChange: (value: SoftTissueState) => void;
  selectedDigits: DigitId[];
}

const SPECIAL_INJURIES: {
  key: keyof Pick<
    SoftTissueState,
    | "isHighPressureInjection"
    | "isFightBite"
    | "isCompartmentSyndrome"
    | "isRingAvulsion"
  >;
  label: string;
  description: string;
  icon: string;
}[] = [
  {
    key: "isHighPressureInjection",
    label: "High-pressure injection",
    description: "Paint gun, grease gun, hydraulic",
    icon: "alert-triangle",
  },
  {
    key: "isFightBite",
    label: "Fight bite",
    description: "Human bite to MCP joint",
    icon: "alert-circle",
  },
  {
    key: "isCompartmentSyndrome",
    label: "Compartment syndrome",
    description: "Hand / forearm compartment pressure",
    icon: "activity",
  },
  {
    key: "isRingAvulsion",
    label: "Ring avulsion",
    description: "Ring-related degloving / avulsion",
    icon: "circle",
  },
];

function useSoftTissueHandlers(
  value: SoftTissueState,
  onChange: (value: SoftTissueState) => void,
) {
  const toggleSpecialInjury = (
    key: keyof Pick<
      SoftTissueState,
      | "isHighPressureInjection"
      | "isFightBite"
      | "isCompartmentSyndrome"
      | "isRingAvulsion"
    >,
  ) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange({ ...value, [key]: !value[key] });
  };

  const toggleDescriptor = (
    key:
      | "hasSoftTissueDefect"
      | "hasSoftTissueLoss"
      | "hasDegloving"
      | "hasGrossContamination",
  ) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange({ ...value, [key]: !value[key] });
  };

  const toggleSurface = (surface: "palmar" | "dorsal") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const nextSurfaces = value.softTissueSurfaces.includes(surface)
      ? value.softTissueSurfaces.filter((entry) => entry !== surface)
      : [...value.softTissueSurfaces, surface];
    onChange({ ...value, softTissueSurfaces: nextSurfaces });
  };

  return { toggleSpecialInjury, toggleDescriptor, toggleSurface };
}

export function SoftTissueDescriptorSection({
  value,
  onChange,
  selectedDigits,
}: SoftTissueSectionProps) {
  const { theme } = useTheme();
  const { toggleDescriptor, toggleSurface } = useSoftTissueHandlers(
    value,
    onChange,
  );

  return (
    <View style={styles.subSection}>
      <ThemedText style={[styles.subSectionTitle, { color: theme.text }]}>
        Descriptors / coverage
      </ThemedText>
      <View style={styles.pillRow}>
        {[
          { key: "hasSoftTissueDefect", label: "Defect" },
          { key: "hasSoftTissueLoss", label: "Loss" },
          { key: "hasDegloving", label: "Degloving" },
          { key: "hasGrossContamination", label: "Gross contamination" },
        ].map(({ key, label }) => {
          const isSelected = value[key as keyof SoftTissueState] === true;
          return (
            <Pressable
              key={key}
              style={[
                styles.pill,
                {
                  backgroundColor: isSelected
                    ? theme.link
                    : theme.backgroundTertiary,
                  borderColor: isSelected ? theme.link : theme.border,
                },
              ]}
              onPress={() =>
                toggleDescriptor(
                  key as
                    | "hasSoftTissueDefect"
                    | "hasSoftTissueLoss"
                    | "hasDegloving"
                    | "hasGrossContamination",
                )
              }
            >
              <ThemedText
                style={[
                  styles.pillText,
                  { color: isSelected ? theme.buttonText : theme.text },
                ]}
              >
                {label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      {value.hasSoftTissueDefect ||
      value.hasSoftTissueLoss ||
      value.hasDegloving ? (
        <View style={styles.surfaceSection}>
          <ThemedText style={[styles.hint, { color: theme.textTertiary }]}>
            Surfaces involved
            {selectedDigits.length > 0 ? ` (${selectedDigits.join(", ")})` : ""}
          </ThemedText>
          <View style={styles.pillRow}>
            {(["palmar", "dorsal"] as const).map((surface) => {
              const isSelected = value.softTissueSurfaces.includes(surface);
              return (
                <Pressable
                  key={surface}
                  style={[
                    styles.pill,
                    {
                      backgroundColor: isSelected
                        ? theme.link + "15"
                        : theme.backgroundTertiary,
                      borderColor: isSelected ? theme.link : theme.border,
                    },
                  ]}
                  onPress={() => toggleSurface(surface)}
                >
                  <ThemedText
                    style={[
                      styles.pillText,
                      { color: isSelected ? theme.link : theme.text },
                    ]}
                  >
                    {surface === "palmar" ? "Palmar" : "Dorsal"}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}
    </View>
  );
}

export function SoftTissueSpecialInjurySection({
  value,
  onChange,
}: Omit<SoftTissueSectionProps, "selectedDigits">) {
  const { theme } = useTheme();
  const { toggleSpecialInjury } = useSoftTissueHandlers(value, onChange);

  return (
    <View style={styles.subSection}>
      <ThemedText style={[styles.subSectionTitle, { color: theme.text }]}>
        Special injuries
      </ThemedText>
      <View style={styles.specialGrid}>
        {SPECIAL_INJURIES.map(({ key, label, description, icon }) => {
          const isActive = value[key];
          return (
            <Pressable
              key={key}
              style={[
                styles.specialCard,
                {
                  backgroundColor: isActive
                    ? theme.link + "15"
                    : theme.backgroundTertiary,
                  borderColor: isActive ? theme.link : theme.border,
                },
              ]}
              onPress={() => toggleSpecialInjury(key)}
            >
              <View style={styles.specialCardTop}>
                <Feather
                  name={icon as any}
                  size={18}
                  color={isActive ? theme.link : theme.textSecondary}
                />
                <View
                  style={[
                    styles.checkbox,
                    {
                      borderColor: isActive ? theme.link : theme.textTertiary,
                      backgroundColor: isActive ? theme.link : "transparent",
                    },
                  ]}
                >
                  {isActive ? (
                    <Feather name="check" size={12} color={theme.buttonText} />
                  ) : null}
                </View>
              </View>
              <ThemedText
                style={[styles.specialLabel, { color: theme.text }]}
                numberOfLines={1}
              >
                {label}
              </ThemedText>
              <ThemedText
                style={[styles.specialDesc, { color: theme.textTertiary }]}
                numberOfLines={2}
              >
                {description}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function SoftTissueSection(props: SoftTissueSectionProps) {
  return (
    <View style={styles.container}>
      <SoftTissueDescriptorSection {...props} />
      <SoftTissueSpecialInjurySection
        value={props.value}
        onChange={props.onChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.lg,
  },
  subSection: {
    gap: Spacing.sm,
  },
  surfaceSection: {
    gap: Spacing.xs,
  },
  subSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  hint: {
    fontSize: 13,
  },
  specialGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  specialCard: {
    width: "48%",
    flexGrow: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    gap: 4,
  },
  specialCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  specialLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  specialDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  pill: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    minHeight: 40,
    justifyContent: "center",
  },
  pillText: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
});
