import React, { useState, useEffect } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing } from "@/constants/theme";
import { FormField, PickerField } from "@/components/FormField";
import { AnastomosisEntryCard } from "@/components/AnastomosisEntryCard";
import { RecipientSiteSelector } from "@/components/RecipientSiteSelector";
import { SectionHeader } from "@/components/SectionHeader";
import { v4 as uuidv4 } from "uuid";
import {
  type Specialty,
  type AnatomicalRegion,
  type AnastomosisEntry,
  type ClinicalDetails,
  type FreeFlapDetails,
  type VesselType,
  type HarvestSide,
  type Indication,
  type ElevationPlane,
  INDICATION_LABELS,
} from "@/types/case";

interface FreeFlapClinicalFieldsProps {
  clinicalDetails: FreeFlapDetails;
  procedureType: string;
  onUpdate: (details: FreeFlapDetails) => void;
}

const DEFAULT_DONOR_VESSELS: Record<string, { artery: string; vein: string }> = {
  "ALT Flap": {
    artery: "Lateral circumflex femoral artery descending branch",
    vein: "Lateral circumflex femoral vein",
  },
  "DIEP Flap": {
    artery: "Deep inferior epigastric artery",
    vein: "Deep inferior epigastric vein",
  },
  "Radial Forearm Flap": {
    artery: "Radial artery",
    vein: "Radial artery venae comitantes",
  },
  "Fibula Flap": {
    artery: "Peroneal artery",
    vein: "Peroneal artery venae comitantes",
  },
  "Latissimus Dorsi Flap": {
    artery: "Thoracodorsal artery",
    vein: "Thoracodorsal vein",
  },
  "Gracilis Flap": {
    artery: "Medial circumflex femoral artery gracilis branch",
    vein: "Gracilis vein",
  },
  "SCIP Flap": {
    artery: "Superficial circumflex iliac artery",
    vein: "Superficial circumflex iliac vein",
  },
  "Medial Sural Artery Perforator Flap": {
    artery: "Medial sural artery",
    vein: "Medial sural vein",
  },
};

export function FreeFlapClinicalFields({
  clinicalDetails,
  procedureType,
  onUpdate,
}: FreeFlapClinicalFieldsProps) {
  const { theme } = useTheme();
  
  const anastomoses = clinicalDetails.anastomoses || [];
  const recipientSiteRegion = clinicalDetails.recipientSiteRegion;

  const addAnastomosis = (vesselType: VesselType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newEntry: AnastomosisEntry = {
      id: uuidv4(),
      vesselType,
      recipientVesselName: "",
      couplingMethod: vesselType === "artery" ? "hand_sewn" : undefined,
    };
    onUpdate({
      ...clinicalDetails,
      anastomoses: [...anastomoses, newEntry],
    });
  };

  const updateAnastomosis = (updated: AnastomosisEntry) => {
    onUpdate({
      ...clinicalDetails,
      anastomoses: anastomoses.map((a) => (a.id === updated.id ? updated : a)),
    });
  };

  const removeAnastomosis = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onUpdate({
      ...clinicalDetails,
      anastomoses: anastomoses.filter((a) => a.id !== id),
    });
  };

  const donorVessels = DEFAULT_DONOR_VESSELS[procedureType];

  return (
    <View style={styles.container}>
      <RecipientSiteSelector
        value={recipientSiteRegion}
        onSelect={(region) => 
          onUpdate({ ...clinicalDetails, recipientSiteRegion: region })
        }
        required
      />

      <ThemedText style={[styles.subsectionTitle, { color: theme.text }]}>
        Anastomoses
      </ThemedText>
      <ThemedText style={[styles.subsectionSubtitle, { color: theme.textSecondary }]}>
        Add arterial and venous connections
      </ThemedText>

      {anastomoses.map((entry, index) => {
        const defaultDonorVessel = donorVessels
          ? (entry.vesselType === "artery" ? donorVessels.artery : donorVessels.vein)
          : undefined;
        return (
          <AnastomosisEntryCard
            key={entry.id}
            entry={entry}
            index={index}
            recipientRegion={recipientSiteRegion}
            defaultDonorVessel={defaultDonorVessel}
            onUpdate={updateAnastomosis}
            onDelete={() => removeAnastomosis(entry.id)}
          />
        );
      })}

      <View style={styles.anastomosisButtons}>
        <Pressable
          style={[styles.addButton, { backgroundColor: theme.error + "15", borderColor: theme.error + "30" }]}
          onPress={() => addAnastomosis("artery")}
        >
          <Feather name="plus" size={16} color={theme.error} />
          <ThemedText style={[styles.addButtonText, { color: theme.error }]}>
            Add Artery
          </ThemedText>
        </Pressable>
        <Pressable
          style={[styles.addButton, { backgroundColor: theme.link + "15", borderColor: theme.link + "30" }]}
          onPress={() => addAnastomosis("vein")}
        >
          <Feather name="plus" size={16} color={theme.link} />
          <ThemedText style={[styles.addButtonText, { color: theme.link }]}>
            Add Vein
          </ThemedText>
        </Pressable>
      </View>

      <SelectField
        label="Harvest Side"
        value={clinicalDetails.harvestSide || ""}
        options={[
          { value: "left", label: "Left" },
          { value: "right", label: "Right" },
        ]}
        onSelect={(v) => onUpdate({ ...clinicalDetails, harvestSide: v as HarvestSide })}
        required
      />

      <SelectField
        label="Indication"
        value={clinicalDetails.indication || ""}
        options={Object.entries(INDICATION_LABELS).map(([value, label]) => ({ value, label }))}
        onSelect={(v) => onUpdate({ ...clinicalDetails, indication: v as Indication })}
        required
      />

      <FormField
        label="Ischemia Time"
        value={clinicalDetails.ischemiaTimeMinutes ? String(clinicalDetails.ischemiaTimeMinutes) : ""}
        onChangeText={(v) => onUpdate({ 
          ...clinicalDetails, 
          ischemiaTimeMinutes: v ? parseInt(v) : undefined 
        })}
        placeholder="60"
        keyboardType="numeric"
        unit="min"
        required
      />

      <View style={styles.row}>
        <View style={styles.halfField}>
          <FormField
            label="Flap Width"
            value={clinicalDetails.flapWidthCm ? String(clinicalDetails.flapWidthCm) : ""}
            onChangeText={(v) => onUpdate({ 
              ...clinicalDetails, 
              flapWidthCm: v ? parseFloat(v) : undefined 
            })}
            placeholder="8"
            keyboardType="decimal-pad"
            unit="cm"
          />
        </View>
        <View style={styles.halfField}>
          <FormField
            label="Flap Length"
            value={clinicalDetails.flapLengthCm ? String(clinicalDetails.flapLengthCm) : ""}
            onChangeText={(v) => onUpdate({ 
              ...clinicalDetails, 
              flapLengthCm: v ? parseFloat(v) : undefined 
            })}
            placeholder="15"
            keyboardType="decimal-pad"
            unit="cm"
          />
        </View>
      </View>

      {procedureType === "ALT Flap" ? (
        <>
          <SelectField
            label="Perforator Count"
            value={clinicalDetails.perforatorCount ? String(clinicalDetails.perforatorCount) : ""}
            options={[
              { value: "1", label: "1" },
              { value: "2", label: "2" },
              { value: "3", label: "3+" },
            ]}
            onSelect={(v) => onUpdate({ 
              ...clinicalDetails, 
              perforatorCount: v ? parseInt(v) as 1 | 2 | 3 : undefined 
            })}
          />

          <SelectField
            label="Elevation Plane"
            value={clinicalDetails.elevationPlane || ""}
            options={[
              { value: "subfascial", label: "Subfascial" },
              { value: "suprafascial", label: "Suprafascial" },
            ]}
            onSelect={(v) => onUpdate({ 
              ...clinicalDetails, 
              elevationPlane: v as ElevationPlane 
            })}
          />
        </>
      ) : null}
    </View>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onSelect: (value: string) => void;
  required?: boolean;
}

function SelectField({ label, value, options, onSelect, required }: SelectFieldProps) {
  const { theme } = useTheme();
  
  return (
    <View style={styles.selectField}>
      <ThemedText style={[styles.selectLabel, { color: theme.textSecondary }]}>
        {label}{required ? " *" : ""}
      </ThemedText>
      <View style={styles.selectOptions}>
        {options.map((option) => (
          <Pressable
            key={option.value}
            style={[
              styles.selectOption,
              {
                backgroundColor: value === option.value ? theme.link + "20" : theme.backgroundDefault,
                borderColor: value === option.value ? theme.link : theme.border,
              },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSelect(option.value);
            }}
          >
            <ThemedText
              style={[
                styles.selectOptionText,
                { color: value === option.value ? theme.link : theme.text },
              ]}
            >
              {option.label}
            </ThemedText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

interface HandTraumaClinicalFieldsProps {
  clinicalDetails: Record<string, unknown>;
  onUpdate: (details: Record<string, unknown>) => void;
}

export function HandTraumaClinicalFields({
  clinicalDetails,
  onUpdate,
}: HandTraumaClinicalFieldsProps) {
  return (
    <View style={styles.container}>
      <FormField
        label="Injury Mechanism"
        value={String(clinicalDetails.injuryMechanism || "")}
        onChangeText={(v) => onUpdate({ ...clinicalDetails, injuryMechanism: v })}
        placeholder="e.g., Saw injury, crush injury"
      />
      <FormField
        label="Fixation Material"
        value={String(clinicalDetails.fixationMaterial || "")}
        onChangeText={(v) => onUpdate({ ...clinicalDetails, fixationMaterial: v })}
        placeholder="e.g., K-wire 1.2mm, plate/screws"
      />
      <FormField
        label="Nerve Status"
        value={String(clinicalDetails.nerveStatus || "")}
        onChangeText={(v) => onUpdate({ ...clinicalDetails, nerveStatus: v })}
        placeholder="e.g., Digital nerve intact"
      />
      <FormField
        label="Tendon Injuries"
        value={String(clinicalDetails.tendonInjuries || "")}
        onChangeText={(v) => onUpdate({ ...clinicalDetails, tendonInjuries: v })}
        placeholder="e.g., FDP zone 2"
      />
    </View>
  );
}

interface BodyContouringClinicalFieldsProps {
  clinicalDetails: Record<string, unknown>;
  onUpdate: (details: Record<string, unknown>) => void;
}

export function BodyContouringClinicalFields({
  clinicalDetails,
  onUpdate,
}: BodyContouringClinicalFieldsProps) {
  return (
    <View style={styles.container}>
      <FormField
        label="Resection Weight"
        value={clinicalDetails.resectionWeightGrams ? String(clinicalDetails.resectionWeightGrams) : ""}
        onChangeText={(v) => onUpdate({ 
          ...clinicalDetails, 
          resectionWeightGrams: v ? parseInt(v) : undefined 
        })}
        placeholder="e.g., 500"
        keyboardType="numeric"
        unit="g"
      />
      <FormField
        label="Drain Output"
        value={clinicalDetails.drainOutputMl ? String(clinicalDetails.drainOutputMl) : ""}
        onChangeText={(v) => onUpdate({ 
          ...clinicalDetails, 
          drainOutputMl: v ? parseInt(v) : undefined 
        })}
        placeholder="e.g., 100"
        keyboardType="numeric"
        unit="mL"
      />
    </View>
  );
}

interface ProcedureClinicalDetailsProps {
  specialty: Specialty;
  procedureType: string;
  clinicalDetails: ClinicalDetails;
  onUpdate: (details: ClinicalDetails) => void;
}

export function ProcedureClinicalDetails({
  specialty,
  procedureType,
  clinicalDetails,
  onUpdate,
}: ProcedureClinicalDetailsProps) {
  const { theme } = useTheme();
  
  if (specialty === "free_flap") {
    const existingDetails = clinicalDetails as FreeFlapDetails || {};
    const freeFlapDetails: FreeFlapDetails = {
      ...existingDetails,
      harvestSide: existingDetails.harvestSide || "left",
      indication: existingDetails.indication || "trauma",
      anastomoses: existingDetails.anastomoses || [],
    };
    return (
      <FreeFlapClinicalFields
        clinicalDetails={freeFlapDetails}
        procedureType={procedureType}
        onUpdate={onUpdate}
      />
    );
  }

  if (specialty === "hand_trauma") {
    return (
      <HandTraumaClinicalFields
        clinicalDetails={clinicalDetails as Record<string, unknown>}
        onUpdate={onUpdate}
      />
    );
  }

  if (specialty === "body_contouring") {
    return (
      <BodyContouringClinicalFields
        clinicalDetails={clinicalDetails as Record<string, unknown>}
        onUpdate={onUpdate}
      />
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: Spacing.md,
    marginBottom: 2,
  },
  subsectionSubtitle: {
    fontSize: 12,
    marginBottom: Spacing.sm,
  },
  anastomosisButtons: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  addButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: "500",
  },
  row: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  halfField: {
    flex: 1,
  },
  selectField: {
    marginBottom: Spacing.md,
  },
  selectLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: Spacing.sm,
  },
  selectOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  selectOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  selectOptionText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
