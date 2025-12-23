import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ChevronLeft, Sparkles, Star } from "lucide-react-native";
import { useGlobalContext } from "@/lib/GlobalProvider";
import { CoralPalette } from "@/constants/colors";
import images from "@/constants/images";

const FONT = { fontFamily: "Nunito" };

interface CoinPackage {
  id: string;
  coins: number;
  price: string;
  bonus?: string;
  popular?: boolean;
  bestValue?: boolean;
}

const COIN_PACKAGES: CoinPackage[] = [
  { id: "starter", coins: 500, price: "$0.99" },
  { id: "popular", coins: 1200, price: "$1.99", bonus: "+20%", popular: true },
  { id: "best_value", coins: 3500, price: "$4.99", bonus: "+40%", bestValue: true },
  { id: "mega", coins: 8000, price: "$9.99", bonus: "+60%" },
];

const CoinPackageCard = ({
  pkg,
  onPress,
}: {
  pkg: CoinPackage;
  onPress: () => void;
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        backgroundColor: CoralPalette.white,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: pkg.bestValue ? 2 : 1,
        borderColor: pkg.bestValue ? CoralPalette.primary : CoralPalette.lightGrey,
        shadowColor: "#000",
        shadowOpacity: pkg.bestValue ? 0.15 : 0.08,
        shadowOffset: { width: 0, height: pkg.bestValue ? 4 : 2 },
        shadowRadius: pkg.bestValue ? 8 : 4,
        elevation: pkg.bestValue ? 6 : 3,
        position: "relative",
        overflow: "visible",
      }}
    >
      {/* Badge */}
      {(pkg.popular || pkg.bestValue) && (
        <View
          style={{
            position: "absolute",
            top: -10,
            right: 16,
            backgroundColor: pkg.bestValue ? CoralPalette.primary : CoralPalette.purple,
            paddingHorizontal: 12,
            paddingVertical: 4,
            borderRadius: 12,
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
          }}
        >
          {pkg.bestValue ? (
            <Star size={12} color={CoralPalette.white} fill={CoralPalette.white} />
          ) : (
            <Sparkles size={12} color={CoralPalette.white} />
          )}
          <Text style={[FONT, { color: CoralPalette.white, fontSize: 11, fontWeight: "700" }]}>
            {pkg.bestValue ? "BEST VALUE" : "POPULAR"}
          </Text>
        </View>
      )}

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        {/* Left: Coin icon and amount */}
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
          <Image
            source={images.token}
            style={{ width: 44, height: 44 }}
            resizeMode="contain"
          />
          <View style={{ marginLeft: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "baseline" }}>
              <Text style={[FONT, { fontSize: 24, fontWeight: "800", color: CoralPalette.dark }]}>
                {pkg.coins.toLocaleString()}
              </Text>
              {pkg.bonus && (
                <Text style={[FONT, { fontSize: 14, fontWeight: "700", color: CoralPalette.green, marginLeft: 8 }]}>
                  {pkg.bonus}
                </Text>
              )}
            </View>
            <Text style={[FONT, { fontSize: 13, color: CoralPalette.mutedDark }]}>
              coins
            </Text>
          </View>
        </View>

        {/* Right: Price button */}
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={0.8}
          style={{
            backgroundColor: pkg.bestValue ? CoralPalette.primary : CoralPalette.primaryLight,
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 12,
          }}
        >
          <Text
            style={[
              FONT,
              {
                fontSize: 16,
                fontWeight: "700",
                color: pkg.bestValue ? CoralPalette.white : CoralPalette.primary,
              },
            ]}
          >
            {pkg.price}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

export default function BuyCoinsPage() {
  const insets = useSafeAreaInsets();
  const { userProfile } = useGlobalContext();
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const handlePurchase = (pkg: CoinPackage) => {
    // TODO: Implement actual in-app purchase with RevenueCat or similar
    Alert.alert(
      "Coming Soon",
      `Purchasing ${pkg.coins.toLocaleString()} coins for ${pkg.price} will be available soon!`,
      [{ text: "OK" }]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: CoralPalette.greyLighter }}>
      {/* Header */}
      <View
        style={{
          backgroundColor: CoralPalette.primaryMuted,
          paddingTop: insets.top + 8,
          paddingBottom: 20,
          paddingHorizontal: 16,
        }}
      >
        {/* Back button and title row */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: "rgba(255,255,255,0.2)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ChevronLeft size={24} color={CoralPalette.white} />
          </TouchableOpacity>
          <Text
            style={[
              FONT,
              {
                fontSize: 20,
                fontWeight: "800",
                color: CoralPalette.white,
                marginLeft: 12,
              },
            ]}
          >
            Get Coins
          </Text>
        </View>

        {/* Current balance */}
        <View
          style={{
            backgroundColor: "rgba(255,255,255,0.15)",
            borderRadius: 16,
            padding: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Image
            source={images.token}
            style={{ width: 32, height: 32 }}
            resizeMode="contain"
          />
          <Text
            style={[
              FONT,
              {
                fontSize: 28,
                fontWeight: "800",
                color: CoralPalette.white,
                marginLeft: 10,
              },
            ]}
          >
            {(userProfile?.coins ?? 0).toLocaleString()}
          </Text>
          <Text
            style={[
              FONT,
              {
                fontSize: 14,
                color: "rgba(255,255,255,0.8)",
                marginLeft: 8,
              },
            ]}
          >
            current balance
          </Text>
        </View>
      </View>

      {/* Packages */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={[
            FONT,
            {
              fontSize: 14,
              color: CoralPalette.mutedDark,
              marginBottom: 16,
              textAlign: "center",
            },
          ]}
        >
          Choose a coin package to unlock pets and accessories faster!
        </Text>

        {COIN_PACKAGES.map((pkg) => (
          <CoinPackageCard
            key={pkg.id}
            pkg={pkg}
            onPress={() => handlePurchase(pkg)}
          />
        ))}

        {/* Footer note */}
        <Text
          style={[
            FONT,
            {
              fontSize: 12,
              color: CoralPalette.mutedDark,
              textAlign: "center",
              marginTop: 16,
              lineHeight: 18,
            },
          ]}
        >
          Coins are also earned by completing focus sessions.{"\n"}
          Keep focusing to grow your collection!
        </Text>
      </ScrollView>
    </View>
  );
}


