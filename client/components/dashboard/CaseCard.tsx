import React, { useMemo } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@/components/FeatherIcon";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { EncryptedImage } from "@/components/EncryptedImage";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";
import {
  Case,
  getPrimarySiteLabel,
  isExcisionBiopsyDiagnosis,
} from "@/types/case";
import { getCasePrimaryTitle } from "@/lib/caseDiagnosisSummary";
import {
  getSkinCancerCaseBadge,
  caseCanAddHistology,
} from "@/lib/skinCancerConfig";
import { RoleBadge } from "@/components/RoleBadge";
import { SpecialtyBadge } from "@/components/SpecialtyBadge";
import { SpecialtyIcon } from "@/components/SpecialtyIcon";

const BADGE_PRIORITY: Record<string, number> = {
  error: 0,
  warning: 1,
  info: 2,
  success: 3,
};

function getThemeColor(
  theme: ReturnType<typeof useTheme>["theme"],
  key: string,
): string {
  const colorMap: Record<string, string> = {
    warning: theme.warning,
    success: theme.success,
    error: theme.error,
    info: theme.info,
    textSecondary: theme.textSecondary,
  };
  return colorMap[key] ?? theme.textSecondary;
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dateStart = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const diffDays = Math.round(
    (todayStart.getTime() - dateStart.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-NZ", { day: "numeric", month: "short" });
}

interface DashboardCaseCardProps {
  caseData: Case;
  onPress: () => void;
  onAddEvent?: () => void;
  onAddHistology?: () => void;
}

const CaseThumbnail = React.memo(function CaseThumbnail({
  caseData,
}: {
  caseData: Case;
}) {
  const { theme } = useTheme();
  const firstPhoto = caseData.operativeMedia?.[0];

  if (firstPhoto?.localUri) {
    return (
      <View
        style={[
          thumbStyles.container,
          { backgroundColor: theme.backgroundElevated },
        ]}
      >
        <EncryptedImage
          uri={firstPhoto.localUri}
          style={thumbStyles.image}
          resizeMode="cover"
          thumbnail
        />
      </View>
    );
  }

  return (
    <View
      style={[
        thumbStyles.container,
        { backgroundColor: theme.specialty[caseData.specialty] + "10" },
      ]}
    >
      <SpecialtyIcon
        specialty={caseData.specialty}
        size={20}
        color={theme.specialty[caseData.specialty]}
      />
    </View>
  );
});

function SiteChip({ caseData }: { caseData: Case }) {
  const { theme } = useTheme();
  const label = getPrimarySiteLabel(caseData);
  if (!label) return null;

  return (
    <View
      style={[chipStyles.chip, { backgroundColor: theme.textTertiary + "15" }]}
    >
      <ThemedText style={[chipStyles.chipText, { color: theme.textSecondary }]}>
        {label}
      </ThemedText>
    </View>
  );
}

function DashboardCaseCardInner({
  caseData,
  onPress,
  onAddEvent,
  onAddHistology,
}: DashboardCaseCardProps) {
  const { theme } = useTheme();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const formattedDate = formatRelativeDate(caseData.procedureDate);

  const userRole =
    caseData.teamMembers.find((m) => m.id === caseData.ownerId)?.role || "PS";
  const showRoleBadge = userRole !== "PS";

  const caseTitle = getCasePrimaryTitle(caseData) || caseData.procedureType;

  const skinCancerBadge = useMemo(() => {
    let best: { label: string; colorKey: string } | null = null;
    let bestPriority = Infinity;

    for (const g of caseData.diagnosisGroups ?? []) {
      if (g.skinCancerAssessment) {
        const b = getSkinCancerCaseBadge(g.skinCancerAssessment);
        if (b && (BADGE_PRIORITY[b.colorKey] ?? 99) < bestPriority) {
          best = b;
          bestPriority = BADGE_PRIORITY[b.colorKey] ?? 99;
        }
      }
      for (const l of g.lesionInstances ?? []) {
        if (l.skinCancerAssessment) {
          const b = getSkinCancerCaseBadge(l.skinCancerAssessment);
          if (b && (BADGE_PRIORITY[b.colorKey] ?? 99) < bestPriority) {
            best = b;
            bestPriority = BADGE_PRIORITY[b.colorKey] ?? 99;
          }
        }
      }
    }
    return best;
  }, [caseData.diagnosisGroups]);

  const hasHistologyPending =
    !skinCancerBadge &&
    caseData.diagnosisGroups?.some(
      (g) =>
        g.diagnosisCertainty === "clinical" ||
        isExcisionBiopsyDiagnosis(g.diagnosisPicklistId),
    );

  const showHistologyAction = onAddHistology && caseCanAddHistology(caseData);
  const hasActions = showHistologyAction || onAddEvent;

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`${caseData.patientIdentifier}, ${caseTitle}, ${formattedDate}`}
      style={({ pressed }) => [
        styles.card,
        pressed && { backgroundColor: theme.backgroundElevated },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <SpecialtyBadge specialty={caseData.specialty} size="small" />
          {showRoleBadge ? <RoleBadge role={userRole} size="small" /> : null}
          {skinCancerBadge ? (
            <View
              style={[
                chipStyles.chip,
                {
                  backgroundColor:
                    getThemeColor(theme, skinCancerBadge.colorKey) + "20",
                },
              ]}
            >
              <ThemedText
                style={[
                  chipStyles.chipText,
                  {
                    color: getThemeColor(theme, skinCancerBadge.colorKey),
                  },
                ]}
              >
                {skinCancerBadge.label}
              </ThemedText>
            </View>
          ) : hasHistologyPending ? (
            <View style={[chipStyles.chip, { backgroundColor: "#E5A00D20" }]}>
              <ThemedText style={[chipStyles.chipText, { color: "#E5A00D" }]}>
                Histology pending
              </ThemedText>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.contentRow}>
        <CaseThumbnail caseData={caseData} />
        <View style={styles.contentText}>
          <ThemedText style={styles.patientId} numberOfLines={1}>
            {caseData.patientIdentifier}
          </ThemedText>
          <View style={styles.diagnosisRow}>
            <ThemedText
              style={[styles.procedureType, { color: theme.textSecondary }]}
              numberOfLines={1}
            >
              {caseTitle}
            </ThemedText>
            <SiteChip caseData={caseData} />
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.footerMeta}>
          <View style={styles.footerItem}>
            <Feather name="calendar" size={14} color={theme.textTertiary} />
            <ThemedText
              style={[styles.footerText, { color: theme.textSecondary }]}
            >
              {formattedDate}
            </ThemedText>
          </View>
          <View style={styles.footerItem}>
            <Feather name="map-pin" size={14} color={theme.textTertiary} />
            <ThemedText
              style={[styles.footerText, { color: theme.textSecondary }]}
            >
              {caseData.facility}
            </ThemedText>
          </View>
        </View>
        {hasActions ? (
          <View style={styles.footerActions}>
            {showHistologyAction ? (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onAddHistology!();
                }}
                style={[
                  styles.actionChip,
                  {
                    backgroundColor: theme.warning + "15",
                    borderColor: theme.warning + "30",
                  },
                ]}
              >
                <Feather name="file-text" size={12} color={theme.warning} />
                <ThemedText
                  style={[styles.actionChipText, { color: theme.warning }]}
                >
                  Histology
                </ThemedText>
              </Pressable>
            ) : null}
            {onAddEvent ? (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onAddEvent();
                }}
                style={[
                  styles.actionChip,
                  {
                    backgroundColor: theme.backgroundElevated,
                    borderColor: theme.border,
                  },
                ]}
              >
                <Feather name="plus" size={12} color={theme.textSecondary} />
                <ThemedText
                  style={[
                    styles.actionChipText,
                    { color: theme.textSecondary },
                  ]}
                >
                  Event
                </ThemedText>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

export const DashboardCaseCard = React.memo(DashboardCaseCardInner);

const thumbStyles = StyleSheet.create({
  container: {
    width: 48,
    height: 48,
    borderRadius: 10,
    overflow: "hidden",
    marginRight: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  image: {
    width: 48,
    height: 48,
  },
});

const chipStyles = StyleSheet.create({
  chip: {
    alignSelf: "flex-start",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginLeft: Spacing.xs,
  },
  chipText: {
    fontSize: 11,
    fontWeight: "500",
  },
});

const styles = StyleSheet.create({
  card: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  headerLeft: {
    flexDirection: "row",
    gap: Spacing.sm,
    flexWrap: "wrap",
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  contentText: {
    flex: 1,
  },
  diagnosisRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  patientId: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  procedureType: {
    fontSize: 14,
    flexShrink: 1,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerMeta: {
    flexDirection: "row",
    gap: Spacing.lg,
    flexShrink: 1,
  },
  footerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  footerText: {
    fontSize: 13,
  },
  footerActions: {
    flexDirection: "row",
    gap: 6,
    marginLeft: Spacing.sm,
  },
  actionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    height: 28,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  actionChipText: {
    fontSize: 11,
    fontWeight: "500",
  },
});
