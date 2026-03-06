import * as SecureStore from "expo-secure-store";

// ── SecureStore Keys ─────────────────────────────────────────────────────────
const KEYS = {
  PIN_HASH: "opus_app_lock_pin_hash",
  BIOMETRIC_ENABLED: "opus_app_lock_biometric_enabled",
  APP_LOCK_ENABLED: "opus_app_lock_enabled",
  AUTO_LOCK_TIMEOUT: "opus_app_lock_timeout",
  PIN_VERSION: "opus_app_lock_pin_version",
} as const;

const CURRENT_PIN_VERSION = "2";

// ── Storage Functions ────────────────────────────────────────────────────────

export async function isAppLockEnabled(): Promise<boolean> {
  const value = await SecureStore.getItemAsync(KEYS.APP_LOCK_ENABLED);
  return value === "true";
}

export async function setAppLockEnabled(enabled: boolean): Promise<void> {
  await SecureStore.setItemAsync(
    KEYS.APP_LOCK_ENABLED,
    enabled ? "true" : "false",
  );
}

export async function isBiometricPreferenceEnabled(): Promise<boolean> {
  const value = await SecureStore.getItemAsync(KEYS.BIOMETRIC_ENABLED);
  return value === "true";
}

export async function setBiometricPreference(enabled: boolean): Promise<void> {
  await SecureStore.setItemAsync(
    KEYS.BIOMETRIC_ENABLED,
    enabled ? "true" : "false",
  );
}

export async function getAutoLockTimeout(): Promise<number> {
  const value = await SecureStore.getItemAsync(KEYS.AUTO_LOCK_TIMEOUT);
  if (value === null) return 0;
  return parseInt(value, 10);
}

export async function setAutoLockTimeout(seconds: number): Promise<void> {
  await SecureStore.setItemAsync(KEYS.AUTO_LOCK_TIMEOUT, seconds.toString());
}

export async function savePin(pin: string): Promise<void> {
  const { digestStringAsync, CryptoDigestAlgorithm } = await import(
    "expo-crypto"
  );
  const hash = await digestStringAsync(
    CryptoDigestAlgorithm.SHA256,
    `opus_pin_v1_${pin}`,
  );
  await SecureStore.setItemAsync(KEYS.PIN_HASH, hash);
  await SecureStore.setItemAsync(KEYS.PIN_VERSION, CURRENT_PIN_VERSION);
}

export async function verifyPin(pin: string): Promise<boolean> {
  const stored = await SecureStore.getItemAsync(KEYS.PIN_HASH);
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
  const hash = await SecureStore.getItemAsync(KEYS.PIN_HASH);
  return hash !== null && hash.length > 0;
}

export async function migratePinIfNeeded(): Promise<boolean> {
  const storedVersion = await SecureStore.getItemAsync(KEYS.PIN_VERSION);
  if (storedVersion === CURRENT_PIN_VERSION) {
    return false;
  }

  const hasPin = await isPinSet();
  if (!hasPin) {
    return false;
  }

  await SecureStore.deleteItemAsync(KEYS.PIN_HASH);
  await SecureStore.deleteItemAsync(KEYS.APP_LOCK_ENABLED);
  await SecureStore.deleteItemAsync(KEYS.BIOMETRIC_ENABLED);
  await SecureStore.deleteItemAsync(KEYS.AUTO_LOCK_TIMEOUT);
  await SecureStore.deleteItemAsync(KEYS.PIN_VERSION);
  return true;
}

export async function clearAllAppLockData(): Promise<void> {
  await SecureStore.deleteItemAsync(KEYS.PIN_HASH);
  await SecureStore.deleteItemAsync(KEYS.BIOMETRIC_ENABLED);
  await SecureStore.deleteItemAsync(KEYS.APP_LOCK_ENABLED);
  await SecureStore.deleteItemAsync(KEYS.AUTO_LOCK_TIMEOUT);
  await SecureStore.deleteItemAsync(KEYS.PIN_VERSION);
}
