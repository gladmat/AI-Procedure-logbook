import React, { useState } from "react";
import { View, StyleSheet, Pressable, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing } from "@/constants/theme";
import {
  getProceduresForSpecialty,
  getSubcategoriesForSpecialty,
  getProceduresForSubcategory,
  type ProcedurePicklistEntry,
} from "@/lib/procedurePicklist";
import type { Specialty } from "@/types/case";

interface ProcedureSubcategoryPickerProps {
  specialty: Specialty;
  selectedEntryId?: string;
  onSelect: (entry: ProcedurePicklistEntry) => void;
}

export function ProcedureSubcategoryPicker({
  specialty,
  selectedEntryId,
  onSelect,
}: ProcedureSubcategoryPickerProps) {
  const { theme } = useTheme();
  const subcategories = getSubcategoriesForSpecialty(specialty);

  const initialSubcat = () => {
    if (selectedEntryId) {
      const all = getProceduresForSpecialty(specialty);
      const entry = all.find((e) => e.id === selectedEntryId);
      if (entry) return entry.subcategory;
    }
    return subcategories[0] ?? "";
  };

  const [activeSubcategory, setActiveSubcategory] = useState<string>(initialSubcat);

  const proceduresInSubcat = getProceduresForSubcategory(specialty, activeSubcategory);

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.subcatRow}
        style={styles.subcatScroll}
      >
        {subcategories.map((subcat) => {
          const isActive = subcat === activeSubcategory;
          return (
            <Pressable
              key={subcat}
              onPress={() => {
                Haptics.selectionAsync();
                setActiveSubcategory(subcat);
              }}
              style={[
                styles.subcatChip,
                {
                  backgroundColor: isActive ? theme.link : theme.backgroundDefault,
                  borderColor: isActive ? theme.link : theme.border,
                },
              ]}
            >
              <ThemedText
                style={[
                  styles.subcatChipText,
                  { color: isActive ? theme.buttonText : theme.textSecondary },
                ]}
              >
                {subcat}
              </ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.procedureList}>
        {proceduresInSubcat.map((entry) => {
          const isSelected = entry.id === selectedEntryId;
          return (
            <Pressable
              key={entry.id}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSelect(entry);
              }}
              style={[
                styles.procedureRow,
                {
                  backgroundColor: isSelected
                    ? theme.link + "15"
                    : theme.backgroundDefault,
                  borderColor: isSelected ? theme.link : theme.border,
                },
              ]}
            >
              <View style={styles.procedureRowLeft}>
                <ThemedText
                  style={[
                    styles.procedureName,
                    {
                      color: isSelected ? theme.link : theme.text,
                      fontWeight: isSelected ? "600" : "400",
                    },
                  ]}
                >
                  {entry.displayName}
                </ThemedText>
                <View style={styles.badgeRow}>
                  {entry.hasFreeFlap ? (
                    <View style={[styles.badge, { backgroundColor: theme.error + "20" }]}>
                      <ThemedText style={[styles.badgeText, { color: theme.error }]}>
                        Free flap
                      </ThemedText>
                    </View>
                  ) : null}
                  {entry.tags.includes("microsurgery") ? (
                    <View style={[styles.badge, { backgroundColor: theme.link + "15" }]}>
                      <ThemedText style={[styles.badgeText, { color: theme.link }]}>
                        Microsurgery
                      </ThemedText>
                    </View>
                  ) : null}
                  {entry.tags.includes("pedicled_flap") && !entry.hasFreeFlap ? (
                    <View style={[styles.badge, { backgroundColor: "#8B5CF620" }]}>
                      <ThemedText style={[styles.badgeText, { color: "#8B5CF6" }]}>
                        Pedicled
                      </ThemedText>
                    </View>
                  ) : null}
                </View>
              </View>
              {isSelected ? (
                <Feather name="check" size={18} color={theme.link} />
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  subcatScroll: {
    marginBottom: Spacing.md,
  },
  subcatRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    paddingRight: Spacing.md,
  },
  subcatChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  subcatChipText: {
    fontSize: 13,
    fontWeight: "500",
  },
  procedureList: {
    gap: Spacing.xs,
  },
  procedureRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  procedureRowLeft: {
    flex: 1,
    gap: 4,
  },
  procedureName: {
    fontSize: 14,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
});
