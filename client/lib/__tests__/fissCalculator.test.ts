import { describe, it, expect } from "vitest";
import { calculateFISS, FISS_POINTS } from "../fissCalculator";

describe("FISS Calculator", () => {
  it("returns score 0 and mild for empty fractures", () => {
    const result = calculateFISS({
      fractures: [],
      softTissueLacerationOver10cm: false,
    });
    expect(result.score).toBe(0);
    expect(result.severity).toBe("mild");
  });

  it("scores a single nasal fracture as 1 (mild)", () => {
    const result = calculateFISS({
      fractures: ["hn_dx_fx_nasal"],
      softTissueLacerationOver10cm: false,
    });
    expect(result.score).toBe(1);
    expect(result.severity).toBe("mild");
  });

  it("scores mandible body as 2 (mild)", () => {
    const result = calculateFISS({
      fractures: ["hn_dx_fx_mandible_body"],
      softTissueLacerationOver10cm: false,
    });
    expect(result.score).toBe(2);
    expect(result.severity).toBe("mild");
  });

  it("scores multiple fractures (zygoma + orbital floor) as 2 (mild)", () => {
    const result = calculateFISS({
      fractures: ["hn_dx_fx_zygoma", "hn_dx_fx_orbital_floor"],
      softTissueLacerationOver10cm: false,
    });
    expect(result.score).toBe(2);
    expect(result.severity).toBe("mild");
  });

  it("scores Le Fort III as 6 (moderate)", () => {
    const result = calculateFISS({
      fractures: ["hn_dx_fx_lefort_3"],
      softTissueLacerationOver10cm: false,
    });
    expect(result.score).toBe(6);
    expect(result.severity).toBe("moderate");
  });

  it("scores panfacial (multiple high-value fractures) as severe", () => {
    // Le Fort III (6) + NOE (3) + mandible body (2) = 11
    const result = calculateFISS({
      fractures: [
        "hn_dx_fx_lefort_3",
        "hn_dx_fx_noe",
        "hn_dx_fx_mandible_body",
      ],
      softTissueLacerationOver10cm: false,
    });
    expect(result.score).toBe(11);
    expect(result.severity).toBe("severe");
  });

  it("adds +1 for soft tissue laceration >10cm", () => {
    const result = calculateFISS({
      fractures: ["hn_dx_fx_nasal"],
      softTissueLacerationOver10cm: true,
    });
    expect(result.score).toBe(2);
    expect(result.severity).toBe("mild");
  });

  it("returns 0 points for unknown fracture IDs (graceful fallback)", () => {
    const result = calculateFISS({
      fractures: ["hn_dx_fx_unknown", "totally_fake_id"],
      softTissueLacerationOver10cm: false,
    });
    expect(result.score).toBe(0);
    expect(result.severity).toBe("mild");
  });

  it("computes Le Fort I + mandible + nasal + soft tissue = 6 (moderate)", () => {
    // Le Fort I (2) + mandible body (2) + nasal (1) + soft tissue (1) = 6
    const result = calculateFISS({
      fractures: [
        "hn_dx_fx_lefort_1",
        "hn_dx_fx_mandible_body",
        "hn_dx_fx_nasal",
      ],
      softTissueLacerationOver10cm: true,
    });
    expect(result.score).toBe(6);
    expect(result.severity).toBe("moderate");
  });

  it("scores current broad mandible ID at 2 points", () => {
    const result = calculateFISS({
      fractures: ["hn_dx_fx_mandible"],
      softTissueLacerationOver10cm: false,
    });
    expect(result.score).toBe(2);
    expect(result.severity).toBe("mild");
  });

  it("severity boundary: score 4 is mild, score 5 is moderate, score 8 is severe", () => {
    // 4 → mild (zygoma + NOE = 1 + 3 = 4)
    const mild = calculateFISS({
      fractures: ["hn_dx_fx_zygoma", "hn_dx_fx_noe"],
      softTissueLacerationOver10cm: false,
    });
    expect(mild.score).toBe(4);
    expect(mild.severity).toBe("mild");

    // 5 → moderate (zygoma + NOE + nasal = 1 + 3 + 1 = 5)
    const moderate = calculateFISS({
      fractures: ["hn_dx_fx_zygoma", "hn_dx_fx_noe", "hn_dx_fx_nasal"],
      softTissueLacerationOver10cm: false,
    });
    expect(moderate.score).toBe(5);
    expect(moderate.severity).toBe("moderate");

    // 8 → severe (Le Fort III + mandible body = 6 + 2 = 8)
    const severe = calculateFISS({
      fractures: ["hn_dx_fx_lefort_3", "hn_dx_fx_mandible_body"],
      softTissueLacerationOver10cm: false,
    });
    expect(severe.score).toBe(8);
    expect(severe.severity).toBe("severe");
  });

  it("FISS_POINTS includes all expected fracture IDs", () => {
    // Verify key entries exist
    expect(FISS_POINTS["hn_dx_fx_mandible_body"]).toBe(2);
    expect(FISS_POINTS["hn_dx_fx_nasal"]).toBe(1);
    expect(FISS_POINTS["hn_dx_fx_noe"]).toBe(3);
    expect(FISS_POINTS["hn_dx_fx_lefort_3"]).toBe(6);
    expect(FISS_POINTS["hn_dx_fx_frontal_sinus_displaced"]).toBe(5);
    expect(FISS_POINTS["hn_dx_fx_panfacial"]).toBe(6);
  });
});
