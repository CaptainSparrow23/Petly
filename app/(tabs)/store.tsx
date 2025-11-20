import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import Constants from "expo-constants";
import { ScrollView, SheetManager } from "react-native-actions-sheet";

import Filters, { type SpeciesValue } from "@/components/store/Filters";
import { Tile, PetTileItem } from "@/components/store/Tiles";
import { useStoreCatalog } from "@/hooks/useStore";
import { useGlobalContext } from "@/lib/GlobalProvider";
import CoinBadge from "@/components/other/CoinBadge";
import { Scroll } from "lucide-react-native";
import { CoralPalette } from "@/constants/colors";

const API_BASE_URL = Constants.expoConfig?.extra?.backendUrl as string;

// layout constants
const HORIZONTAL_PADDING = 24; // matches header px-6
const HORIZONTAL_GAP = 20;
const VERTICAL_GAP = 20;

const Store = () => {
  const { userProfile, updateUserProfile } = useGlobalContext();
  const { width } = useWindowDimensions();

  // perfect pixel width per tile
  const itemWidth = Math.floor(
    (width - HORIZONTAL_PADDING * 2 - HORIZONTAL_GAP) / 2
  );

  const {
    availablePets,
    loading,
    error,
    refetch: refetchCatalog,
  } = useStoreCatalog(userProfile?.ownedPets, { autoFetch: false });

  const [selectedSpecies, setSelectedSpecies] = useState<SpeciesValue>("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [recentlyPurchasedPetName, setRecentlyPurchasedPetName] =
    useState<string | null>(null);

  // refresh data when screen gains focus
  useFocusEffect(
    useCallback(() => {
      void refetchCatalog();
      return undefined;
    }, [refetchCatalog])
  );

  // confirm purchase flow
  const handleConfirmPurchase = useCallback(
    async (pet: PetTileItem) => {
      try {
        if (userProfile?.coins && userProfile.coins < pet.priceCoins) {
          await SheetManager.hide("store-confirmation");
          setTimeout(() => {
            void SheetManager.show("store-insufficient", {
              payload: {
                petName: pet.name,
                onCloseRequest: () => void SheetManager.hide("store-insufficient"),
                onGetMoreCoins: () => {},
                onClosed: () => {},
              },
            });
          }, 0);
          return;
        }

        const userId = userProfile?.userId;
        if (!API_BASE_URL || !userId) {
          throw new Error("We couldn't complete your purchase. Please try again shortly.");
        }

        const response = await fetch(
          `${API_BASE_URL}/api/store/purchase/${userId}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ petId: pet.id, priceCoins: pet.priceCoins }),
          }
        );

        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload?.success) {
          throw new Error(payload?.error || payload?.message || "Purchase failed");
        }

        setRecentlyPurchasedPetName(pet.name);

        // update user profile locally
        updateUserProfile({
          coins: Math.max(0, (userProfile?.coins ?? 0) - pet.priceCoins),
          ownedPets: userProfile?.ownedPets.includes(pet.id)
            ? userProfile?.ownedPets
            : [...(userProfile?.ownedPets || []), pet.id],
        });

        void refetchCatalog();
        await SheetManager.hide("store-confirmation");

        setTimeout(() => {
          void SheetManager.show("store-success", {
            payload: {
              petName: pet.name,
              onCloseRequest: () => void SheetManager.hide("store-success"),
              onClosed: () => {
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
        console.warn("[Store]", message);
        throw new Error(message);
      }
    },
    [
      userProfile?.coins,
      userProfile?.ownedPets,
      updateUserProfile,
      refetchCatalog,
      userProfile?.userId,
    ]
  );

  const handlePurchasePress = useCallback(
    (pet: PetTileItem) => {
      void SheetManager.show("store-confirmation", {
        payload: {
          petName: pet.name,
          petPrice: pet.priceCoins,
          onConfirm: () => handleConfirmPurchase(pet),
          onCancel: () => void SheetManager.hide("store-confirmation"),
        },
      });
    },
    [handleConfirmPurchase]
  );

  const handleTilePress = useCallback(
    (pet: PetTileItem) => {
      setRecentlyPurchasedPetName(null);
      void SheetManager.show("store-preview", {
        payload: {
          pet,
          onPurchase: handlePurchasePress,
          onClosed: () => setRecentlyPurchasedPetName(null),
        },
      });
    },
    [handlePurchasePress]
  );

  const renderTile = useCallback(
    ({ item }: { item: PetTileItem }) => (
      <View style={{ width: itemWidth, flexGrow: 0 }}>
        <Tile item={item} onPress={() => handleTilePress(item)} />
      </View>
    ),
    [handleTilePress, itemWidth]
  );

  const keyExtractor = useCallback((item: PetTileItem) => item.id, []);

  const visiblePets = useMemo(() => {
    const filtered =
      selectedSpecies === "all"
        ? availablePets
        : availablePets.filter((pet) => pet.species === selectedSpecies);

    return [...filtered].sort((a, b) =>
      sortOrder === "asc"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name)
    );
  }, [availablePets, selectedSpecies, sortOrder]);

  const toggleSortOrder = useCallback(() => {
    setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
  }, []);

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#191d31" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <Text className="text-base font-medium text-black-300">
          Something went wrong
        </Text>
        <Text className="text-sm text-black-200 mt-2 text-center">{error}</Text>
      </View>
    );
  }

  const EmptyState = () => (
    <View className="flex-1 bg-white items-center justify-center px-6">
      <Text className="text-base font-medium text-white-300">
        No pets found
      </Text>
      <Text className="text-sm text-white-200 mt-2 text-center">
        Check back later for new companions.
      </Text>
    </View>
  );

  return (
    <View className="flex-1" style={{ backgroundColor: CoralPalette.surface }}>
      <CoinBadge />

      <ScrollView
      showsVerticalScrollIndicator={false}>
        <View className="pt-3 mt-3 ml-2" style={{ backgroundColor: "transparent" }}>
          <View className="px-6">
            <View className="flex-row items-center justify-between">
              <Text className="text-2xl font-bold" style={{ color: CoralPalette.dark }}>
                All Pets
              </Text>
              <TouchableOpacity onPress={toggleSortOrder} activeOpacity={0.7}>
                <Text className="text-sm font-semibold" style={{ color: CoralPalette.dark }}>
                  {sortOrder === "asc" ? "Sort: A → Z" : "Sort: Z → A"}
                </Text>
              </TouchableOpacity>
            </View>
            <Text className="text-sm font-semibold mt-1" style={{ color: CoralPalette.mutedDark }}>
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

        {/* grid */}
        <FlatList
          className="mt-5"
          data={visiblePets}
          keyExtractor={keyExtractor}
          renderItem={renderTile}
          numColumns={2}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
        ListEmptyComponent={EmptyState}
        contentContainerStyle={{
          paddingHorizontal: HORIZONTAL_PADDING,
          paddingTop: 8,
          paddingBottom: 32,
        }}
        columnWrapperStyle={{
          columnGap: HORIZONTAL_GAP,
          justifyContent: "flex-start",
        }}
        ItemSeparatorComponent={() => <View style={{ height: VERTICAL_GAP }} />}
      />
      </ScrollView>
    </View>
  );
};

export default Store;
