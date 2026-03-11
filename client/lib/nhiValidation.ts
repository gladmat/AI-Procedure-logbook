/**
 * NZ National Health Index (NHI) validation.
 *
 * Format: 3 alpha (excluding I, O) + 4 numeric (e.g., ABC1234).
 * Check digit uses mod-11 algorithm — warns but does not block.
 */

const NHI_REGEX = /^[A-HJ-NP-Z]{3}\d{4}$/;

/**
 * Validate NHI format: 3 alpha (no I/O) + 4 digits.
 */
export function isValidNhi(value: string): boolean {
  return NHI_REGEX.test(value.toUpperCase());
}

/**
 * Format raw input into NHI shape: uppercase, strip non-alphanumeric, max 7.
 */
export function formatNhi(value: string): string {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 7);
}

/**
 * Validate NHI format + mod-11 check digit.
 * The check digit is the 7th character.
 * Letters I and O are excluded from the NHI alphabet.
 */
export function isValidNhiWithCheckDigit(value: string): boolean {
  const upper = value.toUpperCase();
  if (!NHI_REGEX.test(upper)) return false;

  const alphaMap: Record<string, number> = {
    A: 1,
    B: 2,
    C: 3,
    D: 4,
    E: 5,
    F: 6,
    G: 7,
    H: 8,
    J: 9,
    K: 10,
    L: 11,
    M: 12,
    N: 13,
    P: 14,
    Q: 15,
    R: 16,
    S: 17,
    T: 18,
    U: 19,
    V: 20,
    W: 21,
    X: 22,
    Y: 23,
    Z: 24,
  };

  const digits = [
    alphaMap[upper[0]!]!,
    alphaMap[upper[1]!]!,
    alphaMap[upper[2]!]!,
    parseInt(upper[3]!),
    parseInt(upper[4]!),
    parseInt(upper[5]!),
  ];
  const weights = [7, 6, 5, 4, 3, 2];
  const sum = digits.reduce((acc, d, i) => acc + d * weights[i]!, 0);
  const remainder = sum % 11;
  if (remainder === 0) return false; // check digit would be 11, which is invalid
  const checkDigit = 11 - remainder;
  const expected = checkDigit === 10 ? 0 : checkDigit;
  return parseInt(upper[6]!) === expected;
}
