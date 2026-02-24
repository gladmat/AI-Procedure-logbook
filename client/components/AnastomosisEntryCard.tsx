import React, { useEffect, useState } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing } from "@/constants/theme";
import { FormField, SelectField, PickerField } from "@/components/FormField";
import {
  type AnastomosisEntry,
  type AnatomicalRegion,
  type SnomedRefItem,
  VESSEL_TYPE_LABELS,
  VEIN_COUPLING_METHOD_OPTIONS,
  ANASTOMOSIS_LABELS,
} from "@/types/case";
import { fetchVesselsByRegion, getRecipientVesselPresets } from "@/lib/snomedApi";

interface AnastomosisEntryCardProps {
  entry: AnastomosisEntry;
  index: number;
  recipientRegion?: AnatomicalRegion;
  defaultDonorVessel?: string;
  onUpdate: (entry: AnastomosisEntry) => void;
  onDelete: () => void;
}

const COUPLER_SIZES = ["1.5", "2.0", "2.5", "3.0", "3.5", "4.0"];

export function AnastomosisEntryCard({
  entry,
  index,
  recipientRegion,
  defaultDonorVessel,
  onUpdate,
  onDelete,
}: AnastomosisEntryCardProps) {
  const { theme } = useTheme();
  const [arteries, setArteries] = useState<SnomedRefItem[]>([]);
  const [veins, setVeins] = useState<SnomedRefItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (recipientRegion) {
      setIsLoading(true);
      Promise.all([
        fetchVesselsByRegion(recipientRegion, "artery"),
        fetchVesselsByRegion(recipientRegion, "vein"),
      ])
        .then(([arteriesData, veinsData]) => {
          // Use server data if available, otherwise use local presets
          if (arteriesData.length > 0) {
            setArteries(arteriesData);
          } else {
            const localArteries = getRecipientVesselPresets(recipientRegion, "artery");
            setArteries(localArteries.map((name) => ({
              snomedCtCode: name.toLowerCase().replace(/\s+/g, "_"),
              displayName: name,
              commonName: name,
            } as SnomedRefItem)));
          }
          
          if (veinsData.length > 0) {
            setVeins(veinsData);
          } else {
            const localVeins = getRecipientVesselPresets(recipientRegion, "vein");
            setVeins(localVeins.map((name) => ({
              snomedCtCode: name.toLowerCase().replace(/\s+/g, "_"),
              displayName: name,
              commonName: name,
            } as SnomedRefItem)));
          }
        })
        .catch((err) => {
          console.error("Error fetching vessels:", err);
          // Fall back to local presets on error
          const localArteries = getRecipientVesselPresets(recipientRegion, "artery");
          const localVeins = getRecipientVesselPresets(recipientRegion, "vein");
          setArteries(localArteries.map((name) => ({
            snomedCtCode: name.toLowerCase().replace(/\s+/g, "_"),
            displayName: name,
            commonName: name,
          } as SnomedRefItem)));
          setVeins(localVeins.map((name) => ({
            snomedCtCode: name.toLowerCase().replace(/\s+/g, "_"),
            displayName: name,
            commonName: name,
          } as SnomedRefItem)));
        })
        .finally(() => setIsLoading(false));
    }
  }, [recipientRegion]);

  const vesselOptions =
    entry.vesselType === "artery"
      ? arteries.map((v) => ({
          value: v.snomedCtCode,
          label: v.commonName || v.displayName,
        }))
      : veins.map((v) => ({
          value: v.snomedCtCode,
          label: v.commonName || v.displayName,
        }));

  const selectedVessel =
    entry.vesselType === "artery"
      ? arteries.find((v) => v.snomedCtCode === entry.recipientVesselSnomedCode)
      : veins.find((v) => v.snomedCtCode === entry.recipientVesselSnomedCode);

  const handleVesselTypeChange = (value: string) => {
    onUpdate({
      ...entry,
      vesselType: value as "artery" | "vein",
      recipientVesselSnomedCode: undefined,
      recipientVesselName: "",
    });
  };

  const handleVesselSelect = (snomedCode: string) => {
    const vessel =
      entry.vesselType === "artery"
        ? arteries.find((v) => v.snomedCtCode === snomedCode)
        : veins.find((v) => v.snomedCtCode === snomedCode);

    onUpdate({
      ...entry,
      recipientVesselSnomedCode: snomedCode,
      recipientVesselName: vessel?.displayName || "",
    });
  };

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.backgroundElevated, borderColor: theme.border },
      ]}
    >
      <View style={styles.headerRow}>
        <ThemedText style={[styles.cardTitle, { color: theme.text }]}>
          {entry.vesselType === "artery" ? "Arterial" : "Venous"} Anastomosis{" "}
          {index + 1}
        </ThemedText>
        <Pressable onPress={onDelete} hitSlop={8}>
          <Feather name="trash-2" size={18} color={theme.error} />
        </Pressable>
      </View>

      <PickerField
        label="Vessel Type"
        value={entry.vesselType}
        options={Object.entries(VESSEL_TYPE_LABELS).map(([value, label]) => ({
          value,
          label,
        }))}
        onSelect={handleVesselTypeChange}
        required
      />

      {recipientRegion ? (
        isLoading ? (
          <ThemedText style={{ color: theme.textSecondary, marginBottom: Spacing.md }}>
            Loading vessels...
          </ThemedText>
        ) : vesselOptions.length > 0 ? (
          <View style={styles.vesselSelectContainer}>
            <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
              Recipient Vessel
            </ThemedText>
            <View style={styles.vesselOptions}>
              {vesselOptions.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => handleVesselSelect(option.value)}
                  style={[
                    styles.vesselOption,
                    {
                      backgroundColor:
                        entry.recipientVesselSnomedCode === option.value
                          ? theme.link + "15"
                          : theme.backgroundDefault,
                      borderColor:
                        entry.recipientVesselSnomedCode === option.value
                          ? theme.link
                          : theme.border,
                    },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.vesselOptionText,
                      {
                        color:
                          entry.recipientVesselSnomedCode === option.value
                            ? theme.link
                            : theme.text,
                        fontWeight:
                          entry.recipientVesselSnomedCode === option.value
                            ? "600"
                            : "400",
                      },
                    ]}
                  >
                    {option.label}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </View>
        ) : (
          <FormField
            label="Recipient Vessel"
            value={entry.recipientVesselName}
            onChangeText={(text) =>
              onUpdate({ ...entry, recipientVesselName: text })
            }
            placeholder="Enter vessel name"
          />
        )
      ) : (
        <FormField
          label="Recipient Vessel"
          value={entry.recipientVesselName}
          onChangeText={(text) =>
            onUpdate({ ...entry, recipientVesselName: text })
          }
          placeholder="Select recipient site first"
        />
      )}

      <FormField
        label="Donor Vessel"
        value={entry.donorVesselName || ""}
        onChangeText={(text) => onUpdate({ ...entry, donorVesselName: text })}
        placeholder={defaultDonorVessel || "e.g., Desc. branch LCFA"}
      />

      {/* Arteries are always hand-sewn, veins can choose coupler or hand-sewn */}
      {entry.vesselType === "artery" ? (
        <View style={styles.fixedValue}>
          <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
            Technique
          </ThemedText>
          <ThemedText style={[styles.fixedValueText, { color: theme.text }]}>
            Hand-sewn (standard for arteries)
          </ThemedText>
        </View>
      ) : (
        <PickerField
          label="Technique"
          value={entry.couplingMethod || ""}
          options={VEIN_COUPLING_METHOD_OPTIONS}
          onSelect={(value) =>
            onUpdate({ ...entry, couplingMethod: value as any })
          }
        />
      )}

      {entry.vesselType === "vein" && entry.couplingMethod === "coupler" ? (
        <PickerField
          label="Coupler Size (mm)"
          value={entry.couplerSizeMm?.toString() || ""}
          options={COUPLER_SIZES.map((size) => ({ value: size, label: size }))}
          onSelect={(value) =>
            onUpdate({ ...entry, couplerSizeMm: parseFloat(value) })
          }
        />
      ) : null}

      <PickerField
        label="Configuration"
        value={entry.configuration || ""}
        options={Object.entries(ANASTOMOSIS_LABELS).map(([value, label]) => ({
          value,
          label,
        }))}
        onSelect={(value) =>
          onUpdate({ ...entry, configuration: value as any })
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: Spacing.sm,
  },
  vesselSelectContainer: {
    marginBottom: Spacing.lg,
  },
  vesselOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  vesselOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  vesselOptionText: {
    fontSize: 13,
  },
  fixedValue: {
    marginBottom: Spacing.lg,
  },
  fixedValueText: {
    fontSize: 16,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    backgroundColor: "rgba(0,0,0,0.03)",
  },
});
