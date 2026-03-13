/**
 * LipofillingCard — Per-side lipofilling data capture.
 *
 * Harvest → Process → Inject per-side:
 * 1. Harvest — sites (multi-select), total volume, technique, cannula, tumescent
 * 2. Processing — method, centrifuge RPM+min (conditional), volume after, additives
 * 3. Injection — per active side: volume (required), technique, planes, condition
 * 4. Session tracking (toggle) — session number, interval, indication, context
 */

import React, { useCallback, useState } from "react";
import { View, LayoutAnimation, StyleSheet } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";
import {
  BreastChipRow,
  BreastMultiChipRow,
  BreastCheckboxRow,
  BreastNumericField,
  BreastSectionToggle,
} from "./BreastCardHelpers";
import { SectionWrapper } from "@/components/skin-cancer/SectionWrapper";
import type {
  LipofillingData,
  LipofillingInjectionSide,
  LipofillingHarvestSite,
  LipofillingHarvestTechnique,
  LipofillingProcessingMethod,
  LipofillingAdditive,
  LipofillingInjectionTechnique,
  LipofillingInjectionPlane,
  RecipientSiteCondition,
  LipofillingIndication,
  LipofillingContext,
} from "@/types/breast";
import {
  HARVEST_SITE_LABELS,
  HARVEST_TECHNIQUE_LABELS,
  PROCESSING_METHOD_LABELS,
  LIPOFILLING_ADDITIVE_LABELS,
  LIPOFILLING_INJECTION_TECHNIQUE_LABELS,
  LIPOFILLING_INJECTION_PLANE_LABELS,
  RECIPIENT_SITE_CONDITION_LABELS,
  LIPOFILLING_INDICATION_LABELS,
  LIPOFILLING_CONTEXT_LABELS,
} from "@/types/breast";
import type { BreastLaterality } from "@/types/breast";
import { ThemedText } from "@/components/ThemedText";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const HARVEST_SITES: readonly LipofillingHarvestSite[] = [
  "abdomen",
  "flanks",
  "inner_thigh",
  "outer_thigh",
  "buttocks",
  "arms",
  "back",
  "other",
] as const;

const HARVEST_TECHNIQUES: readonly LipofillingHarvestTechnique[] = [
  "coleman_syringe",
  "power_assisted",
  "vaser",
  "water_assisted",
  "standard_suction",
  "other",
] as const;

const PROCESSING_METHODS: readonly LipofillingProcessingMethod[] = [
  "coleman_centrifuge",
  "puregraft",
  "revolve",
  "telfa_decanting",
  "gravity_sedimentation",
  "filtration",
  "other",
] as const;

const ADDITIVES: readonly LipofillingAdditive[] = [
  "none",
  "prp",
  "prf",
  "svf",
  "ascs",
] as const;

const INJECTION_TECHNIQUES: readonly LipofillingInjectionTechnique[] = [
  "microdroplet",
  "threading",
  "fan_pattern",
  "multiplane",
] as const;

const INJECTION_PLANES: readonly LipofillingInjectionPlane[] = [
  "subcutaneous",
  "intramuscular",
  "subglandular",
  "prepectoral",
] as const;

const SITE_CONDITIONS: readonly RecipientSiteCondition[] = [
  "native",
  "irradiated",
  "scarred",
  "previously_reconstructed",
] as const;

const INDICATIONS: readonly LipofillingIndication[] = [
  "contour_correction",
  "volume_restoration",
  "skin_quality_improvement",
  "rippling_correction",
  "symmetrisation",
  "primary_reconstruction",
  "aesthetic_augmentation",
] as const;

const CONTEXTS: readonly LipofillingContext[] = [
  "adjunct_to_implant",
  "adjunct_to_flap",
  "adjunct_to_bct",
  "primary_reconstruction",
  "standalone_aesthetic",
  "revision",
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  side: BreastLaterality;
  value: LipofillingData;
  onChange: (data: LipofillingData) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export const LipofillingCard = React.memo(function LipofillingCard({
  side,
  value,
  onChange,
}: Props) {
  const { theme } = useTheme();
  const [showSession, setShowSession] = useState(
    !!(value.sessionNumber || value.indication),
  );

  const update = useCallback(
    (patch: Partial<LipofillingData>) => {
      onChange({ ...value, ...patch });
    },
    [onChange, value],
  );

  const injectionKey =
    side === "left" ? "injectionLeft" : "injectionRight";
  const injection = value[injectionKey];

  const updateInjection = useCallback(
    (patch: Partial<LipofillingInjectionSide>) => {
      update({
        [injectionKey]: { ...injection, ...patch } as LipofillingInjectionSide,
      });
    },
    [injection, injectionKey, update],
  );

  const isCentrifuge = value.processingMethod === "coleman_centrifuge";

  const summaryParts: string[] = [];
  if (value.harvestSites?.length)
    summaryParts.push(
      `${value.harvestSites.length} site${value.harvestSites.length > 1 ? "s" : ""}`,
    );
  if (injection?.volumeInjectedMl)
    summaryParts.push(`${injection.volumeInjectedMl}ml injected`);
  const summary = summaryParts.join(", ") || "Tap to configure";

  return (
    <SectionWrapper
      title="Lipofilling"
      icon="droplet"
      collapsible
      defaultCollapsed={false}
      subtitle={summary}
    >
      {/* ── 1. Harvest ────────────────────────────────────────────────────── */}

      <BreastMultiChipRow
        label="Harvest Sites"
        options={HARVEST_SITES}
        labels={HARVEST_SITE_LABELS}
        selected={value.harvestSites ?? []}
        onToggle={(v) => update({ harvestSites: v })}
      />

      <BreastNumericField
        label="Total Volume Harvested"
        value={value.totalVolumeHarvestedMl}
        onValueChange={(v) => update({ totalVolumeHarvestedMl: v })}
        unit="ml"
        integer
      />

      <BreastChipRow
        label="Harvest Technique"
        options={HARVEST_TECHNIQUES}
        labels={HARVEST_TECHNIQUE_LABELS}
        selected={value.harvestTechnique}
        onSelect={(v) => update({ harvestTechnique: v })}
        allowDeselect
      />

      <BreastNumericField
        label="Cannula Size"
        value={value.cannulaSizeMm}
        onValueChange={(v) => update({ cannulaSizeMm: v })}
        unit="mm"
      />

      <BreastCheckboxRow
        label="Tumescent used"
        value={value.tumescentUsed ?? false}
        onChange={(v) => {
          update({
            tumescentUsed: v,
            tumescentVolumeMl: v ? value.tumescentVolumeMl : undefined,
          });
        }}
      />

      {value.tumescentUsed && (
        <BreastNumericField
          label="Tumescent Volume"
          value={value.tumescentVolumeMl}
          onValueChange={(v) => update({ tumescentVolumeMl: v })}
          unit="ml"
          integer
        />
      )}

      {/* ── 2. Processing ─────────────────────────────────────────────────── */}

      <View style={styles.sectionDivider} />

      <BreastChipRow
        label="Processing Method"
        options={PROCESSING_METHODS}
        labels={PROCESSING_METHOD_LABELS}
        selected={value.processingMethod}
        onSelect={(v) => {
          const patch: Partial<LipofillingData> = { processingMethod: v };
          if (v !== "coleman_centrifuge") {
            patch.centrifugationRpm = undefined;
            patch.centrifugationMinutes = undefined;
          }
          update(patch);
        }}
        allowDeselect
      />

      {isCentrifuge && (
        <View style={styles.centrifugeRow}>
          <View style={{ flex: 1 }}>
            <BreastNumericField
              label="RPM"
              value={value.centrifugationRpm}
              onValueChange={(v) => update({ centrifugationRpm: v })}
              integer
            />
          </View>
          <View style={{ flex: 1 }}>
            <BreastNumericField
              label="Duration"
              value={value.centrifugationMinutes}
              onValueChange={(v) => update({ centrifugationMinutes: v })}
              unit="min"
              integer
            />
          </View>
        </View>
      )}

      <BreastNumericField
        label="Volume After Processing"
        value={value.volumeAfterProcessingMl}
        onValueChange={(v) => update({ volumeAfterProcessingMl: v })}
        unit="ml"
        integer
      />

      <BreastMultiChipRow
        label="Additives"
        options={ADDITIVES}
        labels={LIPOFILLING_ADDITIVE_LABELS}
        selected={value.additives ?? []}
        onToggle={(v) => update({ additives: v })}
      />

      {/* ── 3. Injection (per active side) ────────────────────────────────── */}

      <View style={styles.sectionDivider} />

      <ThemedText
        type="small"
        style={{ color: theme.textSecondary, fontWeight: "600" }}
      >
        Injection — {side === "left" ? "Left" : "Right"} Breast
      </ThemedText>

      <BreastNumericField
        label="Volume Injected"
        value={injection?.volumeInjectedMl}
        onValueChange={(v) =>
          updateInjection({ volumeInjectedMl: v ?? 0 })
        }
        unit="ml"
        integer
      />

      <BreastChipRow
        label="Injection Technique"
        options={INJECTION_TECHNIQUES}
        labels={LIPOFILLING_INJECTION_TECHNIQUE_LABELS}
        selected={injection?.injectionTechnique}
        onSelect={(v) => updateInjection({ injectionTechnique: v })}
        allowDeselect
      />

      <BreastMultiChipRow
        label="Injection Planes"
        options={INJECTION_PLANES}
        labels={LIPOFILLING_INJECTION_PLANE_LABELS}
        selected={injection?.injectionPlanes ?? []}
        onToggle={(v) => updateInjection({ injectionPlanes: v })}
      />

      <BreastChipRow
        label="Recipient Site Condition"
        options={SITE_CONDITIONS}
        labels={RECIPIENT_SITE_CONDITION_LABELS}
        selected={injection?.recipientSiteCondition}
        onSelect={(v) => updateInjection({ recipientSiteCondition: v })}
        allowDeselect
      />

      {/* ── 4. Session Tracking ───────────────────────────────────────────── */}

      <BreastSectionToggle
        label={showSession ? "Hide Session Details" : "Session Details"}
        isExpanded={showSession}
        onToggle={() => {
          LayoutAnimation.configureNext(
            LayoutAnimation.Presets.easeInEaseOut,
          );
          setShowSession(!showSession);
        }}
      />

      {showSession && (
        <View>
          <BreastNumericField
            label="Session Number"
            value={value.sessionNumber}
            onValueChange={(v) => update({ sessionNumber: v })}
            integer
          />

          <BreastNumericField
            label="Interval from Previous Session"
            value={value.intervalFromPreviousMonths}
            onValueChange={(v) =>
              update({ intervalFromPreviousMonths: v })
            }
            unit="months"
            integer
          />

          <BreastChipRow
            label="Indication"
            options={INDICATIONS}
            labels={LIPOFILLING_INDICATION_LABELS}
            selected={value.indication}
            onSelect={(v) => update({ indication: v })}
            allowDeselect
          />

          <BreastChipRow
            label="Context"
            options={CONTEXTS}
            labels={LIPOFILLING_CONTEXT_LABELS}
            selected={value.context}
            onSelect={(v) => update({ context: v })}
            allowDeselect
          />
        </View>
      )}
    </SectionWrapper>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  sectionDivider: {
    height: 1,
    backgroundColor: "rgba(128,128,128,0.15)",
    marginVertical: Spacing.sm,
  },
  centrifugeRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
});
