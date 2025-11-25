import { useCallback, useEffect, useMemo, useState } from "react";
import Constants from "expo-constants";
import type { StoreItem } from "@/components/store/Tiles";

// Resolve the backend base URL once so every hook caller uses the same endpoint.
const API_BASE_URL = Constants.expoConfig?.extra?.backendUrl as string;

interface StoreCatalogResponse {
  success: boolean;
  data?: StoreItem[];
  message?: string;
}

interface UseStoreCatalogOptions {
  /** When false, the hook exposes state but leaves fetching to the caller. */
  autoFetch?: boolean;
}

/**
 * Fetch and partition the store catalog.
 * - `availablePets`: pets not yet owned (for the store grid).
 * - `ownedPets`: pets that match the supplied owned ids (for profile/pets tab).
 */
export const useStoreCatalog = (
  ownedIds?: string[] | null,
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
    return ownedIds && ownedIds.length ? new Set(ownedIds) : null;
  }, [ownedIds]);

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
