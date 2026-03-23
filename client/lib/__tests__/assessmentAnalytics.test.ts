import { describe, it, expect } from "vitest";
import {
  computeLearningCurves,
  computeLearningCurveForProcedure,
  computeTeachingAggregate,
  computeCalibrationScore,
  computeTrainingOverview,
  computeEntrustmentDistribution,
  getProceduresWithAssessments,
} from "@/lib/assessmentAnalytics";
import type { RevealedPairWithContext } from "@/lib/assessmentStorage";
import type { EntrustmentLevel, TeachingQualityLevel } from "@/types/sharing";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makePair(
  overrides: Partial<RevealedPairWithContext> = {},
): RevealedPairWithContext {
  return {
    supervisorEntrustment: 3 as EntrustmentLevel,
    traineeSelfEntrustment: 3 as EntrustmentLevel,
    teachingQuality: 4 as TeachingQualityLevel,
    revealedAt: "2026-03-20T10:00:00Z",
    procedureCode: "SNOMED-001",
    procedureDisplayName: "Test Procedure",
    sharedCaseId: "case-1",
    ...overrides,
  };
}

function makePairs(
  count: number,
  template: Partial<RevealedPairWithContext> = {},
): RevealedPairWithContext[] {
  return Array.from({ length: count }, (_, i) =>
    makePair({
      sharedCaseId: `case-${i}`,
      revealedAt: `2026-03-${String(i + 1).padStart(2, "0")}T10:00:00Z`,
      ...template,
    }),
  );
}

// ── computeLearningCurves ────────────────────────────────────────────────────

describe("computeLearningCurves", () => {
  it("returns empty array for no pairs", () => {
    expect(computeLearningCurves([])).toEqual([]);
  });

  it("groups by procedureCode", () => {
    const pairs = [
      makePair({ procedureCode: "A", sharedCaseId: "c1" }),
      makePair({ procedureCode: "B", sharedCaseId: "c2" }),
      makePair({
        procedureCode: "A",
        sharedCaseId: "c3",
        revealedAt: "2026-03-21T10:00:00Z",
      }),
    ];
    const curves = computeLearningCurves(pairs);
    expect(curves).toHaveLength(2);
    expect(curves[0]!.procedureCode).toBe("A");
    expect(curves[0]!.totalCases).toBe(2);
    expect(curves[1]!.procedureCode).toBe("B");
    expect(curves[1]!.totalCases).toBe(1);
  });

  it("sorts points by date ascending", () => {
    const pairs = [
      makePair({
        procedureCode: "A",
        sharedCaseId: "c1",
        revealedAt: "2026-03-15T10:00:00Z",
      }),
      makePair({
        procedureCode: "A",
        sharedCaseId: "c2",
        revealedAt: "2026-03-10T10:00:00Z",
      }),
      makePair({
        procedureCode: "A",
        sharedCaseId: "c3",
        revealedAt: "2026-03-20T10:00:00Z",
      }),
    ];
    const curves = computeLearningCurves(pairs);
    const points = curves[0]!.points;
    expect(points[0]!.date).toBe("2026-03-10T10:00:00Z");
    expect(points[1]!.date).toBe("2026-03-15T10:00:00Z");
    expect(points[2]!.date).toBe("2026-03-20T10:00:00Z");
  });

  it("assigns sequential case numbers starting at 1", () => {
    const pairs = [
      makePair({
        procedureCode: "A",
        sharedCaseId: "c1",
        revealedAt: "2026-03-01T10:00:00Z",
      }),
      makePair({
        procedureCode: "A",
        sharedCaseId: "c2",
        revealedAt: "2026-03-02T10:00:00Z",
      }),
      makePair({
        procedureCode: "A",
        sharedCaseId: "c3",
        revealedAt: "2026-03-03T10:00:00Z",
      }),
    ];
    const curves = computeLearningCurves(pairs);
    const points = curves[0]!.points;
    expect(points[0]!.caseNumber).toBe(1);
    expect(points[1]!.caseNumber).toBe(2);
    expect(points[2]!.caseNumber).toBe(3);
  });

  it("sets latestRating from most recent point", () => {
    const pairs = [
      makePair({
        procedureCode: "A",
        sharedCaseId: "c1",
        revealedAt: "2026-03-01T10:00:00Z",
        supervisorEntrustment: 2 as EntrustmentLevel,
      }),
      makePair({
        procedureCode: "A",
        sharedCaseId: "c2",
        revealedAt: "2026-03-10T10:00:00Z",
        supervisorEntrustment: 4 as EntrustmentLevel,
      }),
    ];
    const curves = computeLearningCurves(pairs);
    expect(curves[0]!.latestRating).toBe(4);
  });

  it("sorts curves by totalCases descending", () => {
    const pairs = [
      makePair({ procedureCode: "B", sharedCaseId: "c1" }),
      makePair({ procedureCode: "A", sharedCaseId: "c2" }),
      makePair({
        procedureCode: "A",
        sharedCaseId: "c3",
        revealedAt: "2026-03-21T10:00:00Z",
      }),
      makePair({
        procedureCode: "A",
        sharedCaseId: "c4",
        revealedAt: "2026-03-22T10:00:00Z",
      }),
    ];
    const curves = computeLearningCurves(pairs);
    expect(curves[0]!.procedureCode).toBe("A");
    expect(curves[0]!.totalCases).toBe(3);
    expect(curves[1]!.procedureCode).toBe("B");
  });

  it("skips pairs without procedureCode", () => {
    const pairs = [
      makePair({ procedureCode: "", sharedCaseId: "c1" }),
      makePair({ procedureCode: "A", sharedCaseId: "c2" }),
    ];
    const curves = computeLearningCurves(pairs);
    expect(curves).toHaveLength(1);
    expect(curves[0]!.procedureCode).toBe("A");
  });

  it("preserves caseComplexity on points", () => {
    const pairs = [
      makePair({
        procedureCode: "A",
        sharedCaseId: "c1",
        caseComplexity: "complex",
      }),
    ];
    const curves = computeLearningCurves(pairs);
    expect(curves[0]!.points[0]!.caseComplexity).toBe("complex");
  });
});

// ── computeLearningCurveForProcedure ─────────────────────────────────────────

describe("computeLearningCurveForProcedure", () => {
  it("returns null for nonexistent procedure", () => {
    const pairs = [makePair({ procedureCode: "A" })];
    expect(computeLearningCurveForProcedure(pairs, "B")).toBeNull();
  });

  it("returns curve for matching procedure", () => {
    const pairs = [
      makePair({ procedureCode: "A", sharedCaseId: "c1" }),
      makePair({ procedureCode: "B", sharedCaseId: "c2" }),
    ];
    const curve = computeLearningCurveForProcedure(pairs, "A");
    expect(curve).not.toBeNull();
    expect(curve!.procedureCode).toBe("A");
    expect(curve!.totalCases).toBe(1);
  });
});

// ── computeTeachingAggregate ─────────────────────────────────────────────────

describe("computeTeachingAggregate", () => {
  it("returns null for empty pairs", () => {
    expect(computeTeachingAggregate([])).toBeNull();
  });

  it("returns null when fewer than 5 assessments", () => {
    const pairs = makePairs(4);
    expect(computeTeachingAggregate(pairs)).toBeNull();
  });

  it("returns null when fewer than 3 unique sharedCaseIds", () => {
    // 5 pairs but only 2 unique sharedCaseIds
    const pairs = [
      makePair({ sharedCaseId: "c1", revealedAt: "2026-03-01T10:00:00Z" }),
      makePair({ sharedCaseId: "c1", revealedAt: "2026-03-02T10:00:00Z" }),
      makePair({ sharedCaseId: "c1", revealedAt: "2026-03-03T10:00:00Z" }),
      makePair({ sharedCaseId: "c2", revealedAt: "2026-03-04T10:00:00Z" }),
      makePair({ sharedCaseId: "c2", revealedAt: "2026-03-05T10:00:00Z" }),
    ];
    expect(computeTeachingAggregate(pairs)).toBeNull();
  });

  it("returns aggregate when threshold met", () => {
    const pairs = makePairs(5, { teachingQuality: 4 as TeachingQualityLevel });
    const result = computeTeachingAggregate(pairs);
    expect(result).not.toBeNull();
    expect(result!.meetsThreshold).toBe(true);
    expect(result!.overallAverage).toBe(4);
    expect(result!.totalAssessments).toBe(5);
    expect(result!.uniqueTrainees).toBe(5);
  });

  it("computes correct average", () => {
    const pairs = [
      makePair({
        sharedCaseId: "c1",
        teachingQuality: 3 as TeachingQualityLevel,
        revealedAt: "2026-03-01T10:00:00Z",
      }),
      makePair({
        sharedCaseId: "c2",
        teachingQuality: 5 as TeachingQualityLevel,
        revealedAt: "2026-03-02T10:00:00Z",
      }),
      makePair({
        sharedCaseId: "c3",
        teachingQuality: 4 as TeachingQualityLevel,
        revealedAt: "2026-03-03T10:00:00Z",
      }),
      makePair({
        sharedCaseId: "c4",
        teachingQuality: 4 as TeachingQualityLevel,
        revealedAt: "2026-03-04T10:00:00Z",
      }),
      makePair({
        sharedCaseId: "c5",
        teachingQuality: 4 as TeachingQualityLevel,
        revealedAt: "2026-03-05T10:00:00Z",
      }),
    ];
    const result = computeTeachingAggregate(pairs);
    expect(result).not.toBeNull();
    // (3+5+4+4+4)/5 = 4.0
    expect(result!.overallAverage).toBe(4);
  });

  it("groups by procedure", () => {
    const pairs = [
      makePair({
        sharedCaseId: "c1",
        procedureCode: "A",
        teachingQuality: 3 as TeachingQualityLevel,
        revealedAt: "2026-03-01T10:00:00Z",
      }),
      makePair({
        sharedCaseId: "c2",
        procedureCode: "A",
        teachingQuality: 5 as TeachingQualityLevel,
        revealedAt: "2026-03-02T10:00:00Z",
      }),
      makePair({
        sharedCaseId: "c3",
        procedureCode: "B",
        teachingQuality: 4 as TeachingQualityLevel,
        revealedAt: "2026-03-03T10:00:00Z",
      }),
      makePair({
        sharedCaseId: "c4",
        procedureCode: "B",
        teachingQuality: 4 as TeachingQualityLevel,
        revealedAt: "2026-03-04T10:00:00Z",
      }),
      makePair({
        sharedCaseId: "c5",
        procedureCode: "B",
        teachingQuality: 4 as TeachingQualityLevel,
        revealedAt: "2026-03-05T10:00:00Z",
      }),
    ];
    const result = computeTeachingAggregate(pairs);
    expect(result!.byProcedure).toHaveLength(2);
    // B has 3 entries, A has 2 — sorted by count desc
    expect(result!.byProcedure[0]!.procedureCode).toBe("B");
    expect(result!.byProcedure[0]!.count).toBe(3);
    expect(result!.byProcedure[1]!.procedureCode).toBe("A");
  });

  it("computes monthly trend", () => {
    const pairs = [
      makePair({
        sharedCaseId: "c1",
        teachingQuality: 3 as TeachingQualityLevel,
        revealedAt: "2026-02-15T10:00:00Z",
      }),
      makePair({
        sharedCaseId: "c2",
        teachingQuality: 4 as TeachingQualityLevel,
        revealedAt: "2026-02-20T10:00:00Z",
      }),
      makePair({
        sharedCaseId: "c3",
        teachingQuality: 5 as TeachingQualityLevel,
        revealedAt: "2026-03-01T10:00:00Z",
      }),
      makePair({
        sharedCaseId: "c4",
        teachingQuality: 5 as TeachingQualityLevel,
        revealedAt: "2026-03-10T10:00:00Z",
      }),
      makePair({
        sharedCaseId: "c5",
        teachingQuality: 4 as TeachingQualityLevel,
        revealedAt: "2026-03-15T10:00:00Z",
      }),
    ];
    const result = computeTeachingAggregate(pairs);
    expect(result!.trend).toHaveLength(2);
    expect(result!.trend[0]!.month).toBe("2026-02");
    expect(result!.trend[0]!.averageRating).toBe(3.5);
    expect(result!.trend[1]!.month).toBe("2026-03");
  });
});

// ── computeCalibrationScore ──────────────────────────────────────────────────

describe("computeCalibrationScore", () => {
  it("returns null for fewer than 3 pairs", () => {
    expect(computeCalibrationScore(makePairs(2))).toBeNull();
  });

  it("returns null for empty pairs", () => {
    expect(computeCalibrationScore([])).toBeNull();
  });

  it("computes correct mean absolute gap", () => {
    const pairs = [
      makePair({
        sharedCaseId: "c1",
        supervisorEntrustment: 4 as EntrustmentLevel,
        traineeSelfEntrustment: 3 as EntrustmentLevel,
        revealedAt: "2026-03-01T10:00:00Z",
      }),
      makePair({
        sharedCaseId: "c2",
        supervisorEntrustment: 3 as EntrustmentLevel,
        traineeSelfEntrustment: 3 as EntrustmentLevel,
        revealedAt: "2026-03-02T10:00:00Z",
      }),
      makePair({
        sharedCaseId: "c3",
        supervisorEntrustment: 5 as EntrustmentLevel,
        traineeSelfEntrustment: 3 as EntrustmentLevel,
        revealedAt: "2026-03-03T10:00:00Z",
      }),
    ];
    const result = computeCalibrationScore(pairs);
    expect(result).not.toBeNull();
    // |4-3| + |3-3| + |5-3| = 1 + 0 + 2 = 3, mean = 1.0
    expect(result!.overallMeanGap).toBe(1);
  });

  it("classifies excellent (< 0.5)", () => {
    const pairs = [
      makePair({
        sharedCaseId: "c1",
        supervisorEntrustment: 3 as EntrustmentLevel,
        traineeSelfEntrustment: 3 as EntrustmentLevel,
        revealedAt: "2026-03-01T10:00:00Z",
      }),
      makePair({
        sharedCaseId: "c2",
        supervisorEntrustment: 4 as EntrustmentLevel,
        traineeSelfEntrustment: 4 as EntrustmentLevel,
        revealedAt: "2026-03-02T10:00:00Z",
      }),
      makePair({
        sharedCaseId: "c3",
        supervisorEntrustment: 3 as EntrustmentLevel,
        traineeSelfEntrustment: 3 as EntrustmentLevel,
        revealedAt: "2026-03-03T10:00:00Z",
      }),
    ];
    const result = computeCalibrationScore(pairs);
    expect(result!.interpretation).toBe("excellent");
  });

  it("classifies good (0.5–1.0)", () => {
    const pairs = [
      makePair({
        sharedCaseId: "c1",
        supervisorEntrustment: 4 as EntrustmentLevel,
        traineeSelfEntrustment: 3 as EntrustmentLevel,
        revealedAt: "2026-03-01T10:00:00Z",
      }),
      makePair({
        sharedCaseId: "c2",
        supervisorEntrustment: 3 as EntrustmentLevel,
        traineeSelfEntrustment: 3 as EntrustmentLevel,
        revealedAt: "2026-03-02T10:00:00Z",
      }),
      makePair({
        sharedCaseId: "c3",
        supervisorEntrustment: 4 as EntrustmentLevel,
        traineeSelfEntrustment: 3 as EntrustmentLevel,
        revealedAt: "2026-03-03T10:00:00Z",
      }),
    ];
    const result = computeCalibrationScore(pairs);
    // |1| + |0| + |1| = 2, mean = 0.67
    expect(result!.interpretation).toBe("good");
  });

  it("classifies needs_attention (> 1.0)", () => {
    const pairs = [
      makePair({
        sharedCaseId: "c1",
        supervisorEntrustment: 5 as EntrustmentLevel,
        traineeSelfEntrustment: 2 as EntrustmentLevel,
        revealedAt: "2026-03-01T10:00:00Z",
      }),
      makePair({
        sharedCaseId: "c2",
        supervisorEntrustment: 4 as EntrustmentLevel,
        traineeSelfEntrustment: 2 as EntrustmentLevel,
        revealedAt: "2026-03-02T10:00:00Z",
      }),
      makePair({
        sharedCaseId: "c3",
        supervisorEntrustment: 5 as EntrustmentLevel,
        traineeSelfEntrustment: 1 as EntrustmentLevel,
        revealedAt: "2026-03-03T10:00:00Z",
      }),
    ];
    const result = computeCalibrationScore(pairs);
    // |3| + |2| + |4| = 9, mean = 3.0
    expect(result!.interpretation).toBe("needs_attention");
  });

  it("detects under_estimates direction (trainee rates lower than supervisor)", () => {
    const pairs = [
      makePair({
        sharedCaseId: "c1",
        supervisorEntrustment: 4 as EntrustmentLevel,
        traineeSelfEntrustment: 2 as EntrustmentLevel,
        revealedAt: "2026-03-01T10:00:00Z",
      }),
      makePair({
        sharedCaseId: "c2",
        supervisorEntrustment: 5 as EntrustmentLevel,
        traineeSelfEntrustment: 3 as EntrustmentLevel,
        revealedAt: "2026-03-02T10:00:00Z",
      }),
      makePair({
        sharedCaseId: "c3",
        supervisorEntrustment: 4 as EntrustmentLevel,
        traineeSelfEntrustment: 3 as EntrustmentLevel,
        revealedAt: "2026-03-03T10:00:00Z",
      }),
    ];
    const result = computeCalibrationScore(pairs);
    // Signed mean: (2 + 2 + 1)/3 = 1.67 > 0 → trainee under-estimates
    expect(result!.direction).toBe("under_estimates");
  });

  it("detects over_estimates direction (trainee rates higher than supervisor)", () => {
    const pairs = [
      makePair({
        sharedCaseId: "c1",
        supervisorEntrustment: 2 as EntrustmentLevel,
        traineeSelfEntrustment: 4 as EntrustmentLevel,
        revealedAt: "2026-03-01T10:00:00Z",
      }),
      makePair({
        sharedCaseId: "c2",
        supervisorEntrustment: 3 as EntrustmentLevel,
        traineeSelfEntrustment: 5 as EntrustmentLevel,
        revealedAt: "2026-03-02T10:00:00Z",
      }),
      makePair({
        sharedCaseId: "c3",
        supervisorEntrustment: 2 as EntrustmentLevel,
        traineeSelfEntrustment: 4 as EntrustmentLevel,
        revealedAt: "2026-03-03T10:00:00Z",
      }),
    ];
    const result = computeCalibrationScore(pairs);
    expect(result!.direction).toBe("over_estimates");
  });

  it("detects balanced direction", () => {
    const pairs = [
      makePair({
        sharedCaseId: "c1",
        supervisorEntrustment: 3 as EntrustmentLevel,
        traineeSelfEntrustment: 3 as EntrustmentLevel,
        revealedAt: "2026-03-01T10:00:00Z",
      }),
      makePair({
        sharedCaseId: "c2",
        supervisorEntrustment: 4 as EntrustmentLevel,
        traineeSelfEntrustment: 4 as EntrustmentLevel,
        revealedAt: "2026-03-02T10:00:00Z",
      }),
      makePair({
        sharedCaseId: "c3",
        supervisorEntrustment: 3 as EntrustmentLevel,
        traineeSelfEntrustment: 3 as EntrustmentLevel,
        revealedAt: "2026-03-03T10:00:00Z",
      }),
    ];
    const result = computeCalibrationScore(pairs);
    expect(result!.direction).toBe("balanced");
  });

  it("computes monthly trend", () => {
    const pairs = [
      makePair({
        sharedCaseId: "c1",
        supervisorEntrustment: 4 as EntrustmentLevel,
        traineeSelfEntrustment: 3 as EntrustmentLevel,
        revealedAt: "2026-02-15T10:00:00Z",
      }),
      makePair({
        sharedCaseId: "c2",
        supervisorEntrustment: 3 as EntrustmentLevel,
        traineeSelfEntrustment: 3 as EntrustmentLevel,
        revealedAt: "2026-03-01T10:00:00Z",
      }),
      makePair({
        sharedCaseId: "c3",
        supervisorEntrustment: 4 as EntrustmentLevel,
        traineeSelfEntrustment: 4 as EntrustmentLevel,
        revealedAt: "2026-03-10T10:00:00Z",
      }),
    ];
    const result = computeCalibrationScore(pairs);
    expect(result!.monthlyTrend).toHaveLength(2);
    expect(result!.monthlyTrend[0]!.month).toBe("2026-02");
    expect(result!.monthlyTrend[0]!.meanGap).toBe(1); // |4-3| = 1
    expect(result!.monthlyTrend[1]!.month).toBe("2026-03");
    expect(result!.monthlyTrend[1]!.meanGap).toBe(0); // (|0| + |0|)/2 = 0
  });
});

// ── computeTrainingOverview ──────────────────────────────────────────────────

describe("computeTrainingOverview", () => {
  it("returns zeros for empty pairs", () => {
    const result = computeTrainingOverview([]);
    expect(result.totalAssessments).toBe(0);
    expect(result.proceduresAssessed).toBe(0);
    expect(result.uniqueCounterparts).toBe(0);
    expect(result.averageSupervisorRating).toBe(0);
    expect(result.averageSelfRating).toBe(0);
  });

  it("computes correct counts", () => {
    const pairs = [
      makePair({
        sharedCaseId: "c1",
        procedureCode: "A",
        supervisorEntrustment: 4 as EntrustmentLevel,
        traineeSelfEntrustment: 3 as EntrustmentLevel,
      }),
      makePair({
        sharedCaseId: "c2",
        procedureCode: "B",
        supervisorEntrustment: 3 as EntrustmentLevel,
        traineeSelfEntrustment: 4 as EntrustmentLevel,
      }),
      makePair({
        sharedCaseId: "c3",
        procedureCode: "A",
        supervisorEntrustment: 5 as EntrustmentLevel,
        traineeSelfEntrustment: 5 as EntrustmentLevel,
      }),
    ];
    const result = computeTrainingOverview(pairs);
    expect(result.totalAssessments).toBe(3);
    expect(result.proceduresAssessed).toBe(2); // A and B
    expect(result.uniqueCounterparts).toBe(3); // 3 distinct sharedCaseIds
    expect(result.averageSupervisorRating).toBe(4); // (4+3+5)/3 = 4.0
    expect(result.averageSelfRating).toBe(4); // (3+4+5)/3 = 4.0
  });
});

// ── computeEntrustmentDistribution ───────────────────────────────────────────

describe("computeEntrustmentDistribution", () => {
  it("returns all 5 levels with zeros for empty pairs", () => {
    const result = computeEntrustmentDistribution([]);
    expect(result).toHaveLength(5);
    expect(result.every((d) => d.count === 0)).toBe(true);
  });

  it("counts correctly at each level", () => {
    const pairs = [
      makePair({
        supervisorEntrustment: 3 as EntrustmentLevel,
        sharedCaseId: "c1",
      }),
      makePair({
        supervisorEntrustment: 3 as EntrustmentLevel,
        sharedCaseId: "c2",
      }),
      makePair({
        supervisorEntrustment: 5 as EntrustmentLevel,
        sharedCaseId: "c3",
      }),
      makePair({
        supervisorEntrustment: 1 as EntrustmentLevel,
        sharedCaseId: "c4",
      }),
    ];
    const result = computeEntrustmentDistribution(pairs);
    expect(result.find((d) => d.level === 1)!.count).toBe(1);
    expect(result.find((d) => d.level === 2)!.count).toBe(0);
    expect(result.find((d) => d.level === 3)!.count).toBe(2);
    expect(result.find((d) => d.level === 4)!.count).toBe(0);
    expect(result.find((d) => d.level === 5)!.count).toBe(1);
  });

  it("sorts by level ascending", () => {
    const result = computeEntrustmentDistribution(makePairs(3));
    expect(result[0]!.level).toBe(1);
    expect(result[4]!.level).toBe(5);
  });
});

// ── getProceduresWithAssessments ─────────────────────────────────────────────

describe("getProceduresWithAssessments", () => {
  it("returns empty for no pairs", () => {
    expect(getProceduresWithAssessments([])).toEqual([]);
  });

  it("groups procedures and counts correctly", () => {
    const pairs = [
      makePair({
        procedureCode: "A",
        procedureDisplayName: "Proc A",
        sharedCaseId: "c1",
      }),
      makePair({
        procedureCode: "A",
        procedureDisplayName: "Proc A",
        sharedCaseId: "c2",
      }),
      makePair({
        procedureCode: "B",
        procedureDisplayName: "Proc B",
        sharedCaseId: "c3",
      }),
    ];
    const result = getProceduresWithAssessments(pairs);
    expect(result).toHaveLength(2);
    expect(result[0]!.code).toBe("A");
    expect(result[0]!.count).toBe(2);
    expect(result[1]!.code).toBe("B");
    expect(result[1]!.count).toBe(1);
  });

  it("sorts by count descending", () => {
    const pairs = [
      makePair({ procedureCode: "B", sharedCaseId: "c1" }),
      makePair({ procedureCode: "A", sharedCaseId: "c2" }),
      makePair({ procedureCode: "A", sharedCaseId: "c3" }),
      makePair({ procedureCode: "A", sharedCaseId: "c4" }),
    ];
    const result = getProceduresWithAssessments(pairs);
    expect(result[0]!.code).toBe("A");
    expect(result[0]!.count).toBe(3);
  });

  it("skips pairs without procedureCode", () => {
    const pairs = [
      makePair({ procedureCode: "", sharedCaseId: "c1" }),
      makePair({ procedureCode: "A", sharedCaseId: "c2" }),
    ];
    const result = getProceduresWithAssessments(pairs);
    expect(result).toHaveLength(1);
  });
});
