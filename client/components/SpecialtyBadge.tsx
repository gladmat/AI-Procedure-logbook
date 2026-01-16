import React from "react";
import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing } from "@/constants/theme";
import { Specialty, SPECIALTY_LABELS } from "@/types/case";

interface SpecialtyBadgeProps {
  specialty: Specialty;
  showLabel?: boolean;
  size?: "small" | "medium" | "large";
}

const SPECIALTY_ICONS: Record<Specialty, keyof typeof Feather.glyphMap> = {
  free_flap: "activity",
  hand_trauma: "tool",
  body_contouring: "user",
  aesthetics: "star",
  burns: "thermometer",
};

export function SpecialtyBadge({
  specialty,
  showLabel = true,
  size = "medium",
}: SpecialtyBadgeProps) {
  const { theme } = useTheme();
  
  const iconSize = size === "small" ? 14 : size === "large" ? 20 : 16;
  const paddingH = size === "small" ? Spacing.sm : size === "large" ? Spacing.lg : Spacing.md;
  const paddingV = size === "small" ? Spacing.xs : size === "large" ? Spacing.md : Spacing.sm;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: theme.link + "15",
          paddingHorizontal: paddingH,
          paddingVertical: paddingV,
        },
      ]}
    >
      <Feather
        name={SPECIALTY_ICONS[specialty]}
        size={iconSize}
        color={theme.link}
      />
      {showLabel ? (
        <ThemedText
          style={[
            styles.text,
            { color: theme.link, fontSize: size === "small" ? 11 : 12 },
          ]}
        >
          {SPECIALTY_LABELS[specialty]}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
  },
  text: {
    fontWeight: "600",
  },
});
