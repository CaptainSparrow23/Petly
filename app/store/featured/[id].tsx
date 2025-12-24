import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  useWindowDimensions,
  StatusBar,
  ActivityIndicator,
  Image,
  type ImageProps,
} from "react-native";
import Animated, { type AnimatedProps } from "react-native-reanimated";

// Typed wrapper for shared element transitions (Reanimated 4.x)
// sharedTransitionTag must be on Animated.Image directly
const SharedImage = Animated.Image as React.ComponentType<
  AnimatedProps<ImageProps> & { sharedTransitionTag?: string }
>;
import { useLocalSearchParams, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SheetManager } from "react-native-actions-sheet";
import { Plus, ChevronLeft } from "lucide-react-native";
import Constants from "expo-constants";

import { Tile, type StoreCategory, type StoreItem } from "@/components/store/Tiles";
import { useGlobalContext } from "@/providers/GlobalProvider";
import { CoralPalette } from "@/constants/colors";
import images from "@/constants/images";

const API_BASE_URL = Constants.expoConfig?.extra?.backendUrl as string;
const FONT = { fontFamily: "Nunito" };

type OwnedField = "ownedPets" | "ownedHats" | "ownedCollars" | "ownedGadgets";

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

// Custom hero image positioning per featured set
// The container is fixed size for all sets - these values control the image WITHIN the container
interface HeroImageStyle {
  translateY: number;   // vertical offset (negative = move up)
  translateX: number;   // horizontal offset (negative = move left)
  scale: number;        // zoom level (1 = fit, 1.5 = 150% zoomed in)
}

const HERO_IMAGE_STYLES: Record<string, HeroImageStyle> = {
  chef_set: {
    translateY: 0,
    translateX: -20,
    scale: 1.1,
  },
  composer_set: {
    translateY: -10,
    translateX: -10,
    scale: 1.1,
  },
  // Add more sets here as needed
};

const DEFAULT_HERO_STYLE: HeroImageStyle = {
  translateY: 0,
  translateX: 0,
  scale: 1.0,
};

export default function FeaturedSetPage() {
  const { id, artKey } = useLocalSearchParams<{ id: string | string[]; artKey?: string | string[] }>();
  const featuredId = Array.isArray(id) ? id[0] : id;
  const featuredArtKey = Array.isArray(artKey) ? artKey[0] : artKey;
  const { width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { userProfile, updateUserProfile } = useGlobalContext();

  const [featuredSet, setFeaturedSet] = useState<FeaturedSet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch featured set data
  useEffect(() => {
    if (!API_BASE_URL || !featuredId) return;

    const controller = new AbortController();
    const fetchFeaturedSet = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/store/featured`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const payload = await response.json();
        if (payload?.success && Array.isArray(payload?.data)) {
          const set = payload.data.find((s: FeaturedSet) => s.id === featuredId);
          if (set) {
            setFeaturedSet(set);
          } else {
            setError("Featured set not found");
          }
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError("Failed to load featured set");
        }
      } finally {
        setLoading(false);
      }
    };

    void fetchFeaturedSet();
    return () => controller.abort();
  }, [featuredId]);

  // Owned items
  const ownedPets = userProfile?.ownedPets ?? [];
  const ownedHats = userProfile?.ownedHats ?? [];
  const ownedCollars = userProfile?.ownedCollars ?? [];
  const ownedGadgets = userProfile?.ownedGadgets ?? [];

  const ownedIdSet = useMemo(() => {
    return new Set([...ownedPets, ...ownedHats, ...ownedCollars, ...ownedGadgets]);
  }, [ownedPets, ownedHats, ownedCollars, ownedGadgets]);

  const ownedByField = useMemo<Record<OwnedField, string[]>>(
    () => ({ ownedPets, ownedHats, ownedCollars, ownedGadgets }),
    [ownedPets, ownedHats, ownedCollars, ownedGadgets]
  );

  const userId = userProfile?.userId;
  const userCoins = userProfile?.coins ?? 0;

  // Purchase handlers
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
        console.warn("[FeaturedSet]", message);
        throw new Error(message);
      }
    },
    [ownedByField, updateUserProfile, userCoins, userId]
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

  const artSource = useMemo(() => {
    const key = featuredSet?.artKey ?? featuredArtKey;
    if (!key) return null;
    return images[key as keyof typeof images] ?? null;
  }, [featuredArtKey, featuredSet?.artKey]);

  // Get the hero image style for this set
  const heroStyle = useMemo(() => {
    if (!featuredId) return DEFAULT_HERO_STYLE;
    return HERO_IMAGE_STYLES[featuredId] ?? DEFAULT_HERO_STYLE;
  }, [featuredId]);

  // Pad data to fill the last row
  const NUM_COLUMNS = 2;
  const formatData = (data: (StoreItem & { empty?: boolean })[]) => {
    const fullRows = Math.floor(data.length / NUM_COLUMNS);
    let elementsLastRow = data.length - fullRows * NUM_COLUMNS;

    while (elementsLastRow !== 0 && elementsLastRow < NUM_COLUMNS) {
      data.push({ id: `empty-${elementsLastRow}`, empty: true } as StoreItem & { empty?: boolean });
      elementsLastRow++;
    }

    return data;
  };

  const paddedItems = useMemo(() => {
    if (!featuredSet?.items) return [];
    return formatData([...featuredSet.items]);
  }, [featuredSet?.items]);

  const renderItem = useCallback(
    ({ item }: { item: StoreItem & { empty?: boolean } }) => {
      if (item.empty) {
        return <View style={{  padding: 10, flex: 1, opacity: 0 }} />;
      }
      const isOwned = ownedIdSet.has(item.id);
      return (
        <View style={{ padding: 10, flex: 1 }}>
          <Tile item={{ ...item, owned: isOwned }} onPress={() => handleTilePress(item)} />
        </View>
      );
    },
    [handleTilePress, ownedIdSet]
  );

  const ListHeader = useMemo(() => (
    <View>
      {/* Hero Image - fixed container with image positioned inside */}
      <View style={{ width: screenWidth, height: screenWidth * 0.7, overflow: "hidden" }}>
        {artSource && (
          <SharedImage 
            source={artSource}
            sharedTransitionTag={`featured-image-${featuredId}`}
            style={{ 
              position: "absolute",
              width: screenWidth * heroStyle.scale,
              height: screenWidth * 0.7 * heroStyle.scale,
              left: heroStyle.translateX,
              top: heroStyle.translateY,
            }} 
            resizeMode="cover" 
          />
        )}
        
        {/* Overlay controls */}
        <View
          style={{
            position: "absolute",
            top: insets.top,
            left: 0,
            right: 0,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingHorizontal: 16,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "rgba(0,0,0,0.4)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <ChevronLeft size={24} color={CoralPalette.white} />
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
            <View style={{ marginLeft: 5 }}>
              <Plus size={18} color={CoralPalette.white} />
            </View>
          </View>
        </View>
      </View>

      {/* Title and Description */}
      <View style={{ paddingHorizontal: 20, marginTop: 15 }}>
        <Text style={[{ fontSize: 22, fontWeight: "600", color: CoralPalette.dark, marginBottom: 10 }, FONT]}>
          {featuredSet?.title}
        </Text>
        <Text style={[{ fontSize: 14, color: CoralPalette.mutedDark, lineHeight: 22, marginBottom: 16 }, FONT]}>
          {featuredSet?.description}
        </Text>
      </View>
    </View>
  ), [artSource, featuredSet?.title, featuredSet?.description, insets.top, screenWidth, userProfile?.coins, featuredId, heroStyle]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: CoralPalette.greyLight, justifyContent: "center", alignItems: "center" }}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <ActivityIndicator size="large" color={CoralPalette.primaryMuted} />
      </View>
    );
  }

  if (error || !featuredSet) {
    return (
      <View style={{ flex: 1, backgroundColor: CoralPalette.greyLight, justifyContent: "center", alignItems: "center", padding: 24 }}>
        <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
        <Text style={[{ fontSize: 18, fontWeight: "700", color: CoralPalette.dark, textAlign: "center" }, FONT]}>
          {error || "Something went wrong"}
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginTop: 16, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: CoralPalette.primaryMuted, borderRadius: 8 }}
        >
          <Text style={[{ color: CoralPalette.white, fontWeight: "700" }, FONT]}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: CoralPalette.greyLight }}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <FlatList
        data={paddedItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={{ paddingBottom: 24 }}
        columnWrapperStyle={{ flex:1,  justifyContent: "center" }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={ListHeader}
      />
    </View>
  );
}
