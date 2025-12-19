import { useCallback, useEffect, useMemo, useState } from "react";
import Constants from "expo-constants";
import type { StoreItem } from "@/components/store/Tiles";

// Resolve the backend base URL once so every hook caller uses the same endpoint.
const API_BASE_URL = Constants.expoConfig?.extra?.backendUrl as string;

// --- Rotated Store Catalog ---

interface RotatedCatalogResponse {
  success: boolean;
  data?: {
    hats: StoreItem[];
    faces: StoreItem[];
    collars: StoreItem[];
    nextRefreshTimestamp: number;
    weekKey: string;
  };
  message?: string;
  error?: string;
}

interface UseRotatedStoreCatalogOptions {
  /** When false, the hook exposes state but leaves fetching to the caller. */
  autoFetch?: boolean;
}

/**
 * Fetch the weekly rotated store catalog for a user.
 * Returns seeded random items per category, excluding owned items.
 */
export const useRotatedStoreCatalog = (
  userId?: string | null,
  options?: UseRotatedStoreCatalogOptions
) => {
  const [hats, setHats] = useState<StoreItem[]>([]);
  const [faces, setFaces] = useState<StoreItem[]>([]);
  const [collars, setCollars] = useState<StoreItem[]>([]);
  const [nextRefreshTimestamp, setNextRefreshTimestamp] = useState<number | null>(null);
  const [weekKey, setWeekKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRotatedCatalog = useCallback(async (signal?: AbortSignal) => {
    if (!API_BASE_URL) {
      setError("Backend URL not configured");
      setLoading(false);
      return;
    }

    if (!userId) {
      setError("User ID required");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${API_BASE_URL}/api/store/rotated-catalog/${encodeURIComponent(userId)}`,
        { signal }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const payload: RotatedCatalogResponse = await response.json();
      if (!payload.success || !payload.data) {
        throw new Error(payload.message || payload.error || "Failed to load catalog");
      }

      setHats(payload.data.hats || []);
      setFaces(payload.data.faces || []);
      setCollars(payload.data.collars || []);
      setNextRefreshTimestamp(payload.data.nextRefreshTimestamp);
      setWeekKey(payload.data.weekKey);
    } catch (err) {
      if (signal?.aborted) return;
      const message = err instanceof Error ? err.message : "Unable to load store catalog";
      setError(message);
      setHats([]);
      setFaces([]);
      setCollars([]);
    } finally {
      if (signal?.aborted) return;
      setLoading(false);
    }
  }, [userId]);

  const autoFetch = options?.autoFetch ?? true;

  useEffect(() => {
    if (!autoFetch || !userId) {
      return;
    }
    const controller = new AbortController();
    void fetchRotatedCatalog(controller.signal);
    return () => controller.abort();
  }, [autoFetch, userId, fetchRotatedCatalog]);

  const refetch = useCallback(() => fetchRotatedCatalog(), [fetchRotatedCatalog]);

  return {
    hats,
    faces,
    collars,
    nextRefreshTimestamp,
    weekKey,
    loading,
    error,
    refetch,
  };
};

// --- Original Store Catalog (kept for backward compatibility) ---

interface StoreCatalogResponse {
  success: boolean;
  data?: StoreItem[];
  message?: string;
}

interface UseStoreCatalogOptions {
  /** When false, the hook exposes state but leaves fetching to the caller. */
  autoFetch?: boolean;
}

interface OwnedItems {
  ownedPets?: string[];
  ownedHats?: string[];
  ownedCollars?: string[];
  ownedGadgets?: string[];
}

/**
 * Fetch and partition the store catalog.
 * - `availablePets`: items not yet owned (for the store grid).
 * - `ownedPets`: items that match the supplied owned ids (for profile/pets tab).
 */
export const useStoreCatalog = (
  ownedItems?: OwnedItems | null,
  options?: UseStoreCatalogOptions,
) => {
  const [catalog, setCatalog] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Shared fetch helper so callers can trigger a reload manually.
  const fetchCatalog = useCallback(async (signal?: AbortSignal) => {
    if (!API_BASE_URL) {
      const message = "Backend URL not configured";
      setError(message);
      setCatalog([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/api/store/catalog`, {
        signal,
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const payload: StoreCatalogResponse = await response.json();
      if (!payload.success || !Array.isArray(payload.data)) {
        throw new Error(payload.message || "Failed to load catalog");
      }

      setCatalog(payload.data);
    } catch (err) {
      if (signal?.aborted) return;
      const message =
        err instanceof Error ? err.message : "Unable to load store catalog";
      setError(message);
      setCatalog([]);
    } finally {
      if (signal?.aborted) return;
      setLoading(false);
    }
  }, []);

  const autoFetch = options?.autoFetch ?? true;

  // Kick off the initial fetch unless the caller opted out.
  useEffect(() => {
    if (!autoFetch) {
      return;
    }
    const controller = new AbortController();
    void fetchCatalog(controller.signal);
    return () => controller.abort();
  }, [autoFetch, fetchCatalog]);

  // Memoize the owned-id set so filtering stays cheap.
  const ownedIdSet = useMemo(() => {
    const allOwned = [
      ...(ownedItems?.ownedPets || []),
      ...(ownedItems?.ownedHats || []),
      ...(ownedItems?.ownedCollars || []),
      ...(ownedItems?.ownedGadgets || []),
    ];
    return allOwned.length ? new Set(allOwned) : null;
  }, [ownedItems]);

  const ownedPets = useMemo(() => {
    if (!ownedIdSet) {
      return [];
    }
    return catalog.filter((item) => ownedIdSet.has(item.id));
  }, [catalog, ownedIdSet]);

  const availablePets = useMemo(() => {
    if (!ownedIdSet) {
      return catalog;
    }
    return catalog.filter((item) => !ownedIdSet.has(item.id));
  }, [catalog, ownedIdSet]);

  const refetch = useCallback(() => fetchCatalog(), [fetchCatalog]);

  return {
    catalog,
    availablePets,
    ownedPets,
    loading,
    error,
    refetch,
  };
};
