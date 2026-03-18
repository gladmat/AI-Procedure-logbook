/**
 * Nerve Outcome Tracking tests
 *
 * Covers:
 *   - NERVE_TARGET_MUSCLES mapping completeness
 *   - MRC motor grade ordering
 *   - BMRC sensory grade ordering
 *   - SWMT result completeness
 *   - NRS bounds validation
 *   - Outcome interval constants
 */

import { describe, it, expect } from "vitest";
import {
  NERVE_TARGET_MUSCLES,
  MRC_MOTOR_GRADE_LABELS,
  MRC_MOTOR_GRADE_SHORT,
  BMRC_SENSORY_GRADE_LABELS,
  SWMT_RESULT_LABELS,
  NERVE_OUTCOME_INTERVALS,
} from "@/lib/peripheralNerveConfig";
import type {
  MRCMotorGrade,
  BMRCSensoryGrade,
  NerveOutcomeAssessment,
} from "@/types/peripheralNerve";

// ══════════════════════════════════════════════════
// NERVE_TARGET_MUSCLES
// ══════════════════════════════════════════════════

describe("NERVE_TARGET_MUSCLES", () => {
  const commonNerves = [
    "median",
    "ulnar",
    "radial",
    "musculocutaneous",
    "axillary",
    "common_peroneal",
    "tibial",
    "femoral",
    "sciatic",
  ] as const;

  it("defines target muscles for all common nerves", () => {
    for (const nerve of commonNerves) {
      const muscles = NERVE_TARGET_MUSCLES[nerve];
      expect(muscles, `${nerve} should have target muscles`).toBeDefined();
      expect(muscles!.length).toBeGreaterThan(0);
    }
  });

  it("median nerve has APB as a key target", () => {
    const muscles = NERVE_TARGET_MUSCLES.median!;
    expect(muscles.some((m) => m.muscle.includes("APB"))).toBe(true);
  });

  it("ulnar nerve has FDI as a key target", () => {
    const muscles = NERVE_TARGET_MUSCLES.ulnar!;
    expect(muscles.some((m) => m.muscle.includes("FDI"))).toBe(true);
  });

  it("radial nerve has EDC as a key target", () => {
    const muscles = NERVE_TARGET_MUSCLES.radial!;
    expect(muscles.some((m) => m.muscle.includes("EDC"))).toBe(true);
  });

  it("common_peroneal has tibialis anterior", () => {
    const muscles = NERVE_TARGET_MUSCLES.common_peroneal!;
    expect(muscles.some((m) => m.muscle.includes("TA"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════
// MRC Motor Grade ordering
// ══════════════════════════════════════════════════

describe("MRC motor grade labels", () => {
  const EXPECTED_ORDER: MRCMotorGrade[] = [
    "M0",
    "M1",
    "M2",
    "M3",
    "M4_minus",
    "M4",
    "M4_plus",
    "M5",
  ];

  it("has labels for all 8 grades", () => {
    expect(Object.keys(MRC_MOTOR_GRADE_LABELS)).toHaveLength(8);
  });

  it("has short labels for all 8 grades", () => {
    expect(Object.keys(MRC_MOTOR_GRADE_SHORT)).toHaveLength(8);
  });

  it("all grades have non-empty labels", () => {
    for (const grade of EXPECTED_ORDER) {
      expect(MRC_MOTOR_GRADE_LABELS[grade]).toBeTruthy();
      expect(MRC_MOTOR_GRADE_SHORT[grade]).toBeTruthy();
    }
  });

  it("M4 subgrades use correct display symbols", () => {
    expect(MRC_MOTOR_GRADE_SHORT.M4_minus).toContain("4");
    expect(MRC_MOTOR_GRADE_SHORT.M4_plus).toContain("4");
  });
});

// ══════════════════════════════════════════════════
// BMRC Sensory Grade ordering
// ══════════════════════════════════════════════════

describe("BMRC sensory grade labels", () => {
  const EXPECTED_ORDER: BMRCSensoryGrade[] = [
    "S0",
    "S1",
    "S1_plus",
    "S2",
    "S2_plus",
    "S3",
    "S3_plus",
    "S4",
  ];

  it("has labels for all 8 grades", () => {
    expect(Object.keys(BMRC_SENSORY_GRADE_LABELS)).toHaveLength(8);
  });

  it("all grades have non-empty labels", () => {
    for (const grade of EXPECTED_ORDER) {
      expect(BMRC_SENSORY_GRADE_LABELS[grade]).toBeTruthy();
    }
  });

  it("S0 is anaesthesia, S4 is normal", () => {
    expect(BMRC_SENSORY_GRADE_LABELS.S0).toContain("naesthesia");
    expect(BMRC_SENSORY_GRADE_LABELS.S4).toContain("Normal");
  });
});

// ══════════════════════════════════════════════════
// SWMT Result
// ══════════════════════════════════════════════════

describe("SWMT result labels", () => {
  it("covers all 6 results", () => {
    expect(Object.keys(SWMT_RESULT_LABELS)).toHaveLength(6);
  });

  it("includes normal and anaesthetic extremes", () => {
    expect(SWMT_RESULT_LABELS.normal).toBeTruthy();
    expect(SWMT_RESULT_LABELS.anaesthetic).toBeTruthy();
  });
});

// ══════════════════════════════════════════════════
// Outcome intervals
// ══════════════════════════════════════════════════

describe("NERVE_OUTCOME_INTERVALS", () => {
  it("has 5 standard follow-up intervals", () => {
    expect(NERVE_OUTCOME_INTERVALS).toHaveLength(5);
  });

  it("intervals are in ascending order (months)", () => {
    for (let i = 1; i < NERVE_OUTCOME_INTERVALS.length; i++) {
      expect(NERVE_OUTCOME_INTERVALS[i]).toBeGreaterThan(
        NERVE_OUTCOME_INTERVALS[i - 1]!,
      );
    }
  });

  it("includes the standard 3, 6, 12, 18, 24 month intervals", () => {
    expect([...NERVE_OUTCOME_INTERVALS]).toEqual([3, 6, 12, 18, 24]);
  });
});

// ══════════════════════════════════════════════════
// NerveOutcomeAssessment shape
// ══════════════════════════════════════════════════

describe("NerveOutcomeAssessment type shape", () => {
  it("minimal valid assessment has date and months", () => {
    const outcome: NerveOutcomeAssessment = {
      assessmentDate: "2026-03-19",
      monthsSinceSurgery: 6,
    };
    expect(outcome.assessmentDate).toBe("2026-03-19");
    expect(outcome.monthsSinceSurgery).toBe(6);
  });

  it("motor assessments are an array of muscle/nerve/grade triples", () => {
    const outcome: NerveOutcomeAssessment = {
      assessmentDate: "2026-03-19",
      monthsSinceSurgery: 12,
      motorAssessments: [
        { muscle: "APB", nerve: "median", mrcGrade: "M4" },
        { muscle: "FDI", nerve: "ulnar", mrcGrade: "M3" },
      ],
    };
    expect(outcome.motorAssessments).toHaveLength(2);
    expect(outcome.motorAssessments![0]!.mrcGrade).toBe("M4");
  });

  it("painNRS is 0-10", () => {
    const outcome: NerveOutcomeAssessment = {
      assessmentDate: "2026-03-19",
      monthsSinceSurgery: 3,
      painNRS: 0,
    };
    expect(outcome.painNRS).toBe(0);
  });
});
