import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Text,
  TouchableOpacity,
  View,
  Image,
  ScrollView,
  RefreshControl,
  useWindowDimensions,
  type DimensionValue,
  type ImageProps,
} from "react-native";
import Animated, { type AnimatedProps } from "react-native-reanimated";

// Typed wrapper for shared element transitions (Reanimated 4.x)
// sharedTransitionTag must be on Animated.Image directly, not a wrapper View
const SharedImage = Animated.Image as React.ComponentType<
  AnimatedProps<ImageProps> & { sharedTransitionTag?: string }
>;
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import Constants from "expo-constants";
import { SheetManager } from "react-native-actions-sheet";

import { Tile, type StoreCategory, type StoreItem } from "@/components/store/Tiles";
import Filters, { CategoryValue } from "@/components/store/Filters";
import { useStoreCatalog } from "@/hooks/useStore";
import { useGlobalContext } from "@/lib/GlobalProvider";
import { CoralPalette } from "@/constants/colors";
import images from "@/constants/images";
import { StoreTileSkeleton, Skeleton } from "@/components/other/Skeleton";
import StorePill, { type StoreTabValue } from "@/components/store/StorePill";

const API_BASE_URL = Constants.expoConfig?.extra?.backendUrl as string;
const FONT = { fontFamily: "Nunito" };

type OwnedField = "ownedPets" | "ownedHats" | "ownedCollars" | "ownedGadgets";

const EMPTY_OWNED_IDS: string[] = [];

const categoryToField: Record<StoreCategory, OwnedField> = {
  Pet: "ownedPets",
  Hat: "ownedHats",
  Collar: "ownedCollars",
  Gadget: "ownedGadgets",
};

interface FeaturedSet {
  id: string;
  title: string;
  description: string;
  artKey: string;
  items: StoreItem[];
}

// Custom image styles per featured set
// Adjust these values to position/scale each set's artwork
interface FeaturedImageStyle {
  widthPercent: DimensionValue; // e.g. "110%"
  heightMultiplier: number;     // multiplied by imageHeight
  translateY: number;           // multiplied by imageHeight (negative = move up)
  translateX?: number;          // optional horizontal offset
}

const FEATURED_IMAGE_STYLES: Record<string, FeaturedImageStyle> = {
  chef_set: {
    widthPercent: "120%",
    heightMultiplier: 1.18,
    translateY: -0.1,
    translateX: -50,
  },
  composer_set: {
    widthPercent: "120%",
    heightMultiplier: 1.18,
    translateY: -0.14,
    translateX: -30,
  },
  // Add more sets here as needed
};

const DEFAULT_IMAGE_STYLE: FeaturedImageStyle = {
  widthPercent: "110%",
  heightMultiplier: 1.18,
  translateY: -0.18,
};

type FeaturedTileProps = {
  featuredSet?: FeaturedSet;
  onPress: () => void;
};

const FeaturedTile = React.memo(function FeaturedTile({ featuredSet, onPress }: FeaturedTileProps) {
  const { width: screenWidth } = useWindowDimensions();
  
  const containerWidth = screenWidth - 24 - 20;
  const imageHeight = containerWidth * 0.53;
  const fixedHeight = imageHeight + 20 + 23 + 8;

  const artSource = featuredSet ? images[featuredSet.artKey as keyof typeof images] : null;
  const imageStyle = featuredSet ? (FEATURED_IMAGE_STYLES[featuredSet.id] ?? DEFAULT_IMAGE_STYLE) : DEFAULT_IMAGE_STYLE;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      disabled={!featuredSet}
      style={{
        backgroundColor: CoralPalette.white,
        borderRadius: 5,
        borderColor: CoralPalette.lightGrey,
        borderWidth: 1,
        padding: 10,
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 4 },
        elevation: 5,
        height: fixedHeight,
      }}
    >
      {featuredSet && artSource ? (
        <>
          <View style={{ borderRadius: 5, overflow: "hidden", height: imageHeight }}>
            <SharedImage 
              source={artSource}
              sharedTransitionTag={`featured-image-${featuredSet.id}`}
              style={{ 
                width: imageStyle.widthPercent, 
                height: imageHeight * imageStyle.heightMultiplier,
                transform: [
                  { translateY: imageHeight * imageStyle.translateY },
                  ...(imageStyle.translateX ? [{ translateX: imageStyle.translateX }] : []),
                ],
              }} 
              resizeMode="cover" 
            />
          </View>
          <Text 
            numberOfLines={1}
            ellipsizeMode="tail"
            style={[{ color: CoralPalette.mutedDark, fontSize: 15, fontWeight: "400", marginTop: 8}, FONT]}
          >
            {featuredSet.title}
          </Text>
        </>
      ) : (
        <>
          <Skeleton width="100%" height={imageHeight} radius={5} />
          <Skeleton width="60%" height={15} radius={4} style={{ marginTop: 8 }} />
        </>
      )}
    </TouchableOpacity>
  );
});

const Store = () => {
  const { width: screenWidth } = useWindowDimensions();
  const { userProfile, updateUserProfile } = useGlobalContext();
  const [selectedTab, setSelectedTab] = useState<StoreTabValue>("featured");
  const [selectedCategory, setSelectedCategory] = useState<CategoryValue>("all");
  const [featuredSets, setFeaturedSets] = useState<FeaturedSet[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch featured sets
  useEffect(() => {
    if (!API_BASE_URL) return;

    const controller = new AbortController();
    const fetchFeaturedSets = async (signal: AbortSignal) => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/store/featured`, { signal });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const payload = await response.json().catch(() => null);
        if (payload?.success && Array.isArray(payload?.data)) {
          setFeaturedSets(payload.data);
        }
      } catch (error) {
        if (!signal.aborted) console.warn("[Store] Error fetching featured sets:", error);
      }
    };

    void fetchFeaturedSets(controller.signal);
    return () => controller.abort();
  }, []);

  const ownedPets = userProfile?.ownedPets ?? EMPTY_OWNED_IDS;
  const ownedHats = userProfile?.ownedHats ?? EMPTY_OWNED_IDS;
  const ownedCollars = userProfile?.ownedCollars ?? EMPTY_OWNED_IDS;
  const ownedGadgets = userProfile?.ownedGadgets ?? EMPTY_OWNED_IDS;

  const ownedItems = useMemo(
    () => ({ ownedPets, ownedHats, ownedCollars, ownedGadgets }),
    [ownedPets, ownedHats, ownedCollars, ownedGadgets]
  );

  const ownedIdSet = useMemo(() => {
    return new Set([...ownedPets, ...ownedHats, ...ownedCollars, ...ownedGadgets]);
  }, [ownedPets, ownedHats, ownedCollars, ownedGadgets]);

  const { catalog, loading, error, refetch: refetchCatalog } = useStoreCatalog(ownedItems, { autoFetch: false });

  useFocusEffect(useCallback(() => { void refetchCatalog(); }, [refetchCatalog]));

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await refetchCatalog(); } finally { setRefreshing(false); }
  }, [refetchCatalog]);

  const filteredCatalog = useMemo(() => {
    const baseFiltered = catalog.filter(
      (item) => (item.category === "Hat" || item.category === "Collar") && !item.featured
    );
    if (selectedCategory === "all") return baseFiltered;
    return baseFiltered.filter((item) => item.category === selectedCategory);
  }, [catalog, selectedCategory]);

  // --- Purchase Handlers ---
  const userId = userProfile?.userId;
  const userCoins = userProfile?.coins ?? 0;

  const ownedByField = useMemo<Record<OwnedField, string[]>>(
    () => ({ ownedPets, ownedHats, ownedCollars, ownedGadgets }),
    [ownedPets, ownedHats, ownedCollars, ownedGadgets]
  );

  const handleConfirmPurchase = useCallback(
    async (item: StoreItem) => {
      try {
        if (!API_BASE_URL || !userId) {
          throw new Error("We couldn't complete your purchase. Please try again shortly.");
        }

        if (userCoins < item.priceCoins) {
          await SheetManager.hide("store-confirmation");
          setTimeout(() => {
            void SheetManager.show("store-insufficient", {
              payload: {
                petName: item.name,
                onCloseRequest: () => void SheetManager.hide("store-insufficient"),
                onGetMoreCoins: () => {},
                onClosed: () => {},
              },
            });
          }, 0);
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/store/purchase/${userId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ petId: item.id, priceCoins: item.priceCoins }),
        });

        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload?.success) {
          throw new Error(payload?.error || payload?.message || "Purchase failed");
        }

        const ownedField = categoryToField[item.category];
        const currentOwned = ownedByField[ownedField];
        updateUserProfile({
          coins: Math.max(0, userCoins - item.priceCoins),
          [ownedField]: currentOwned.includes(item.id) ? currentOwned : [...currentOwned, item.id],
        });

        void refetchCatalog();
        await SheetManager.hide("store-confirmation");

        setTimeout(() => {
          void SheetManager.show("store-success", {
            payload: {
              petName: item.name,
              onCloseRequest: () => void SheetManager.hide("store-success"),
              onClosed: () => void SheetManager.hide("store-preview"),
            },
          });
        }, 0);
      } catch (err) {
        const message = err instanceof Error ? err.message : "We could not complete your purchase. Please try again.";
        console.warn("[Store]", message);
        throw new Error(message);
      }
    },
    [ownedByField, updateUserProfile, refetchCatalog, userCoins, userId]
  );

  const handlePurchasePress = useCallback(
    (item: StoreItem) => {
      if (item.category === "Pet") return;
      void SheetManager.show("store-confirmation", {
        payload: {
          petName: item.name,
          petPrice: item.priceCoins,
          onConfirm: () => handleConfirmPurchase(item),
          onCancel: () => void SheetManager.hide("store-confirmation"),
        },
      });
    },
    [handleConfirmPurchase]
  );

  const handleTilePress = useCallback(
    (item: StoreItem) => {
      const isOwned = ownedIdSet.has(item.id);
      void SheetManager.show("store-preview", {
        payload: {
          pet: { ...item, owned: isOwned },
          onPurchase: handlePurchasePress,
          onClosed: () => {},
        },
      });
    },
    [handlePurchasePress, ownedIdSet]
  );

  const CatalogHeader = useMemo(
    () => (
      <View style={{ marginBottom: 10 }}>
        <Filters selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} />
      </View>
    ),
    [selectedCategory]
  );

  const ListEmptyComponent = useMemo(() => {
    if (loading && catalog.length === 0) {
      return (
        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", padding: 8 }}>
          {Array.from({ length: 6 }).map((_, index) => (
            <View key={index} style={{ padding: 10 }}>
              <StoreTileSkeleton width={165} />
            </View>
          ))}
        </View>
      );
    }

    return (
      <View style={{ padding: 24, alignItems: "center" }}>
        <Text style={[{ fontSize: 14, fontWeight: "700", color: CoralPalette.mutedDark, textAlign: "center" }, FONT]}>
          No items found.
        </Text>
      </View>
    );
  }, [catalog.length, loading]);

  const renderItem = useCallback(
    ({ item }: { item: StoreItem }) => {
      const isOwned = ownedIdSet.has(item.id);
      return (
        <View style={{ padding: 10 }}>
          <Tile item={{ ...item, owned: isOwned }} onPress={() => handleTilePress(item)} />
        </View>
      );
    },
    [handleTilePress, ownedIdSet]
  );

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: CoralPalette.surface, justifyContent: "center", alignItems: "center", padding: 24 }}>
        <Text style={{ fontSize: 18, fontWeight: "800", color: CoralPalette.dark, textAlign: "center", fontFamily: "Nunito" }}>
          We hit a snag
        </Text>
        <Text style={{ fontSize: 14, marginTop: 8, color: CoralPalette.mutedDark, textAlign: "center", lineHeight: 20, fontFamily: "Nunito" }}>
          {error}
        </Text>
        <TouchableOpacity
          onPress={() => void refetchCatalog()}
          activeOpacity={0.85}
          style={{ marginTop: 16, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: CoralPalette.primaryMuted }}
        >
          <Text style={[{ color: CoralPalette.white, fontWeight: "800" }, FONT]}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: CoralPalette.greyLight }}>
      {/* Pill switcher - connects seamlessly with header */}
      <View style={{ backgroundColor: CoralPalette.primaryMuted, alignItems: "center", paddingBottom: 12 }}>
        <StorePill selectedTab={selectedTab} onTabChange={setSelectedTab} width={screenWidth - 50} />
      </View>

      {/* Featured tab - render but hide when not active */}
      <View style={{ flex: 1, display: selectedTab === "featured" ? "flex" : "none" }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        >
          <Text style={[{ color: CoralPalette.mutedDark, fontSize: 12, fontWeight: "400", marginBottom: 10, marginLeft: 10 }, FONT]}>
            Discover themed featured sets that contain special items!
          </Text>

          {featuredSets.length === 0 ? (
            <View>
              {[0, 1].map((index) => {
                const skeletonContainerWidth = screenWidth - 24 - 20;
                const skeletonImageHeight = skeletonContainerWidth * 0.53;
                return (
                  <View
                    key={index}
                    style={{
                      backgroundColor: CoralPalette.white,
                      borderRadius: 5,
                      borderColor: CoralPalette.lightGrey,
                      borderWidth: 1,
                      padding: 10,
                      marginBottom: index === 0 ? 16 : 0,
                    }}
                  >
                    <Skeleton width="100%" height={skeletonImageHeight} radius={5} />
                    <Skeleton width="60%" height={15} radius={4} style={{ marginTop: 8 }} />
                  </View>
                );
              })}
            </View>
          ) : (
            featuredSets.map((set, index) => (
              <View key={set.id} style={{ marginBottom: index < featuredSets.length - 1 ? 16 : 0 }}>
                <FeaturedTile
                  featuredSet={set}
                  onPress={() =>
                    router.push({
                      pathname: "/store/featured/[id]",
                      params: { id: set.id, artKey: set.artKey },
                    })
                  }
                />
              </View>
            ))
          )}
        </ScrollView>
      </View>

      {/* Catalog tab - render but hide when not active */}
      <View style={{ flex: 1, display: selectedTab === "catalog" ? "flex" : "none" }}>
        <FlatList
          data={filteredCatalog}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={{ padding: 8, paddingBottom: 24 }}
          columnWrapperStyle={{ justifyContent: "center" }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={CatalogHeader}
          ListEmptyComponent={ListEmptyComponent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        />
      </View>
    </View>
  );
};

export default Store;
