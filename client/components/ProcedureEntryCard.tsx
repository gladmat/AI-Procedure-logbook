import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing } from "@/constants/theme";
import { FormField, PickerField } from "@/components/FormField";
import {
  type CaseProcedure,
  type Role,
  type Specialty,
  ROLE_LABELS,
  SPECIALTY_LABELS,
  PROCEDURE_TYPES,
} from "@/types/case";

interface ProcedureEntryCardProps {
  procedure: CaseProcedure;
  index: number;
  isOnlyProcedure: boolean;
  onUpdate: (procedure: CaseProcedure) => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

export function ProcedureEntryCard({
  procedure,
  index,
  isOnlyProcedure,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: ProcedureEntryCardProps) {
  const { theme } = useTheme();

  const handleSpecialtyChange = (value: string) => {
    onUpdate({
      ...procedure,
      specialty: value as Specialty,
      procedureName: "",
    });
  };

  const handleProcedureNameChange = (value: string) => {
    onUpdate({
      ...procedure,
      procedureName: value,
    });
  };

  const handleRoleChange = (value: string) => {
    onUpdate({
      ...procedure,
      surgeonRole: value as Role,
    });
  };

  const handleSnomedCodeChange = (value: string) => {
    onUpdate({
      ...procedure,
      snomedCtCode: value,
    });
  };

  const handleSnomedDisplayChange = (value: string) => {
    onUpdate({
      ...procedure,
      snomedCtDisplay: value,
    });
  };

  const handleNotesChange = (value: string) => {
    onUpdate({
      ...procedure,
      notes: value,
    });
  };

  const procedureTypeOptions = procedure.specialty
    ? PROCEDURE_TYPES[procedure.specialty]?.map((type) => ({
        value: type,
        label: type,
      })) || []
    : [];

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.backgroundElevated, borderColor: theme.border },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={[styles.orderBadge, { backgroundColor: theme.link + "20" }]}>
            <ThemedText style={[styles.orderText, { color: theme.link }]}>
              {index + 1}
            </ThemedText>
          </View>
          <ThemedText style={[styles.cardTitle, { color: theme.text }]}>
            Procedure
          </ThemedText>
        </View>
        <View style={styles.headerRight}>
          {canMoveUp ? (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onMoveUp?.();
              }}
              hitSlop={8}
              style={styles.iconButton}
            >
              <Feather name="chevron-up" size={18} color={theme.textSecondary} />
            </Pressable>
          ) : null}
          {canMoveDown ? (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onMoveDown?.();
              }}
              hitSlop={8}
              style={styles.iconButton}
            >
              <Feather name="chevron-down" size={18} color={theme.textSecondary} />
            </Pressable>
          ) : null}
          {!isOnlyProcedure ? (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onDelete();
              }}
              hitSlop={8}
              style={styles.iconButton}
            >
              <Feather name="trash-2" size={18} color={theme.error} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <PickerField
        label="Specialty"
        value={procedure.specialty || ""}
        options={Object.entries(SPECIALTY_LABELS).map(([value, label]) => ({
          value,
          label,
        }))}
        onSelect={handleSpecialtyChange}
        placeholder="Select specialty"
      />

      {procedure.specialty ? (
        <PickerField
          label="Procedure Type"
          value={procedure.procedureName}
          options={procedureTypeOptions}
          onSelect={handleProcedureNameChange}
          placeholder="Select procedure"
          required
        />
      ) : null}

      <PickerField
        label="Your Role"
        value={procedure.surgeonRole}
        options={Object.entries(ROLE_LABELS).map(([value, label]) => ({
          value,
          label,
        }))}
        onSelect={handleRoleChange}
        required
      />

      <View style={styles.snomedRow}>
        <View style={styles.snomedCodeField}>
          <FormField
            label="SNOMED CT Code"
            value={procedure.snomedCtCode || ""}
            onChangeText={handleSnomedCodeChange}
            placeholder="e.g., 234567890"
            keyboardType="numeric"
          />
        </View>
        <View style={styles.snomedDisplayField}>
          <FormField
            label="SNOMED Display"
            value={procedure.snomedCtDisplay || ""}
            onChangeText={handleSnomedDisplayChange}
            placeholder="Procedure description"
          />
        </View>
      </View>

      <FormField
        label="Notes"
        value={procedure.notes || ""}
        onChangeText={handleNotesChange}
        placeholder="Additional procedure notes..."
        multiline
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  orderBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  orderText: {
    fontSize: 12,
    fontWeight: "700",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  iconButton: {
    padding: Spacing.xs,
  },
  snomedRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  snomedCodeField: {
    flex: 1,
  },
  snomedDisplayField: {
    flex: 2,
  },
});
