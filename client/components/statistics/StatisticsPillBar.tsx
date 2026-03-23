import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

export type StatisticsTab = "practice" | "training";

interface StatisticsPillBarProps {
  activeTab: StatisticsTab;
  onTabPress: (tab: StatisticsTab) => void;
}

const TABS: { id: StatisticsTab; label: string }[] = [
  { id: "practice", label: "Practice" },
  { id: "training", label: "Training" },
];

export const StatisticsPillBar = React.memo(function StatisticsPillBar({
  activeTab,
  onTabPress,
}: StatisticsPillBarProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={styles.pillRow} accessibilityRole="tablist">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <Pressable
              key={tab.id}
              testID={`statistics.pill-${tab.id}`}
              onPress={() => onTabPress(tab.id)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              style={[
                styles.pill,
                {
                  backgroundColor: isActive
                    ? theme.link
                    : theme.backgroundSecondary,
                },
              ]}
            >
              <ThemedText
                style={[
                  styles.pillText,
                  {
                    color: isActive ? theme.buttonText : theme.textSecondary,
                  },
                ]}
              >
                {tab.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  pillRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  pill: {
    flex: 1,
    height: 36,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  pillText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
