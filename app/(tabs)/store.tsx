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

import Filters, { type CategoryValue } from "@/components/store/Filters";
import { Tile, StoreItem } from "@/components/store/Tiles";
import { useStoreCatalog } from "@/hooks/useStore";
import { useGlobalContext } from "@/lib/GlobalProvider";
import CoinBadge from "@/components/other/CoinBadge";
import { ArrowUpDown } from "lucide-react-native";
import { CoralPalette } from "@/constants/colors";

const API_BASE_URL = Constants.expoConfig?.extra?.backendUrl as string;
const FONT = { fontFamily: "Nunito" };

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

  const [selectedCategory, setSelectedCategory] = useState<CategoryValue>("Pet");
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
    async (pet: StoreItem) => {
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
    (pet: StoreItem) => {
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
    (pet: StoreItem) => {
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
    ({ item }: { item: StoreItem }) => (
      <View style={{ width: itemWidth, flexGrow: 0 }}>
        <Tile item={item} onPress={() => handleTilePress(item)} />
      </View>
    ),
    [handleTilePress, itemWidth]
  );

  const keyExtractor = useCallback((item: StoreItem) => item.id, []);

  const visibleItems = useMemo(() => {
    const filtered =
      selectedCategory === "all"
        ? availablePets
        : availablePets.filter((item) => item.category === selectedCategory);

    return [...filtered].sort((a, b) =>
      sortOrder === "asc"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name)
    );
  }, [availablePets, selectedCategory, sortOrder]);

  const toggleSortOrder = useCallback(() => {
    setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
  }, []);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: CoralPalette.surface }}>
        <ActivityIndicator size="large" color={CoralPalette.primary} />
        <Text className="mt-3 text-base font-semibold" style={[{ color: CoralPalette.dark }, FONT]}>
          Loading the store...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: CoralPalette.surface }}>
        <Text className="text-lg font-extrabold text-center" style={[{ color: CoralPalette.dark }, FONT]}>
          We hit a snag
        </Text>
        <Text className="text-sm mt-2 text-center" style={[{ color: CoralPalette.mutedDark, lineHeight: 20 }, FONT]}>
          {error}
        </Text>
      </View>
    );
  }

  const EmptyState = () => (
    <View className="flex-1 items-center justify-center px-6">
      <Text className="text-base font-bold" style={[{ color: CoralPalette.dark }, FONT]}>
        No items found
      </Text>
      <Text className="text-sm mt-2 text-center" style={[{ color: CoralPalette.mutedDark, lineHeight: 20 }, FONT]}>
        Check back later for more pets and accessories.
      </Text>
    </View>
  );

  return (
    <View className="flex-1 relative" style={{ backgroundColor: CoralPalette.surfaceAlt }}>
      <CoinBadge />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32, paddingTop: 16 }}>
        <View className="px-6 flex-row items-start justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-xs font-extrabold uppercase" style={[{ color: CoralPalette.primaryMuted, letterSpacing: 1 }, FONT]}>
              Petly store
            </Text>
            <Text className="text-3xl font-extrabold mt-2" style={[{ color: CoralPalette.dark }, FONT]}>
              Pets and accessories
            </Text>
            <Text className="text-sm mt-1" style={[{ color: CoralPalette.mutedDark, lineHeight: 20 }, FONT]}>
              Browse buddies plus hats, collars, and gadgets to style them.
            </Text>
          </View>

          <TouchableOpacity
            onPress={toggleSortOrder}
            activeOpacity={0.85}
            className="flex-row items-center mt-1"
          >
            <ArrowUpDown size={18} color={CoralPalette.primary} />
            <Text className="ml-2 text-sm font-bold" style={[{ color: CoralPalette.dark }, FONT]}>
              {sortOrder === "asc" ? "Sort A → Z" : "Sort Z → A"}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="px-6 mt-5">
          <Filters
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
        </View>

        {/* grid */}
        <FlatList
          className="mt-5"
          data={visibleItems}
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
