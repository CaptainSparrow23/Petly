import { useCallback, useEffect, useState } from "react";
import Constants from "expo-constants";
import { ImageSourcePropType } from "react-native";

const API_BASE_URL = Constants.expoConfig?.extra?.backendUrl as string;

export interface PetItem {
  id: string;
  name: string;
  type: string;
  rating: number;
  image: ImageSourcePropType;
}

interface OwnedPetsResponse {
  success: boolean;
  data?: PetItem[];
  message?: string;
}

interface UsePetsOptions {
  /** When false, the hook exposes state but leaves fetching to the caller. */
  autoFetch?: boolean;
}

interface UsePetsParams {
  ownedPets?: string[] | null;
  selectedPet?: string | null;
  userId?: string;
  options?: UsePetsOptions;
}

/**
 * Fetch owned pets metadata from the backend and handle pet selection
 */
export const usePets = ({
  ownedPets,
  selectedPet,
  userId,
  options,
}: UsePetsParams) => {
  const [pets, setPets] = useState<PetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [focusedPet, setFocusedPet] = useState<string | null>(selectedPet ?? null);
  const [isSaving, setIsSaving] = useState(false);

  // Keep local selection in sync if the profile changes elsewhere
  useEffect(() => {
    if (selectedPet && selectedPet !== focusedPet) {
      setFocusedPet(selectedPet);
    }
  }, [selectedPet]);

  // Shared fetch helper so callers can trigger a reload manually.
  const fetchPets = useCallback(async (ownedPetIds: string[], signal?: AbortSignal) => {
    if (!API_BASE_URL) {
      const message = "Backend URL not configured";
      setError(message);
      setPets([]);
      setLoading(false);
      return;
    }

    if (!ownedPetIds || ownedPetIds.length === 0) {
      setPets([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/api/pets/owned`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ownedPets: ownedPetIds }),
        signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const payload: OwnedPetsResponse = await response.json();
      if (!payload.success || !Array.isArray(payload.data)) {
        throw new Error(payload.message || "Failed to load pets");
      }

      setPets(payload.data);
    } catch (err) {
      if (signal?.aborted) return;
      const message =
        err instanceof Error ? err.message : "Unable to load pets";
      setError(message);
      setPets([]);
    } finally {
      if (signal?.aborted) return;
      setLoading(false);
    }
  }, []);

  const autoFetch = options?.autoFetch ?? true;

  // Kick off the initial fetch unless the caller opted out.
  useEffect(() => {
    if (!autoFetch || !ownedPets || ownedPets.length === 0) {
      if (!ownedPets || ownedPets.length === 0) {
        setPets([]);
        setLoading(false);
      }
      return;
    }
    const controller = new AbortController();
    void fetchPets(ownedPets, controller.signal);
    return () => controller.abort();
  }, [autoFetch, fetchPets, ownedPets]);

  const refetch = useCallback(() => {
    if (ownedPets && ownedPets.length > 0) {
      return fetchPets(ownedPets);
    }
  }, [fetchPets, ownedPets]);

  // Persist selected pet to backend
  const persistSelectedPet = useCallback(
    async (petId: string) => {
      if (!userId) throw new Error('Missing user id for pet update.');
      if (!API_BASE_URL) throw new Error('Backend URL is not configured.');

      const res = await fetch(`${API_BASE_URL}/api/pets/update_pet/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ petId }),
      });

      let json: any = null;
      try {
        json = await res.json();
      } catch {
        // ignore parse errors; rely on status
      }
      if (!res.ok || !json?.success) {
        const msg = json?.error || json?.message || `Request failed with status ${res.status}`;
        throw new Error(msg);
      }
    },
    [userId]
  );

  // Save the selected pet
  const saveSelectedPet = useCallback(
    async (petIdToSave: string, onSuccess?: () => void, onError?: (error: string) => void) => {
      if (isSaving) return;
      
      const changed = !!petIdToSave && petIdToSave !== selectedPet;
      if (!changed || !petIdToSave) {
        onSuccess?.();
        return;
      }

      setIsSaving(true);

      try {
        await persistSelectedPet(petIdToSave);
        onSuccess?.();
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to update pet';
        onError?.(errorMsg);
        // Rollback to previous selection
        setFocusedPet(selectedPet ?? null);
      } finally {
        setIsSaving(false);
      }
    },
    [isSaving, persistSelectedPet, selectedPet]
  );

  return {
    pets,
    loading,
    error,
    refetch,
    focusedPet,
    setFocusedPet,
    isSaving,
    saveSelectedPet,
  };
};
