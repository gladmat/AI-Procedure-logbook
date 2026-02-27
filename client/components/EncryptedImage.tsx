import React, { useState, useEffect, useRef } from "react";
import {
  Image,
  View,
  ActivityIndicator,
  StyleProp,
  ImageStyle,
  ViewStyle,
} from "react-native";
import { loadEncryptedMedia, isEncryptedMediaUri } from "@/lib/mediaStorage";
import { useTheme } from "@/hooks/useTheme";

const MAX_CACHE_ENTRIES = 30;
const decryptedCache = new Map<string, string>();
const cacheOrder: string[] = [];

function cacheSet(key: string, value: string) {
  if (decryptedCache.has(key)) {
    const idx = cacheOrder.indexOf(key);
    if (idx !== -1) cacheOrder.splice(idx, 1);
  }
  decryptedCache.set(key, value);
  cacheOrder.push(key);
  while (cacheOrder.length > MAX_CACHE_ENTRIES) {
    const oldest = cacheOrder.shift();
    if (oldest) decryptedCache.delete(oldest);
  }
}

interface EncryptedImageProps {
  uri: string;
  style?: StyleProp<ImageStyle>;
  placeholderStyle?: StyleProp<ViewStyle>;
  resizeMode?: "cover" | "contain" | "stretch" | "center";
  onError?: () => void;
  onLoad?: () => void;
}

export function EncryptedImage({
  uri,
  style,
  placeholderStyle,
  resizeMode = "cover",
  onError,
  onLoad,
}: EncryptedImageProps) {
  const { theme } = useTheme();
  const [dataUri, setDataUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isEncryptedMediaUri(uri)) {
      setDataUri(uri);
      setLoading(false);
      return;
    }

    const cached = decryptedCache.get(uri);
    if (cached) {
      setDataUri(cached);
      setLoading(false);
      return;
    }

    setLoading(true);
    setDataUri(null);

    loadEncryptedMedia(uri)
      .then((result) => {
        if (!mountedRef.current) return;
        if (result) {
          cacheSet(uri, result);
          setDataUri(result);
        } else {
          onError?.();
        }
      })
      .catch(() => {
        if (mountedRef.current) onError?.();
      })
      .finally(() => {
        if (mountedRef.current) setLoading(false);
      });
  }, [uri]);

  if (loading) {
    return (
      <View
        style={[
          style,
          placeholderStyle,
          {
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: theme.backgroundDefault,
          },
        ]}
      >
        <ActivityIndicator size="small" color={theme.textSecondary} />
      </View>
    );
  }

  if (!dataUri) return null;

  return (
    <Image
      source={{ uri: dataUri }}
      style={style}
      resizeMode={resizeMode}
      onError={() => onError?.()}
      onLoad={() => onLoad?.()}
    />
  );
}

export function clearDecryptedCache() {
  decryptedCache.clear();
  cacheOrder.length = 0;
}
