/**
 * SkinCancerAssessment
 * ════════════════════
 * Main orchestrator for the skin cancer assessment module.
 * Renders inline inside DiagnosisGroupEditor when skin_cancer specialty
 * is selected (no DiagnosisPicker — mirrors hand trauma inline flow).
 *
 * Layout (hand-trauma aesthetic with SectionWrapper cards):
 *   SectionWrapper "1. Diagnosis"  ← ALWAYS VISIBLE (Tier 1 chips)
 *     └ 7 chips: BCC│SCC│Melanoma│MCC│Other malig.│Benign│Uncertain
 *
 *   ── AFTER TIER 1 SELECTED ──
 *   PathwayGate (Biopsy / Histology known)
 *
 *   ── AFTER PATHWAY SELECTED ──
 *   [Histology known] SectionWrapper "N. Pathology" (Tier 2 details only)
 *   SectionWrapper "N. Lesion" (site, laterality, dimensions)
 *   [conditional] MarginRecommendationBadge
 *   [conditional] SectionWrapper "N. SLNB"
 *   SectionWrapper "N. Excision" (method + margin inputs)
 *   [Histology known] SectionWrapper "N. Context" (optional metadata)
 *   SectionWrapper "N. Summary & Procedures" (accept-mapping)
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { View, Pressable, Switch, TextInput, LayoutAnimation, Platform, UIManager, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import {
  shouldOfferSLNB,
  canConsiderSLNB,
  getMarginRecommendation,
  getSkinCancerCompletion,
  getSkinCancerDiagnosisAutoConfig,
  getSkinCancerProcedureSuggestions,
} from "@/lib/skinCancerConfig";
import type {
  SkinCancerLesionAssessment,
  SkinCancerPathwayStage,
  SkinCancerBiopsyType,
  SkinCancerHistology,
  SkinCancerCompletionState,
  SkinCancerPathologyCategory,
  SLNBDetails,
  LesionPhoto,
} from "@/types/skinCancer";
import { generateLesionCaption } from "./LesionDetailsSection";
import { SectionWrapper } from "./SectionWrapper";
import { PathologySection } from "./PathologySection";
import { LesionDetailsSection } from "./LesionDetailsSection";
import { HistologySection } from "./HistologySection";
import { MarginRecommendationBadge } from "./MarginRecommendationBadge";
import { SLNBSection } from "./SLNBSection";
import { SkinCancerSummaryPanel } from "./SkinCancerSummaryPanel";

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

const BIOPSY_METHODS: { value: SkinCancerBiopsyType; label: string }[] = [
  { value: "excision_biopsy", label: "Excision" },
  { value: "incisional_biopsy", label: "Incisional" },
  { value: "shave_biopsy", label: "Shave" },
  { value: "punch_biopsy", label: "Punch" },
];

const PUNCH_SIZES = [2, 3, 4, 5, 6, 8] as const;

const DIAGNOSIS_CATEGORIES: {
  value: SkinCancerPathologyCategory;
  label: string;
}[] = [
  { value: "bcc", label: "BCC" },
  { value: "scc", label: "SCC" },
  { value: "melanoma", label: "Melanoma" },
  { value: "merkel_cell", label: "MCC" },
  { value: "rare_malignant", label: "Other malig." },
  { value: "benign", label: "Benign" },
  { value: "uncertain", label: "Uncertain" },
];

// Enable LayoutAnimation on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/** Smooth spring-like animation for multi-section collapse (less jarring than easeInEaseOut) */
const SMOOTH_LAYOUT_ANIM = LayoutAnimation.create(
  300,
  LayoutAnimation.Types.easeInEaseOut,
  LayoutAnimation.Properties.opacity,
);

// ═══════════════════════════════════════════════════════════════
// Props
// ═══════════════════════════════════════════════════════════════

interface SkinCancerAssessmentProps {
  assessment: SkinCancerLesionAssessment | undefined;
  onAssessmentChange: (assessment: SkinCancerLesionAssessment) => void;
  /** Picklist diagnosis ID — drives auto-config (pathway filtering, pathology locking) */
  diagnosisId?: string;
  /** Callback to populate parent's procedure list (legacy, diagnosis-driven flow) */
  onAcceptProcedures?: (procedurePicklistIds: string[]) => void;
  /** Callback for inline flow — resolves BOTH diagnosis AND procedures */
  onAcceptMapping?: (procedurePicklistIds: string[]) => void;
  /** Whether procedures have been accepted */
  isAccepted?: boolean;
  /** Callback to add another lesion (triggers multi-lesion transition) */
  onAddLesion?: () => void;
  /** Callback when a lesion photo is captured (for case thumbnail wiring) */
  onPhotoAdded?: (photo: LesionPhoto) => void;
  /** Callback to revoke accepted mapping (re-enables editing) */
  onEditMapping?: () => void;
  /** Scroll view ref for stabilizing scroll position during collapse/expand */
  scrollViewRef?: React.RefObject<any>;
  /** Current scroll Y position (tracked by parent) */
  scrollPositionRef?: React.MutableRefObject<number>;
}

export function SkinCancerAssessment({
  assessment,
  onAssessmentChange,
  diagnosisId,
  onAcceptProcedures,
  onAcceptMapping,
  isAccepted = false,
  onAddLesion,
  onPhotoAdded,
  onEditMapping: onEditMappingProp,
  scrollViewRef,
  scrollPositionRef,
}: SkinCancerAssessmentProps) {
  const { theme } = useTheme();
  const [manualSlnbToggle, setManualSlnbToggle] = useState(false);
  const summaryRef = useRef<View>(null);

  // ── Section collapse state (controlled mode for all collapsible sections) ──
  const [sectionCollapse, setSectionCollapse] = useState<Record<string, boolean>>({
    diagnosis: false,
    pathology: true, // collapsed by default
  });
  const isSectionCollapsed = useCallback(
    (key: string) => sectionCollapse[key] ?? false,
    [sectionCollapse],
  );
  const setSectionCollapsedState = useCallback(
    (key: string, val: boolean) => {
      LayoutAnimation.configureNext(SMOOTH_LAYOUT_ANIM);
      setSectionCollapse((prev) => ({ ...prev, [key]: val }));
    },
    [],
  );

  // ── Diagnosis auto-config ──
  const autoConfig = useMemo(
    () => getSkinCancerDiagnosisAutoConfig(diagnosisId),
    [diagnosisId],
  );

  // ── Pathway auto-set based on Tier 1 selection ──
  // "uncertain" → auto-set excision_biopsy (gate hidden)
  // everything else → auto-set histology_known (gate shows collapsed, changeable)
  const isUncertainCategory = assessment?.clinicalSuspicion === "uncertain";
  const filteredPathwayStages = useMemo(() => {
    return autoConfig.availablePathwayStages ?? [
      "excision_biopsy" as SkinCancerPathwayStage,
      "histology_known" as SkinCancerPathwayStage,
    ];
  }, [autoConfig.availablePathwayStages]);

  // ── Computed values ──
  const relevantHisto =
    assessment?.priorHistology || assessment?.currentHistology;

  const autoSlnb = relevantHisto ? shouldOfferSLNB(relevantHisto) : false;
  const considerSlnb = relevantHisto ? canConsiderSLNB(relevantHisto) : false;
  const showSlnb = autoSlnb || manualSlnbToggle;

  const marginRec = useMemo(
    () => (relevantHisto ? getMarginRecommendation(relevantHisto) : undefined),
    [relevantHisto],
  );

  const completion = useMemo(
    () => (assessment ? getSkinCancerCompletion(assessment) : undefined),
    [assessment],
  );

  // ── Has Tier 1 selection? (progressive disclosure gate) ──
  const hasTier1Selection = !!assessment?.clinicalSuspicion;

  // ── Procedure suggestions ──
  const suggestedProcedureIds = useMemo(
    () => (assessment ? getSkinCancerProcedureSuggestions(assessment) : []),
    [assessment],
  );

  // Fire success haptic when all visible sections become "complete"
  const prevAllCompleteRef = useRef(false);
  useEffect(() => {
    if (!assessment?.pathwayStage || !completion) {
      prevAllCompleteRef.current = false;
      return;
    }
    const visibleKeys = (
      Object.keys(completion) as (keyof SkinCancerCompletionState)[]
    ).filter((k) => completion[k] !== "not_applicable");
    const allComplete =
      visibleKeys.length > 0 &&
      visibleKeys.every((k) => completion[k] === "complete");
    if (allComplete && !prevAllCompleteRef.current) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    prevAllCompleteRef.current = allComplete;
  }, [completion, assessment?.pathwayStage]);

  // Auto-update lesion photo captions when histology/site changes
  const prevCaptionKeyRef = useRef("");
  useEffect(() => {
    if (!assessment?.lesionPhotos?.length) return;
    const newCaption = generateLesionCaption(assessment);
    if (newCaption === prevCaptionKeyRef.current) return;
    prevCaptionKeyRef.current = newCaption;
    const updated = assessment.lesionPhotos.map((p) => ({
      ...p,
      caption: newCaption,
    }));
    onAssessmentChange({ ...assessment, lesionPhotos: updated });
  }, [
    assessment?.priorHistology?.pathologyCategory,
    assessment?.currentHistology?.pathologyCategory,
    assessment?.clinicalSuspicion,
    assessment?.site,
    assessment?.laterality,
  ]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers ──
  const handleStageSelect = useCallback(
    (stage: SkinCancerPathwayStage) => {
      // Sync Tier 1 category → priorHistology for histology_known
      const priorHistology =
        stage === "histology_known" && assessment?.clinicalSuspicion
          ? {
              ...(assessment?.priorHistology ?? {}),
              source:
                assessment?.priorHistology?.source ?? ("own_biopsy" as const),
              pathologyCategory: assessment.clinicalSuspicion,
            }
          : assessment?.priorHistology;
      onAssessmentChange({
        ...(assessment ?? {}),
        pathwayStage: stage,
        priorHistology,
      } as SkinCancerLesionAssessment);
    },
    [assessment, onAssessmentChange],
  );

  const handleDetailsChange = useCallback(
    (updated: SkinCancerLesionAssessment) => {
      onAssessmentChange(updated);
    },
    [onAssessmentChange],
  );

  const handleClinicalSuspicionChange = useCallback(
    (value: SkinCancerPathologyCategory | undefined) => {
      onAssessmentChange({
        ...(assessment ?? {}),
        clinicalSuspicion: value,
      } as SkinCancerLesionAssessment);
    },
    [assessment, onAssessmentChange],
  );

  /** Tier 1 chip tap — always writes to clinicalSuspicion, auto-sets pathway.
   *  Switching categories resets all pathway-specific fields (keeps location data). */
  const handleDiagnosisCategoryTap = useCallback(
    (cat: SkinCancerPathologyCategory) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const newCat =
        assessment?.clinicalSuspicion === cat ? undefined : cat;

      // Pathway auto-logic
      let pathwayStage: SkinCancerPathwayStage | undefined;
      if (!newCat) {
        pathwayStage = undefined;
      } else if (newCat === "uncertain") {
        pathwayStage = "excision_biopsy" as SkinCancerPathwayStage;
      } else {
        pathwayStage = "histology_known" as SkinCancerPathwayStage;
      }

      // When switching categories (or deselecting), reset all pathway-specific
      // fields but preserve location data (site, laterality, dimensions, photos)
      const preserved = {
        site: assessment?.site,
        laterality: assessment?.laterality,
        clinicalLengthMm: assessment?.clinicalLengthMm,
        clinicalWidthMm: assessment?.clinicalWidthMm,
        lesionPhotos: assessment?.lesionPhotos,
      };

      const priorHistology =
        pathwayStage === "histology_known" && newCat
          ? {
              source: "own_biopsy" as const,
              pathologyCategory: newCat,
            }
          : undefined;

      onAssessmentChange({
        ...preserved,
        clinicalSuspicion: newCat,
        pathwayStage,
        priorHistology,
      } as SkinCancerLesionAssessment);

      // Auto-collapse Diagnosis section after selection
      if (newCat) {
        setSectionCollapsedState("diagnosis", true);
      }
    },
    [assessment, onAssessmentChange, setSectionCollapsedState],
  );

  const handlePriorHistologyChange = useCallback(
    (histology: SkinCancerHistology) => {
      onAssessmentChange({
        ...(assessment ?? {}),
        priorHistology: histology,
      } as SkinCancerLesionAssessment);
    },
    [assessment, onAssessmentChange],
  );

  const handleCurrentHistologyChange = useCallback(
    (histology: SkinCancerHistology) => {
      onAssessmentChange({
        ...(assessment ?? {}),
        currentHistology: histology,
      } as SkinCancerLesionAssessment);
    },
    [assessment, onAssessmentChange],
  );

  const handleSLNBChange = useCallback(
    (slnb: SLNBDetails) => {
      onAssessmentChange({
        ...(assessment ?? {}),
        slnb,
      } as SkinCancerLesionAssessment);
    },
    [assessment, onAssessmentChange],
  );

  const handleContinuingCareChange = useCallback(
    (partial: Partial<SkinCancerLesionAssessment>) => {
      onAssessmentChange({
        ...(assessment ?? {}),
        ...partial,
      } as SkinCancerLesionAssessment);
    },
    [assessment, onAssessmentChange],
  );

  const handleBiopsyTypeChange = useCallback(
    (type: SkinCancerBiopsyType) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const newType = assessment?.biopsyType === type ? undefined : type;
      onAssessmentChange({
        ...(assessment ?? {}),
        biopsyType: newType,
        // Clear dependent fields
        biopsyPeripheralMarginMm:
          newType === "excision_biopsy"
            ? assessment?.biopsyPeripheralMarginMm
            : undefined,
        punchSizeMm:
          newType === "punch_biopsy" ? assessment?.punchSizeMm : undefined,
      } as SkinCancerLesionAssessment);
    },
    [assessment, onAssessmentChange],
  );

  /** Collapse all sections, scroll to keep summary at same screen position */
  const handleAccept = useCallback(
    (procedureIds: string[]) => {
      if (onAcceptMapping) {
        onAcceptMapping(procedureIds);
      } else if (onAcceptProcedures) {
        onAcceptProcedures(procedureIds);
      }
      const scrollView = scrollViewRef?.current;
      const summaryNode = summaryRef.current;
      const canStabilize = !!scrollView && !!summaryNode && !!scrollPositionRef;

      const doCollapse = (beforeScreenY: number) => {
        LayoutAnimation.configureNext(SMOOTH_LAYOUT_ANIM);
        setSectionCollapse({
          diagnosis: true,
          pathology: true,
          lesion: true,
          slnb: true,
          excision: true,
          summary: false,
        });
        // After animation, measure new position and compensate scroll
        if (canStabilize) {
          setTimeout(() => {
            summaryNode.measureInWindow((_x: number, afterScreenY: number) => {
              const shift = beforeScreenY - afterScreenY;
              if (shift > 10) {
                const newY = Math.max(0, scrollPositionRef.current - shift);
                scrollView.scrollTo?.({ y: newY, animated: false });
              }
            });
          }, 350);
        }
      };

      if (canStabilize) {
        summaryNode.measureInWindow((_x: number, y: number) => doCollapse(y));
      } else {
        doCollapse(0);
      }
    },
    [onAcceptMapping, onAcceptProcedures, scrollViewRef, scrollPositionRef],
  );

  const handleEditMapping = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const scrollView = scrollViewRef?.current;
    const summaryNode = summaryRef.current;
    const canStabilize = !!scrollView && !!summaryNode && !!scrollPositionRef;

    const doExpand = (beforeScreenY: number) => {
      LayoutAnimation.configureNext(SMOOTH_LAYOUT_ANIM);
      setSectionCollapse({
        diagnosis: false,
        pathology: true,
      });
      onEditMappingProp?.();
      // After animation, compensate for sections expanding above
      if (canStabilize) {
        setTimeout(() => {
          summaryNode.measureInWindow((_x: number, afterScreenY: number) => {
            const shift = afterScreenY - beforeScreenY;
            if (shift > 10) {
              const newY = scrollPositionRef.current + shift;
              scrollView.scrollTo?.({ y: newY, animated: false });
            }
          });
        }, 350);
      }
    };

    if (canStabilize) {
      summaryNode.measureInWindow((_x: number, y: number) => doExpand(y));
    } else {
      doExpand(0);
    }
  }, [onEditMappingProp, scrollViewRef, scrollPositionRef]);

  // Determine if we have any accept handler
  const hasAcceptHandler = !!onAcceptMapping || !!onAcceptProcedures;

  // ── Dynamic section numbering ──
  const isHistologyKnown = assessment?.pathwayStage === "histology_known";
  let sectionNum = 0;

  const isBiopsy = assessment?.pathwayStage === "excision_biopsy";

  return (
    <View style={styles.container}>
      {/* ── 1. Diagnosis (Tier 1 chips — ALWAYS VISIBLE) ── */}
      <SectionWrapper
        title={`${++sectionNum}. Diagnosis`}
        icon="activity"
        collapsible
        isCollapsed={isSectionCollapsed("diagnosis")}
        onCollapsedChange={(v) => setSectionCollapsedState("diagnosis", v)}
        subtitle={assessment?.clinicalSuspicion ? DIAGNOSIS_CATEGORIES.find(c => c.value === assessment.clinicalSuspicion)?.label : undefined}
      >
        <View style={styles.tier1Grid}>
          {DIAGNOSIS_CATEGORIES.map((opt) => {
            const isSelected =
              assessment?.clinicalSuspicion === opt.value;
            return (
              <Pressable
                key={opt.value}
                style={[
                  styles.tier1Chip,
                  {
                    backgroundColor: isSelected
                      ? theme.link
                      : theme.backgroundTertiary,
                    borderColor: isSelected ? theme.link : theme.border,
                  },
                ]}
                onPress={() => handleDiagnosisCategoryTap(opt.value)}
              >
                <ThemedText
                  style={[
                    styles.tier1ChipText,
                    {
                      color: isSelected ? theme.buttonText : theme.text,
                    },
                  ]}
                >
                  {opt.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </SectionWrapper>

      {/* Pathway auto-set: uncertain→biopsy, everything else→histology_known */}
      {/* PathwayGate hidden — pathway is always deterministic from Tier 1 */}

      {/* ── After pathway is set ── */}
      {assessment?.pathwayStage ? (
        <>
          {/* ── Prior Histology (collapsible, collapsed by default) ── */}
          {isHistologyKnown ? (
            <SectionWrapper
              title={`${++sectionNum}. Prior Histology`}
              icon="file-text"
              collapsible
              isCollapsed={isSectionCollapsed("pathology")}
              onCollapsedChange={(v) => setSectionCollapsedState("pathology", v)}
              subtitle="Optional — prior biopsy report details"
            >
              <PathologySection
                pathwayStage={assessment.pathwayStage}
                clinicalSuspicion={assessment.clinicalSuspicion}
                onClinicalSuspicionChange={handleClinicalSuspicionChange}
                priorHistology={assessment.priorHistology}
                onPriorHistologyChange={handlePriorHistologyChange}
                lockedPathology={autoConfig.lockedPathology}
                hideCurrentProcedureSource={
                  autoConfig.hideCurrentProcedureSource
                }
                hideTier1
                defaultSource="own_biopsy"
                priorProcedureType={assessment.priorProcedureType}
                onPriorProcedureTypeChange={(value) =>
                  handleContinuingCareChange({ priorProcedureType: value })
                }
              />
            </SectionWrapper>
          ) : null}

          {/* ── Lesion ── */}
          <SectionWrapper
            title={`${++sectionNum}. Lesion`}
            icon="map-pin"
            collapsible
            isCollapsed={isSectionCollapsed("lesion")}
            onCollapsedChange={(v) => setSectionCollapsedState("lesion", v)}
          >
            <LesionDetailsSection
              assessment={assessment}
              onChange={handleDetailsChange}
              onPhotoAdded={onPhotoAdded}
            />
          </SectionWrapper>

          {/* ── Margin recommendation badge ── */}
          {marginRec ? (
            <MarginRecommendationBadge recommendation={marginRec} />
          ) : null}

          {/* ── SLNB ── */}
          {showSlnb ? (
            <SectionWrapper
              title={`${++sectionNum}. SLNB`}
              icon="target"
              collapsible
              isCollapsed={isSectionCollapsed("slnb")}
              onCollapsedChange={(v) => setSectionCollapsedState("slnb", v)}
            >
              <SLNBSection
                slnb={assessment.slnb}
                onSLNBChange={handleSLNBChange}
                autoVisible={autoSlnb}
                canConsider={false}
              />
            </SectionWrapper>
          ) : considerSlnb ? (
            <View style={styles.considerRow}>
              <ThemedText
                style={[styles.considerLabel, { color: theme.text }]}
              >
                Consider SLNB
              </ThemedText>
              <Switch
                value={manualSlnbToggle}
                onValueChange={setManualSlnbToggle}
                trackColor={{
                  false: theme.border,
                  true: theme.link + "60",
                }}
                thumbColor={
                  manualSlnbToggle ? theme.link : theme.textSecondary
                }
              />
            </View>
          ) : null}

          {/* ── Biopsy (excision_biopsy) / Excision (histology_known) ── */}
          {isBiopsy ? (
            <SectionWrapper
              title={`${++sectionNum}. Biopsy`}
              icon="scissors"
              collapsible
              isCollapsed={isSectionCollapsed("excision")}
              onCollapsedChange={(v) => setSectionCollapsedState("excision", v)}
            >
              {/* Biopsy method chips */}
              <View style={styles.biopsyGrid}>
                {BIOPSY_METHODS.map((opt) => {
                  const isSelected = assessment.biopsyType === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      style={[
                        styles.biopsyChip,
                        {
                          backgroundColor: isSelected
                            ? theme.link
                            : theme.backgroundTertiary,
                          borderColor: isSelected ? theme.link : theme.border,
                        },
                      ]}
                      onPress={() => handleBiopsyTypeChange(opt.value)}
                    >
                      <ThemedText
                        style={[
                          styles.biopsyChipText,
                          {
                            color: isSelected ? theme.buttonText : theme.text,
                          },
                        ]}
                      >
                        {opt.label}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>

              {/* Conditional fields */}
              {assessment.biopsyType === "excision_biopsy" && (
                <View style={styles.marginRow}>
                  <ThemedText
                    style={[styles.marginLabel, { color: theme.textSecondary }]}
                  >
                    PERIPHERAL MARGIN
                  </ThemedText>
                  <View style={styles.marginInputWrap}>
                    <TextInput
                      style={[
                        styles.marginInput,
                        {
                          color: theme.text,
                          borderColor: theme.border,
                          backgroundColor: theme.backgroundTertiary,
                        },
                      ]}
                      value={
                        assessment.biopsyPeripheralMarginMm?.toString() ?? ""
                      }
                      onChangeText={(t) => {
                        const v = t ? parseFloat(t) : undefined;
                        onAssessmentChange({
                          ...assessment,
                          biopsyPeripheralMarginMm:
                            v !== undefined && !isNaN(v) ? v : undefined,
                        });
                      }}
                      keyboardType="decimal-pad"
                      placeholder="mm"
                      placeholderTextColor={theme.textTertiary}
                      returnKeyType="done"
                    />
                    <ThemedText
                      style={[
                        styles.marginUnit,
                        { color: theme.textSecondary },
                      ]}
                    >
                      mm
                    </ThemedText>
                  </View>
                </View>
              )}

              {assessment.biopsyType === "punch_biopsy" && (
                <View style={styles.punchSection}>
                  <ThemedText
                    style={[styles.marginLabel, { color: theme.textSecondary }]}
                  >
                    PUNCH SIZE
                  </ThemedText>
                  <View style={styles.punchGrid}>
                    {PUNCH_SIZES.map((size) => {
                      const isSelected = assessment.punchSizeMm === size;
                      return (
                        <Pressable
                          key={size}
                          style={[
                            styles.punchChip,
                            {
                              backgroundColor: isSelected
                                ? theme.link
                                : theme.backgroundTertiary,
                              borderColor: isSelected
                                ? theme.link
                                : theme.border,
                            },
                          ]}
                          onPress={() => {
                            Haptics.impactAsync(
                              Haptics.ImpactFeedbackStyle.Light,
                            );
                            onAssessmentChange({
                              ...assessment,
                              punchSizeMm:
                                assessment.punchSizeMm === size
                                  ? undefined
                                  : size,
                            });
                          }}
                        >
                          <ThemedText
                            style={[
                              styles.punchChipText,
                              {
                                color: isSelected
                                  ? theme.buttonText
                                  : theme.text,
                              },
                            ]}
                          >
                            {size}mm
                          </ThemedText>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}
            </SectionWrapper>
          ) : (
            <SectionWrapper
              title={`${++sectionNum}. Excision`}
              icon="scissors"
              collapsible
              isCollapsed={isSectionCollapsed("excision")}
              onCollapsedChange={(v) => setSectionCollapsedState("excision", v)}
            >
              <HistologySection
                label=""
                histology={assessment.currentHistology}
                onHistologyChange={handleCurrentHistologyChange}
                isPending
                defaultExpanded={false}
                hideHeader
                simplifiedMode
              />
            </SectionWrapper>
          )}

          {/* ── Add another lesion (biopsy pathway only) ── */}
          {onAddLesion &&
            isBiopsy &&
            assessment.biopsyType &&
            assessment.site && (
              <Pressable
                style={[
                  styles.addLesionButton,
                  { borderColor: theme.border },
                ]}
                onPress={onAddLesion}
              >
                <ThemedText
                  style={[styles.addLesionText, { color: theme.link }]}
                >
                  + Add another lesion
                </ThemedText>
              </Pressable>
            )}

          {/* ── MDT toggle (histology_known only) ── */}
          {isHistologyKnown ? (
            <View style={styles.mdtRow}>
              <ThemedText style={[styles.mdtLabel, { color: theme.text }]}>
                Discussed at MDT
              </ThemedText>
              <Switch
                value={assessment.discussedAtMdt ?? false}
                onValueChange={(v) =>
                  handleContinuingCareChange({ discussedAtMdt: v })
                }
                trackColor={{
                  false: theme.border,
                  true: theme.link + "60",
                }}
                thumbColor={
                  assessment.discussedAtMdt
                    ? theme.link
                    : theme.textSecondary
                }
              />
            </View>
          ) : null}

          {/* ── Summary & Procedures ── */}
          {hasAcceptHandler ? (
            <View ref={summaryRef} collapsable={false}>
              <SectionWrapper
                title={`${++sectionNum}. Summary & Procedures`}
                icon="check-square"
                collapsible
                isCollapsed={isSectionCollapsed("summary")}
                onCollapsedChange={(v) => setSectionCollapsedState("summary", v)}
              >
                <SkinCancerSummaryPanel
                  assessment={assessment}
                  suggestedProcedureIds={suggestedProcedureIds}
                  isAccepted={isAccepted}
                  onAccept={handleAccept}
                  onEditMapping={handleEditMapping}
                />
              </SectionWrapper>
            </View>
          ) : null}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.lg,
  },
  tier1Grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  tier1Chip: {
    flexBasis: "31%",
    flexGrow: 1,
    minWidth: 96,
    minHeight: 44,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  tier1ChipText: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  considerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  considerLabel: {
    fontSize: 15,
    fontWeight: "500",
  },
  biopsyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  biopsyChip: {
    flexBasis: "46%",
    flexGrow: 1,
    minHeight: 44,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  biopsyChipText: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  marginRow: {
    marginTop: Spacing.md,
    gap: 6,
  },
  marginLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  marginInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  marginInput: {
    flex: 1,
    maxWidth: 100,
    height: 40,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 16,
    fontWeight: "500",
  },
  marginUnit: {
    fontSize: 14,
    fontWeight: "500",
  },
  punchSection: {
    marginTop: Spacing.md,
    gap: 6,
  },
  punchGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  punchChip: {
    minWidth: 52,
    minHeight: 40,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  punchChipText: {
    fontSize: 14,
    fontWeight: "600",
  },
  addLesionButton: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  addLesionText: {
    fontSize: 15,
    fontWeight: "600",
  },
  mdtRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  mdtLabel: {
    fontSize: 15,
    fontWeight: "500",
  },
});
