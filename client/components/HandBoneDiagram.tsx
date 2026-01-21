import React from "react";
import { View, StyleSheet, Pressable, Image, Dimensions, ViewStyle } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing } from "@/constants/theme";

// Using require for static image assets
const handBonesImage = require("../assets/images/hand-bones-diagram.png");

interface BoneData {
  id: string;
  name: string;
  familyCode: string;
  subBoneId?: string;
  finger?: string;
  phalanx?: string;
  // Hitbox coordinates as percentage of image dimensions
  hitbox: { x: number; y: number; width: number; height: number };
}

// Image dimensions: 640x640 - coordinates as percentages
const IMAGE_SIZE = 640;

// Carpal bones - based on image anatomy
const CARPAL_BONES: BoneData[] = [
  { id: "scaphoid", name: "Scaphoid (Navicular)", familyCode: "72",
    hitbox: { x: 38, y: 22, width: 10, height: 8 } },
  { id: "lunate", name: "Lunate", familyCode: "71",
    hitbox: { x: 27, y: 21, width: 8, height: 7 } },
  { id: "triquetrum", name: "Triquetrum", familyCode: "76", subBoneId: "2",
    hitbox: { x: 18, y: 23, width: 8, height: 7 } },
  { id: "pisiform", name: "Pisiform", familyCode: "76", subBoneId: "1",
    hitbox: { x: 16, y: 30, width: 6, height: 5 } },
  { id: "trapezium", name: "Trapezium", familyCode: "75",
    hitbox: { x: 44, y: 32, width: 8, height: 7 } },
  { id: "trapezoid", name: "Trapezoid", familyCode: "76", subBoneId: "3",
    hitbox: { x: 36, y: 31, width: 7, height: 6 } },
  { id: "capitate", name: "Capitate", familyCode: "73",
    hitbox: { x: 28, y: 29, width: 8, height: 10 } },
  { id: "hamate", name: "Hamate", familyCode: "74",
    hitbox: { x: 20, y: 31, width: 8, height: 9 } },
];

// Metacarpal bones
const METACARPAL_BONES: BoneData[] = [
  { id: "mc1", name: "1st Metacarpal (Thumb)", familyCode: "77", finger: "1",
    hitbox: { x: 52, y: 40, width: 10, height: 18 } },
  { id: "mc2", name: "2nd Metacarpal (Index)", familyCode: "77", finger: "2",
    hitbox: { x: 37, y: 42, width: 7, height: 20 } },
  { id: "mc3", name: "3rd Metacarpal (Middle)", familyCode: "77", finger: "3",
    hitbox: { x: 29, y: 43, width: 7, height: 22 } },
  { id: "mc4", name: "4th Metacarpal (Ring)", familyCode: "77", finger: "4",
    hitbox: { x: 21, y: 43, width: 7, height: 20 } },
  { id: "mc5", name: "5th Metacarpal (Little)", familyCode: "77", finger: "5",
    hitbox: { x: 14, y: 42, width: 7, height: 18 } },
];

// Phalanges
const PHALANX_BONES: BoneData[] = [
  // Thumb (only proximal and distal)
  { id: "pp1", name: "Thumb Proximal Phalanx", familyCode: "78", finger: "1", phalanx: "1",
    hitbox: { x: 58, y: 60, width: 8, height: 12 } },
  { id: "dp1", name: "Thumb Distal Phalanx", familyCode: "78", finger: "1", phalanx: "3",
    hitbox: { x: 62, y: 72, width: 7, height: 10 } },
  
  // Index finger
  { id: "pp2", name: "Index Proximal Phalanx", familyCode: "78", finger: "2", phalanx: "1",
    hitbox: { x: 42, y: 63, width: 6, height: 12 } },
  { id: "mp2", name: "Index Middle Phalanx", familyCode: "78", finger: "2", phalanx: "2",
    hitbox: { x: 45, y: 75, width: 5, height: 9 } },
  { id: "dp2", name: "Index Distal Phalanx", familyCode: "78", finger: "2", phalanx: "3",
    hitbox: { x: 47, y: 84, width: 5, height: 8 } },
  
  // Middle finger
  { id: "pp3", name: "Middle Proximal Phalanx", familyCode: "78", finger: "3", phalanx: "1",
    hitbox: { x: 33, y: 66, width: 6, height: 14 } },
  { id: "mp3", name: "Middle Middle Phalanx", familyCode: "78", finger: "3", phalanx: "2",
    hitbox: { x: 35, y: 80, width: 5, height: 10 } },
  { id: "dp3", name: "Middle Distal Phalanx", familyCode: "78", finger: "3", phalanx: "3",
    hitbox: { x: 36, y: 90, width: 5, height: 7 } },
  
  // Ring finger
  { id: "pp4", name: "Ring Proximal Phalanx", familyCode: "78", finger: "4", phalanx: "1",
    hitbox: { x: 24, y: 64, width: 6, height: 12 } },
  { id: "mp4", name: "Ring Middle Phalanx", familyCode: "78", finger: "4", phalanx: "2",
    hitbox: { x: 24, y: 76, width: 5, height: 9 } },
  { id: "dp4", name: "Ring Distal Phalanx", familyCode: "78", finger: "4", phalanx: "3",
    hitbox: { x: 24, y: 85, width: 5, height: 7 } },
  
  // Little finger
  { id: "pp5", name: "Little Proximal Phalanx", familyCode: "78", finger: "5", phalanx: "1",
    hitbox: { x: 14, y: 61, width: 5, height: 10 } },
  { id: "mp5", name: "Little Middle Phalanx", familyCode: "78", finger: "5", phalanx: "2",
    hitbox: { x: 13, y: 71, width: 5, height: 8 } },
  { id: "dp5", name: "Little Distal Phalanx", familyCode: "78", finger: "5", phalanx: "3",
    hitbox: { x: 12, y: 79, width: 5, height: 7 } },
];

// Crush/Multiple injury option
const CRUSH_OPTION: BoneData = {
  id: "crush",
  name: "Crush / Multiple Injuries",
  familyCode: "79",
  hitbox: { x: 0, y: 0, width: 0, height: 0 }, // Not clickable on image
};

const ALL_BONES = [...CARPAL_BONES, ...METACARPAL_BONES, ...PHALANX_BONES];

interface HandBoneDiagramProps {
  selectedBone: BoneData | null;
  onBoneSelect: (bone: BoneData) => void;
  fracturedBones?: string[];
}

export function HandBoneDiagram({
  selectedBone,
  onBoneSelect,
  fracturedBones = []
}: HandBoneDiagramProps) {
  const { theme } = useTheme();
  const screenWidth = Dimensions.get("window").width;
  const imageDisplaySize = Math.min(screenWidth - 48, 340);
  
  const getOverlayStyle = (bone: BoneData): ViewStyle => {
    const isSelected = selectedBone?.id === bone.id;
    const isFractured = fracturedBones.includes(bone.id);
    
    // Calculate pixel values from percentages
    const left = (bone.hitbox.x / 100) * imageDisplaySize;
    const top = (bone.hitbox.y / 100) * imageDisplaySize;
    const width = (bone.hitbox.width / 100) * imageDisplaySize;
    const height = (bone.hitbox.height / 100) * imageDisplaySize;
    
    return {
      position: "absolute",
      left,
      top,
      width,
      height,
      backgroundColor: isSelected 
        ? `${theme.link}60` 
        : isFractured 
          ? "rgba(229, 57, 53, 0.4)" 
          : "transparent",
      borderWidth: isSelected ? 2 : isFractured ? 2 : 0,
      borderColor: isSelected ? theme.link : "#E53935",
      borderRadius: 4,
    };
  };

  return (
    <View style={styles.container}>
      <ThemedText style={[styles.title, { color: theme.text }]}>
        Select Fractured Bone
      </ThemedText>
      <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
        Tap on the bone in the diagram below
      </ThemedText>
      
      <View style={[styles.imageContainer, { 
        backgroundColor: theme.backgroundSecondary,
        width: imageDisplaySize,
        height: imageDisplaySize
      }]}>
        <Image
          source={handBonesImage}
          style={{ width: "100%", height: "100%" }}
          resizeMode="contain"
        />
        
        {/* Clickable overlay regions */}
        {ALL_BONES.map((bone) => (
          <Pressable
            key={bone.id}
            style={getOverlayStyle(bone)}
            onPress={() => onBoneSelect(bone)}
          />
        ))}
      </View>
      
      {selectedBone ? (
        <View style={[styles.selectionInfo, { backgroundColor: theme.backgroundElevated }]}>
          <ThemedText style={[styles.selectedBoneName, { color: theme.link }]}>
            {selectedBone.name}
          </ThemedText>
          <ThemedText style={[styles.selectedBoneCode, { color: theme.textSecondary }]}>
            AO Region 7 - Code: {selectedBone.familyCode}
            {selectedBone.subBoneId ? `.${selectedBone.subBoneId}` : ""}
          </ThemedText>
        </View>
      ) : null}
      
      {/* Crush/Multiple option */}
      <Pressable
        style={[
          styles.crushOption,
          { 
            backgroundColor: selectedBone?.id === "crush" ? theme.link : theme.backgroundElevated,
            borderColor: theme.border
          }
        ]}
        onPress={() => onBoneSelect(CRUSH_OPTION)}
      >
        <ThemedText style={[
          styles.crushOptionText, 
          { color: selectedBone?.id === "crush" ? "#FFF" : theme.text }
        ]}>
          Crush / Multiple Injuries (79)
        </ThemedText>
      </Pressable>
      
      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: "#D4C4A8" }]} />
          <ThemedText style={[styles.legendText, { color: theme.textSecondary }]}>
            Carpal (71-76)
          </ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: "#E8D5B7" }]} />
          <ThemedText style={[styles.legendText, { color: theme.textSecondary }]}>
            Metacarpal (77)
          </ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: "#F5E6D3" }]} />
          <ThemedText style={[styles.legendText, { color: theme.textSecondary }]}>
            Phalanx (78)
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

// Export bone data for use in other components
export { ALL_BONES, CARPAL_BONES, METACARPAL_BONES, PHALANX_BONES, CRUSH_OPTION };
export type { BoneData };

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  imageContainer: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    position: "relative",
  },
  selectionInfo: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    minWidth: 200,
  },
  selectedBoneName: {
    fontSize: 17,
    fontWeight: "600",
  },
  selectedBoneCode: {
    fontSize: 13,
    marginTop: 2,
  },
  crushOption: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  crushOptionText: {
    fontSize: 15,
    fontWeight: "500",
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    marginTop: Spacing.md,
    gap: Spacing.md,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendColor: {
    width: 14,
    height: 14,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: "#8B7355",
  },
  legendText: {
    fontSize: 11,
  },
});
