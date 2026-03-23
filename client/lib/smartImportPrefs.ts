import AsyncStorage from "@react-native-async-storage/async-storage";
import { userScopedAsyncKey } from "./activeUser";

const BASE_KEY = "@opus_smart_import_always_delete";

function storageKey(): string {
  return userScopedAsyncKey(BASE_KEY);
}

/** Check if the user has opted to always delete Camera Roll originals after import. */
export async function getAlwaysDeleteAfterImport(): Promise<boolean> {
  const value = await AsyncStorage.getItem(storageKey());
  return value === "true";
}

/** Set the "always delete after import" preference. */
export async function setAlwaysDeleteAfterImport(
  enabled: boolean,
): Promise<void> {
  await AsyncStorage.setItem(storageKey(), enabled ? "true" : "false");
}
