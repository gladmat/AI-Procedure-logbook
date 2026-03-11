/**
 * Per-user HMAC-SHA256 hashing for patient identifiers.
 *
 * Replaces bare SHA-256 which is vulnerable to rainbow table attacks
 * on the NHI keyspace (~175M values). Per-user HMAC key stored in
 * iOS Keychain via expo-secure-store — never transmitted anywhere.
 */

import * as SecureStore from "expo-secure-store";
import { hmac } from "@noble/hashes/hmac.js";
import { sha256 } from "@noble/hashes/sha2.js";
import {
  bytesToHex,
  hexToBytes,
  randomBytes,
  utf8ToBytes,
} from "@noble/hashes/utils.js";

const HMAC_KEY_STORE_KEY = "opus_patient_hmac_key";
const HMAC_HASH_PREFIX = "hmac:";

/**
 * Get or create the per-user HMAC key.
 * Stored in iOS Keychain via expo-secure-store.
 * Generated once per device, never transmitted.
 */
export async function getPatientHmacKey(): Promise<Uint8Array> {
  const existing = await SecureStore.getItemAsync(HMAC_KEY_STORE_KEY);
  if (existing) {
    return hexToBytes(existing);
  }

  const newKey = randomBytes(32); // 256-bit random key
  await SecureStore.setItemAsync(HMAC_KEY_STORE_KEY, bytesToHex(newKey), {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  return newKey;
}

/**
 * Compute HMAC-SHA256 of a patient identifier using the per-user key.
 * Returns `hmac:` + hex string for storage in case index.
 */
export async function hashPatientIdentifierHmac(
  identifier: string,
): Promise<string> {
  const key = await getPatientHmacKey();
  const normalized = identifier.toUpperCase().trim();
  const hash = hmac(sha256, key, utf8ToBytes(normalized));
  return HMAC_HASH_PREFIX + bytesToHex(hash);
}

/**
 * Check if a hash is a legacy bare SHA-256 (no `hmac:` prefix).
 */
export function isLegacyHash(hash: string): boolean {
  return !hash.startsWith(HMAC_HASH_PREFIX);
}

/**
 * Patient identity fields that must be stripped before server sync.
 * These fields are stored on-device only, never transmitted.
 */
const PATIENT_IDENTITY_FIELDS = [
  "patientFirstName",
  "patientLastName",
  "patientDateOfBirth",
  "patientNhi",
] as const;

/**
 * Strip patient identity fields from a case before server sync.
 * This is the single most important security boundary in the app.
 */
export function stripPatientIdentityForSync<
  T extends Record<string, unknown>,
>(caseData: T): Omit<T, (typeof PATIENT_IDENTITY_FIELDS)[number]> {
  const result = { ...caseData };
  for (const field of PATIENT_IDENTITY_FIELDS) {
    delete result[field];
  }
  return result;
}
