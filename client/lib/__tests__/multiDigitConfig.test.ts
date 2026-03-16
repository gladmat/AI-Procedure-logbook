import { describe, expect, it } from "vitest";
import {
  resolveDigitConfig,
  DIGIT_LABELS,
  DIGIT_BODY_STRUCTURE_SNOMED,
  formatAffectedDigits,
} from "@/lib/diagnosisPicklists/multiDigitConfig";
import type { DigitId } from "@/types/case";

const ALL_DIGITS: DigitId[] = ["I", "II", "III", "IV", "V"];

describe("resolveDigitConfig", () => {
  it("resolves thumb (I) to trigger thumb SNOMED and procedure", () => {
    const result = resolveDigitConfig("hand_dx_trigger_digit", "I");
    expect(result).toBeDefined();
    expect(result!.diagnosisSnomedCode).toBe("202855006");
    expect(result!.diagnosisSnomedDisplay).toMatch(/thumb/i);
    expect(result!.procedurePicklistId).toBe("hand_comp_trigger_thumb");
    expect(result!.procedureDisplayName).toMatch(/thumb/i);
  });

  it("resolves finger II to trigger finger SNOMED and procedure", () => {
    const result = resolveDigitConfig("hand_dx_trigger_digit", "II");
    expect(result).toBeDefined();
    expect(result!.diagnosisSnomedCode).toBe("1539003");
    expect(result!.procedurePicklistId).toBe("hand_comp_trigger_finger");
  });

  it("resolves all 5 digits without returning null", () => {
    for (const digit of ALL_DIGITS) {
      const result = resolveDigitConfig("hand_dx_trigger_digit", digit);
      expect(result).toBeDefined();
      expect(result!.procedurePicklistId).toBeTruthy();
      expect(result!.diagnosisSnomedCode).toBeTruthy();
    }
  });

  it("fingers II-V all resolve to the same default (trigger finger)", () => {
    for (const digit of ["II", "III", "IV", "V"] as DigitId[]) {
      const result = resolveDigitConfig("hand_dx_trigger_digit", digit);
      expect(result!.procedurePicklistId).toBe("hand_comp_trigger_finger");
      expect(result!.diagnosisSnomedCode).toBe("1539003");
    }
  });

  it("returns null for unknown diagnosis ID", () => {
    const result = resolveDigitConfig("hand_dx_unknown", "I");
    expect(result).toBeNull();
  });
});

describe("DIGIT_LABELS", () => {
  it("has labels for all 5 digits", () => {
    for (const digit of ALL_DIGITS) {
      expect(DIGIT_LABELS[digit]).toBeTruthy();
    }
  });

  it("digit I is Thumb", () => {
    expect(DIGIT_LABELS["I"]).toBe("Thumb");
  });

  it("digit III is Middle finger", () => {
    expect(DIGIT_LABELS["III"]).toBe("Middle finger");
  });
});

describe("DIGIT_BODY_STRUCTURE_SNOMED", () => {
  it("has SNOMED codes for all 5 digits", () => {
    for (const digit of ALL_DIGITS) {
      const entry = DIGIT_BODY_STRUCTURE_SNOMED[digit];
      expect(entry).toBeDefined();
      expect(entry.code).toBeTruthy();
      expect(entry.display).toBeTruthy();
    }
  });

  it("thumb has correct SNOMED body structure code", () => {
    expect(DIGIT_BODY_STRUCTURE_SNOMED["I"].code).toBe("76505004");
  });
});

describe("formatAffectedDigits", () => {
  it("formats single digit", () => {
    expect(formatAffectedDigits(["I"])).toBe("Thumb");
  });

  it("formats multiple digits", () => {
    const result = formatAffectedDigits(["II", "IV"]);
    expect(result).toContain("Index finger");
    expect(result).toContain("Ring finger");
  });

  it("returns empty string for empty array", () => {
    expect(formatAffectedDigits([])).toBe("");
  });
});
