/**
 * BreastCompletionSummary — Per-module completion indicator in BreastSideCard header.
 *
 * Shows a compact check/circle icon with percentage.
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";
import type { BreastCompletionStatus } from "@/lib/breastConfig";

interface Props {
  status: BreastCompletionStatus;
}

export const BreastCompletionSummary = React.memo(
  function BreastCompletionSummary({ status }: Props) {
    const { theme } = useTheme();

    if (status.overallPercentage === 0) return null;

    const isComplete = status.overallPercentage === 100;
    const color = isComplete ? theme.success : theme.textSecondary;

    return (
      <View style={styles.row}>
        <Feather
          name={isComplete ? "check-circle" : "circle"}
          size={14}
          color={color}
        />
        <ThemedText
          type="small"
          style={{ color, fontWeight: "600", fontSize: 12 }}
        >
          {status.overallPercentage}%
        </ThemedText>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
});
