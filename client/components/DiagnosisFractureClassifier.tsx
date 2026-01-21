import React, { useState } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { FractureClassificationWizard } from "@/components/FractureClassificationWizard";
import { FractureEntry } from "@/types/case";

interface DiagnosisFractureClassifierProps {
  fractures: FractureEntry[];
  onFracturesChange: (fractures: FractureEntry[]) => void;
}

export function DiagnosisFractureClassifier({
  fractures,
  onFracturesChange,
}: DiagnosisFractureClassifierProps) {
  const { theme } = useTheme();
  const [showWizard, setShowWizard] = useState(false);

  const handleFractureSave = (newFractures: FractureEntry[]) => {
    onFracturesChange(newFractures);
    setShowWizard(false);
  };

  const removeFracture = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onFracturesChange(fractures.filter((f) => f.id !== id));
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Feather name="activity" size={18} color={theme.link} />
          <ThemedText style={[styles.title, { color: theme.text }]}>
            AO/OTA Fracture Classification
          </ThemedText>
        </View>
        <Pressable
          style={[styles.addButton, { backgroundColor: theme.link }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowWizard(true);
          }}
        >
          <Feather name="plus" size={16} color="#FFF" />
          <ThemedText style={styles.addButtonText}>Add</ThemedText>
        </Pressable>
      </View>

      <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
        Classify hand fractures using the AO/OTA 2018 system
      </ThemedText>

      {fractures.length > 0 ? (
        <View style={styles.fractureList}>
          {fractures.map((fracture) => (
            <View
              key={fracture.id}
              style={[styles.fractureCard, { backgroundColor: theme.backgroundTertiary }]}
            >
              <View style={styles.fractureCardContent}>
                <ThemedText style={[styles.fractureBoneName, { color: theme.text }]}>
                  {fracture.boneName}
                </ThemedText>
                <View style={[styles.aoCodeBadge, { backgroundColor: theme.link }]}>
                  <ThemedText style={styles.aoCodeBadgeText}>
                    {fracture.aoCode}
                  </ThemedText>
                </View>
              </View>
              <Pressable onPress={() => removeFracture(fracture.id)} hitSlop={8}>
                <Feather name="x-circle" size={20} color={theme.error} />
              </Pressable>
            </View>
          ))}
        </View>
      ) : (
        <Pressable
          style={[styles.emptyCard, { borderColor: theme.border }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowWizard(true);
          }}
        >
          <Feather name="activity" size={28} color={theme.textTertiary} />
          <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
            Tap to classify fracture using AO/OTA system
          </ThemedText>
        </Pressable>
      )}

      <FractureClassificationWizard
        visible={showWizard}
        onClose={() => setShowWizard(false)}
        onSave={handleFractureSave}
        initialFractures={fractures}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 13,
    marginBottom: Spacing.md,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  addButtonText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "600",
  },
  fractureList: {
    gap: Spacing.sm,
  },
  fractureCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  fractureCardContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  fractureBoneName: {
    fontSize: 15,
    fontWeight: "500",
    flex: 1,
  },
  aoCodeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  aoCodeBadgeText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "monospace",
  },
  emptyCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  emptyText: {
    fontSize: 14,
  },
});
