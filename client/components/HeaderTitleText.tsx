import React from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";

interface HeaderTitleTextProps {
  title: string;
  reserveWidth?: number;
  fontSize?: number;
}

export function HeaderTitleText({
  title,
  reserveWidth = 180,
  fontSize = 16,
}: HeaderTitleTextProps) {
  const { width } = useWindowDimensions();
  const { theme } = useTheme();
  const maxWidth = Math.max(140, Math.min(width - reserveWidth, 320));

  return (
    <View style={styles.container}>
      <ThemedText
        numberOfLines={1}
        ellipsizeMode="tail"
        style={[styles.title, { color: theme.text, fontSize, maxWidth }]}
      >
        {title}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontWeight: "600",
    textAlign: "center",
  },
});
