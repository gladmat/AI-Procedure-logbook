import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ENCRYPTION_KEY_ALIAS = "surgical_logbook_encryption_key";

async function getOrCreateEncryptionKey(): Promise<string> {
  if (Platform.OS === "web") {
    const existingKey = await AsyncStorage.getItem(`@${ENCRYPTION_KEY_ALIAS}`);
    if (existingKey) {
      return existingKey;
    }
    const newKey = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `${Date.now()}-${Math.random()}`
    );
    await AsyncStorage.setItem(`@${ENCRYPTION_KEY_ALIAS}`, newKey);
    return newKey;
  }
  
  const existingKey = await SecureStore.getItemAsync(ENCRYPTION_KEY_ALIAS);
  if (existingKey) {
    return existingKey;
  }
  const newKey = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${Date.now()}-${Math.random()}`
  );
  await SecureStore.setItemAsync(ENCRYPTION_KEY_ALIAS, newKey);
  return newKey;
}

function xorEncrypt(text: string, key: string): string {
  const textBytes = new TextEncoder().encode(text);
  const keyBytes = new TextEncoder().encode(key);
  const result = new Uint8Array(textBytes.length);
  
  for (let i = 0; i < textBytes.length; i++) {
    result[i] = textBytes[i] ^ keyBytes[i % keyBytes.length];
  }
  
  return btoa(String.fromCharCode(...result));
}

function xorDecrypt(encrypted: string, key: string): string {
  try {
    const encryptedBytes = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
    const keyBytes = new TextEncoder().encode(key);
    const result = new Uint8Array(encryptedBytes.length);
    
    for (let i = 0; i < encryptedBytes.length; i++) {
      result[i] = encryptedBytes[i] ^ keyBytes[i % keyBytes.length];
    }
    
    return new TextDecoder().decode(result);
  } catch {
    return encrypted;
  }
}

export async function encryptData(data: string): Promise<string> {
  try {
    const key = await getOrCreateEncryptionKey();
    return xorEncrypt(data, key);
  } catch (error) {
    console.error("Encryption failed, storing unencrypted:", error);
    return data;
  }
}

export async function decryptData(encryptedData: string): Promise<string> {
  try {
    const key = await getOrCreateEncryptionKey();
    return xorDecrypt(encryptedData, key);
  } catch (error) {
    console.error("Decryption failed, returning as-is:", error);
    return encryptedData;
  }
}

export async function isEncrypted(data: string): Promise<boolean> {
  try {
    JSON.parse(data);
    return false;
  } catch {
    return true;
  }
}
