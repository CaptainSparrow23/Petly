import Filters, { type SpeciesValue } from "@/components/store/Filters";
import {
  FeaturedTile,
  Tile,
  PetTileItem,
} from "@/components/store/Tiles";
import { useGlobalContext } from "@/lib/global-provider";
import Constants from "expo-constants";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  InsufficientCoinsModal,
  PetPreviewModal,
  PurchaseSuccessModal,
} from "@/components/store/StoreModals";

// Accent color for interactive text links
const PRIMARY_BLUE = "#2563eb";

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
  const { showBanner, refetch, coins, userProfile, ownedPets } =
    useGlobalContext();
  const [pets, setPets] = useState<PetTileItem[]>([]);
  const [featuredPets, setFeaturedPets] = useState<PetTileItem[]>([]);
  const [selectedSpecies, setSelectedSpecies] = useState<SpeciesValue>("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPet, setSelectedPet] = useState<PetTileItem | null>(null);
  const [showInsufficientCoinsModal, setShowInsufficientCoinsModal] =
    useState(false);
  const [showPurchaseSuccessModal, setShowPurchaseSuccessModal] =
    useState(false);
  const [isPurchasingPet, setIsPurchasingPet] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [insufficientPet, setInsufficientPet] = useState<PetTileItem | null>(
    null
  );
  const [recentlyPurchasedPetName, setRecentlyPurchasedPetName] =
    useState<string | null>(null);

  // Fetch catalog data and split legendary pets into the featured rail
  const fetchCatalog = useCallback(async () => {
    if (!API_BASE_URL) {
      const message = "Backend URL not configured";
      setError(message);
      showBanner(`Store error: ${message}`, "error");
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

      const ownedLookup = Array.isArray(ownedPets) ? new Set(ownedPets) : null;
      const nextFeatured: PetTileItem[] = [];
      const nextPets: PetTileItem[] = [];

      payload.data.forEach((pet) => {
        if (ownedLookup?.has(pet.id)) {
          return;
        }

        if (pet.rarity === "legendary") {
          nextFeatured.push(pet);
        } else {
          nextPets.push(pet);
        }
      });

      setPets(nextPets);
      setFeaturedPets(nextFeatured);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to load store catalog";
      setError(message);
      showBanner(`Store error: ${message}`, "error");
      setFeaturedPets([]);
    } finally {
      setLoading(false);
    }
  }, [ownedPets]);

  // Initial load on mount
  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  // Open the detail modal when a tile is tapped
  const handleTilePress = useCallback((pet: PetTileItem) => {
    setSelectedPet(pet);
    setPurchaseError(null);
  }, []);

  const dismissPreview = useCallback(() => {
    setSelectedPet(null);
    setPurchaseError(null);
    setIsPurchasingPet(false);
    setInsufficientPet(null);
  }, []);

  // Kick off the purchase flow for the currently selected pet
  const purchasePet = useCallback(async () => {
    const petToPurchase = selectedPet;
    if (!petToPurchase) {
      return;
    }

    if (coins < petToPurchase.priceCoins) {
      setInsufficientPet(petToPurchase);
      setShowInsufficientCoinsModal(true);
      setSelectedPet(null);
      return;
    }

    const userId = userProfile?.userId;
    if (!API_BASE_URL || !userId) {
      const message =
        "We couldn't complete your purchase. Please try again shortly.";
      setPurchaseError(message);
      showBanner(message, "error");
      return;
    }

    setPurchaseError(null);
    setIsPurchasingPet(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/store/purchase/${userId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            petId: petToPurchase.id,
            priceCoins: petToPurchase.priceCoins,
          }),
        }
      );

      const payload: {
        success?: boolean;
        message?: string;
        error?: string;
      } | null = await response.json().catch(() => null);

      if (!response.ok || !payload?.success) {
        throw new Error(
          payload?.error || payload?.message || "Purchase failed"
        );
      }

      setRecentlyPurchasedPetName(petToPurchase.name);
      setSelectedPet(null);
      setShowPurchaseSuccessModal(true);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "We could not complete your purchase. Please try again.";
      setPurchaseError(message);
      showBanner(message, "error");
    } finally {
      setIsPurchasingPet(false);
    }
  }, [coins, selectedPet, showBanner, userProfile?.userId]);

  const handleCloseInsufficientCoinsModal = useCallback(() => {
    setShowInsufficientCoinsModal(false);
    setTimeout(() => {
      setInsufficientPet(null);
    }, 200);
  }, []);

  const handleGetMoreCoins = useCallback(() => {
    setShowInsufficientCoinsModal(false);
    showBanner("Coin top-ups coming soon.", "info");
    setTimeout(() => {
      setInsufficientPet(null);
    }, 200);
  }, [showBanner]);

  const handleCloseSuccessModal = useCallback(() => {
    const purchasedName = recentlyPurchasedPetName;
    setShowPurchaseSuccessModal(false);
    dismissPreview();
    if (purchasedName) {
      void refetch();
    }
    setTimeout(() => {
      setRecentlyPurchasedPetName(null);
    }, 250);
  }, [dismissPreview, recentlyPurchasedPetName, refetch]);

  // Compute grid spacing for the two-column layout
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

  // Renderer for standard catalog tiles
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

  // Renderer for cards inside the featured carousel
  const renderFeaturedItem = useCallback(
    ({ item }: { item: PetTileItem }) => (
      <View style={{ marginRight: 16 }}>
        <FeaturedTile item={item} onPress={() => handleTilePress(item)} />
      </View>
    ),
    []
  );

  // Stable key extractor for both lists
  const keyExtractor = useCallback((item: PetTileItem) => item.id, []);

  // Filter by species + sort by rarity/name for the grid
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

  // Toggle between ascending/descending rarity order
  const toggleSortOrder = useCallback(() => {
    setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
  }, []);

  // Rotate the featured carousel daily so longer lists feel fresh
  const featuredShowcasePets = useMemo(() => {
    if (!featuredPets.length) {
      return [];
    }

    const chunkSize = 4;
    const sorted = [...featuredPets].sort((a, b) => a.id.localeCompare(b.id));
    if (sorted.length <= chunkSize) {
      return sorted;
    }

    const totalChunks = Math.ceil(sorted.length / chunkSize);
    const dayIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    const chunkIndex = dayIndex % totalChunks;
    const start = chunkIndex * chunkSize;
    const slice = sorted.slice(start, start + chunkSize);

    if (slice.length === chunkSize) {
      return slice;
    }

    return [...slice, ...sorted.slice(0, chunkSize - slice.length)];
  }, [featuredPets]);

  // Loading + error gates before rendering the list
  if (loading) {
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

  // Message shown when filters eliminate every pet
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
      <FlatList
        data={visiblePets}
        keyExtractor={keyExtractor}
        renderItem={renderTile}
        numColumns={2}
        ListHeaderComponent={
          <>
            <View>
              {featuredShowcasePets.length > 0 && (
                <>
                  <View className="px-7 pt-3">
                    <Text className="text-2xl font-bold text-black-300">
                      Featured Companions
                    </Text>
                    <Text className="text-sm text-black-200 mt-1 mb-4">
                      Available for a limited time only.
                    </Text>
                  </View>
                  <FlatList
                    data={featuredShowcasePets}
                    keyExtractor={keyExtractor}
                    renderItem={renderFeaturedItem}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{
                      paddingLeft: 24,
                      paddingRight: 20,
                      paddingBottom: 20,
                    }}
                  />
                </>
              )}
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
                      className="text-sm font-rubik-medium"
                      style={{ color: PRIMARY_BLUE }}
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
      <PetPreviewModal
        pet={selectedPet}
        visible={!!selectedPet}
        onClose={dismissPreview}
        onPurchase={purchasePet}
        isPurchasing={isPurchasingPet}
        purchaseError={purchaseError}
      />
      <InsufficientCoinsModal
        visible={showInsufficientCoinsModal}
        petName={insufficientPet?.name}
        onClose={handleCloseInsufficientCoinsModal}
        onGetMoreCoins={handleGetMoreCoins}
      />
      <PurchaseSuccessModal
        visible={showPurchaseSuccessModal}
        petName={recentlyPurchasedPetName}
        onClose={handleCloseSuccessModal}
      />
    </View>
  );
};

export default Store;
