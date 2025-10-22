import Filters, { type SpeciesValue } from "@/components/store/Filters";
import { FeaturedTile, Tile, PetTileItem } from "@/components/store/Tiles";
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
  // Shared banner + base state for catalog loading
  const { showBanner } = useGlobalContext();
  const [pets, setPets] = useState<PetTileItem[]>([]);
  const [featuredPets, setFeaturedPets] = useState<PetTileItem[]>([]);
  const [selectedSpecies, setSelectedSpecies] =
    useState<SpeciesValue>("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

      const nextFeatured: PetTileItem[] = [];
      const nextPets: PetTileItem[] = [];

      payload.data.forEach((pet) => {
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
  }, [showBanner]);

  // Initial load on mount
  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

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
      <Tile item={item} onPress={() => {}} />
    </View>
  );

  // Renderer for cards inside the featured carousel
  const renderFeaturedItem = useCallback(
    ({ item }: { item: PetTileItem }) => (
      <View style={{ marginRight: 16 }}>
        <FeaturedTile item={item} onPress={() => {}} />
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
          <ActivityIndicator size="large" color="#2563eb" />
          <Text className="mt-3 text-sm text-black-300">
            Loading catalog…
          </Text>
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
          <><View>
            {featuredShowcasePets.length > 0 && (
              <><View className="px-7 pt-3">
                <Text className="text-2xl font-bold text-black-300">
                  Featured Companions
                </Text>
                <Text className="text-sm text-black-200 mt-1 mb-4">
                  Meet the rarest companions available in the store.
                </Text>
              </View><FlatList
                  data={featuredShowcasePets}
                  keyExtractor={keyExtractor}
                  renderItem={renderFeaturedItem}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingLeft: 24, paddingRight: 20, paddingBottom: 20 }} /></>

            )}
            <View className="px-7">
              <View className="flex-row items-center justify-between">
                <Text className="text-2xl font-bold text-black-300">
                  All Pets
                </Text>
                <TouchableOpacity onPress={toggleSortOrder} activeOpacity={0.7}>
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
                Browse every companion available in the store.
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
