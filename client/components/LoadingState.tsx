import React from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = "Loading..." }: LoadingStateProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={theme.link} />
      <ThemedText style={[styles.message, { color: theme.textSecondary }]}>
        {message}
      </ThemedText>
    </View>
  );
}

interface SkeletonCardProps {
  height?: number;
}

export function SkeletonCard({ height = 120 }: SkeletonCardProps) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.skeleton,
        {
          height,
          backgroundColor: theme.backgroundDefault,
        },
      ]}
    >
      <View
        style={[styles.shimmer, { backgroundColor: theme.backgroundSecondary }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing["3xl"],
  },
  message: {
    marginTop: Spacing.lg,
    fontSize: 15,
  },
  skeleton: {
    borderRadius: 16,
    marginBottom: Spacing.md,
    overflow: "hidden",
  },
  shimmer: {
    flex: 1,
    opacity: 0.5,
  },
});
