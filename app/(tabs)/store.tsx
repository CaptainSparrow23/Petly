import Filters, { type SpeciesValue } from "@/components/store/Filters";
import {
  Tile,
  PetTileItem,
} from "@/components/store/Tiles";
import { useGlobalContext } from "@/lib/global-provider";
import Constants from "expo-constants";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SheetManager } from "react-native-actions-sheet";
import { useFocusEffect } from "@react-navigation/native";

// Simple rarity ordering used for sorting the catalog grid
const rarityRank: Record<PetTileItem["rarity"], number> = {
  common: 0,
  rare: 1,
  epic: 2,
  legendary: 3,
};

// Backend endpoint injected via Expo config
const API_BASE_URL = Constants.expoConfig?.extra?.backendUrl as string;

interface StoreCatalogResponse {
  success: boolean;
  data?: PetTileItem[];
  message?: string;
}

const Store = () => {
  const { refetch, coins, userProfile, ownedPets, updateUserProfile } =
    useGlobalContext();

  const [pets, setPets] = useState<PetTileItem[]>([]);
  const [selectedSpecies, setSelectedSpecies] = useState<SpeciesValue>("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [recentlyPurchasedPetName, setRecentlyPurchasedPetName] =
    useState<string | null>(null);

  // Fetch the latest catalog from the backend and filter out pets the user already owns.
  const fetchCatalog = useCallback(
    async (signal?: AbortSignal) => {
      if (!API_BASE_URL) {
        const message = "Backend URL not configured";
        setError(message);
        console.warn("[Store] ", `Store error: ${message}`);
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

        const ownedIds = new Set(ownedPets ?? []);
        setPets(payload.data.filter((pet) => !ownedIds.has(pet.id)));
      } catch (err) {
        if (signal?.aborted) return;
        const message =
          err instanceof Error ? err.message : "Unable to load store catalog";
        setError(message);
        console.warn("[Store] ", `Store error: ${message}`);
      } finally {
        if (signal?.aborted) return;
        setLoading(false);
      }
    },
    [ownedPets]
  );

  // Refresh the catalog whenever the store tab gains focus.
  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController();
      void fetchCatalog(controller.signal);
      return () => {
        controller.abort();
      };
    }, [fetchCatalog])
  );

  // Handle the full purchase flow for the currently previewed pet.
  const handleConfirmPurchase = useCallback(async (pet: PetTileItem) => {
    try {
      if (coins < pet.priceCoins) {
        await SheetManager.hide("store-confirmation");
        // Allow the confirmation sheet to close before presenting the insufficient coins sheet.
        setTimeout(() => {
          void SheetManager.show("store-insufficient", {
            payload: {
              petName: pet.name,
              onCloseRequest: () => {
                void SheetManager.hide("store-insufficient");
              },
              onGetMoreCoins: () => {},
              onClosed: () => {},
            },
        });
      }, 0);
      return;
    }

      const userId = userProfile?.userId;
      if (!API_BASE_URL || !userId) {
        const message =
          "We couldn't complete your purchase. Please try again shortly.";
        console.warn("[Store] ", message);
        throw new Error(message);
      }

      const response = await fetch(
        `${API_BASE_URL}/api/store/purchase/${userId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            petId: pet.id,
            priceCoins: pet.priceCoins,
          }),
        },
      );

      const payload: {
        success?: boolean;
        message?: string;
        error?: string;
      } | null = await response.json().catch(() => null);

      if (!response.ok || !payload?.success) {
        throw new Error(
          payload?.error || payload?.message || "Purchase failed",
        );
      }

      setRecentlyPurchasedPetName(pet.name);
      setPets((prev) => prev.filter((item) => item.id !== pet.id));
      updateUserProfile({
        coins: Math.max(0, coins - pet.priceCoins),
        ownedPets: ownedPets.includes(pet.id)
          ? ownedPets
          : [...ownedPets, pet.id],
      });
      await SheetManager.hide("store-confirmation");
      // Queue the success sheet so it appears after the confirmation sheet finishes closing.
      setTimeout(() => {
        void SheetManager.show("store-success", {
          payload: {
            petName: pet.name,
            onCloseRequest: () => {
              void SheetManager.hide("store-success");
            },
            onClosed: () => {
              if (recentlyPurchasedPetName) {
                void refetch();
              }
              void SheetManager.hide("store-preview");
              setRecentlyPurchasedPetName(null);
            },
          },
        });
      }, 0);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "We could not complete your purchase. Please try again.";
      console.warn("[Store] ", message);
      throw new Error(message);
    }
  }, [
    coins,
    ownedPets,
    recentlyPurchasedPetName,
    refetch,
    updateUserProfile,
    userProfile?.userId,
  ]);

  // Open the confirmation sheet for the tapped pet.
  const handlePurchasePress = useCallback((pet: PetTileItem) => {
    void SheetManager.show("store-confirmation", {
      payload: {
        petName: pet.name,
        petPrice: pet.priceCoins,
        onConfirm: () => handleConfirmPurchase(pet),
        onCancel: () => {
          void SheetManager.hide("store-confirmation");
        },
      },
    });
  }, [handleConfirmPurchase]);

  // Show the pet details preview sheet when a tile is pressed.
  const handleTilePress = useCallback((pet: PetTileItem) => {
    setRecentlyPurchasedPetName(null);
    void SheetManager.show("store-preview", {
      payload: {
        pet,
        onPurchase: handlePurchasePress,
        onClosed: () => {
          setRecentlyPurchasedPetName(null);
        },
      },
    });
  }, [handlePurchasePress]);

  const tileContainerStyle = useCallback((index: number) => {
    const baseSpacing = {
      flexBasis: "48%",
      maxWidth: "48%",
      marginBottom: 16,
    } as const;

    const isLeftColumn = index % 2 === 0;
    const marginTop = index < 2 ? 12 : 16;

    return {
      ...baseSpacing,
      marginRight: isLeftColumn ? 12 : 0,
      marginLeft: isLeftColumn ? 0 : 12,
      marginTop,
    };
  }, []);

  const renderTile = ({
    item,
    index,
  }: {
    item: PetTileItem;
    index: number;
  }) => (
    <View style={tileContainerStyle(index)}>
      <Tile item={item} onPress={() => handleTilePress(item)} />
    </View>
  );

  const keyExtractor = useCallback((item: PetTileItem) => item.id, []);

  // Apply species filtering and rarity sorting before rendering.
  const visiblePets = useMemo(() => {
    const narrowed =
      selectedSpecies === "all"
        ? pets
        : pets.filter((pet) => pet.species === selectedSpecies);

    return [...narrowed].sort((a, b) => {
      const diff = rarityRank[a.rarity] - rarityRank[b.rarity];
      if (diff === 0) {
        return a.name.localeCompare(b.name);
      }
      return sortOrder === "asc" ? diff : -diff;
    });
  }, [pets, selectedSpecies, sortOrder]);

  const toggleSortOrder = useCallback(() => {
    setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
  }, []);

  if (loading) {
    // Loading state: show a centered spinner while the catalog fetch is in flight.
    return (
      <View className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#191d31" />
          <Text className="mt-3 text-sm text-black-300">Loading catalog…</Text>
        </View>
      </View>
    );
  }

  if (error) {
    // Error state: surface the message in a simple fallback view.
    return (
      <View className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-base font-rubik-medium text-black-300">
            Something went wrong
          </Text>
          <Text className="text-sm text-black-200 mt-2 text-center">
            {error}
          </Text>
        </View>
      </View>
    );
  }

  // Empty-state fallback for when the filtered list has no pets.
  const EmptyState = () => (
    <View className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-base font-rubik-medium text-black-300">
          No pets found
        </Text>
        <Text className="text-sm text-black-200 mt-2 text-center">
          Check back later for new companions.
        </Text>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-white">
      {/* Main catalog grid */}
      <FlatList
        data={visiblePets}
        keyExtractor={keyExtractor}
        renderItem={renderTile}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <View>
              <View className="px-7">
                <View className="flex-row items-center justify-between">
                  <Text className="text-2xl font-bold text-black-300">
                    All Pets
                  </Text>
                  <TouchableOpacity
                    onPress={toggleSortOrder}
                    activeOpacity={0.7}
                  >
                    <Text
                      className="text-sm font-rubik-medium text-gray-600"
                    >
                      {sortOrder === "desc"
                        ? "Sort: High → Low"
                        : "Sort: Low → High"}
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text className="text-sm text-black-200 mt-1">
                  Browse every pet available in the store.
                </Text>
              </View>
              <View className="mt-3 mb-2">
                <Filters
                  selectedSpecies={selectedSpecies}
                  onSpeciesChange={setSelectedSpecies}
                />
              </View>
            </View>
          </>
        }
        columnWrapperStyle={{
          paddingHorizontal: 24,
          paddingBottom: 6,
          justifyContent: "space-between",
        }}
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: 32,
          paddingTop: 8,
        }}
        ListEmptyComponent={EmptyState}
      />
    </View>
  );
};

export default Store;
