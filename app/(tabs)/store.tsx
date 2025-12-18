import React, { useCallback, useMemo, useState, useRef, useEffect } from "react";
import { Animated, Image, ImageBackground, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import Constants from "expo-constants";
import { SheetManager } from "react-native-actions-sheet";

import { StoreItem } from "@/components/store/Tiles";
import { useStoreCatalog } from "@/hooks/useStore";
import { useGlobalContext } from "@/lib/GlobalProvider";
import { CoralPalette } from "@/constants/colors";
import images from "@/constants/images";

const API_BASE_URL = Constants.expoConfig?.extra?.backendUrl as string;
const FONT = { fontFamily: "Nunito" };

// --- Constants ---
const TILE_GAP = 30;
const BACKGROUND_ZOOM = 1.3;
const TILE_SHADOW = {
  shadowColor: "#000",
  shadowOpacity: 0.06,
  shadowRadius: 5,
  shadowOffset: { width: 0, height: 3 },
  elevation: 2,
};

// Maps category to userProfile field
const categoryToField: Record<string, 'ownedPets' | 'ownedHats' | 'ownedFaces' | 'ownedCollars' | 'ownedGadgets'> = {
  Pet: 'ownedPets',
  Hat: 'ownedHats',
  Face: 'ownedFaces',
  Collar: 'ownedCollars',
  Gadget: 'ownedGadgets',
};

// --- Types ---
interface ComponentPosition {
  x: number; // 0-1, left to right
  y: number; // 0-1, top to bottom
}

// --- Configuration ---
// Normalized positions (0-1) for tile rows on the background image
const LIST_POSITIONS = {
  hats: { x: 0.07, y: 0.265 } as ComponentPosition,
  face: { x: 0.07, y: 0.43 } as ComponentPosition,
  collars: { x: 0.07, y: 0.615 } as ComponentPosition,
};

const Store = () => {
  const { userProfile, updateUserProfile } = useGlobalContext();
  const { width, height } = useWindowDimensions();

  const storeWidth = width;
  const storeHeight = height;
  const itemWidth = Math.floor((storeWidth - 80) / 3.5);

  const [recentlyPurchasedPetName, setRecentlyPurchasedPetName] = useState<string | null>(null);

  // Animation refs for tile pop-in animations
  const tileScaleRefs = useRef<Record<string, Animated.Value>>({});
  // Animation refs for tile press animations
  const tilePressScaleRefs = useRef<Record<string, Animated.Value>>({});

  const {
    availablePets,
    loading,
    error,
    refetch: refetchCatalog,
  } = useStoreCatalog(
    {
      ownedPets: userProfile?.ownedPets,
      ownedHats: userProfile?.ownedHats,
      ownedFaces: userProfile?.ownedFaces,
      ownedCollars: userProfile?.ownedCollars,
      ownedGadgets: userProfile?.ownedGadgets,
    },
    { autoFetch: false }
  );

  // Refresh data when screen gains focus
  useFocusEffect(
    useCallback(() => {
      void refetchCatalog();
    }, [refetchCatalog])
  );

  // --- Handlers ---
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

        // update user profile locally based on item category
        const ownedField = categoryToField[pet.category] || 'ownedPets';
        const currentOwned = userProfile?.[ownedField] || [];
        updateUserProfile({
          coins: Math.max(0, (userProfile?.coins ?? 0) - pet.priceCoins),
          [ownedField]: currentOwned.includes(pet.id)
            ? currentOwned
            : [...currentOwned, pet.id],
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
      // Pets can't be purchased - they're unlocked by level
      if (pet.category === "Pet") {
        return;
      }
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
    (item: StoreItem) => {
      setRecentlyPurchasedPetName(null);
      void SheetManager.show("store-preview", {
        payload: {
          pet: item,
          onPurchase: handlePurchasePress,
          onClosed: () => setRecentlyPurchasedPetName(null),
        },
      });
    },
    [handlePurchasePress]
  );

  // --- Tile Rendering ---
  const renderPositionedTile = useCallback(
    (item: StoreItem, x: number, y: number) => {
      // Get or create animation value (start at 0, will animate to 1)
      if (!tileScaleRefs.current[item.id]) {
        tileScaleRefs.current[item.id] = new Animated.Value(0);
      }
      if (!tilePressScaleRefs.current[item.id]) {
        tilePressScaleRefs.current[item.id] = new Animated.Value(1);
      }
      const scaleAnim = tileScaleRefs.current[item.id];
      const pressScaleAnim = tilePressScaleRefs.current[item.id];
      const combinedScale = Animated.multiply(scaleAnim, pressScaleAnim);
      
      return (
        <Animated.View
          key={item.id}
          style={{
            position: "absolute",
            left: x,
            top: y,
            width: itemWidth,
            marginHorizontal: 3,
            marginVertical: 3,
            transform: [{ scale: combinedScale }],
          }}
        >
        <View
          style={{
            backgroundColor: CoralPalette.white,
            borderRadius: 16,
            padding: 10,
            ...TILE_SHADOW,
          }}
        >
          {item.owned && (
            <View
              style={{
                position: "absolute",
                top: 8,
                left: 8,
                paddingHorizontal: 6,
                paddingVertical: 3,
                borderRadius: 999,
                backgroundColor: `${CoralPalette.primaryLight}55`,
                zIndex: 1,
              }}
            >
              <Text className="text-xs font-bold" style={[{ color: CoralPalette.primary, fontSize: 9 }, FONT]}>
                Owned
              </Text>
            </View>
          )}
          
          <View className="items-center justify-center" style={{ marginBottom: 8 }}>
            <Image
              source={images[item.id as keyof typeof images] ?? images.lighting}
              resizeMode="contain"
              style={{ width: 70, height: 70 }}
            />
          </View>

          <View className="w-full">
            <View className="flex-row items-center justify-center">
              <View className="h-5 w-5 items-center justify-center">
                <Image source={images.token} style={{ width: 14, height: 14 }} resizeMode="contain" />
              </View>
              <Text className="ml-1 text-sm font-semibold" style={[{ color: CoralPalette.dark, fontSize: 12 }, FONT]}>
                {item.priceCoins.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => handleTilePress(item)}
          onPressIn={() => {
            Animated.spring(pressScaleAnim, {
              toValue: 0.9,
              useNativeDriver: true,
            }).start();
          }}
          onPressOut={() => {
            Animated.spring(pressScaleAnim, {
              toValue: 1,
              useNativeDriver: true,
            }).start();
          }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
          activeOpacity={1}
        />
      </Animated.View>
      );
    },
    [handleTilePress, itemWidth]
  );

  // --- Data Processing ---
  const getRandomItems = useCallback((items: StoreItem[], count: number): StoreItem[] => {
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }, []);

  const hatItems = useMemo(() => {
    const hats = availablePets.filter((item) => item.category === "Hat");
    return getRandomItems(hats, 3);
  }, [availablePets, getRandomItems]);

  const faceItems = useMemo(() => {
    const faces = availablePets.filter((item) => item.category === "Face");
    return getRandomItems(faces, 1);
  }, [availablePets, getRandomItems]);

  const collarItems = useMemo(() => {
    const collars = availablePets.filter((item) => item.category === "Collar");
    return getRandomItems(collars, 3);
  }, [availablePets, getRandomItems]);

  // --- Position Calculations ---
  const getPixelPosition = useCallback(
    (normalizedPos: ComponentPosition) => ({
      x: normalizedPos.x * storeWidth,
      y: normalizedPos.y * storeHeight,
    }),
    [storeWidth, storeHeight]
  );

  const hatsPosition = useMemo(() => getPixelPosition(LIST_POSITIONS.hats), [getPixelPosition]);
  const facePosition = useMemo(() => getPixelPosition(LIST_POSITIONS.face), [getPixelPosition]);
  const collarsPosition = useMemo(() => getPixelPosition(LIST_POSITIONS.collars), [getPixelPosition]);

  const calculateTilePositions = useCallback(
    (startPos: { x: number; y: number }, count: number) => {
      return Array.from({ length: count }, (_, index) => ({
        x: startPos.x + index * (itemWidth + TILE_GAP),
        y: startPos.y,
      }));
    },
    [itemWidth]
  );

  const hatTilePositions = useMemo(
    () => calculateTilePositions(hatsPosition, hatItems.length),
    [hatsPosition, hatItems.length, calculateTilePositions]
  );

  const faceTilePositions = useMemo(
    () => calculateTilePositions(facePosition, faceItems.length),
    [facePosition, faceItems.length, calculateTilePositions]
  );

  const collarTilePositions = useMemo(
    () => calculateTilePositions(collarsPosition, collarItems.length),
    [collarsPosition, collarItems.length, calculateTilePositions]
  );

  // Initialize animation values for all items when they're available
  useEffect(() => {
    if (loading) return;
    
    const allItems = [...hatItems, ...faceItems, ...collarItems];
    allItems.forEach((item) => {
      if (!tileScaleRefs.current[item.id]) {
        tileScaleRefs.current[item.id] = new Animated.Value(0);
      }
      if (!tilePressScaleRefs.current[item.id]) {
        tilePressScaleRefs.current[item.id] = new Animated.Value(1);
      }
    });
  }, [loading, hatItems, faceItems, collarItems]);

  // Animate tiles popping out when page is focused
  useFocusEffect(
    useCallback(() => {
      if (loading) return; // Don't animate while loading

      // Get all items to animate and shuffle for random pop-out order
      const allItems = [...hatItems, ...faceItems, ...collarItems].sort(() => Math.random() - 0.5);
      
      if (allItems.length === 0) return;
      
      // Initialize animation values if they don't exist
      allItems.forEach((item) => {
        if (!tileScaleRefs.current[item.id]) {
          tileScaleRefs.current[item.id] = new Animated.Value(0);
        }
        if (!tilePressScaleRefs.current[item.id]) {
          tilePressScaleRefs.current[item.id] = new Animated.Value(1);
        }
      });
      
      // Animate each tile with staggered delay
      allItems.forEach((item, index) => {
        const scaleAnim = tileScaleRefs.current[item.id];
        
        // Reset to 0 and animate to 1 with staggered delay
        scaleAnim.setValue(0);
        const delay = index * 50; // Stagger each tile by 50ms
        
        setTimeout(() => {
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 40,
            friction: 6,
            useNativeDriver: true,
          }).start();
        }, delay);
      });
    }, [loading, hatItems, faceItems, collarItems])
  );

  // --- Error State ---
  if (error) {
    return (
      <ImageBackground source={images.store_background} style={{ flex: 1 }} resizeMode="cover">
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-lg font-extrabold text-center" style={[{ color: CoralPalette.dark }, FONT]}>
            We hit a snag
          </Text>
          <Text className="text-sm mt-2 text-center" style={[{ color: CoralPalette.mutedDark, lineHeight: 20 }, FONT]}>
            {error}
          </Text>
        </View>
      </ImageBackground>
    );
  }
  return (
    <View className="flex-1" style={{ backgroundColor: CoralPalette.surface }}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <View style={{ width: storeWidth, height: storeHeight, overflow: "hidden", position: "relative" }}>
          {/* Background */}
          <ImageBackground
            source={images.store_background}
            style={{
              position: "absolute",
              width: storeWidth,
              height: storeHeight,
            }}
            resizeMode="cover"
            imageStyle={{
              transform: [{ scale: BACKGROUND_ZOOM }, { translateY: height * 0.06 }],
            }}
          />

          {/* Header */}
          <View 
            style={{
              position: "absolute",
              left: storeWidth * 0.05,
              top: height * 0.08,
              right: storeWidth * 0.05,
            }}
            pointerEvents="box-none"
          >
            <View className="flex-row items-start justify-between">
              <View className="flex-1 pr-3">
                <Text
                  className="uppercase"
                  style={[
                    { fontSize: 40, fontWeight: "700", color: CoralPalette.primaryMuted, letterSpacing: 1 },
                    FONT,
                  ]}
                >
                  Petly store
                </Text>
                <Text className="text-md mt-1 ml-1" style={[{ color: CoralPalette.mutedDark, lineHeight: 20 }, FONT]}>
                  Browse gifts for your companions
                </Text>
              </View>
            </View>
          </View>

          {/* Hats Tiles */}
          {!loading && hatItems.map((item, index) =>
            renderPositionedTile(item, hatTilePositions[index].x, hatTilePositions[index].y)
          )}

          {/* Face Tiles */}
          {!loading && faceItems.map((item, index) =>
            renderPositionedTile(item, faceTilePositions[index].x, faceTilePositions[index].y)
          )}

          {/* Collars Tiles */}
          {!loading && collarItems.map((item, index) =>
            renderPositionedTile(item, collarTilePositions[index].x, collarTilePositions[index].y)
          )}
        </View>
      </View>
    </View>
  );
};

export default Store;
