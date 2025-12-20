import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Text,
  TouchableOpacity,
  View,
  Image,
  StatusBar,
  ScrollView,
  RefreshControl,
  useWindowDimensions,
  StyleSheet,
  Modal,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Constants from "expo-constants";
import { SheetManager } from "react-native-actions-sheet";
import { X, Plus } from "lucide-react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  runOnJS,
  Easing,
} from "react-native-reanimated";

import { Tile, type StoreCategory, type StoreItem } from "@/components/store/Tiles";
import Filters, { CategoryValue } from "@/components/store/Filters";
import { useStoreCatalog } from "@/hooks/useStore";
import { useGlobalContext } from "@/lib/GlobalProvider";
import { CoralPalette } from "@/constants/colors";
import images from "@/constants/images";
import { StoreTileSkeleton, Skeleton } from "@/components/other/Skeleton";

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

type FeaturedTileProps = {
  featuredSet?: FeaturedSet;
  onPress: () => void;
  tileRef: React.RefObject<View | null>;
};

const FeaturedTile = React.memo(function FeaturedTile({ featuredSet, onPress, tileRef }: FeaturedTileProps) {
  const { width: screenWidth } = useWindowDimensions();
  
  const containerWidth = screenWidth - 24 - 20;
  const imageHeight = containerWidth * 0.53;
  const fixedHeight = imageHeight + 20 + 23 + 8;

  const artSource = featuredSet ? images[featuredSet.artKey as keyof typeof images] : null;

  return (
    <View ref={tileRef} collapsable={false}>
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
        </>
      ) : (
        <>
          <Skeleton width="100%" height={imageHeight} radius={5} />
          <Skeleton width="60%" height={15} radius={4} style={{ marginTop: 8 }} />
        </>
      )}
    </TouchableOpacity>
    </View>
  );
});

const Store = () => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { userProfile, updateUserProfile } = useGlobalContext();
  const [selectedCategory, setSelectedCategory] = useState<CategoryValue>("all");
  const [featuredSets, setFeaturedSets] = useState<FeaturedSet[]>([]);
  const [expandedSet, setExpandedSet] = useState<FeaturedSet | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Refs and animation values
  const tileRef = useRef<View>(null);
  const scrollRef = useRef<ScrollView>(null);
  
  // Animation shared values
  const animationProgress = useSharedValue(0);
  const originX = useSharedValue(0);
  const originY = useSharedValue(0);
  const originW = useSharedValue(0);
  const originH = useSharedValue(0);

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

  // --- Expand/Collapse Animation ---
  const openFeaturedSet = useCallback((set: FeaturedSet) => {
    // Reset animation to start position
    animationProgress.value = 0;
    
    if (!tileRef.current) {
      setExpandedSet(set);
      animationProgress.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) });
      return;
    }

    tileRef.current.measureInWindow((x, y, w, h) => {
      originX.value = x;
      originY.value = y;
      originW.value = w;
      originH.value = h;
      setExpandedSet(set);
      animationProgress.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) });
    });
  }, [animationProgress, originH, originW, originX, originY]);

  const closeFeaturedSet = useCallback(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    animationProgress.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) }, (finished) => {
      if (finished) runOnJS(setExpandedSet)(null);
    });
  }, [animationProgress]);

  // --- Animated Styles ---
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: animationProgress.value,
  }));

  const expandedContainerStyle = useAnimatedStyle(() => {
    const progress = animationProgress.value;
    return {
      position: "absolute",
      left: interpolate(progress, [0, 1], [originX.value, 0]),
      top: interpolate(progress, [0, 1], [originY.value, 0]),
      width: interpolate(progress, [0, 1], [originW.value, screenWidth]),
      height: interpolate(progress, [0, 1], [originH.value, screenHeight]),
      borderRadius: interpolate(progress, [0, 1], [5, 0]),
      overflow: "hidden",
      backgroundColor: CoralPalette.greyLight,
    };
  }, [screenWidth, screenHeight]);

  const contentOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(animationProgress.value, [0.5, 1], [0, 1]),
  }));

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

  const featuredSet = featuredSets[0];
  
  const handleFeaturedPress = useCallback(() => {
    if (featuredSet) openFeaturedSet(featuredSet);
  }, [featuredSet, openFeaturedSet]);

  const ListHeader = useMemo(
    () => (
      <View style={{ paddingHorizontal: 12 }}>
        <Text style={{ fontSize: 22, fontWeight: "700", color: CoralPalette.dark, fontFamily: "Nunito", marginBottom: 2, marginTop: 4 }}>
          Featured
        </Text>
        <Text style={[{ color: CoralPalette.mutedDark, fontSize: 14, fontWeight: "400", marginBottom: 8 }, FONT]}>
          Discover limited-time sets that rotates monthly!
        </Text>

        <FeaturedTile featuredSet={featuredSet} onPress={handleFeaturedPress} tileRef={tileRef} />

        <Text style={{ fontSize: 22, fontWeight: "700", color: CoralPalette.dark, fontFamily: "Nunito", marginTop: 18, marginBottom: 2 }}>
          Catalog
        </Text>
        <Text style={[{ color: CoralPalette.mutedDark, fontSize: 14, fontWeight: "400", marginBottom: 8 }, FONT]}>
          Browse our full collection of items
        </Text>

        <View style={{ marginBottom: 10 }}>
          <Filters selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} />
        </View>
      </View>
    ),
    [featuredSet, handleFeaturedPress, selectedCategory]
  );

  const artSource = useMemo(() => {
    if (!expandedSet?.artKey) return null;
    return images[expandedSet.artKey as keyof typeof images] ?? null;
  }, [expandedSet?.artKey]);

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
        <View style={{ padding: 19 }}>
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
      <FlatList
        data={filteredCatalog}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={{ padding: 8, paddingBottom: 24 }}
        columnWrapperStyle={{ justifyContent: "center" }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmptyComponent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      />

      {/* Expanded Featured Set - Fullscreen Modal with Animation */}
      <Modal
        visible={expandedSet !== null}
        transparent
        statusBarTranslucent
        animationType="none"
        onRequestClose={closeFeaturedSet}
      >
        <View style={StyleSheet.absoluteFill}>
          <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
          <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.4)" }, backdropStyle]} />
          
          <Animated.View style={expandedContainerStyle}>
            <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} bounces={false}>
              {/* Hero Image */}
              <View style={{ width: screenWidth, height: screenWidth * 0.85 }}>
                {artSource && (
                  <Image source={artSource} style={{ width: "110%", height: "80%" }} resizeMode="cover" />
                )}
                
                {/* Overlay controls */}
                <Animated.View
                  style={[
                    contentOpacity,
                    {
                      position: "absolute",
                      top: insets.top + 10,
                      left: 0,
                      right: 0,
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingHorizontal: 16,
                    },
                  ]}
                >
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
                    <Image source={images.token} style={{ width: 20, height: 20 }} resizeMode="contain" />
                    <Text style={[{ color: CoralPalette.white, fontSize: 16, fontWeight: "700", marginLeft: 6 }, FONT]}>
                      {userProfile?.coins?.toLocaleString() ?? 0}
                    </Text>
                    <View style={{ marginLeft: 2 }}>
                      <Plus size={18} color={CoralPalette.white} />
                    </View>
                  </View>
                </Animated.View>
              </View>

              {/* Content */}
              <Animated.View style={[contentOpacity, { paddingHorizontal: 20, paddingBottom: 100, marginTop: -55 }]}>
                <Text style={[{ fontSize: 22, fontWeight: "600", color: CoralPalette.dark, marginBottom: 10 }, FONT]}>
                  {expandedSet?.title}
                </Text>

                <Text style={[{ fontSize: 14, color: CoralPalette.mutedDark, lineHeight: 22, marginBottom: 24 }, FONT]}>
                  {expandedSet?.description}
                </Text>

                <View style={{ alignItems: "center" }}>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-start", gap: 16, maxWidth: 346 }}>
                    {expandedSet?.items.map((item) => {
                      const isOwned = ownedIdSet.has(item.id);
                      return (
                        <View key={item.id}>
                          <Tile item={{ ...item, owned: isOwned }} onPress={() => handleTilePress(item)} />
                        </View>
                      );
                    })}
                  </View>
                </View>
              </Animated.View>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

export default Store;
