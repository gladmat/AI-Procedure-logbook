import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AestheticProductCategory } from "@/types/aesthetics";
import { userScopedAsyncKey } from "@/lib/activeUser";

const STORAGE_BASE_KEY = "@opus_recent_products";
function recentProductsKey(): string {
  return userScopedAsyncKey(STORAGE_BASE_KEY);
}
const MAX_RECENT_PER_CATEGORY = 5;

type RecentProductsData = Partial<Record<AestheticProductCategory, string[]>>;

/**
 * Lightweight hook for tracking recently-used aesthetic products per category.
 * Stores product IDs in AsyncStorage, capped at 5 per category.
 */
export function useRecentProducts(category: AestheticProductCategory) {
  const [recentIds, setRecentIds] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(recentProductsKey())
      .then((raw) => {
        if (cancelled) return;
        if (raw) {
          const data: RecentProductsData = JSON.parse(raw);
          setRecentIds(data[category] ?? []);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [category]);

  const recordProductUse = useCallback(
    async (productId: string) => {
      try {
        const raw = await AsyncStorage.getItem(recentProductsKey());
        const data: RecentProductsData = raw ? JSON.parse(raw) : {};
        const existing = data[category] ?? [];
        const deduped = existing.filter((id) => id !== productId);
        const updated = [productId, ...deduped].slice(
          0,
          MAX_RECENT_PER_CATEGORY,
        );
        data[category] = updated;
        await AsyncStorage.setItem(recentProductsKey(), JSON.stringify(data));
        setRecentIds(updated);
      } catch {
        // Silently fail — recents are non-critical
      }
    },
    [category],
  );

  return { recentIds, recordProductUse };
}
