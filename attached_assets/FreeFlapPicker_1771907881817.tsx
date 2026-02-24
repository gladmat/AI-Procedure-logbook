import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing } from "@/constants/theme";
import { PickerField } from "@/components/FormField";
import {
  type FreeFlap,
  type ElevationPlane,
  FREE_FLAP_LABELS,
  ELEVATION_PLANE_LABELS,
} from "@/types/case";

interface FreeFlapPickerProps {
  flapType?: FreeFlap;
  elevationPlane?: ElevationPlane;
  onFlapTypeChange: (flapType: FreeFlap) => void;
  onElevationPlaneChange: (plane: ElevationPlane) => void;
  required?: boolean;
}

// Grouped for UI rendering — order reflects clinical frequency in orthoplastic/general context
const FLAP_GROUPS: { label: string; flaps: FreeFlap[] }[] = [
  {
    label: "Fasciocutaneous / Perforator",
    flaps: ["alt", "radial_forearm", "scip", "siea", "tdap", "parascapular", "medial_sural"],
  },
  {
    label: "Muscle ± Skin",
    flaps: ["gracilis", "tug", "latissimus_dorsi", "serratus_anterior", "pap"],
  },
  {
    label: "Osteocutaneous",
    flaps: ["fibula"],
  },
  {
    label: "Breast / Perforator",
    flaps: ["diep", "sgap", "igap"],
  },
  {
    label: "Other",
    flaps: ["other"],
  },
];

// Flap-specific elevation plane options
const ALT_ELEVATION_PLANES: ElevationPlane[] = ["subfascial", "epifascial", "thin_alt"];
const DEFAULT_ELEVATION_PLANES: ElevationPlane[] = ["subfascial", "suprafascial"];
const MUSCLE_ONLY_PLANES: ElevationPlane[] = ["subfascial"];  // e.g. pure muscle gracilis

export function FreeFlapPicker({
  flapType,
  elevationPlane,
  onFlapTypeChange,
  onElevationPlaneChange,
  required = false,
}: FreeFlapPickerProps) {
  const { theme } = useTheme();

  const handleFlapSelect = (flap: FreeFlap) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onFlapTypeChange(flap);
    // Reset elevation plane to a valid value for the new flap
    if (flap === "alt") {
      onElevationPlaneChange("subfascial");
    } else {
      onElevationPlaneChange("subfascial");
    }
  };

  const elevationOptions =
    flapType === "alt"
      ? ALT_ELEVATION_PLANES
      : DEFAULT_ELEVATION_PLANES;

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
          Flap Type
        </ThemedText>
        {required ? (
          <ThemedText style={[styles.required, { color: theme.error }]}>*</ThemedText>
        ) : null}
      </View>

      {FLAP_GROUPS.map((group) => (
        <View key={group.label} style={styles.group}>
          <ThemedText style={[styles.groupLabel, { color: theme.textSecondary }]}>
            {group.label}
          </ThemedText>
          <View style={styles.flapGrid}>
            {group.flaps.map((flap) => (
              <Pressable
                key={flap}
                onPress={() => handleFlapSelect(flap)}
                style={[
                  styles.flapButton,
                  {
                    backgroundColor:
                      flapType === flap ? theme.link + "15" : theme.backgroundDefault,
                    borderColor: flapType === flap ? theme.link : theme.border,
                  },
                ]}
              >
                <ThemedText
                  style={[
                    styles.flapText,
                    {
                      color: flapType === flap ? theme.link : theme.text,
                      fontWeight: flapType === flap ? "600" : "400",
                    },
                  ]}
                >
                  {FREE_FLAP_LABELS[flap]}
                </ThemedText>
                {flapType === flap ? (
                  <Feather name="check" size={14} color={theme.link} style={styles.checkIcon} />
                ) : null}
              </Pressable>
            ))}
          </View>
        </View>
      ))}

      {flapType && flapType !== "other" ? (
        <View style={styles.elevationSection}>
          <PickerField
            label="Elevation Plane"
            value={elevationPlane || ""}
            options={elevationOptions.map((plane) => ({
              value: plane,
              label: ELEVATION_PLANE_LABELS[plane],
            }))}
            onSelect={(value) => onElevationPlaneChange(value as ElevationPlane)}
          />
          {flapType === "alt" ? (
            <ThemedText style={[styles.hint, { color: theme.textSecondary }]}>
              Thin ALT = suprafascial with thinning; epifascial preserves fascia
            </ThemedText>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  labelRow: {
    flexDirection: "row",
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
  },
  required: {
    marginLeft: Spacing.xs,
    fontSize: 14,
  },
  group: {
    marginBottom: Spacing.md,
  },
  groupLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  flapGrid: {
    gap: Spacing.xs,
  },
  flapButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  flapText: {
    fontSize: 14,
    flex: 1,
  },
  checkIcon: {
    marginLeft: Spacing.sm,
  },
  elevationSection: {
    marginTop: Spacing.xs,
  },
  hint: {
    fontSize: 12,
    marginTop: Spacing.xs,
    fontStyle: "italic",
  },
});
