import * as FileSystem from "expo-file-system";
import { v4 as uuidv4 } from "uuid";
import { Platform } from "react-native";

const MEDIA_DIR = `${FileSystem.documentDirectory}media/`;

async function ensureMediaDir(): Promise<void> {
  const dirInfo = await FileSystem.getInfoAsync(MEDIA_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(MEDIA_DIR, { intermediates: true });
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
  if (Platform.OS === "web") {
    return tempUri;
  }

  if (tempUri.startsWith(MEDIA_DIR)) {
    return tempUri;
  }

  await ensureMediaDir();

  const ext = getExtension(tempUri, mimeType);
  const filename = `${uuidv4()}.${ext}`;
  const permanentUri = `${MEDIA_DIR}${filename}`;

  await FileSystem.copyAsync({ from: tempUri, to: permanentUri });

  return permanentUri;
}
