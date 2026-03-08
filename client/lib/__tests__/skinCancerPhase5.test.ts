/**
 * Phase 5 tests: Episode integration helpers
 *
 * Tests the pure logic functions used for auto-creating and
 * auto-resolving skin cancer pathway episodes.
 */

import { describe, it, expect } from "vitest";
import {
  buildSkinCancerEpisodeLinkPlan,
  buildSkinCancerEpisodeUpdatePlan,
  buildSkinCancerFollowUpAssessment,
  determineSkinCancerEpisodeAction,
} from "../skinCancerEpisodeHelpers";
import { getPathwayBadge } from "../skinCancerConfig";
import type { Case, DiagnosisGroup } from "../../types/case";
import type { TreatmentEpisode } from "../../types/episode";
import type {
  SkinCancerLesionAssessment,
  SkinCancerHistology,
} from "../../types/skinCancer";

// ── Helpers ───────────────────────────────────────────────────────────────

function makeHistology(
  overrides: Partial<SkinCancerHistology> = {},
): SkinCancerHistology {
  return {
    pathologyCategory: "bcc",
    source: "own_biopsy",
    marginStatus: "pending",
    ...overrides,
  };
}

function makeAssessment(
  overrides: Partial<SkinCancerLesionAssessment> = {},
): SkinCancerLesionAssessment {
  return {
    pathwayStage: "excision_biopsy",
    ...overrides,
  } as SkinCancerLesionAssessment;
}

function makeCase(groups: Partial<DiagnosisGroup>[]): Case {
  return {
    id: "test-case",
    patientIdentifier: "TEST001",
    procedureDate: "2026-03-08",
    facility: "Test Hospital",
    specialty: "skin_cancer",
    procedureType: "Excision",
    teamMembers: [],
    diagnosisGroups: groups.map((g, i) => ({
      id: `group-${i}`,
      sequenceOrder: i,
      specialty: "skin_cancer" as const,
      procedures: [],
      ...g,
    })),
    schemaVersion: 5,
    createdAt: "2026-03-08T00:00:00Z",
    updatedAt: "2026-03-08T00:00:00Z",
  } as Case;
}

function makeEpisode(
  overrides: Partial<TreatmentEpisode> = {},
): TreatmentEpisode {
  return {
    id: "episode-1",
    patientIdentifier: "TEST001",
    title: "Skin cancer pathway",
    primaryDiagnosisCode: "95324001",
    primaryDiagnosisDisplay: "Skin lesion (finding)",
    type: "cancer_pathway",
    specialty: "skin_cancer",
    status: "active",
    onsetDate: "2026-03-08",
    ownerId: "owner-1",
    createdAt: "2026-03-08T00:00:00Z",
    updatedAt: "2026-03-08T00:00:00Z",
    ...overrides,
  };
}

// ── determineSkinCancerEpisodeAction ──────────────────────────────────────

describe("determineSkinCancerEpisodeAction", () => {
  it('returns "none" when there are no skin cancer assessments', () => {
    const c = makeCase([{ procedures: [] }]);
    expect(determineSkinCancerEpisodeAction(c)).toBe("none");
  });

  it('returns "none" when case has no diagnosis groups', () => {
    const c = makeCase([]);
    expect(determineSkinCancerEpisodeAction(c)).toBe("none");
  });

  it('returns "resolve" when all margins are clear (single-lesion)', () => {
    const c = makeCase([
      {
        skinCancerAssessment: makeAssessment({
          currentHistology: makeHistology({ marginStatus: "complete" }),
        }),
      },
    ]);
    expect(determineSkinCancerEpisodeAction(c)).toBe("resolve");
  });

  it('returns "reexcision" when any margin is incomplete (single-lesion)', () => {
    const c = makeCase([
      {
        skinCancerAssessment: makeAssessment({
          currentHistology: makeHistology({ marginStatus: "incomplete" }),
        }),
      },
    ]);
    expect(determineSkinCancerEpisodeAction(c)).toBe("reexcision");
  });

  it('returns "reexcision" when any margin is close', () => {
    const c = makeCase([
      {
        skinCancerAssessment: makeAssessment({
          currentHistology: makeHistology({ marginStatus: "close" }),
        }),
      },
    ]);
    expect(determineSkinCancerEpisodeAction(c)).toBe("reexcision");
  });

  it('returns "none" when margins are still pending', () => {
    const c = makeCase([
      {
        skinCancerAssessment: makeAssessment({
          currentHistology: makeHistology({ marginStatus: "pending" }),
        }),
      },
    ]);
    expect(determineSkinCancerEpisodeAction(c)).toBe("none");
  });

  it('returns "none" when no histology is entered yet', () => {
    const c = makeCase([
      {
        skinCancerAssessment: makeAssessment({}),
      },
    ]);
    expect(determineSkinCancerEpisodeAction(c)).toBe("none");
  });

  it('returns "resolve" when all lesions clear in multi-lesion case', () => {
    const c = makeCase([
      {
        isMultiLesion: true,
        lesionInstances: [
          {
            id: "l1",
            site: "Nose",
            skinCancerAssessment: makeAssessment({
              currentHistology: makeHistology({ marginStatus: "complete" }),
            }),
          },
          {
            id: "l2",
            site: "Cheek",
            skinCancerAssessment: makeAssessment({
              currentHistology: makeHistology({ marginStatus: "complete" }),
            }),
          },
        ],
      },
    ]);
    expect(determineSkinCancerEpisodeAction(c)).toBe("resolve");
  });

  it('returns "reexcision" when any lesion has incomplete margins in multi-lesion', () => {
    const c = makeCase([
      {
        isMultiLesion: true,
        lesionInstances: [
          {
            id: "l1",
            site: "Nose",
            skinCancerAssessment: makeAssessment({
              currentHistology: makeHistology({ marginStatus: "complete" }),
            }),
          },
          {
            id: "l2",
            site: "Cheek",
            skinCancerAssessment: makeAssessment({
              currentHistology: makeHistology({ marginStatus: "incomplete" }),
            }),
          },
        ],
      },
    ]);
    expect(determineSkinCancerEpisodeAction(c)).toBe("reexcision");
  });

  it('returns "none" when mixed complete and pending margins', () => {
    const c = makeCase([
      {
        isMultiLesion: true,
        lesionInstances: [
          {
            id: "l1",
            site: "Nose",
            skinCancerAssessment: makeAssessment({
              currentHistology: makeHistology({ marginStatus: "complete" }),
            }),
          },
          {
            id: "l2",
            site: "Cheek",
            skinCancerAssessment: makeAssessment({
              currentHistology: makeHistology({ marginStatus: "pending" }),
            }),
          },
        ],
      },
    ]);
    // Not all clear (one pending), no incomplete → "none"
    expect(determineSkinCancerEpisodeAction(c)).toBe("none");
  });

  it("handles mixed single-lesion and multi-lesion assessments", () => {
    const c = makeCase([
      {
        skinCancerAssessment: makeAssessment({
          currentHistology: makeHistology({ marginStatus: "complete" }),
        }),
      },
      {
        isMultiLesion: true,
        lesionInstances: [
          {
            id: "l1",
            site: "Arm",
            skinCancerAssessment: makeAssessment({
              currentHistology: makeHistology({ marginStatus: "complete" }),
            }),
          },
        ],
      },
    ]);
    expect(determineSkinCancerEpisodeAction(c)).toBe("resolve");
  });
});

describe("buildSkinCancerEpisodeLinkPlan", () => {
  it("creates a new cancer pathway episode for pending biopsy lesions", () => {
    const caseData = makeCase([
      {
        skinCancerAssessment: makeAssessment({
          pathwayStage: "excision_biopsy",
          site: "Nose",
          clinicalSuspicion: "bcc",
        }),
      },
    ]);

    const plan = buildSkinCancerEpisodeLinkPlan(
      caseData,
      [],
      "2026-03-09T00:00:00Z",
      "episode-new",
    );

    expect(plan?.linkedEpisodeId).toBe("episode-new");
    expect(plan?.episodeToCreate?.pendingAction).toBe("awaiting_histology");
  });

  it("reuses an existing active cancer pathway episode when present", () => {
    const caseData = makeCase([
      {
        skinCancerAssessment: makeAssessment({
          pathwayStage: "excision_biopsy",
          clinicalSuspicion: "scc",
        }),
      },
    ]);

    const plan = buildSkinCancerEpisodeLinkPlan(
      caseData,
      [makeEpisode({ id: "episode-existing" })],
      "2026-03-09T00:00:00Z",
      "episode-new",
    );

    expect(plan?.linkedEpisodeId).toBe("episode-existing");
    expect(plan?.episodeToCreate).toBeUndefined();
  });
});

describe("buildSkinCancerEpisodeUpdatePlan", () => {
  it("marks the episode resolved when current-procedure margins are clear", () => {
    const update = buildSkinCancerEpisodeUpdatePlan(
      makeCase([
        {
          skinCancerAssessment: makeAssessment({
            pathwayStage: "excision_biopsy",
            currentHistology: makeHistology({
              pathologyCategory: "bcc",
              marginStatus: "complete",
            }),
          }),
        },
      ]),
      makeEpisode(),
      "2026-03-09T00:00:00Z",
    );

    expect(update?.status).toBe("completed");
    expect(update?.pendingAction).toBeUndefined();
  });

  it("marks the episode as awaiting re-excision for close margins", () => {
    const update = buildSkinCancerEpisodeUpdatePlan(
      makeCase([
        {
          skinCancerAssessment: makeAssessment({
            pathwayStage: "excision_biopsy",
            currentHistology: makeHistology({
              pathologyCategory: "bcc",
              marginStatus: "close",
            }),
          }),
        },
      ]),
      makeEpisode(),
      "2026-03-09T00:00:00Z",
    );

    expect(update?.pendingAction).toBe("awaiting_reexcision");
  });
});

describe("buildSkinCancerFollowUpAssessment", () => {
  it("promotes current histology into prior histology for follow-up cases", () => {
    const followUp = buildSkinCancerFollowUpAssessment(
      makeAssessment({
        pathwayStage: "excision_biopsy",
        biopsyType: "excision_biopsy",
        currentHistology: makeHistology({
          source: "current_procedure",
          pathologyCategory: "bcc",
          marginStatus: "incomplete",
        }),
      }),
    );

    expect(followUp?.pathwayStage).toBe("histology_known");
    expect(followUp?.currentHistology).toBeUndefined();
    expect(followUp?.priorHistology?.pathologyCategory).toBe("bcc");
    expect(followUp?.priorHistology?.source).toBe("own_biopsy");
    expect(followUp?.biopsyType).toBeUndefined();
  });
});

// ── getPathwayBadge priority ─────────────────────────────────────────────

describe("getPathwayBadge badge priority for CaseCard", () => {
  it("error badge takes priority over warning", () => {
    // error = incomplete, warning = awaiting histo
    const errorBadge = getPathwayBadge(
      makeAssessment({
        currentHistology: makeHistology({ marginStatus: "incomplete" }),
      }),
    );
    const warningBadge = getPathwayBadge(makeAssessment());

    expect(errorBadge?.colorKey).toBe("error");
    expect(warningBadge?.colorKey).toBe("warning");
  });

  it("warning badge takes priority over success", () => {
    const warningBadge = getPathwayBadge(makeAssessment());
    const successBadge = getPathwayBadge(
      makeAssessment({
        currentHistology: makeHistology({ marginStatus: "complete" }),
      }),
    );

    expect(warningBadge?.colorKey).toBe("warning");
    expect(successBadge?.colorKey).toBe("success");
  });
});
