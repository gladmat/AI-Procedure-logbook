import React, { useState } from "react";
import { View, StyleSheet, Pressable, ScrollView } from "react-native";
import Svg, { Path, G, Text as SvgText, Rect } from "react-native-svg";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing } from "@/constants/theme";

interface BoneData {
  id: string;
  name: string;
  familyCode: string;
  subBoneId?: string;
  finger?: string;
  phalanx?: string;
  path: string;
  labelX: number;
  labelY: number;
}

// Anatomically accurate hand bone paths (dorsal view, left hand)
// Based on Gray's Anatomy plate illustrations (public domain)
const CARPAL_BONES: BoneData[] = [
  {
    id: "scaphoid",
    name: "Scaphoid",
    familyCode: "72",
    path: "M95,180 C85,175 80,185 82,195 C84,205 90,215 100,218 C110,221 120,215 122,205 C124,195 115,182 105,178 Z",
    labelX: 100,
    labelY: 198
  },
  {
    id: "lunate",
    name: "Lunate",
    familyCode: "71",
    path: "M125,178 C118,175 112,182 115,195 C118,208 128,218 140,218 C152,218 158,205 155,192 C152,179 135,173 125,178 Z",
    labelX: 135,
    labelY: 198
  },
  {
    id: "triquetrum",
    name: "Triquetrum",
    familyCode: "76",
    subBoneId: "2",
    path: "M158,182 C152,178 148,185 150,198 C152,211 162,222 175,220 C188,218 192,205 188,192 C184,179 168,175 158,182 Z",
    labelX: 170,
    labelY: 200
  },
  {
    id: "pisiform",
    name: "Pisiform",
    familyCode: "76",
    subBoneId: "1",
    path: "M178,225 C172,222 168,228 170,238 C172,248 180,255 190,252 C200,249 202,238 198,228 C194,218 185,220 178,225 Z",
    labelX: 185,
    labelY: 240
  },
  {
    id: "trapezium",
    name: "Trapezium",
    familyCode: "75",
    path: "M72,218 C65,222 62,232 68,245 C74,258 88,262 98,255 C108,248 108,235 102,222 C96,209 82,212 72,218 Z",
    labelX: 85,
    labelY: 240
  },
  {
    id: "trapezoid",
    name: "Trapezoid",
    familyCode: "76",
    subBoneId: "3",
    path: "M102,218 C95,215 92,225 95,238 C98,251 108,258 120,255 C132,252 135,240 130,228 C125,216 112,212 102,218 Z",
    labelX: 115,
    labelY: 238
  },
  {
    id: "capitate",
    name: "Capitate",
    familyCode: "73",
    path: "M122,218 C115,215 112,228 115,245 C118,262 132,272 148,268 C164,264 168,248 162,232 C156,216 135,212 122,218 Z",
    labelX: 140,
    labelY: 245
  },
  {
    id: "hamate",
    name: "Hamate",
    familyCode: "74",
    path: "M152,220 C145,218 142,230 145,248 C148,266 162,278 180,275 C198,272 202,252 195,235 C188,218 165,215 152,220 Z",
    labelX: 172,
    labelY: 250
  }
];

// Metacarpal bones (proximal to distal segments)
const METACARPAL_BONES: BoneData[] = [
  // Thumb metacarpal (MC1)
  { id: "mc1", name: "1st Metacarpal", familyCode: "77", finger: "1",
    path: "M70,245 L55,290 L50,340 L62,345 L75,295 L85,250 Z",
    labelX: 65, labelY: 295 },
  // Index metacarpal (MC2)
  { id: "mc2", name: "2nd Metacarpal", familyCode: "77", finger: "2",
    path: "M98,255 L88,300 L82,360 L95,365 L102,305 L110,260 Z",
    labelX: 95, labelY: 310 },
  // Middle metacarpal (MC3)
  { id: "mc3", name: "3rd Metacarpal", familyCode: "77", finger: "3",
    path: "M128,255 L120,305 L115,370 L130,375 L138,310 L142,260 Z",
    labelX: 128, labelY: 315 },
  // Ring metacarpal (MC4)
  { id: "mc4", name: "4th Metacarpal", familyCode: "77", finger: "4",
    path: "M155,258 L150,305 L148,365 L162,368 L168,310 L170,262 Z",
    labelX: 158, labelY: 315 },
  // Little metacarpal (MC5)
  { id: "mc5", name: "5th Metacarpal", familyCode: "77", finger: "5",
    path: "M182,262 L180,305 L180,355 L195,358 L198,308 L198,265 Z",
    labelX: 188, labelY: 310 }
];

// Phalanges (proximal, middle, distal for each finger)
const PHALANX_BONES: BoneData[] = [
  // Thumb phalanges (only proximal and distal)
  { id: "pp1", name: "Thumb Prox Phalanx", familyCode: "78", finger: "1", phalanx: "1",
    path: "M48,345 L38,395 L35,425 L50,428 L55,398 L62,350 Z",
    labelX: 48, labelY: 388 },
  { id: "dp1", name: "Thumb Distal Phalanx", familyCode: "78", finger: "1", phalanx: "3",
    path: "M33,428 L25,460 L28,478 L45,478 L52,460 L50,432 Z",
    labelX: 40, labelY: 455 },
  
  // Index phalanges
  { id: "pp2", name: "Index Prox Phalanx", familyCode: "78", finger: "2", phalanx: "1",
    path: "M80,365 L72,415 L70,450 L85,453 L90,418 L95,370 Z",
    labelX: 82, labelY: 410 },
  { id: "mp2", name: "Index Mid Phalanx", familyCode: "78", finger: "2", phalanx: "2",
    path: "M68,453 L62,485 L60,510 L75,513 L80,488 L85,458 Z",
    labelX: 72, labelY: 483 },
  { id: "dp2", name: "Index Distal Phalanx", familyCode: "78", finger: "2", phalanx: "3",
    path: "M58,513 L52,540 L55,558 L72,558 L78,540 L75,518 Z",
    labelX: 65, labelY: 538 },
  
  // Middle phalanges
  { id: "pp3", name: "Middle Prox Phalanx", familyCode: "78", finger: "3", phalanx: "1",
    path: "M113,375 L105,430 L102,470 L118,473 L125,433 L130,380 Z",
    labelX: 115, labelY: 425 },
  { id: "mp3", name: "Middle Mid Phalanx", familyCode: "78", finger: "3", phalanx: "2",
    path: "M100,473 L95,515 L92,545 L108,548 L115,518 L118,478 Z",
    labelX: 105, labelY: 512 },
  { id: "dp3", name: "Middle Distal Phalanx", familyCode: "78", finger: "3", phalanx: "3",
    path: "M90,548 L85,578 L88,598 L105,598 L112,578 L108,553 Z",
    labelX: 98, labelY: 575 },
  
  // Ring phalanges
  { id: "pp4", name: "Ring Prox Phalanx", familyCode: "78", finger: "4", phalanx: "1",
    path: "M148,368 L142,420 L140,458 L156,461 L162,423 L165,373 Z",
    labelX: 152, labelY: 415 },
  { id: "mp4", name: "Ring Mid Phalanx", familyCode: "78", finger: "4", phalanx: "2",
    path: "M138,461 L132,500 L130,528 L146,531 L152,503 L156,466 Z",
    labelX: 143, labelY: 498 },
  { id: "dp4", name: "Ring Distal Phalanx", familyCode: "78", finger: "4", phalanx: "3",
    path: "M128,531 L122,560 L125,578 L143,578 L150,560 L146,536 Z",
    labelX: 136, labelY: 556 },
  
  // Little phalanges
  { id: "pp5", name: "Little Prox Phalanx", familyCode: "78", finger: "5", phalanx: "1",
    path: "M180,358 L175,400 L175,432 L190,435 L195,402 L198,362 Z",
    labelX: 186, labelY: 398 },
  { id: "mp5", name: "Little Mid Phalanx", familyCode: "78", finger: "5", phalanx: "2",
    path: "M173,435 L168,468 L168,492 L183,495 L188,470 L192,440 Z",
    labelX: 180, labelY: 465 },
  { id: "dp5", name: "Little Distal Phalanx", familyCode: "78", finger: "5", phalanx: "3",
    path: "M166,495 L162,522 L165,538 L180,538 L186,522 L183,500 Z",
    labelX: 174, labelY: 518 }
];

const ALL_BONES = [...CARPAL_BONES, ...METACARPAL_BONES, ...PHALANX_BONES];

interface HandBoneDiagramProps {
  selectedBone: BoneData | null;
  onBoneSelect: (bone: BoneData) => void;
  highlightedBones?: string[]; // Array of bone IDs to highlight
  fracturedBones?: string[]; // Array of bone IDs that have fractures
}

export function HandBoneDiagram({
  selectedBone,
  onBoneSelect,
  highlightedBones = [],
  fracturedBones = []
}: HandBoneDiagramProps) {
  const { theme } = useTheme();
  const [hoveredBone, setHoveredBone] = useState<string | null>(null);
  
  const getBoneFill = (bone: BoneData): string => {
    if (selectedBone?.id === bone.id) {
      return theme.link;
    }
    if (fracturedBones.includes(bone.id)) {
      return "#E53935"; // Red for fractured
    }
    if (highlightedBones.includes(bone.id) || hoveredBone === bone.id) {
      return theme.info;
    }
    // Different colors for different bone types
    if (bone.familyCode === "77") return "#E8D5B7"; // Metacarpals - light bone color
    if (bone.familyCode === "78") return "#F5E6D3"; // Phalanges - lighter
    return "#D4C4A8"; // Carpals - slightly darker
  };
  
  const getBoneStroke = (bone: BoneData): string => {
    if (selectedBone?.id === bone.id) {
      return theme.text;
    }
    return "#8B7355";
  };
  
  const renderBone = (bone: BoneData) => (
    <G key={bone.id}>
      <Path
        d={bone.path}
        fill={getBoneFill(bone)}
        stroke={getBoneStroke(bone)}
        strokeWidth={selectedBone?.id === bone.id ? 2.5 : 1.5}
        onPress={() => onBoneSelect(bone)}
        onPressIn={() => setHoveredBone(bone.id)}
        onPressOut={() => setHoveredBone(null)}
      />
    </G>
  );

  return (
    <View style={styles.container}>
      <ThemedText style={[styles.title, { color: theme.text }]}>
        Select Fractured Bone
      </ThemedText>
      <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
        Tap on the bone to classify the fracture
      </ThemedText>
      
      <View style={[styles.diagramContainer, { backgroundColor: theme.backgroundSecondary }]}>
        <Svg width="100%" height={450} viewBox="0 130 260 490">
          {/* Wrist outline for context */}
          <Path
            d="M60,168 C50,175 45,185 48,200 L48,180 C45,175 42,170 45,165 C52,155 75,150 135,148 C195,150 218,155 225,165 C228,170 225,175 222,180 L222,200 C225,185 220,175 210,168 C200,160 175,155 135,155 C95,155 70,160 60,168 Z"
            fill="#F5E6D3"
            stroke="#8B7355"
            strokeWidth={1}
          />
          
          {/* Render all bones */}
          {ALL_BONES.map(renderBone)}
          
          {/* Fracture lines on fractured bones */}
          {fracturedBones.map(boneId => {
            const bone = ALL_BONES.find(b => b.id === boneId);
            if (!bone) return null;
            return (
              <Path
                key={`fracture-${boneId}`}
                d={`M${bone.labelX - 10},${bone.labelY - 5} L${bone.labelX + 10},${bone.labelY + 5}`}
                stroke="#C62828"
                strokeWidth={2}
                strokeDasharray="4,2"
              />
            );
          })}
        </Svg>
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
      
      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: "#D4C4A8" }]} />
          <ThemedText style={[styles.legendText, { color: theme.textSecondary }]}>
            Carpal bones (71-76)
          </ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: "#E8D5B7" }]} />
          <ThemedText style={[styles.legendText, { color: theme.textSecondary }]}>
            Metacarpals (77)
          </ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: "#F5E6D3" }]} />
          <ThemedText style={[styles.legendText, { color: theme.textSecondary }]}>
            Phalanges (78)
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

// Export bone data for use in other components
export { ALL_BONES, CARPAL_BONES, METACARPAL_BONES, PHALANX_BONES };
export type { BoneData };

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  diagramContainer: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    marginHorizontal: Spacing.md,
  },
  selectionInfo: {
    marginTop: Spacing.md,
    marginHorizontal: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  selectedBoneName: {
    fontSize: 18,
    fontWeight: "600",
  },
  selectedBoneCode: {
    fontSize: 14,
    marginTop: 4,
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
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#8B7355",
  },
  legendText: {
    fontSize: 12,
  },
});
