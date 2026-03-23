import * as SecureStore from "expo-secure-store";
import { userScopedSecureKey } from "./activeUser";

// ── Base key names (scoped per user at runtime) ─────────────────────────────
export const APP_LOCK_KEY_NAMES = {
  PIN_HASH: "opus_app_lock_pin_hash",
  BIOMETRIC_ENABLED: "opus_app_lock_biometric_enabled",
  APP_LOCK_ENABLED: "opus_app_lock_enabled",
  AUTO_LOCK_TIMEOUT: "opus_app_lock_timeout",
  PIN_VERSION: "opus_app_lock_pin_version",
} as const;

const CURRENT_PIN_VERSION = "2";

/** Returns user-scoped SecureStore keys for the active user. */
function getUserKeys() {
  return {
    PIN_HASH: userScopedSecureKey(APP_LOCK_KEY_NAMES.PIN_HASH),
    BIOMETRIC_ENABLED: userScopedSecureKey(APP_LOCK_KEY_NAMES.BIOMETRIC_ENABLED),
    APP_LOCK_ENABLED: userScopedSecureKey(APP_LOCK_KEY_NAMES.APP_LOCK_ENABLED),
    AUTO_LOCK_TIMEOUT: userScopedSecureKey(APP_LOCK_KEY_NAMES.AUTO_LOCK_TIMEOUT),
    PIN_VERSION: userScopedSecureKey(APP_LOCK_KEY_NAMES.PIN_VERSION),
  };
}

// ── Storage Functions ────────────────────────────────────────────────────────

export async function isAppLockEnabled(): Promise<boolean> {
  const keys = getUserKeys();
  const value = await SecureStore.getItemAsync(keys.APP_LOCK_ENABLED);
  return value === "true";
}

export async function setAppLockEnabled(enabled: boolean): Promise<void> {
  const keys = getUserKeys();
  await SecureStore.setItemAsync(
    keys.APP_LOCK_ENABLED,
    enabled ? "true" : "false",
  );
}

export async function isBiometricPreferenceEnabled(): Promise<boolean> {
  const keys = getUserKeys();
  const value = await SecureStore.getItemAsync(keys.BIOMETRIC_ENABLED);
  return value === "true";
}

export async function setBiometricPreference(enabled: boolean): Promise<void> {
  const keys = getUserKeys();
  await SecureStore.setItemAsync(
    keys.BIOMETRIC_ENABLED,
    enabled ? "true" : "false",
  );
}

export async function getAutoLockTimeout(): Promise<number> {
  const keys = getUserKeys();
  const value = await SecureStore.getItemAsync(keys.AUTO_LOCK_TIMEOUT);
  if (value === null) return 0;
  return parseInt(value, 10);
}

export async function setAutoLockTimeout(seconds: number): Promise<void> {
  const keys = getUserKeys();
  await SecureStore.setItemAsync(keys.AUTO_LOCK_TIMEOUT, seconds.toString());
}

export async function savePin(pin: string): Promise<void> {
  const keys = getUserKeys();
  const { digestStringAsync, CryptoDigestAlgorithm } = await import(
    "expo-crypto"
  );
  const hash = await digestStringAsync(
    CryptoDigestAlgorithm.SHA256,
    `opus_pin_v1_${pin}`,
  );
  await SecureStore.setItemAsync(keys.PIN_HASH, hash);
  await SecureStore.setItemAsync(keys.PIN_VERSION, CURRENT_PIN_VERSION);
}

export async function verifyPin(pin: string): Promise<boolean> {
  const keys = getUserKeys();
  const stored = await SecureStore.getItemAsync(keys.PIN_HASH);
  if (!stored) return false;
  const { digestStringAsync, CryptoDigestAlgorithm } = await import(
    "expo-crypto"
  );
  const hash = await digestStringAsync(
    CryptoDigestAlgorithm.SHA256,
    `opus_pin_v1_${pin}`,
  );
  return hash === stored;
}

export async function isPinSet(): Promise<boolean> {
  const keys = getUserKeys();
  const hash = await SecureStore.getItemAsync(keys.PIN_HASH);
  return hash !== null && hash.length > 0;
}

export async function migratePinIfNeeded(): Promise<boolean> {
  const keys = getUserKeys();
  const storedVersion = await SecureStore.getItemAsync(keys.PIN_VERSION);
  if (storedVersion === CURRENT_PIN_VERSION) {
    return false;
  }

  const hasPin = await isPinSet();
  if (!hasPin) {
    return false;
  }

  await SecureStore.deleteItemAsync(keys.PIN_HASH);
  await SecureStore.deleteItemAsync(keys.APP_LOCK_ENABLED);
  await SecureStore.deleteItemAsync(keys.BIOMETRIC_ENABLED);
  await SecureStore.deleteItemAsync(keys.AUTO_LOCK_TIMEOUT);
  await SecureStore.deleteItemAsync(keys.PIN_VERSION);
  return true;
}

export async function clearAllAppLockData(): Promise<void> {
  const keys = getUserKeys();
  await SecureStore.deleteItemAsync(keys.PIN_HASH);
  await SecureStore.deleteItemAsync(keys.BIOMETRIC_ENABLED);
  await SecureStore.deleteItemAsync(keys.APP_LOCK_ENABLED);
  await SecureStore.deleteItemAsync(keys.AUTO_LOCK_TIMEOUT);
  await SecureStore.deleteItemAsync(keys.PIN_VERSION);
}
