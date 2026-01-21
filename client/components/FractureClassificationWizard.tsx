import React, { useState, useEffect, useMemo } from "react";
import { View, StyleSheet, Pressable, ScrollView, Modal } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing } from "@/constants/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HandBoneDiagram, BoneData, ALL_BONES } from "./HandBoneDiagram";
import {
  AO_HAND_CLASSIFICATION,
  generateAOCode,
  validateAOCode,
  FINGER_NAMES,
  PHALANX_NAMES,
  SEGMENT_NAMES,
  getFractureTypeLabel
} from "@/data/aoHandClassification";

interface FractureEntry {
  id: string;
  boneId: string;
  boneName: string;
  aoCode: string;
  details: {
    familyCode: string;
    type?: string;
    subBoneId?: string;
    finger?: string;
    phalanx?: string;
    segment?: string;
    qualifications?: string[];
  };
}

interface FractureClassificationWizardProps {
  visible: boolean;
  onClose: () => void;
  onSave: (fractures: FractureEntry[]) => void;
  initialFractures?: FractureEntry[];
}

type WizardStep = "bone_select" | "segment_select" | "type_select" | "qualification_select" | "review";

export function FractureClassificationWizard({
  visible,
  onClose,
  onSave,
  initialFractures = []
}: FractureClassificationWizardProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  
  const [step, setStep] = useState<WizardStep>("bone_select");
  const [selectedBone, setSelectedBone] = useState<BoneData | null>(null);
  const [fractures, setFractures] = useState<FractureEntry[]>(initialFractures);
  
  // Classification selections
  const [selectedSegment, setSelectedSegment] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedQualifications, setSelectedQualifications] = useState<string[]>([]);
  const [selectedSubBone, setSelectedSubBone] = useState<string>("");
  
  // For crush/multiple
  const [isCrush, setIsCrush] = useState(false);
  
  useEffect(() => {
    if (visible) {
      setFractures(initialFractures);
      resetSelection();
    }
  }, [visible, initialFractures]);
  
  const resetSelection = () => {
    setStep("bone_select");
    setSelectedBone(null);
    setSelectedSegment("");
    setSelectedType("");
    setSelectedQualifications([]);
    setSelectedSubBone("");
    setIsCrush(false);
  };
  
  const handleBoneSelect = (bone: BoneData) => {
    setSelectedBone(bone);
    
    // Determine next step based on bone type
    const boneConfig = AO_HAND_CLASSIFICATION.bones.find(b => b.familyCode === bone.familyCode);
    
    if (!boneConfig) return;
    
    if (boneConfig.kind === "crush_multiple") {
      // Crush - directly add
      setIsCrush(true);
      setStep("review");
    } else if (boneConfig.kind === "carpal_other_with_subbone" && bone.subBoneId) {
      // Other carpal with known subbone - go to type
      setSelectedSubBone(bone.subBoneId);
      setStep("type_select");
    } else if (boneConfig.kind === "carpal_single") {
      // Simple carpal - go to type
      setStep("type_select");
    } else if (boneConfig.kind === "metacarpal_long_bone" || boneConfig.kind === "phalanx_long_bone") {
      // Long bone - need segment selection
      setStep("segment_select");
    }
  };
  
  const handleSegmentSelect = (segment: string) => {
    setSelectedSegment(segment);
    setStep("type_select");
  };
  
  const handleTypeSelect = (type: string) => {
    setSelectedType(type);
    
    // Check if scaphoid and needs qualifications
    if (selectedBone?.familyCode === "72" && (type === "B" || type === "C")) {
      setStep("qualification_select");
    } else {
      setStep("review");
    }
  };
  
  const handleQualificationToggle = (qual: string) => {
    setSelectedQualifications(prev => 
      prev.includes(qual) ? prev.filter(q => q !== qual) : [...prev, qual]
    );
  };
  
  const currentAOCode = useMemo(() => {
    if (!selectedBone) return "";
    if (isCrush) return "79";
    
    return generateAOCode({
      familyCode: selectedBone.familyCode,
      type: selectedType,
      subBoneId: selectedSubBone || selectedBone.subBoneId,
      finger: selectedBone.finger,
      phalanx: selectedBone.phalanx,
      segment: selectedSegment,
      qualifications: selectedQualifications
    });
  }, [selectedBone, selectedType, selectedSubBone, selectedSegment, selectedQualifications, isCrush]);
  
  const addCurrentFracture = () => {
    if (!selectedBone || !currentAOCode) return;
    
    const newFracture: FractureEntry = {
      id: Date.now().toString(),
      boneId: selectedBone.id,
      boneName: selectedBone.name,
      aoCode: currentAOCode,
      details: {
        familyCode: selectedBone.familyCode,
        type: selectedType,
        subBoneId: selectedSubBone || selectedBone.subBoneId,
        finger: selectedBone.finger,
        phalanx: selectedBone.phalanx,
        segment: selectedSegment,
        qualifications: selectedQualifications.length > 0 ? selectedQualifications : undefined
      }
    };
    
    setFractures(prev => [...prev, newFracture]);
    resetSelection();
  };
  
  const removeFracture = (id: string) => {
    setFractures(prev => prev.filter(f => f.id !== id));
  };
  
  const handleSave = () => {
    onSave(fractures);
    onClose();
  };
  
  const getTypeOptions = (): { key: string; label: string }[] => {
    if (!selectedBone) return [];
    
    const boneConfig = AO_HAND_CLASSIFICATION.bones.find(b => b.familyCode === selectedBone.familyCode);
    if (!boneConfig) return [];
    
    if (boneConfig.kind === "carpal_single") {
      return Object.entries(boneConfig.types).map(([key, val]) => ({
        key,
        label: val.label
      }));
    }
    
    if (boneConfig.kind === "carpal_other_with_subbone") {
      const subBone = boneConfig.subBones[selectedSubBone || selectedBone.subBoneId || ""];
      if (subBone) {
        return Object.entries(subBone.typeLabels).map(([key, label]) => ({
          key,
          label: label as string
        }));
      }
    }
    
    if ((boneConfig.kind === "metacarpal_long_bone" || boneConfig.kind === "phalanx_long_bone") && selectedSegment) {
      const typeRules = boneConfig.typeRulesBySegment[selectedSegment];
      return Object.entries(typeRules).map(([key, label]) => ({
        key,
        label: label as string
      }));
    }
    
    return [];
  };
  
  const renderBoneSelectStep = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <HandBoneDiagram
        selectedBone={selectedBone}
        onBoneSelect={handleBoneSelect}
        fracturedBones={fractures.map(f => f.boneId)}
      />
      
      {/* Crush/Multiple option */}
      <Pressable
        style={[
          styles.crushButton,
          { 
            backgroundColor: theme.backgroundTertiary,
            borderColor: theme.border
          }
        ]}
        onPress={() => {
          setIsCrush(true);
          setSelectedBone({ 
            id: "crush", 
            name: "Crushed / Multiple fractures", 
            familyCode: "79",
            path: "",
            labelX: 0,
            labelY: 0
          });
          setStep("review");
        }}
      >
        <Feather name="alert-triangle" size={20} color={theme.error} />
        <ThemedText style={[styles.crushButtonText, { color: theme.text }]}>
          Crushed / Multiple Fractures (79)
        </ThemedText>
      </Pressable>
      
      {/* Current fractures list */}
      {fractures.length > 0 ? (
        <View style={styles.fracturesSection}>
          <ThemedText style={[styles.fracturesSectionTitle, { color: theme.text }]}>
            Added Fractures ({fractures.length})
          </ThemedText>
          {fractures.map(f => (
            <View key={f.id} style={[styles.fractureItem, { backgroundColor: theme.backgroundTertiary }]}>
              <View style={styles.fractureInfo}>
                <ThemedText style={[styles.fractureBone, { color: theme.text }]}>
                  {f.boneName}
                </ThemedText>
                <ThemedText style={[styles.fractureCode, { color: theme.link }]}>
                  {f.aoCode}
                </ThemedText>
              </View>
              <Pressable onPress={() => removeFracture(f.id)}>
                <Feather name="x-circle" size={22} color={theme.error} />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
  
  const renderSegmentSelectStep = () => (
    <View style={styles.stepContent}>
      <ThemedText style={[styles.stepTitle, { color: theme.text }]}>
        Select Fracture Location
      </ThemedText>
      <ThemedText style={[styles.stepSubtitle, { color: theme.textSecondary }]}>
        {selectedBone?.name}
      </ThemedText>
      
      <View style={styles.optionsGrid}>
        {Object.entries(SEGMENT_NAMES).map(([key, label]) => (
          <Pressable
            key={key}
            style={[
              styles.optionButton,
              { 
                backgroundColor: selectedSegment === key ? theme.link : theme.backgroundTertiary,
                borderColor: theme.border
              }
            ]}
            onPress={() => handleSegmentSelect(key)}
          >
            <ThemedText style={[
              styles.optionNumber, 
              { color: selectedSegment === key ? "#FFF" : theme.textSecondary }
            ]}>
              {key}
            </ThemedText>
            <ThemedText style={[
              styles.optionLabel,
              { color: selectedSegment === key ? "#FFF" : theme.text }
            ]}>
              {label}
            </ThemedText>
          </Pressable>
        ))}
      </View>
      
      {/* Visual segment indicator */}
      <View style={[styles.segmentDiagram, { backgroundColor: theme.backgroundSecondary }]}>
        <View style={[styles.segmentBar, { backgroundColor: "#E8D5B7" }]}>
          <View style={[
            styles.segmentSection, 
            { backgroundColor: selectedSegment === "1" ? theme.link : "#D4C4A8" }
          ]}>
            <ThemedText style={styles.segmentLabel}>1</ThemedText>
          </View>
          <View style={[
            styles.segmentSection, 
            styles.segmentMiddle,
            { backgroundColor: selectedSegment === "2" ? theme.link : "#E8D5B7" }
          ]}>
            <ThemedText style={styles.segmentLabel}>2</ThemedText>
          </View>
          <View style={[
            styles.segmentSection,
            { backgroundColor: selectedSegment === "3" ? theme.link : "#D4C4A8" }
          ]}>
            <ThemedText style={styles.segmentLabel}>3</ThemedText>
          </View>
        </View>
        <View style={styles.segmentLabels}>
          <ThemedText style={[styles.segmentLabelText, { color: theme.textSecondary }]}>
            Proximal
          </ThemedText>
          <ThemedText style={[styles.segmentLabelText, { color: theme.textSecondary }]}>
            Diaphysis
          </ThemedText>
          <ThemedText style={[styles.segmentLabelText, { color: theme.textSecondary }]}>
            Distal
          </ThemedText>
        </View>
      </View>
    </View>
  );
  
  const renderTypeSelectStep = () => {
    const options = getTypeOptions();
    
    return (
      <View style={styles.stepContent}>
        <ThemedText style={[styles.stepTitle, { color: theme.text }]}>
          Select Fracture Type
        </ThemedText>
        <ThemedText style={[styles.stepSubtitle, { color: theme.textSecondary }]}>
          {selectedBone?.name}{selectedSegment ? ` - ${SEGMENT_NAMES[selectedSegment]}` : ""}
        </ThemedText>
        
        <View style={styles.typeOptions}>
          {options.map(opt => (
            <Pressable
              key={opt.key}
              style={[
                styles.typeButton,
                { 
                  backgroundColor: selectedType === opt.key ? theme.link : theme.backgroundTertiary,
                  borderColor: theme.border
                }
              ]}
              onPress={() => handleTypeSelect(opt.key)}
            >
              <View style={[
                styles.typeKey,
                { backgroundColor: selectedType === opt.key ? "rgba(255,255,255,0.2)" : theme.backgroundSecondary }
              ]}>
                <ThemedText style={[
                  styles.typeKeyText,
                  { color: selectedType === opt.key ? "#FFF" : theme.text }
                ]}>
                  {opt.key}
                </ThemedText>
              </View>
              <ThemedText style={[
                styles.typeLabel,
                { color: selectedType === opt.key ? "#FFF" : theme.text }
              ]}>
                {opt.label}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </View>
    );
  };
  
  const renderQualificationSelectStep = () => {
    const scaphoidConfig = AO_HAND_CLASSIFICATION.bones.find(b => b.familyCode === "72");
    if (!scaphoidConfig || scaphoidConfig.kind !== "carpal_single" || !scaphoidConfig.qualifications) {
      return null;
    }
    
    return (
      <View style={styles.stepContent}>
        <ThemedText style={[styles.stepTitle, { color: theme.text }]}>
          Scaphoid Location (Optional)
        </ThemedText>
        <ThemedText style={[styles.stepSubtitle, { color: theme.textSecondary }]}>
          Select fracture location(s) or skip
        </ThemedText>
        
        <View style={styles.qualOptions}>
          {Object.entries(scaphoidConfig.qualifications.options).map(([key, label]) => (
            <Pressable
              key={key}
              style={[
                styles.qualButton,
                { 
                  backgroundColor: selectedQualifications.includes(key) ? theme.link : theme.backgroundTertiary,
                  borderColor: theme.border
                }
              ]}
              onPress={() => handleQualificationToggle(key)}
            >
              <View style={[
                styles.qualCheck,
                { borderColor: selectedQualifications.includes(key) ? "#FFF" : theme.border }
              ]}>
                {selectedQualifications.includes(key) ? (
                  <Feather name="check" size={14} color="#FFF" />
                ) : null}
              </View>
              <ThemedText style={[
                styles.qualLabel,
                { color: selectedQualifications.includes(key) ? "#FFF" : theme.text }
              ]}>
                ({key}) {label}
              </ThemedText>
            </Pressable>
          ))}
        </View>
        
        <Pressable
          style={[styles.skipButton, { borderColor: theme.border }]}
          onPress={() => setStep("review")}
        >
          <ThemedText style={[styles.skipButtonText, { color: theme.textSecondary }]}>
            Skip - No specific location
          </ThemedText>
        </Pressable>
        
        {selectedQualifications.length > 0 ? (
          <Pressable
            style={[styles.continueButton, { backgroundColor: theme.link }]}
            onPress={() => setStep("review")}
          >
            <ThemedText style={styles.continueButtonText}>
              Continue with ({selectedQualifications.join(",")})
            </ThemedText>
          </Pressable>
        ) : null}
      </View>
    );
  };
  
  const renderReviewStep = () => (
    <View style={styles.stepContent}>
      <ThemedText style={[styles.stepTitle, { color: theme.text }]}>
        Confirm Fracture Classification
      </ThemedText>
      
      <View style={[styles.reviewCard, { backgroundColor: theme.backgroundSecondary }]}>
        <View style={styles.reviewHeader}>
          <ThemedText style={[styles.reviewBone, { color: theme.text }]}>
            {selectedBone?.name}
          </ThemedText>
          <View style={[styles.aoCodeBadge, { backgroundColor: theme.link }]}>
            <ThemedText style={styles.aoCodeText}>
              {currentAOCode}
            </ThemedText>
          </View>
        </View>
        
        {!isCrush && selectedSegment ? (
          <View style={styles.reviewDetail}>
            <ThemedText style={[styles.reviewLabel, { color: theme.textSecondary }]}>
              Segment:
            </ThemedText>
            <ThemedText style={[styles.reviewValue, { color: theme.text }]}>
              {SEGMENT_NAMES[selectedSegment]}
            </ThemedText>
          </View>
        ) : null}
        
        {!isCrush && selectedType ? (
          <View style={styles.reviewDetail}>
            <ThemedText style={[styles.reviewLabel, { color: theme.textSecondary }]}>
              Type:
            </ThemedText>
            <ThemedText style={[styles.reviewValue, { color: theme.text }]}>
              {selectedSegment 
                ? getFractureTypeLabel(selectedSegment, selectedType)
                : `Type ${selectedType}`}
            </ThemedText>
          </View>
        ) : null}
        
        {selectedQualifications.length > 0 ? (
          <View style={styles.reviewDetail}>
            <ThemedText style={[styles.reviewLabel, { color: theme.textSecondary }]}>
              Location:
            </ThemedText>
            <ThemedText style={[styles.reviewValue, { color: theme.text }]}>
              {selectedQualifications.map(q => {
                const scaphoid = AO_HAND_CLASSIFICATION.bones.find(b => b.familyCode === "72");
                if (scaphoid?.kind === "carpal_single" && scaphoid.qualifications) {
                  return scaphoid.qualifications.options[q];
                }
                return q;
              }).join(", ")}
            </ThemedText>
          </View>
        ) : null}
        
        {/* Validation */}
        {validateAOCode(currentAOCode).valid ? (
          <View style={[styles.validBadge, { backgroundColor: theme.success }]}>
            <Feather name="check-circle" size={16} color="#FFF" />
            <ThemedText style={styles.validText}>Valid AO Code</ThemedText>
          </View>
        ) : (
          <View style={[styles.validBadge, { backgroundColor: theme.error }]}>
            <Feather name="alert-circle" size={16} color="#FFF" />
            <ThemedText style={styles.validText}>Invalid Code</ThemedText>
          </View>
        )}
      </View>
      
      <View style={styles.reviewActions}>
        <Pressable
          style={[styles.addAnotherButton, { borderColor: theme.link }]}
          onPress={addCurrentFracture}
        >
          <Feather name="plus" size={18} color={theme.link} />
          <ThemedText style={[styles.addAnotherText, { color: theme.link }]}>
            Add & Continue
          </ThemedText>
        </Pressable>
        
        <Pressable
          style={[styles.finishButton, { backgroundColor: theme.link }]}
          onPress={() => {
            addCurrentFracture();
            // Small delay to ensure state updates
            setTimeout(handleSave, 100);
          }}
        >
          <Feather name="check" size={18} color="#FFF" />
          <ThemedText style={styles.finishButtonText}>
            Add & Finish
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
  
  const renderStepContent = () => {
    switch (step) {
      case "bone_select": return renderBoneSelectStep();
      case "segment_select": return renderSegmentSelectStep();
      case "type_select": return renderTypeSelectStep();
      case "qualification_select": return renderQualificationSelectStep();
      case "review": return renderReviewStep();
      default: return null;
    }
  };
  
  const canGoBack = step !== "bone_select";
  
  const goBack = () => {
    switch (step) {
      case "segment_select":
        resetSelection();
        break;
      case "type_select":
        if (selectedBone?.familyCode === "77" || selectedBone?.familyCode === "78") {
          setStep("segment_select");
        } else {
          resetSelection();
        }
        break;
      case "qualification_select":
        setStep("type_select");
        break;
      case "review":
        if (isCrush) {
          resetSelection();
        } else if (selectedBone?.familyCode === "72" && (selectedType === "B" || selectedType === "C")) {
          setStep("qualification_select");
        } else {
          setStep("type_select");
        }
        break;
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, { backgroundColor: theme.backgroundDefault, paddingTop: insets.top }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Pressable onPress={canGoBack ? goBack : onClose} style={styles.headerButton}>
            <Feather name={canGoBack ? "arrow-left" : "x"} size={24} color={theme.text} />
          </Pressable>
          
          <View style={styles.headerCenter}>
            <ThemedText style={[styles.headerTitle, { color: theme.text }]}>
              AO Fracture Classification
            </ThemedText>
            <ThemedText style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
              Hand & Carpus (Region 7)
            </ThemedText>
          </View>
          
          {fractures.length > 0 ? (
            <Pressable onPress={handleSave} style={styles.headerButton}>
              <ThemedText style={[styles.saveText, { color: theme.link }]}>
                Save
              </ThemedText>
            </Pressable>
          ) : (
            <View style={styles.headerButton} />
          )}
        </View>
        
        {/* Progress indicator */}
        <View style={styles.progressContainer}>
          {["bone_select", "segment_select", "type_select", "review"].map((s, i) => (
            <View
              key={s}
              style={[
                styles.progressDot,
                { 
                  backgroundColor: 
                    (step === s || 
                     (step === "qualification_select" && s === "type_select") ||
                     (["segment_select", "type_select", "qualification_select", "review"].indexOf(step) >= i))
                    ? theme.link 
                    : theme.backgroundTertiary
                }
              ]}
            />
          ))}
        </View>
        
        {renderStepContent()}
      </View>
    </Modal>
  );
}

export type { FractureEntry };

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  headerButton: {
    width: 60,
    alignItems: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  headerSubtitle: {
    fontSize: 12,
  },
  saveText: {
    fontSize: 16,
    fontWeight: "600",
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    paddingVertical: Spacing.sm,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stepContent: {
    flex: 1,
    padding: Spacing.md,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  crushButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginTop: Spacing.lg,
    marginHorizontal: Spacing.md,
  },
  crushButtonText: {
    fontSize: 15,
    fontWeight: "500",
  },
  fracturesSection: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  fracturesSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  fractureItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  fractureInfo: {
    flex: 1,
  },
  fractureBone: {
    fontSize: 15,
    fontWeight: "500",
  },
  fractureCode: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 2,
  },
  optionsGrid: {
    gap: Spacing.sm,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.md,
  },
  optionNumber: {
    fontSize: 18,
    fontWeight: "700",
    width: 30,
    textAlign: "center",
  },
  optionLabel: {
    fontSize: 15,
    flex: 1,
  },
  segmentDiagram: {
    marginTop: Spacing.xl,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
  },
  segmentBar: {
    flexDirection: "row",
    width: "80%",
    height: 80,
    borderRadius: 8,
    overflow: "hidden",
  },
  segmentSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  segmentMiddle: {
    flex: 2,
  },
  segmentLabel: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 16,
  },
  segmentLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "80%",
    marginTop: Spacing.sm,
  },
  segmentLabelText: {
    fontSize: 12,
    textAlign: "center",
    flex: 1,
  },
  typeOptions: {
    gap: Spacing.sm,
  },
  typeButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.md,
  },
  typeKey: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  typeKeyText: {
    fontSize: 18,
    fontWeight: "700",
  },
  typeLabel: {
    fontSize: 15,
    flex: 1,
  },
  qualOptions: {
    gap: Spacing.sm,
  },
  qualButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.md,
  },
  qualCheck: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  qualLabel: {
    fontSize: 15,
    flex: 1,
  },
  skipButton: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: "center",
    marginTop: Spacing.lg,
  },
  skipButtonText: {
    fontSize: 15,
  },
  continueButton: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    marginTop: Spacing.md,
  },
  continueButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  reviewCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  reviewBone: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
  },
  aoCodeBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  aoCodeText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "monospace",
  },
  reviewDetail: {
    flexDirection: "row",
    marginBottom: Spacing.sm,
  },
  reviewLabel: {
    fontSize: 14,
    width: 80,
  },
  reviewValue: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  validBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.sm,
  },
  validText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "500",
  },
  reviewActions: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  addAnotherButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
  },
  addAnotherText: {
    fontSize: 15,
    fontWeight: "600",
  },
  finishButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  finishButtonText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "600",
  },
});
