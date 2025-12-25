import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  ImageBackground,
  Alert,
  ActivityIndicator,
  Animated,
  Easing,
  PanResponder,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import type { PurchasesPackage } from "react-native-purchases";
import { useGlobalContext } from "@/providers/GlobalProvider";
import { CoralPalette } from "@/constants/colors";
import images from "@/constants/images";
import { useRevenueCat } from "@/hooks/useRevenueCat";
import { purchaseCoinPackage } from "@/lib/coinPurchases";

const FONT = { fontFamily: "Nunito" };

type TokenPackMeta = {
  id: string;
  title: string;
  coins: number;
  fallbackPrice: string;
  icon: any;
};

const UI_PACKS: TokenPackMeta[] = [
  { id: "starter", title: "Pile of Coins", coins: 500, fallbackPrice: "$0.99", icon: images.token_pile },
  { id: "popular", title: "Bag of Coins", coins: 1200, fallbackPrice: "$1.99", icon: images.token_bag },
  { id: "best_value", title: "Chest of Coins", coins: 3500, fallbackPrice: "$4.99", icon: images.token_chest },
  { id: "mega", title: "Vault of Coins", coins: 8000, fallbackPrice: "$9.99", icon: images.token_vault },
];

const parseCoinsFromTitle = (title?: string | null): number | null => {
  if (!title) return null;
  // Find the first integer-like token (supports commas), e.g. "Coins 3,500".
  const match = title.match(/(\d[\d,]*)/);
  if (!match) return null;
  const normalized = match[1].replace(/,/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

export default function BuyCoinsPage() {
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { userProfile, updateUserProfile } = useGlobalContext();
  const {
    offerings,
    loading: revenueCatLoading,
  } = useRevenueCat();
  const sheetHeight = Math.round(windowHeight * 0.9);
  const headerHeight = 210;
  const headerTopPadding = 20;
  const sheetTranslateY = useRef(new Animated.Value(sheetHeight)).current;
  const sheetTranslateYValue = useRef(sheetHeight);
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const scrollOffset = useRef(0);
  const [isClosing, setIsClosing] = useState(false);

  const offeringRows = useMemo(() => {
    const pkgs = offerings?.current?.availablePackages ?? [];
    if (!pkgs.length) return [];

    const rows = pkgs
      .map((pkg) => {
        const coins = parseCoinsFromTitle(pkg.product?.title) ?? parseCoinsFromTitle(pkg.product?.description);
        return {
          pkg,
          coins,
          priceLabel: pkg.product?.priceString,
        };
      })
      .sort((a, b) => (a.coins ?? Number.MAX_SAFE_INTEGER) - (b.coins ?? Number.MAX_SAFE_INTEGER));

    return rows;
  }, [offerings]);

  const [purchasingPackageId, setPurchasingPackageId] = useState<string | null>(null);

  const closeSheet = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    Animated.parallel([
      Animated.timing(sheetTranslateY, {
        toValue: sheetHeight,
        duration: 180,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 110,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      router.back();
    });
  }, [backdropOpacity, isClosing, sheetHeight, sheetTranslateY]);

  useEffect(() => {
    backdropOpacity.setValue(0.5);
    Animated.timing(sheetTranslateY, {
      toValue: 0,
      duration: 230,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    const id = sheetTranslateY.addListener(({ value }) => {
      sheetTranslateYValue.current = value;
    });

    return () => {
      sheetTranslateY.removeListener(id);
    };
  }, [backdropOpacity, sheetTranslateY]);

  const handlePurchase = async (pkg: PurchasesPackage | null) => {
    if (!pkg) return;
    try {
      setPurchasingPackageId(pkg.identifier ?? "purchasing");
      const result = await purchaseCoinPackage(pkg);
      if (result.cancelled) return;
      if (!result.success) {
        Alert.alert("Purchase failed", result.message);
        return;
      }
      if (typeof result.balance === "number") {
        updateUserProfile({ coins: result.balance });
      }
      Alert.alert("Purchased!", result.message, [
        { text: "OK", onPress: () => closeSheet() },
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Purchase failed. Please try again.";
      Alert.alert("Purchase failed", message);
    } finally {
      setPurchasingPackageId(null);
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => {
        if (isClosing || scrollOffset.current > 0) return false;
        if (gesture.dy <= 6) return false;
        return Math.abs(gesture.dy) > Math.abs(gesture.dx);
      },
      onPanResponderGrant: () => {
        sheetTranslateY.stopAnimation();
        sheetTranslateY.setOffset(sheetTranslateYValue.current);
        sheetTranslateY.setValue(0);
      },
      onPanResponderMove: (_, gesture) => {
        const nextTranslate = Math.min(Math.max(gesture.dy, 0), sheetHeight);
        sheetTranslateY.setValue(nextTranslate);
      },
      onPanResponderRelease: (_, gesture) => {
        sheetTranslateY.flattenOffset();
        const shouldClose =
          gesture.dy > sheetHeight * 0.25 || gesture.vy > 1.2;
        if (shouldClose) {
          closeSheet();
          return;
        }
        Animated.timing(sheetTranslateY, {
          toValue: 0,
          duration: 180,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      },
      onPanResponderTerminate: () => {
        sheetTranslateY.flattenOffset();
        Animated.timing(sheetTranslateY, {
          toValue: 0,
          duration: 180,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  return (
    <View style={{ flex: 1, backgroundColor: "transparent", justifyContent: "flex-end" }}>
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          { backgroundColor: "#000", opacity: backdropOpacity, zIndex: 1 },
        ]}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close coin store"
        onPress={closeSheet}
        style={[StyleSheet.absoluteFillObject, { zIndex: 2 }]}
      />

      <Animated.View
        style={{
          transform: [{ translateY: sheetTranslateY }],
          height: sheetHeight,
          backgroundColor: "#FBF4EC",
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          overflow: "hidden",
          zIndex: 3,
        }}
        {...panResponder.panHandlers}
      >
        <ImageBackground
          source={images.token_background}
          resizeMode="cover"
          style={{
            width: "100%",
            height: headerHeight,
            paddingTop: headerTopPadding,
    
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-end",
              justifyContent: "flex-end",
              paddingHorizontal: 18,
            }}
          >
    

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "rgba(0,0,0,0.3)",
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 16,
              }}
            >
              <Image source={images.token} style={{ width: 18, height: 18 }} resizeMode="contain" />
              <Text style={[FONT, { marginLeft: 8, color: CoralPalette.white, fontWeight: "800" }]}>
                {(userProfile?.coins ?? 0).toLocaleString()}
              </Text>
            </View>
          </View>
        </ImageBackground>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: insets.bottom + 24 }}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
        >
          <View style={{ alignItems: "center", justifyContent: "center", marginBottom: 10, marginTop: 8 }}>
            <Text
              style={[
                FONT,
                {
                  marginTop: 18,
                  marginBottom: 10,
                  fontSize: 18,
                  fontWeight: "900",
                  color: CoralPalette.dark,
                },
              ]}
            >
              Companion Coin Store
            </Text>
          </View>

          {revenueCatLoading && !offerings ? (
            <View style={{ paddingTop: 30, alignItems: "center" }}>
              <ActivityIndicator size="small" color={CoralPalette.mutedDark} />
            </View>
          ) : null}

          {UI_PACKS.map((fallbackPack, index) => {
            const row = offeringRows[index];
            const priceLabel = row?.priceLabel ?? fallbackPack.fallbackPrice;
            const coinsLabel = (row?.coins ?? fallbackPack.coins).toLocaleString();
            const disabled = revenueCatLoading || !!purchasingPackageId || !row?.pkg;

            return (
              <View key={fallbackPack.id} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 18, paddingHorizontal: 10 }}>
                <Image
                  source={fallbackPack.icon}
                  style={{ width: 56, height: 56 }}
                  resizeMode="contain"
                />

                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={[FONT, { fontSize: 15, fontWeight: "700", color: CoralPalette.dark }]}>
                    {fallbackPack.title}
                  </Text>
                  <Text style={[FONT, { marginTop: 4, fontSize: 13, fontWeight: "800", color: "#E1A21A" }]}>
                    {coinsLabel}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => handlePurchase(row?.pkg ?? null)}
                  disabled={disabled}
                  activeOpacity={0.85}
                  style={{
                    backgroundColor: CoralPalette.greenDark,
                    paddingHorizontal: 18,
                    paddingVertical: 10,
                    borderRadius: 12,
                    minWidth: 88,
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: disabled ? 0.7 : 1,
                    shadowColor: CoralPalette.forestTeal,
                    shadowOffset: { width: 0, height: 5 },
                    shadowOpacity: 1,
                    shadowRadius: 0,
                  }}
                >
                  <Text style={[FONT, { color: CoralPalette.white, fontWeight: "900", fontSize: 14 }]}>
                    {priceLabel}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
      </Animated.View>
    </View>
  );
}
