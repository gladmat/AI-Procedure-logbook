import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "./ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface AutoFilledFieldProps {
  label: string;
  value: string | undefined;
  isAutoFilled: boolean;
  onUndo?: () => void;
  children: React.ReactNode;
}

export function AutoFilledField({
  label,
  value,
  isAutoFilled,
  onUndo,
  children,
}: AutoFilledFieldProps) {
  const { theme } = useTheme();

  if (!isAutoFilled) {
    return <>{children}</>;
  }

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: "#D4A900",
          backgroundColor: "rgba(212, 169, 0, 0.08)",
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.labelRow}>
          <Feather name="zap" size={12} color="#D4A900" />
          <ThemedText style={[styles.autoLabel, { color: "#D4A900" }]}>
            Auto-filled
          </ThemedText>
        </View>
        {onUndo ? (
          <Pressable onPress={onUndo} style={styles.undoButton}>
            <Feather name="rotate-ccw" size={14} color={theme.link} />
            <ThemedText style={[styles.undoText, { color: theme.link }]}>
              Undo
            </ThemedText>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

interface DocumentTypeBadgeProps {
  documentType?: string;
  confidence?: "high" | "medium" | "low";
  detectedTriggers?: string[];
}

export function DocumentTypeBadge({
  documentType,
  confidence,
  detectedTriggers,
}: DocumentTypeBadgeProps) {
  const { theme } = useTheme();

  if (!documentType) {
    return null;
  }

  const confidenceColor =
    confidence === "high"
      ? theme.success
      : confidence === "medium"
        ? "#D4A900"
        : theme.textSecondary;

  const confidenceIcon =
    confidence === "high"
      ? "check-circle"
      : confidence === "medium"
        ? "alert-circle"
        : "help-circle";

  return (
    <View style={[styles.badgeContainer, { backgroundColor: theme.backgroundSecondary }]}>
      <View style={styles.badgeHeader}>
        <Feather name="file-text" size={16} color={theme.link} />
        <ThemedText style={styles.badgeTitle}>{documentType}</ThemedText>
      </View>
      <View style={styles.badgeRow}>
        <Feather
          name={confidenceIcon as any}
          size={14}
          color={confidenceColor}
        />
        <ThemedText style={[styles.confidenceText, { color: confidenceColor }]}>
          {confidence ? `${confidence.charAt(0).toUpperCase()}${confidence.slice(1)} confidence` : "Unknown confidence"}
        </ThemedText>
      </View>
      {detectedTriggers && detectedTriggers.length > 0 ? (
        <View style={styles.triggersRow}>
          <ThemedText style={[styles.triggersLabel, { color: theme.textSecondary }]}>
            Detected:
          </ThemedText>
          <ThemedText style={[styles.triggersText, { color: theme.text }]}>
            {detectedTriggers.join(", ")}
          </ThemedText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 2,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  autoLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  undoButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  undoText: {
    fontSize: 12,
    fontWeight: "500",
  },
  badgeContainer: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  badgeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  badgeTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  confidenceText: {
    fontSize: 13,
  },
  triggersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  triggersLabel: {
    fontSize: 12,
  },
  triggersText: {
    fontSize: 12,
    fontWeight: "500",
  },
});
