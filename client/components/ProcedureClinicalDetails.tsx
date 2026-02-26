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
import { FreeFlapPicker } from "@/components/FreeFlapPicker";
import { FlapSpecificFields } from "@/components/FlapSpecificFields";
import { SectionHeader } from "@/components/SectionHeader";
import { v4 as uuidv4 } from "uuid";
import { findPicklistEntry, PICKLIST_TO_FLAP_TYPE } from "@/lib/procedurePicklist";
import {
  type Specialty,
  type AnatomicalRegion,
  type AnastomosisEntry,
  type ClinicalDetails,
  type FreeFlapDetails,
  type HandSurgeryDetails,
  type VesselType,
  type HarvestSide,
  type Indication,
  type ElevationPlane,
  type FreeFlap,
  type FlapSpecificDetails,
  INDICATION_LABELS,
  FLAP_SNOMED_MAP,
  RECIPIENT_SITE_SNOMED_MAP,
  FREE_FLAP_LABELS,
  ELEVATION_PLANE_LABELS,
} from "@/types/case";
import { FLAP_ELEVATION_PLANES } from "@/data/flapFieldConfig";

interface FreeFlapClinicalFieldsProps {
  clinicalDetails: FreeFlapDetails;
  procedureType: string;
  picklistEntryId?: string;
  onUpdate: (details: FreeFlapDetails) => void;
}

const DEFAULT_DONOR_VESSELS: Record<FreeFlap, { artery: string; vein: string }> = {
  alt: {
    artery: "Descending branch of lateral circumflex femoral artery",
    vein: "Venae comitantes of lateral circumflex femoral artery",
  },
  diep: {
    artery: "Deep inferior epigastric artery",
    vein: "Deep inferior epigastric vein",
  },
  radial_forearm: {
    artery: "Radial artery",
    vein: "Venae comitantes of radial artery",
  },
  fibula: {
    artery: "Peroneal artery",
    vein: "Venae comitantes of peroneal artery",
  },
  latissimus_dorsi: {
    artery: "Thoracodorsal artery",
    vein: "Thoracodorsal vein",
  },
  gracilis: {
    artery: "Gracilis branch of medial circumflex femoral artery",
    vein: "Venae comitantes of medial circumflex femoral artery",
  },
  tug: {
    artery: "Gracilis branch of medial circumflex femoral artery",
    vein: "Venae comitantes of medial circumflex femoral artery",
  },
  scip: {
    artery: "Superficial circumflex iliac artery",
    vein: "Superficial circumflex iliac vein",
  },
  siea: {
    artery: "Superficial inferior epigastric artery",
    vein: "Superficial inferior epigastric vein",
  },
  medial_sural: {
    artery: "Medial sural artery",
    vein: "Venae comitantes of medial sural artery",
  },
  sgap: {
    artery: "Superior gluteal artery (perforator branch)",
    vein: "Superior gluteal vein",
  },
  igap: {
    artery: "Inferior gluteal artery (perforator branch)",
    vein: "Inferior gluteal vein",
  },
  pap: {
    artery: "Profunda femoris artery (perforator branch)",
    vein: "Venae comitantes of profunda femoris artery",
  },
  tdap: {
    artery: "Thoracodorsal artery (perforator branch)",
    vein: "Thoracodorsal vein",
  },
  parascapular: {
    artery: "Circumflex scapular artery",
    vein: "Circumflex scapular vein",
  },
  scapular: {
    artery: "Circumflex scapular artery",
    vein: "Circumflex scapular vein",
  },
  serratus_anterior: {
    artery: "Thoracodorsal artery (serratus branch)",
    vein: "Thoracodorsal vein",
  },
  other: {
    artery: "",
    vein: "",
  },
};

export function FreeFlapClinicalFields({
  clinicalDetails,
  procedureType,
  picklistEntryId,
  onUpdate,
}: FreeFlapClinicalFieldsProps) {
  const { theme } = useTheme();

  const presetFlapType = picklistEntryId
    ? PICKLIST_TO_FLAP_TYPE[picklistEntryId]
    : undefined;
  const flapIsLocked = !!presetFlapType;
  
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

  const flapType = clinicalDetails.flapType;
  const donorVessels = flapType ? DEFAULT_DONOR_VESSELS[flapType] : undefined;

  const FLAPS_WITH_SKIN_ISLAND: FreeFlap[] = [
    "gracilis", "tug", "serratus_anterior", "pap", "latissimus_dorsi",
  ];
  const showSkinIsland = flapType ? FLAPS_WITH_SKIN_ISLAND.includes(flapType) : false;

  const handleFlapTypeChange = (flap: FreeFlap) => {
    const snomedEntry = FLAP_SNOMED_MAP[flap];
    onUpdate({
      ...clinicalDetails,
      flapType: flap,
      flapSnomedCode: snomedEntry?.code,
      flapSnomedDisplay: snomedEntry?.display,
      skinIsland: undefined,
      flapSpecificDetails: {},
    });
  };

  const handleRecipientSiteChange = (region: AnatomicalRegion) => {
    const snomedEntry = RECIPIENT_SITE_SNOMED_MAP[region];
    onUpdate({
      ...clinicalDetails,
      recipientSiteRegion: region,
      recipientSiteSnomedCode: snomedEntry?.code,
      recipientSiteSnomedDisplay: snomedEntry?.display,
    });
  };

  return (
    <View style={styles.container}>
      {flapIsLocked && clinicalDetails.flapType ? (
        <View style={styles.lockedFlapSection}>
          <View style={styles.labelRow}>
            <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>
              Flap Type
            </ThemedText>
          </View>
          <View style={[styles.lockedFlapBadge, {
            backgroundColor: theme.link + "15",
            borderColor: theme.link,
          }]}>
            <Feather name="check-circle" size={16} color={theme.link} />
            <ThemedText style={[styles.lockedFlapText, { color: theme.link }]}>
              {FREE_FLAP_LABELS[clinicalDetails.flapType]}
            </ThemedText>
          </View>
          {(FLAP_ELEVATION_PLANES[clinicalDetails.flapType] || []).length > 0 ? (
            <View style={{ marginTop: Spacing.md }}>
              <PickerField
                label="Elevation Plane"
                value={clinicalDetails.elevationPlane || ""}
                options={(FLAP_ELEVATION_PLANES[clinicalDetails.flapType] || []).map((plane) => ({
                  value: plane,
                  label: ELEVATION_PLANE_LABELS[plane],
                }))}
                onSelect={(value) => onUpdate({ ...clinicalDetails, elevationPlane: value as ElevationPlane })}
              />
            </View>
          ) : null}
        </View>
      ) : (
        <FreeFlapPicker
          flapType={clinicalDetails.flapType}
          elevationPlane={clinicalDetails.elevationPlane}
          onFlapTypeChange={handleFlapTypeChange}
          onElevationPlaneChange={(plane) =>
            onUpdate({ ...clinicalDetails, elevationPlane: plane })
          }
          required
        />
      )}

      {showSkinIsland ? (
        <SelectField
          label="Skin Island"
          value={clinicalDetails.skinIsland === true ? "yes" : clinicalDetails.skinIsland === false ? "no" : ""}
          options={[
            { value: "yes", label: "With skin island" },
            { value: "no", label: "Muscle only" },
          ]}
          onSelect={(v) => onUpdate({ ...clinicalDetails, skinIsland: v === "yes" })}
          required
        />
      ) : null}

      <View style={styles.row}>
        <View style={styles.halfField}>
          <ThemedText style={[styles.segmentedLabel, { color: theme.textSecondary }]}>
            Harvest Side *
          </ThemedText>
          <View style={[styles.segmentedControl, { borderColor: theme.border, backgroundColor: theme.backgroundDefault }]}>
            {(["left", "right"] as HarvestSide[]).map((side) => {
              const isSelected = clinicalDetails.harvestSide === side;
              return (
                <Pressable
                  key={side}
                  style={[
                    styles.segmentedButton,
                    isSelected ? { backgroundColor: theme.link } : undefined,
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onUpdate({ ...clinicalDetails, harvestSide: side });
                  }}
                >
                  <ThemedText
                    style={[
                      styles.segmentedButtonText,
                      { color: isSelected ? "#FFFFFF" : theme.textSecondary },
                    ]}
                  >
                    {side === "left" ? "Left" : "Right"}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>
        <View style={styles.halfField}>
          <ThemedText style={[styles.segmentedLabel, { color: theme.textSecondary }]}>
            Recipient Side
          </ThemedText>
          <View style={[styles.segmentedControl, { borderColor: theme.border, backgroundColor: theme.backgroundDefault }]}>
            {(["left", "right"] as HarvestSide[]).map((side) => {
              const isSelected = clinicalDetails.recipientSiteLaterality === side;
              return (
                <Pressable
                  key={side}
                  style={[
                    styles.segmentedButton,
                    isSelected ? { backgroundColor: theme.link } : undefined,
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onUpdate({ ...clinicalDetails, recipientSiteLaterality: side });
                  }}
                >
                  <ThemedText
                    style={[
                      styles.segmentedButtonText,
                      { color: isSelected ? "#FFFFFF" : theme.textSecondary },
                    ]}
                  >
                    {side === "left" ? "Left" : "Right"}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      <RecipientSiteSelector
        value={clinicalDetails.recipientSiteRegion}
        onSelect={handleRecipientSiteChange}
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

      {flapType ? (
        <FlapSpecificFields
          flapType={flapType}
          details={clinicalDetails.flapSpecificDetails || {}}
          onUpdate={(fsd: FlapSpecificDetails) =>
            onUpdate({ ...clinicalDetails, flapSpecificDetails: fsd })
          }
        />
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
    </View>
  );
}

interface HandSurgeryClinicalFieldsProps {
  clinicalDetails: HandSurgeryDetails;
  onUpdate: (details: HandSurgeryDetails) => void;
}

const HAND_OPTIONS = [
  { value: "left", label: "Left" },
  { value: "right", label: "Right" },
];

const DOMINANT_HAND_OPTIONS = [
  { value: "left", label: "Left" },
  { value: "right", label: "Right" },
  { value: "ambidextrous", label: "Ambidextrous" },
];

export function HandSurgeryClinicalFields({
  clinicalDetails,
  onUpdate,
}: HandSurgeryClinicalFieldsProps) {
  return null;
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
  picklistEntryId?: string;
  clinicalDetails: ClinicalDetails;
  onUpdate: (details: ClinicalDetails) => void;
}

export function ProcedureClinicalDetails({
  specialty,
  procedureType,
  picklistEntryId,
  clinicalDetails,
  onUpdate,
}: ProcedureClinicalDetailsProps) {
  const { theme } = useTheme();
  
  const picklistEntry = picklistEntryId ? findPicklistEntry(picklistEntryId) : undefined;
  const isFreeFlapProcedure = picklistEntry
    ? !!picklistEntry.hasFreeFlap
    : procedureType.toLowerCase().includes("free flap") ||
      procedureType.toLowerCase().includes("free tissue");
  
  if (isFreeFlapProcedure) {
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
        picklistEntryId={picklistEntryId}
        onUpdate={onUpdate}
      />
    );
  }

  if (specialty === "hand_surgery") {
    const handDetails: HandSurgeryDetails = {
      injuryMechanism: (clinicalDetails as HandSurgeryDetails)?.injuryMechanism,
      fractures: (clinicalDetails as HandSurgeryDetails)?.fractures,
      dominantHand: (clinicalDetails as HandSurgeryDetails)?.dominantHand,
      affectedHand: (clinicalDetails as HandSurgeryDetails)?.affectedHand,
    };
    return (
      <HandSurgeryClinicalFields
        clinicalDetails={handDetails}
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
  fractureSection: {
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  fractureTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  fractureAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  fractureAddBtnText: {
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
  emptyFractureCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  emptyFractureText: {
    fontSize: 14,
  },
  lockedFlapSection: {
    marginBottom: Spacing.lg,
  },
  labelRow: {
    marginBottom: Spacing.sm,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  lockedFlapBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  lockedFlapText: {
    fontSize: 15,
    fontWeight: "600",
  },
  segmentedLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: Spacing.sm,
  },
  segmentedControl: {
    flexDirection: "row",
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: Spacing.md,
  },
  segmentedButton: {
    flex: 1,
    paddingVertical: Spacing.sm + 2,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentedButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
