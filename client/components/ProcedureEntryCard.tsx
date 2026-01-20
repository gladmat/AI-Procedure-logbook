import React, { useState } from "react";
import { View, StyleSheet, Pressable, Modal } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing } from "@/constants/theme";
import { FormField, PickerField } from "@/components/FormField";
import { ProcedureClinicalDetails } from "@/components/ProcedureClinicalDetails";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import {
  type CaseProcedure,
  type Role,
  type Specialty,
  type ClinicalDetails,
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
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
  const [showRoleInfoModal, setShowRoleInfoModal] = useState(false);

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

  const handleClinicalDetailsUpdate = (details: ClinicalDetails) => {
    onUpdate({
      ...procedure,
      clinicalDetails: details,
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

      <View style={styles.roleHeaderRow}>
        <View style={styles.labelRow}>
          <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>
            Your Role (RACS MALT)
          </ThemedText>
          <ThemedText style={[styles.requiredAsterisk, { color: theme.error }]}>*</ThemedText>
        </View>
        <Pressable
          style={[styles.infoButton, { backgroundColor: theme.link + "15" }]}
          onPress={() => setShowRoleInfoModal(true)}
          hitSlop={8}
        >
          <Feather name="info" size={14} color={theme.link} />
        </Pressable>
      </View>

      <PickerField
        label=""
        value={procedure.surgeonRole}
        options={[
          { value: "PS", label: "PS - Primary Surgeon" },
          { value: "PP", label: "PP - Performed with Peer" },
          { value: "AS", label: "AS - Assisting (scrubbed)" },
          { value: "ONS", label: "ONS - Observing (not scrubbed)" },
          { value: "SS", label: "SS - Supervising (scrubbed)" },
          { value: "SNS", label: "SNS - Supervising (not scrubbed)" },
          { value: "A", label: "A - Available" },
        ]}
        onSelect={handleRoleChange}
      />

      {/* Role Info Modal */}
      <Modal
        visible={showRoleInfoModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowRoleInfoModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.backgroundRoot }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <ThemedText style={styles.modalTitle}>Supervision Levels</ThemedText>
            <Pressable
              style={[styles.modalCloseButton, { backgroundColor: theme.backgroundDefault }]}
              onPress={() => setShowRoleInfoModal(false)}
              hitSlop={8}
            >
              <Feather name="x" size={20} color={theme.text} />
            </Pressable>
          </View>
          <KeyboardAwareScrollViewCompat
            style={styles.modalContent}
            contentContainerStyle={styles.modalScrollContent}
          >
            <ThemedText style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
              RACS MALT role in theatre definitions
            </ThemedText>
            {(Object.keys(ROLE_LABELS) as Role[]).map((roleKey) => (
              <View 
                key={roleKey} 
                style={[styles.roleInfoCard, { backgroundColor: theme.backgroundDefault }]}
              >
                <View style={styles.roleInfoHeader}>
                  <View style={[styles.roleCodeBadge, { backgroundColor: theme.link + "20" }]}>
                    <ThemedText style={[styles.roleCode, { color: theme.link }]}>
                      {roleKey}
                    </ThemedText>
                  </View>
                  <ThemedText style={styles.roleLabel}>{ROLE_LABELS[roleKey]}</ThemedText>
                </View>
                <ThemedText style={[styles.roleDescription, { color: theme.textSecondary }]}>
                  {ROLE_DESCRIPTIONS[roleKey]}
                </ThemedText>
              </View>
            ))}
          </KeyboardAwareScrollViewCompat>
        </View>
      </Modal>

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

      {procedure.specialty ? (
        <ProcedureClinicalDetails
          specialty={procedure.specialty}
          procedureType={procedure.procedureName}
          clinicalDetails={procedure.clinicalDetails || {}}
          onUpdate={handleClinicalDetailsUpdate}
        />
      ) : null}
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
  roleHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  requiredAsterisk: {
    marginLeft: 2,
    fontSize: 14,
    fontWeight: "600",
  },
  infoButton: {
    padding: 4,
    borderRadius: 12,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  modalContent: {
    flex: 1,
  },
  modalScrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: Spacing.lg,
  },
  roleInfoCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  roleInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  roleCodeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  roleCode: {
    fontSize: 12,
    fontWeight: "700",
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  roleDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
});
