/**
 * Phase 4 tests: getPathwayBadge
 *
 * Tests the per-lesion pathway badge logic used by MultiLesionEditor
 * headers in skin cancer multi-lesion mode.
 */

import { describe, it, expect } from "vitest";
import { getPathwayBadge } from "../skinCancerConfig";
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

// ── getPathwayBadge ───────────────────────────────────────────────────────

describe("getPathwayBadge", () => {
  it("returns null for undefined assessment", () => {
    expect(getPathwayBadge(undefined)).toBeNull();
  });

  it("returns null when no pathwayStage is set", () => {
    expect(getPathwayBadge({} as SkinCancerLesionAssessment)).toBeNull();
  });

  it('returns "Awaiting histo" for excision biopsy with no histology', () => {
    const badge = getPathwayBadge(makeAssessment());
    expect(badge).toEqual({
      label: "Awaiting histo",
      colorKey: "warning",
    });
  });

  it('returns "Awaiting histo" for excision biopsy with pending margin', () => {
    const badge = getPathwayBadge(
      makeAssessment({
        currentHistology: makeHistology({ marginStatus: "pending" }),
      }),
    );
    expect(badge).toEqual({
      label: "Awaiting histo",
      colorKey: "warning",
    });
  });

  it('returns "Margins clear" for excision biopsy with complete margins', () => {
    const badge = getPathwayBadge(
      makeAssessment({
        currentHistology: makeHistology({ marginStatus: "complete" }),
      }),
    );
    expect(badge).toEqual({
      label: "Margins clear",
      colorKey: "success",
    });
  });

  it('returns "Incomplete margins" for incomplete margin status', () => {
    const badge = getPathwayBadge(
      makeAssessment({
        currentHistology: makeHistology({ marginStatus: "incomplete" }),
      }),
    );
    expect(badge).toEqual({
      label: "Incomplete margins",
      colorKey: "error",
    });
  });

  it('returns "Incomplete margins" for close margin status', () => {
    const badge = getPathwayBadge(
      makeAssessment({
        currentHistology: makeHistology({ marginStatus: "close" }),
      }),
    );
    expect(badge).toEqual({
      label: "Incomplete margins",
      colorKey: "error",
    });
  });

  it('returns "Histology known" for histology_known without margin result', () => {
    const badge = getPathwayBadge(
      makeAssessment({
        pathwayStage: "histology_known",
        priorHistology: makeHistology({
          marginStatus: "pending",
          pathologyCategory: "melanoma",
        }),
      }),
    );
    // priorHistology has pending margin, and pathwayStage is definitive_excision
    // The logic checks currentHistology first (undefined), then priorHistology
    // priorHistology has pending margin → doesn't match complete/incomplete/close
    // Falls through to definitive_excision check
    expect(badge).toEqual({
      label: "Histology known",
      colorKey: "info",
    });
  });

  it('returns "Histology known" for histology_known pathway with pending margins', () => {
    const badge = getPathwayBadge(
      makeAssessment({
        pathwayStage: "histology_known",
        priorHistology: makeHistology({
          marginStatus: "pending",
          pathologyCategory: "scc",
        }),
      }),
    );
    expect(badge).toEqual({
      label: "Histology known",
      colorKey: "info",
    });
  });

  it('returns "Margins clear" for histology_known with complete margins (via currentHistology)', () => {
    const badge = getPathwayBadge(
      makeAssessment({
        pathwayStage: "histology_known",
        priorHistology: makeHistology({ pathologyCategory: "melanoma" }),
        currentHistology: makeHistology({ marginStatus: "complete" }),
      }),
    );
    expect(badge).toEqual({
      label: "Margins clear",
      colorKey: "success",
    });
  });

  it("prioritises currentHistology over priorHistology for margin status", () => {
    // currentHistology has incomplete margins, priorHistology has pending
    const badge = getPathwayBadge(
      makeAssessment({
        pathwayStage: "histology_known",
        currentHistology: makeHistology({ marginStatus: "incomplete" }),
        priorHistology: makeHistology({ marginStatus: "pending" }),
      }),
    );
    expect(badge).toEqual({
      label: "Incomplete margins",
      colorKey: "error",
    });
  });
});
