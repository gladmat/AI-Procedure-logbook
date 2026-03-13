/**
 * Facial Injury Severity Scale (FISS) Auto-Calculator
 *
 * Sums fracture-specific points from selected diagnosis IDs.
 * Phase 2 fracture sub-type IDs (hn_dx_fx_mandible_body, etc.) are included
 * alongside current broad IDs (hn_dx_fx_mandible, etc.) for forward compat.
 *
 * Reference: Bagheri SC, et al. Application of a facial injury severity scale
 * in craniomaxillofacial trauma. J Oral Maxillofac Surg. 2006;64(3):408-414.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface FISSInput {
  fractures: string[]; // diagnosis IDs
  softTissueLacerationOver10cm: boolean;
}

export interface FISSResult {
  score: number;
  severity: "mild" | "moderate" | "severe";
}

// ─── Point values ────────────────────────────────────────────────────────────

/**
 * FISS point values keyed by diagnosis picklist ID.
 *
 * Phase 2 sub-type IDs are included even though those diagnoses don't exist yet;
 * unknown IDs simply contribute 0 points via the fallback in calculateFISS().
 * Current broad IDs are mapped to a representative midpoint value.
 */
export const FISS_POINTS: Record<string, number> = {
  // ── Phase 2 mandible sub-types ──
  hn_dx_fx_mandible_body: 2,
  hn_dx_fx_mandible_symphysis: 2,
  hn_dx_fx_mandible_parasymphysis: 2,
  hn_dx_fx_mandible_angle: 2,
  hn_dx_fx_mandible_ramus: 2,
  hn_dx_fx_mandible_condyle: 2,
  hn_dx_fx_mandible_dentoalveolar: 1,

  // ── Phase 2 orbital sub-types ──
  hn_dx_fx_orbital_floor: 1,
  hn_dx_fx_orbital_medial_wall: 1,

  // ── Phase 2 frontal sinus sub-types ──
  hn_dx_fx_frontal_sinus_nondisplaced: 1,
  hn_dx_fx_frontal_sinus_displaced: 5,

  // ── Phase 2 Le Fort sub-types ──
  hn_dx_fx_lefort_1: 2,
  hn_dx_fx_lefort_2: 4,
  hn_dx_fx_lefort_3: 6,

  // ── Shared (exist now and in Phase 2) ──
  hn_dx_fx_zygoma: 1,
  hn_dx_fx_nasal: 1,
  hn_dx_fx_noe: 3,
  hn_dx_fx_palatal: 2,

  // ── Current broad IDs (Phase 1 backward compat) ──
  hn_dx_fx_mandible: 2, // broad mandible → body-equivalent
  hn_dx_fx_lefort: 4, // broad Le Fort → midpoint (Le Fort II)
  hn_dx_fx_frontal_sinus: 3, // broad frontal → midpoint
  hn_dx_fx_panfacial: 6, // panfacial → high severity
};

// ─── Calculator ──────────────────────────────────────────────────────────────

/**
 * Calculate the Facial Injury Severity Scale score from fracture selections.
 *
 * - Sums points for each recognised fracture ID (unknown IDs → 0).
 * - Adds +1 for soft tissue laceration >10 cm.
 * - Derives severity: mild (0–4), moderate (5–7), severe (≥8).
 */
export function calculateFISS(input: FISSInput): FISSResult {
  let score = input.fractures.reduce(
    (sum, id) => sum + (FISS_POINTS[id] ?? 0),
    0,
  );

  if (input.softTissueLacerationOver10cm) {
    score += 1;
  }

  let severity: FISSResult["severity"];
  if (score >= 8) {
    severity = "severe";
  } else if (score >= 5) {
    severity = "moderate";
  } else {
    severity = "mild";
  }

  return { score, severity };
}
