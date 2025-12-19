import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Text,
  TouchableOpacity,
  View,
  Image,
  StatusBar,
  ScrollView,
  Modal,
  RefreshControl,
  useWindowDimensions,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import Constants from "expo-constants";
import { SheetManager } from "react-native-actions-sheet";
import { X, Plus } from "lucide-react-native";

import { Tile, type StoreCategory, type StoreItem } from "@/components/store/Tiles";
import Filters, { CategoryValue } from "@/components/store/Filters";
import { useStoreCatalog } from "@/hooks/useStore";
import { useGlobalContext } from "@/lib/GlobalProvider";
import { CoralPalette } from "@/constants/colors";
import images from "@/constants/images";
import { StoreTileSkeleton } from "@/components/other/Skeleton";

const API_BASE_URL = Constants.expoConfig?.extra?.backendUrl as string;
const FONT = { fontFamily: "Nunito" };

type OwnedField = "ownedPets" | "ownedHats" | "ownedCollars" | "ownedGadgets";

const EMPTY_OWNED_IDS: string[] = [];

// Maps category to userProfile field
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

// Memoized Featured Tile to prevent re-renders when filters change
type FeaturedTileProps = {
  featuredSet?: FeaturedSet;
  onPress: () => void;
};

const FeaturedTile = React.memo(function FeaturedTile({ featuredSet, onPress }: FeaturedTileProps) {
  const { width: screenWidth } = useWindowDimensions();
  
  if (!featuredSet) return null;

  const artSource = images[featuredSet.artKey as keyof typeof images];
  if (!artSource) return null;

  // Calculate responsive height: container width (screenWidth - 24 padding - 20 card padding) * aspect ratio
  const containerWidth = screenWidth - 24 - 20; // paddingHorizontal 12*2 + card padding 10*2
  const imageHeight = containerWidth * 0.53; // Maintain consistent aspect ratio

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={{
        backgroundColor: CoralPalette.white,
        borderRadius: 5,
        padding: 10,
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 5,
      }}
    >
      <View style={{ borderRadius: 5, overflow: "hidden", height: imageHeight }}>
        <Image 
          source={artSource} 
          style={{ 
            width: "110%", 
            height: imageHeight * 1.18,
            transform: [{ translateY: -(imageHeight * 0.18) }]
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
    </TouchableOpacity>
  );
});

const Store = () => {
  const { width: screenWidth } = useWindowDimensions();
  const { userProfile, updateUserProfile } = useGlobalContext();
  const [selectedCategory, setSelectedCategory] = useState<CategoryValue>("all");
  const [featuredSets, setFeaturedSets] = useState<FeaturedSet[]>([]);
  const [expandedSet, setExpandedSet] = useState<FeaturedSet | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch featured sets
  useEffect(() => {
    if (!API_BASE_URL) {
      return;
    }

    const controller = new AbortController();
    const fetchFeaturedSets = async (signal: AbortSignal) => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/store/featured`, { signal });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const payload = await response.json().catch(() => null);
        if (payload?.success && Array.isArray(payload?.data)) {
          setFeaturedSets(payload.data);
        }
      } catch (error) {
        if (signal.aborted) {
          return;
        }
        console.warn("[Store] Error fetching featured sets:", error);
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
    () => ({
      ownedPets,
      ownedHats,
      ownedCollars,
      ownedGadgets,
    }),
    [ownedPets, ownedHats, ownedCollars, ownedGadgets]
  );

  const ownedIdSet = useMemo(() => {
    const allOwned = [...ownedPets, ...ownedHats, ...ownedCollars, ...ownedGadgets];
    return new Set(allOwned);
  }, [ownedPets, ownedHats, ownedCollars, ownedGadgets]);

  const {
    catalog,
    loading,
    error,
    refetch: refetchCatalog,
  } = useStoreCatalog(ownedItems, { autoFetch: false });

  // Refresh data when screen gains focus
  useFocusEffect(
    useCallback(() => {
      void refetchCatalog();
    }, [refetchCatalog])
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetchCatalog();
    } finally {
      setRefreshing(false);
    }
  }, [refetchCatalog]);

  // Filter catalog: only hats and collars that are NOT featured, then apply category filter
  const filteredCatalog = useMemo(() => {
    const baseFiltered = catalog.filter(
      (item) => (item.category === "Hat" || item.category === "Collar") && !item.featured
    );
    
    if (selectedCategory === "all") {
      return baseFiltered;
    }
    return baseFiltered.filter((item) => item.category === selectedCategory);
  }, [catalog, selectedCategory]);

  // --- Expand/Collapse Featured Set ---
  const openFeaturedSet = useCallback((set: FeaturedSet) => {
    setExpandedSet(set);
  }, []);

  const closeFeaturedSet = useCallback(() => {
    setExpandedSet(null);
  }, []);

  // --- Purchase Handlers ---
  const userId = userProfile?.userId;
  const userCoins = userProfile?.coins ?? 0;

  const ownedByField = useMemo<Record<OwnedField, string[]>>(
    () => ({
      ownedPets,
      ownedHats,
      ownedCollars,
      ownedGadgets,
    }),
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

        const response = await fetch(
          `${API_BASE_URL}/api/store/purchase/${userId}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ petId: item.id, priceCoins: item.priceCoins }),
          }
        );

        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload?.success) {
          throw new Error(payload?.error || payload?.message || "Purchase failed");
        }

        // Update user profile locally based on item category
        const ownedField = categoryToField[item.category];
        const currentOwned = ownedByField[ownedField];
        updateUserProfile({
          coins: Math.max(0, userCoins - item.priceCoins),
          [ownedField]: currentOwned.includes(item.id)
            ? currentOwned
            : [...currentOwned, item.id],
        });

        void refetchCatalog();
        await SheetManager.hide("store-confirmation");

        setTimeout(() => {
          void SheetManager.show("store-success", {
            payload: {
              petName: item.name,
              onCloseRequest: () => void SheetManager.hide("store-success"),
              onClosed: () => {
                void SheetManager.hide("store-preview");
              },
            },
          });
        }, 0);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "We could not complete your purchase. Please try again.";
        console.warn("[Store]", message);
        throw new Error(message);
      }
    },
    [
      ownedByField,
      updateUserProfile,
      refetchCatalog,
      userCoins,
      userId,
    ]
  );

  const handlePurchasePress = useCallback(
    (item: StoreItem) => {
      // Pets can't be purchased - they're unlocked by level
      if (item.category === "Pet") {
        return;
      }
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
      void SheetManager.show("store-preview", {
        payload: {
          pet: item,
          onPurchase: handlePurchasePress,
          onClosed: () => {},
        },
      });
    },
    [handlePurchasePress]
  );

  // --- Featured Tile ---
  const featuredSet = featuredSets[0];
  
  const handleFeaturedPress = useCallback(() => {
    if (featuredSet) {
      openFeaturedSet(featuredSet);
    }
  }, [featuredSet, openFeaturedSet]);

  // --- List Header Component ---
  const ListHeader = useMemo(
    () => (
      <View style={{ paddingHorizontal: 12 }}>
        {/* Featured Section */}
        <Text
          style={{
            fontSize: 22,
            fontWeight: "700",
            color: CoralPalette.dark,
            fontFamily: "Nunito",
            marginBottom: 2,
            marginTop: 8,
          }}
        >
          Featured
        </Text>
        <Text style={[{ color: CoralPalette.mutedDark, fontSize: 14, fontWeight: "400", marginBottom: 8}, FONT]}>
        Discover limited-time sets that rotates monthly!
        </Text>

        {/* Featured Set Container - Memoized to prevent glitches */}
        <FeaturedTile featuredSet={featuredSet} onPress={handleFeaturedPress} />

        {/* Catalog Title */}
        <Text
          style={{
            fontSize: 22,
            fontWeight: "700",
            color: CoralPalette.dark,
            fontFamily: "Nunito",
            marginTop: 12,
            marginBottom: 2,
          }}
        >
          Catalog
        </Text>
        <Text style={[{ color: CoralPalette.mutedDark, fontSize: 14, fontWeight: "400", marginBottom: 8}, FONT]}>
        Browse our full collection of items 
        </Text>

        {/* Filter Chips */}
        <View style={{ marginBottom: 10 }}>
          <Filters selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} />
        </View>
      </View>
    ),
    [featuredSet, handleFeaturedPress, selectedCategory]
  );

  const tileWidth = useMemo(() => Math.max(0, Math.floor((screenWidth - 48) / 2)), [screenWidth]);
  const userLevel = userProfile?.level ?? 1;

  const artSource = useMemo(() => {
    if (!expandedSet?.artKey) {
      return null;
    }
    return images[expandedSet.artKey as keyof typeof images] ?? null;
  }, [expandedSet?.artKey]);

  const ListEmptyComponent = useMemo(() => {
    if (loading && catalog.length === 0) {
      return (
        <View style={{ flexDirection: "row", flexWrap: "wrap", padding: 8 }}>
          {Array.from({ length: 6 }).map((_, index) => (
            <View key={index} style={{ width: "50%", padding: 8 }}>
              <StoreTileSkeleton width={tileWidth} />
            </View>
          ))}
        </View>
      );
    }

    return (
      <View style={{ padding: 24, alignItems: "center" }}>
        <Text
          style={[
            {
              fontSize: 14,
              fontWeight: "700",
              color: CoralPalette.mutedDark,
              textAlign: "center",
            },
            FONT,
          ]}
        >
          No items found.
        </Text>
      </View>
    );
  }, [catalog.length, loading, tileWidth]);

  // --- Render Item ---
  const renderItem = useCallback(
    ({ item }: { item: StoreItem }) => {
      const isOwned = ownedIdSet.has(item.id);
      
      return (
        <View style={{ width: "50%", padding: 8 }}>
          <Tile
            item={{ ...item, owned: isOwned }}
            onPress={() => handleTilePress(item)}
            userLevel={userLevel}
          />
        </View>
      );
    },
    [handleTilePress, ownedIdSet, userLevel]
  );

  // --- Error State ---
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
          style={{
            marginTop: 16,
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 10,
            backgroundColor: CoralPalette.primaryMuted,
          }}
        >
          <Text style={[{ color: CoralPalette.white, fontWeight: "800" }, FONT]}>
            Try again
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: CoralPalette.greyLighter }}>
      <FlatList
        data={filteredCatalog}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={{ padding: 8 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmptyComponent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      />

      {/* Expanded Featured Set Modal */}
      <Modal
        visible={expandedSet !== null}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={closeFeaturedSet}
      >
        <View style={{ flex: 1, backgroundColor: CoralPalette.greyLight }}>
          <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
          
          <ScrollView 
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Hero Image */}
       
            <View style={{ width: screenWidth, height: screenWidth * 0.85 }}>
              {artSource && (
                <Image
                  source={artSource}
                  style={{ width: "110%", height: "80%" }}
                  resizeMode="cover"
                  
                />
              )}
         
         
              
              {/* Overlay controls */}
              <SafeAreaView
                edges={["top"]}
                style={{
                  position: "absolute",
                  top: 50,
                  left: 0,
                  right: 0,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingHorizontal: 16,
                  paddingTop: 8,
                }}
              >
                {/* Close button */}
                <TouchableOpacity
                  onPress={closeFeaturedSet}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: "rgba(0,0,0,0.4)",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <X size={24} color={CoralPalette.white} />
                </TouchableOpacity>

                {/* Coins display */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "rgba(0,0,0,0.4)",
                    borderRadius: 20,
                    paddingHorizontal: 8,
                    paddingVertical: 6,
                  }}
                >
                  <Image
                    source={images.token}
                    style={{ width: 20, height: 20 }}
                    resizeMode="contain"
                  />
                  <Text
                    style={[
                      {
                        color: CoralPalette.white,
                        fontSize: 16,
                        fontWeight: "700",
                        marginLeft: 6,
                      },
                      FONT,
                    ]}
                  >
                    {userProfile?.coins?.toLocaleString() ?? 0}
                  </Text>
                  <View style={{ marginLeft: 2 }}>
                    <Plus size={18} color={CoralPalette.white} />
                  </View>
                </View>
              </SafeAreaView>
            </View>

            {/* Content */}
            <View style={{ paddingHorizontal: 20,  paddingBottom: 100, marginTop: -55 }}>
              {/* Title */}
              <Text
                style={[
                  {
                    fontSize: 22,
                    fontWeight: "600",
                    color: CoralPalette.dark,
                    marginBottom: 10,
                  },
                  FONT,
                ]}
              >
                {expandedSet?.title}
              </Text>

              {/* Description */}
              <Text
                style={[
                  {
                    fontSize: 14,
                    color: CoralPalette.mutedDark,
                    lineHeight: 22,
                    marginBottom: 24,
                  },
                  FONT,
                ]}
              >
                {expandedSet?.description}
              </Text>

              {/* Items Grid */}
              <View style={{ flexDirection: "row", flexWrap: "wrap", marginHorizontal: -8 }}>
                {expandedSet?.items.map((item) => {
                  const isOwned = ownedIdSet.has(item.id);
                  
                  return (
                    <View key={item.id} style={{ width: "50%", padding: 8 }}>
                      <Tile
                        item={{ ...item, owned: isOwned }}
                        onPress={() => handleTilePress(item)}
                        userLevel={userLevel}
                      />
                    </View>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

export default Store;
