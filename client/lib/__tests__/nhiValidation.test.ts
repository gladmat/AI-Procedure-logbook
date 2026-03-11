import { describe, expect, it } from "vitest";
import {
  isValidNhi,
  formatNhi,
  isValidNhiWithCheckDigit,
} from "@/lib/nhiValidation";

describe("NHI validation", () => {
  describe("isValidNhi", () => {
    it("accepts valid format: 3 alpha + 4 digits", () => {
      expect(isValidNhi("ABC1234")).toBe(true);
      expect(isValidNhi("ZZZ9999")).toBe(true);
      expect(isValidNhi("abc1234")).toBe(true); // case-insensitive
    });

    it("rejects strings with I or O (excluded from NHI alphabet)", () => {
      expect(isValidNhi("AIB1234")).toBe(false); // contains I
      expect(isValidNhi("AOB1234")).toBe(false); // contains O
    });

    it("rejects wrong length", () => {
      expect(isValidNhi("AB1234")).toBe(false); // too short
      expect(isValidNhi("ABCD1234")).toBe(false); // too long alpha
      expect(isValidNhi("ABC12345")).toBe(false); // too long digits
    });

    it("rejects all-alpha or all-digit", () => {
      expect(isValidNhi("ABCDEFG")).toBe(false);
      expect(isValidNhi("1234567")).toBe(false);
    });

    it("rejects when digits appear in alpha positions", () => {
      expect(isValidNhi("1BC1234")).toBe(false);
    });
  });

  describe("formatNhi", () => {
    it("uppercases input", () => {
      expect(formatNhi("abc")).toBe("ABC");
    });

    it("strips non-alphanumeric characters", () => {
      expect(formatNhi("AB-C 12.34")).toBe("ABC1234");
    });

    it("truncates to 7 characters", () => {
      expect(formatNhi("ABCD12345")).toBe("ABCD123");
    });
  });

  describe("isValidNhiWithCheckDigit", () => {
    // Known valid NHIs (mod-11 check digit correct)
    it("accepts known valid NHI: DAB0019", () => {
      expect(isValidNhiWithCheckDigit("DAB0019")).toBe(true);
    });

    it("rejects format-valid NHI with wrong check digit", () => {
      expect(isValidNhiWithCheckDigit("DAB0018")).toBe(false);
    });

    it("rejects format-invalid NHI", () => {
      expect(isValidNhiWithCheckDigit("123")).toBe(false);
      expect(isValidNhiWithCheckDigit("")).toBe(false);
    });

    it("is case-insensitive", () => {
      expect(isValidNhiWithCheckDigit("dab0019")).toBe(
        isValidNhiWithCheckDigit("DAB0019"),
      );
    });
  });
});
