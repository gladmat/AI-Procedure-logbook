import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { Feather } from "@/components/FeatherIcon";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing } from "@/constants/theme";
import type { DigitId, HandTraumaDetails } from "@/types/case";

export interface AmputationState {
  amputationLevel?: HandTraumaDetails["amputationLevel"];
  amputationType?: HandTraumaDetails["amputationType"];
  isReplantable?: boolean;
}

interface AmputationSectionProps {
  value: AmputationState;
  onChange: (value: AmputationState) => void;
  selectedDigits: DigitId[];
}

const AMPUTATION_LEVELS: {
  key: NonNullable<HandTraumaDetails["amputationLevel"]>;
  label: string;
}[] = [
  { key: "fingertip", label: "Fingertip" },
  { key: "distal_phalanx", label: "Distal phalanx" },
  { key: "middle_phalanx", label: "Middle phalanx" },
  { key: "proximal_phalanx", label: "Proximal phalanx" },
  { key: "mcp", label: "MCP level" },
  { key: "ray", label: "Ray amputation" },
  { key: "hand_wrist", label: "Hand / wrist" },
];

export function AmputationSection({
  value,
  onChange,
  selectedDigits,
}: AmputationSectionProps) {
  const { theme } = useTheme();

  const setAmputationLevel = (
    level: NonNullable<HandTraumaDetails["amputationLevel"]>,
  ) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (value.amputationLevel === level) {
      onChange({
        amputationLevel: undefined,
        amputationType: undefined,
        isReplantable: undefined,
      });
      return;
    }

    onChange({
      ...value,
      amputationLevel: level,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.subSection}>
        <ThemedText style={[styles.subSectionTitle, { color: theme.text }]}>
          Amputation level
        </ThemedText>
        <ThemedText style={[styles.hint, { color: theme.textTertiary }]}>
          {selectedDigits.length > 0
            ? `Selected digits: ${selectedDigits.join(", ")}`
            : "Select digits above if the amputation is digit-specific."}
        </ThemedText>
        <View style={styles.pillRow}>
          {AMPUTATION_LEVELS.map(({ key, label }) => {
            const isSelected = value.amputationLevel === key;
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
                onPress={() => setAmputationLevel(key)}
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
      </View>

      {value.amputationLevel ? (
        <>
          <View style={styles.subSection}>
            <ThemedText style={[styles.subSectionTitle, { color: theme.text }]}>
              Amputation type
            </ThemedText>
            <View style={styles.pillRow}>
              {[
                { key: "complete" as const, label: "Complete" },
                { key: "subtotal" as const, label: "Subtotal" },
              ].map(({ key, label }) => {
                const isSelected = value.amputationType === key;
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
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      onChange({
                        ...value,
                        amputationType:
                          value.amputationType === key ? undefined : key,
                      });
                    }}
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
          </View>

          <View style={styles.subSection}>
            <ThemedText style={[styles.subSectionTitle, { color: theme.text }]}>
              Replantability
            </ThemedText>
            <View style={styles.pillRow}>
              {[
                { key: true, label: "Replantable", icon: "check-circle" },
                { key: false, label: "Non-replantable", icon: "x-circle" },
              ].map(({ key, label, icon }) => {
                const isSelected = value.isReplantable === key;
                return (
                  <Pressable
                    key={String(key)}
                    style={[
                      styles.replantPill,
                      {
                        backgroundColor: isSelected
                          ? key
                            ? theme.success + "20"
                            : theme.error + "20"
                          : theme.backgroundTertiary,
                        borderColor: isSelected
                          ? key
                            ? theme.success
                            : theme.error
                          : theme.border,
                      },
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      onChange({
                        ...value,
                        isReplantable: key,
                      });
                    }}
                  >
                    <Feather
                      name={icon as any}
                      size={16}
                      color={
                        isSelected
                          ? key
                            ? theme.success
                            : theme.error
                          : theme.textSecondary
                      }
                    />
                    <ThemedText
                      style={[
                        styles.pillText,
                        {
                          color: isSelected
                            ? key
                              ? theme.success
                              : theme.error
                            : theme.text,
                        },
                      ]}
                    >
                      {label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </>
      ) : null}
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
  subSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  hint: {
    fontSize: 13,
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
  replantPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    minHeight: 40,
    gap: 6,
  },
  pillText: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
});
