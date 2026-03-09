import React from "react";
import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { PulseMetricCard } from "@/components/dashboard/PulseMetricCard";
import { InfoButton } from "@/components/dashboard/InfoButton";
import type { PracticePulseData } from "@/hooks/usePracticePulse";

interface PracticePulseRowProps {
  pulseData: PracticePulseData;
  totalCaseCount: number;
}

function PracticePulseRowInner({
  pulseData,
  totalCaseCount,
}: PracticePulseRowProps) {
  const { theme } = useTheme();

  if (totalCaseCount === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <ThemedText
            style={[styles.headerText, { color: theme.textSecondary }]}
          >
            Practice Pulse
          </ThemedText>
          <InfoButton
            title="Practice Pulse"
            content="Total Cases shows your lifetime case count. This Week shows cases logged in the current week (Monday–Sunday). Completion tracks how many recent cases have all required fields filled."
          />
        </View>
      </View>
      <View style={styles.metricsRow}>
        <PulseMetricCard
          type="totalCases"
          label="Total cases"
          value={pulseData.totalCases.count}
        />
        <PulseMetricCard
          type="thisWeek"
          label="This week"
          value={pulseData.thisWeek.count}
          dailyDots={pulseData.thisWeek.dailyDots}
          todayIndex={pulseData.thisWeek.todayIndex}
        />
        <PulseMetricCard
          type="completion"
          label="Completion"
          value={pulseData.completion.percentage}
          percentage={pulseData.completion.percentage}
        />
      </View>
    </View>
  );
}

export const PracticePulseRow = React.memo(PracticePulseRowInner);

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerText: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  metricsRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
  },
});
