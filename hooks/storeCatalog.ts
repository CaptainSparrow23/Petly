import { useCallback, useEffect, useState } from "react";
import Constants from "expo-constants";
import type { PetTileItem } from "@/components/store/Tiles";

const API_BASE_URL = Constants.expoConfig?.extra?.backendUrl as string;

interface StoreCatalogResponse {
  success: boolean;
  data?: PetTileItem[];
  message?: string;
}

export const useStoreCatalog = () => {
  const [catalog, setCatalog] = useState<PetTileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCatalog = useCallback(async () => {
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

      const response = await fetch(`${API_BASE_URL}/api/store/catalog`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const payload: StoreCatalogResponse = await response.json();
      if (!payload.success || !Array.isArray(payload.data)) {
        throw new Error(payload.message || "Failed to load catalog");
      }

      setCatalog(payload.data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to load store catalog";
      setError(message);
      setCatalog([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  return { catalog, loading, error, refetch: fetchCatalog };
};
