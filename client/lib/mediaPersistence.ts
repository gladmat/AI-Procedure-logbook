import * as FileSystem from "expo-file-system";
import { v4 as uuidv4 } from "uuid";
import { Platform } from "react-native";

function getMediaDir(): string {
  if (!FileSystem.documentDirectory) {
    throw new Error("FileSystem.documentDirectory is not available on this platform");
  }
  return `${FileSystem.documentDirectory}media/`;
}

async function ensureMediaDir(mediaDir: string): Promise<void> {
  const dirInfo = await FileSystem.getInfoAsync(mediaDir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(mediaDir, { intermediates: true });
  }
}

function getExtension(uri: string, mimeType?: string): string {
  const uriExt = uri.split(".").pop()?.split("?")[0]?.toLowerCase();
  if (uriExt && ["jpg", "jpeg", "png", "heic", "webp", "gif"].includes(uriExt)) {
    return uriExt;
  }
  if (mimeType) {
    const ext = mimeType.split("/").pop()?.toLowerCase();
    if (ext === "jpeg") return "jpg";
    if (ext) return ext;
  }
  return "jpg";
}

export async function persistMediaFile(
  tempUri: string,
  mimeType?: string
): Promise<string> {
  if (Platform.OS === "web" || !FileSystem.documentDirectory) {
    return tempUri;
  }

  if (!tempUri) {
    throw new Error("No file URI provided");
  }

  const mediaDir = getMediaDir();

  if (tempUri.startsWith(mediaDir)) {
    const fileInfo = await FileSystem.getInfoAsync(tempUri);
    if (fileInfo.exists) {
      return tempUri;
    }
  }

  await ensureMediaDir(mediaDir);

  const ext = getExtension(tempUri, mimeType);
  const filename = `${uuidv4()}.${ext}`;
  const permanentUri = `${mediaDir}${filename}`;

  const sourceInfo = await FileSystem.getInfoAsync(tempUri);
  if (!sourceInfo.exists) {
    throw new Error(`Source file not found: ${tempUri.substring(tempUri.length - 40)}`);
  }

  await FileSystem.copyAsync({ from: tempUri, to: permanentUri });

  const destInfo = await FileSystem.getInfoAsync(permanentUri);
  if (!destInfo.exists) {
    throw new Error("File copy succeeded but destination file not found");
  }

  return permanentUri;
}
