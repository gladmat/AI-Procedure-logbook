import type { EntrustmentLevel } from "@/types/sharing";
import type { RevealedPairWithContext } from "./assessmentStorage";

// ── Types ────────────────────────────────────────────────────────────────────

export interface LearningCurvePoint {
  caseNumber: number;
  supervisorRating: EntrustmentLevel;
  selfRating: EntrustmentLevel;
  date: string;
  sharedCaseId: string;
  caseComplexity?: string;
}

export interface ProcedureLearningCurve {
  procedureCode: string;
  procedureDisplayName: string;
  totalCases: number;
  latestRating: EntrustmentLevel;
  points: LearningCurvePoint[];
}

export interface TeachingAggregate {
  overallAverage: number;
  totalAssessments: number;
  /** Approximate unique trainee count (uses distinct sharedCaseId as proxy). */
  uniqueTrainees: number;
  byProcedure: {
    procedureCode: string;
    procedureDisplayName: string;
    averageRating: number;
    count: number;
  }[];
  trend: {
    month: string;
    averageRating: number;
    count: number;
  }[];
  meetsThreshold: boolean;
}

export type CalibrationInterpretation =
  | "excellent"
  | "good"
  | "needs_attention";
export type CalibrationDirection =
  | "over_estimates"
  | "under_estimates"
  | "balanced";

export interface CalibrationScore {
  overallMeanGap: number;
  interpretation: CalibrationInterpretation;
  direction: CalibrationDirection;
  monthlyTrend: {
    month: string;
    meanGap: number;
    count: number;
  }[];
  totalPairs: number;
}

export interface TrainingOverviewStats {
  totalAssessments: number;
  proceduresAssessed: number;
  uniqueCounterparts: number;
  averageSupervisorRating: number;
  averageSelfRating: number;
}

// ── Learning Curves ──────────────────────────────────────────────────────────

/**
 * Group revealed pairs by procedure, sort by date, assign sequential case numbers.
 * Returns curves sorted by totalCases descending.
 */
export function computeLearningCurves(
  pairs: RevealedPairWithContext[],
): ProcedureLearningCurve[] {
  if (pairs.length === 0) return [];

  // Group by procedure code
  const byProcedure = new Map<string, RevealedPairWithContext[]>();
  for (const pair of pairs) {
    if (!pair.procedureCode) continue;
    const existing = byProcedure.get(pair.procedureCode);
    if (existing) {
      existing.push(pair);
    } else {
      byProcedure.set(pair.procedureCode, [pair]);
    }
  }

  const curves: ProcedureLearningCurve[] = [];

  for (const [code, group] of byProcedure) {
    // Sort by date ascending
    const sorted = [...group].sort(
      (a, b) =>
        new Date(a.revealedAt).getTime() - new Date(b.revealedAt).getTime(),
    );

    const points: LearningCurvePoint[] = sorted.map((pair, i) => ({
      caseNumber: i + 1,
      supervisorRating: pair.supervisorEntrustment,
      selfRating: pair.traineeSelfEntrustment,
      date: pair.revealedAt,
      sharedCaseId: pair.sharedCaseId,
      caseComplexity: pair.caseComplexity,
    }));

    const last = sorted[sorted.length - 1]!;

    curves.push({
      procedureCode: code,
      procedureDisplayName: last.procedureDisplayName || code,
      totalCases: points.length,
      latestRating: last.supervisorEntrustment,
      points,
    });
  }

  // Sort by total cases descending
  curves.sort((a, b) => b.totalCases - a.totalCases);

  return curves;
}

/**
 * Get learning curve for a single procedure.
 */
export function computeLearningCurveForProcedure(
  pairs: RevealedPairWithContext[],
  procedureCode: string,
): ProcedureLearningCurve | null {
  const filtered = pairs.filter((p) => p.procedureCode === procedureCode);
  if (filtered.length === 0) return null;
  const curves = computeLearningCurves(filtered);
  return curves[0] ?? null;
}

// ── Teaching Aggregate ───────────────────────────────────────────────────────

/**
 * Compute aggregate teaching quality score.
 *
 * Privacy: Returns null when fewer than 5 assessments or fewer than 3 unique
 * sharedCaseIds (proxy for unique trainees). RevealedAssessmentPair does not
 * store counterpart userId — sharedCaseId cardinality approximates unique
 * encounters, which is sufficient for the identification-prevention threshold.
 */
export function computeTeachingAggregate(
  pairs: RevealedPairWithContext[],
): TeachingAggregate | null {
  if (pairs.length === 0) return null;

  const uniqueSharedCaseIds = new Set(pairs.map((p) => p.sharedCaseId));
  const meetsThreshold = pairs.length >= 5 && uniqueSharedCaseIds.size >= 3;

  const totalTeaching = pairs.reduce((sum, p) => sum + p.teachingQuality, 0);
  const overallAverage = Math.round((totalTeaching / pairs.length) * 10) / 10;

  // Group by procedure
  const procMap = new Map<
    string,
    { name: string; sum: number; count: number }
  >();
  for (const pair of pairs) {
    if (!pair.procedureCode) continue;
    const existing = procMap.get(pair.procedureCode);
    if (existing) {
      existing.sum += pair.teachingQuality;
      existing.count += 1;
    } else {
      procMap.set(pair.procedureCode, {
        name: pair.procedureDisplayName || pair.procedureCode,
        sum: pair.teachingQuality,
        count: 1,
      });
    }
  }

  const byProcedure = Array.from(procMap.entries())
    .map(([code, data]) => ({
      procedureCode: code,
      procedureDisplayName: data.name,
      averageRating: Math.round((data.sum / data.count) * 10) / 10,
      count: data.count,
    }))
    .sort((a, b) => b.count - a.count);

  // Monthly trend
  const monthMap = new Map<string, { sum: number; count: number }>();
  for (const pair of pairs) {
    const month = pair.revealedAt.slice(0, 7); // "YYYY-MM"
    const existing = monthMap.get(month);
    if (existing) {
      existing.sum += pair.teachingQuality;
      existing.count += 1;
    } else {
      monthMap.set(month, { sum: pair.teachingQuality, count: 1 });
    }
  }

  const trend = Array.from(monthMap.entries())
    .map(([month, data]) => ({
      month,
      averageRating: Math.round((data.sum / data.count) * 10) / 10,
      count: data.count,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  if (!meetsThreshold) return null;

  return {
    overallAverage,
    totalAssessments: pairs.length,
    uniqueTrainees: uniqueSharedCaseIds.size,
    byProcedure,
    trend,
    meetsThreshold,
  };
}

// ── Calibration Score ────────────────────────────────────────────────────────

/**
 * Compute calibration score: mean |supervisor - self| across all pairs.
 * Lower is better (0 = perfect calibration).
 *
 * Returns null when fewer than 3 pairs (insufficient data).
 */
export function computeCalibrationScore(
  pairs: RevealedPairWithContext[],
): CalibrationScore | null {
  if (pairs.length < 3) return null;

  const gaps = pairs.map(
    (p) => p.supervisorEntrustment - p.traineeSelfEntrustment,
  );
  const absGaps = gaps.map(Math.abs);
  const overallMeanGap =
    Math.round((absGaps.reduce((a, b) => a + b, 0) / absGaps.length) * 100) /
    100;

  // Signed mean for direction: positive = supervisor rates higher = trainee under-estimates
  const signedMean = gaps.reduce((a, b) => a + b, 0) / gaps.length;

  let interpretation: CalibrationInterpretation;
  if (overallMeanGap < 0.5) {
    interpretation = "excellent";
  } else if (overallMeanGap <= 1.0) {
    interpretation = "good";
  } else {
    interpretation = "needs_attention";
  }

  let direction: CalibrationDirection;
  if (Math.abs(signedMean) < 0.25) {
    direction = "balanced";
  } else if (signedMean > 0) {
    direction = "under_estimates";
  } else {
    direction = "over_estimates";
  }

  // Monthly trend
  const monthMap = new Map<string, { sumAbs: number; count: number }>();
  for (let i = 0; i < pairs.length; i++) {
    const month = pairs[i]!.revealedAt.slice(0, 7);
    const existing = monthMap.get(month);
    if (existing) {
      existing.sumAbs += absGaps[i]!;
      existing.count += 1;
    } else {
      monthMap.set(month, { sumAbs: absGaps[i]!, count: 1 });
    }
  }

  const monthlyTrend = Array.from(monthMap.entries())
    .map(([month, data]) => ({
      month,
      meanGap: Math.round((data.sumAbs / data.count) * 100) / 100,
      count: data.count,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return {
    overallMeanGap,
    interpretation,
    direction,
    monthlyTrend,
    totalPairs: pairs.length,
  };
}

// ── Training Overview ────────────────────────────────────────────────────────

/**
 * Compute summary statistics for the training overview cards.
 */
export function computeTrainingOverview(
  pairs: RevealedPairWithContext[],
): TrainingOverviewStats {
  if (pairs.length === 0) {
    return {
      totalAssessments: 0,
      proceduresAssessed: 0,
      uniqueCounterparts: 0,
      averageSupervisorRating: 0,
      averageSelfRating: 0,
    };
  }

  const procedures = new Set(pairs.map((p) => p.procedureCode).filter(Boolean));
  const counterparts = new Set(pairs.map((p) => p.sharedCaseId));

  const avgSup =
    Math.round(
      (pairs.reduce((s, p) => s + p.supervisorEntrustment, 0) / pairs.length) *
        10,
    ) / 10;
  const avgSelf =
    Math.round(
      (pairs.reduce((s, p) => s + p.traineeSelfEntrustment, 0) / pairs.length) *
        10,
    ) / 10;

  return {
    totalAssessments: pairs.length,
    proceduresAssessed: procedures.size,
    uniqueCounterparts: counterparts.size,
    averageSupervisorRating: avgSup,
    averageSelfRating: avgSelf,
  };
}

// ── Entrustment Distribution ─────────────────────────────────────────────────

/**
 * Count supervisor entrustment ratings at each level 1–5.
 * Used for the supervisor's "ratings given" distribution chart.
 */
export function computeEntrustmentDistribution(
  pairs: RevealedPairWithContext[],
): { level: number; count: number }[] {
  const counts = new Map<number, number>();
  for (let l = 1; l <= 5; l++) counts.set(l, 0);

  for (const pair of pairs) {
    const level = pair.supervisorEntrustment;
    counts.set(level, (counts.get(level) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([level, count]) => ({ level, count }))
    .sort((a, b) => a.level - b.level);
}

// ── Procedures with assessments ──────────────────────────────────────────────

/**
 * List procedures that have at least 1 revealed assessment.
 */
export function getProceduresWithAssessments(
  pairs: RevealedPairWithContext[],
): { code: string; name: string; count: number }[] {
  const map = new Map<string, { name: string; count: number }>();

  for (const pair of pairs) {
    if (!pair.procedureCode) continue;
    const existing = map.get(pair.procedureCode);
    if (existing) {
      existing.count += 1;
    } else {
      map.set(pair.procedureCode, {
        name: pair.procedureDisplayName || pair.procedureCode,
        count: 1,
      });
    }
  }

  return Array.from(map.entries())
    .map(([code, data]) => ({ code, name: data.name, count: data.count }))
    .sort((a, b) => b.count - a.count);
}
