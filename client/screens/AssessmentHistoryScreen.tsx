import React, { useState, useCallback } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  InteractionManager,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@/components/FeatherIcon";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";
import {
  getAllRevealedPairs,
  type RevealedPairWithContext,
} from "@/lib/assessmentStorage";
import { ENTRUSTMENT_LABELS, TEACHING_QUALITY_LABELS } from "@/types/sharing";

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatRevealDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function calibrationGapColor(
  gap: number,
  theme: ReturnType<typeof useTheme>["theme"],
): string {
  if (gap === 0) return theme.success;
  if (gap <= 1) return theme.warning;
  return theme.error;
}

// ── Assessment row ───────────────────────────────────────────────────────────

const AssessmentRow = React.memo(function AssessmentRow({
  pair,
}: {
  pair: RevealedPairWithContext;
}) {
  const { theme } = useTheme();
  const gap = Math.abs(
    pair.supervisorEntrustment - pair.traineeSelfEntrustment,
  );
  const gapColor = calibrationGapColor(gap, theme);

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: theme.backgroundElevated,
          borderColor: theme.border,
        },
        Shadows.card,
      ]}
    >
      {/* Procedure name */}
      <ThemedText
        style={[styles.procedureName, { color: theme.text }]}
        numberOfLines={1}
      >
        {pair.procedureDisplayName || pair.procedureCode}
      </ThemedText>

      {/* Date */}
      <ThemedText style={[styles.date, { color: theme.textTertiary }]}>
        {formatRevealDate(pair.revealedAt)}
      </ThemedText>

      {/* Ratings row */}
      <View style={styles.ratingsRow}>
        {/* Supervisor rating */}
        <View style={styles.ratingCell}>
          <ThemedText
            style={[styles.ratingLabel, { color: theme.textTertiary }]}
          >
            Supervisor
          </ThemedText>
          <ThemedText style={[styles.ratingValue, { color: theme.success }]}>
            {pair.supervisorEntrustment}
          </ThemedText>
          <ThemedText
            style={[styles.ratingDesc, { color: theme.textSecondary }]}
            numberOfLines={1}
          >
            {ENTRUSTMENT_LABELS[pair.supervisorEntrustment]}
          </ThemedText>
        </View>

        {/* Gap badge */}
        <View style={styles.gapContainer}>
          <View style={[styles.gapBadge, { backgroundColor: gapColor + "20" }]}>
            <ThemedText style={[styles.gapText, { color: gapColor }]}>
              {gap === 0 ? "Match" : `Gap ${gap}`}
            </ThemedText>
          </View>
        </View>

        {/* Self rating */}
        <View style={[styles.ratingCell, styles.ratingCellRight]}>
          <ThemedText
            style={[styles.ratingLabel, { color: theme.textTertiary }]}
          >
            Self
          </ThemedText>
          <ThemedText style={[styles.ratingValue, { color: theme.info }]}>
            {pair.traineeSelfEntrustment}
          </ThemedText>
          <ThemedText
            style={[styles.ratingDesc, { color: theme.textSecondary }]}
            numberOfLines={1}
          >
            {ENTRUSTMENT_LABELS[pair.traineeSelfEntrustment]}
          </ThemedText>
        </View>
      </View>

      {/* Teaching quality */}
      <View style={styles.teachingRow}>
        <ThemedText
          style={[styles.teachingLabel, { color: theme.textTertiary }]}
        >
          Teaching
        </ThemedText>
        <ThemedText style={[styles.teachingValue, { color: theme.accent }]}>
          {pair.teachingQuality}/5
        </ThemedText>
        <ThemedText
          style={[styles.teachingDesc, { color: theme.textSecondary }]}
          numberOfLines={1}
        >
          {TEACHING_QUALITY_LABELS[pair.teachingQuality]}
        </ThemedText>
      </View>
    </View>
  );
});

// ── Main screen ──────────────────────────────────────────────────────────────

export default function AssessmentHistoryScreen() {
  const { theme } = useTheme();
  const [pairs, setPairs] = useState<RevealedPairWithContext[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const task = InteractionManager.runAfterInteractions(async () => {
        setLoading(true);
        try {
          const data = await getAllRevealedPairs();
          // Sort by revealedAt descending
          data.sort(
            (a, b) =>
              new Date(b.revealedAt).getTime() -
              new Date(a.revealedAt).getTime(),
          );
          setPairs(data);
        } catch (error) {
          console.error("Error loading assessment history:", error);
        } finally {
          setLoading(false);
        }
      });
      return () => task.cancel();
    }, []),
  );

  if (loading) {
    return (
      <View
        testID="screen-assessmentHistory"
        style={[styles.centered, { backgroundColor: theme.backgroundRoot }]}
      >
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  if (pairs.length === 0) {
    return (
      <View
        testID="screen-assessmentHistory"
        style={[styles.centered, { backgroundColor: theme.backgroundRoot }]}
      >
        <Feather name="award" size={48} color={theme.textTertiary} />
        <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>
          No assessments yet
        </ThemedText>
        <ThemedText
          style={[styles.emptySubtitle, { color: theme.textSecondary }]}
        >
          Completed EPA assessments on shared cases will appear here.
        </ThemedText>
      </View>
    );
  }

  return (
    <View
      testID="screen-assessmentHistory"
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
    >
      <FlatList
        data={pairs}
        keyExtractor={(item) => item.sharedCaseId}
        renderItem={({ item }) => <AssessmentRow pair={item} />}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
  },
  row: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  procedureName: {
    fontSize: 16,
    fontWeight: "600",
  },
  date: {
    fontSize: 12,
    marginTop: 2,
    marginBottom: Spacing.sm,
  },
  ratingsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingCell: {
    flex: 1,
  },
  ratingCellRight: {
    alignItems: "flex-end",
  },
  ratingLabel: {
    fontSize: 11,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  ratingValue: {
    fontSize: 24,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  ratingDesc: {
    fontSize: 12,
    marginTop: 1,
  },
  gapContainer: {
    alignItems: "center",
    paddingHorizontal: Spacing.xs,
  },
  gapBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  gapText: {
    fontSize: 11,
    fontWeight: "600",
  },
  teachingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(128,128,128,0.2)",
    gap: Spacing.xs,
  },
  teachingLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  teachingValue: {
    fontSize: 14,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  teachingDesc: {
    fontSize: 12,
    flex: 1,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "600",
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
});
