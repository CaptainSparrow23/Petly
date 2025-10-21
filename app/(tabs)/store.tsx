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

const PRIMARY_BLUE = "#2563eb";

const rarityRank: Record<PetTileItem["rarity"], number> = {
  common: 0,
  rare: 1,
  epic: 2,
  legendary: 3,
};

const API_BASE_URL = Constants.expoConfig?.extra?.backendUrl as string;

interface StoreCatalogResponse {
  success: boolean;
  data?: PetTileItem[];
  message?: string;
}

const Store = () => {
  const { showBanner } = useGlobalContext();
  const [pets, setPets] = useState<PetTileItem[]>([]);
  const [featuredPets, setFeaturedPets] = useState<PetTileItem[]>([]);
  const [selectedSpecies, setSelectedSpecies] =
    useState<SpeciesValue>("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      setFeaturedPets([]);

      const response = await fetch(`${API_BASE_URL}/api/store/catalog`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const payload: StoreCatalogResponse = await response.json();
      if (!payload.success || !Array.isArray(payload.data)) {
        throw new Error(payload.message || "Failed to load catalog");
      }

      setPets(payload.data);

      const legendaryFromCatalog = payload.data.filter(
        (pet) => pet.rarity === "legendary"
      );

      if (legendaryFromCatalog.length) {
        setFeaturedPets(legendaryFromCatalog);
      } else {
        try {
          const legendaryResponse = await fetch(
            `${API_BASE_URL}/api/store/legendary`
          );

          if (!legendaryResponse.ok) {
            throw new Error(`HTTP ${legendaryResponse.status}`);
          }

          const legendaryPayload: StoreCatalogResponse =
            await legendaryResponse.json();

          if (
            legendaryPayload.success &&
            Array.isArray(legendaryPayload.data)
          ) {
            setFeaturedPets(legendaryPayload.data);
          } else {
            setFeaturedPets([]);
          }
        } catch (legendaryError) {
          console.warn("Failed to load legendary catalog:", legendaryError);
          setFeaturedPets([]);
        }
      }
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

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  const renderTile = ({
    item,
    index,
  }: {
    item: PetTileItem;
    index: number;
  }) => (
    <View
      style={{
        flexBasis: "48%",
        maxWidth: "48%",
        marginRight: index % 2 === 0 ? 12 : 0,
        marginLeft: index % 2 !== 0 ? 12 : 0,
        marginTop: index < 2 ? 12 : 16,
        marginBottom: 16,
      }}
    >
      <Tile item={item} onPress={() => {}} />
    </View>
  );

  const renderFeaturedItem = useCallback(
    ({ item }: { item: PetTileItem }) => (
      <View style={{ marginRight: 16 }}>
        <FeaturedTile item={item} onPress={() => {}} />
      </View>
    ),
    []
  );

  const featuredKeyExtractor = useCallback((item: PetTileItem) => item.id, []);

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

  const featuredShowcasePets = useMemo(() => {
    if (!featuredPets.length) {
      return [];
    }

    const chunkSize = 5;
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

  const listHeader = useMemo(
    () => (
      <View className="px-6 pb-4">
        {featuredShowcasePets.length > 0 && (
          <View className="mb-6">
            <Text className="text-2xl font-rubik-bold text-black-300">
              Featured Companions
            </Text>
            <Text className="text-sm text-black-200 mt-1 mb-4">
              Meet the rarest companions available in the store.
            </Text>
            <FlatList
              data={featuredShowcasePets}
              keyExtractor={featuredKeyExtractor}
              renderItem={renderFeaturedItem}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 16 }}
            />
          </View>
        )}
        <View className="flex-row items-center justify-between">
          <Text className="text-2xl font-rubik-bold text-black-300">
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
        <View className="mt-4">
          <Filters
            selectedSpecies={selectedSpecies}
            onSpeciesChange={setSelectedSpecies}
          />
        </View>
      </View>
    ),
    [
      featuredKeyExtractor,
      featuredShowcasePets,
      renderFeaturedItem,
      selectedSpecies,
      sortOrder,
      toggleSortOrder,
    ]
  );

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
    <View className="flex-1 bg-white px-2">
      <FlatList
        data={visiblePets}
        keyExtractor={(item) => item.id}
        renderItem={renderTile}
        numColumns={2}
        ListHeaderComponent={listHeader}
        columnWrapperStyle={{
          paddingHorizontal: 24,
          paddingBottom: 6,
          justifyContent: "space-between",
        }}
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: 32,
          paddingTop: 20,
        }}
        ListEmptyComponent={EmptyState}
      />
    </View>
  );
};

export default Store;
