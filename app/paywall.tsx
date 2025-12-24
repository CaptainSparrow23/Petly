import React from "react";
import { ActivityIndicator, View } from "react-native";
import RevenueCatUI from "react-native-purchases-ui";
import { router } from "expo-router";
import { useRevenueCat } from "@/hooks/useRevenueCat";
import { CoralPalette } from "@/constants/colors";

export default function PaywallScreen() {
  const { loading, offerings } = useRevenueCat();

  const offering = offerings?.all["ofrng374110fc7b"];

  if (loading && !offerings) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: CoralPalette.surfaceAlt }}
      >
        <ActivityIndicator size="large" color={CoralPalette.primary} />
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: CoralPalette.surfaceAlt }}>
      <RevenueCatUI.Paywall
        options={{
          offering: offering ?? undefined,
        }}
        onDismiss={() => router.back()}
      />
    </View>
  );
}
