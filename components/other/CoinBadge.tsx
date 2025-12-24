import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { useGlobalContext } from "@/providers/GlobalProvider";
import { CoralPalette } from "@/constants/colors";
import images from "@/constants/images";
import { router } from "expo-router";
import { Plus } from "lucide-react-native";

const FONT = { fontFamily: "Nunito" };

type CoinBadgeProps = {
  variant?: "floating" | "inline";
};

export default function CoinBadge({ variant = "floating" }: CoinBadgeProps) {
  const { userProfile } = useGlobalContext();
  const containerClassName =
    variant === "floating"
      ? "absolute top-3 right-0 z-20 mr-2 flex-row items-center rounded-full"
      : "flex-row items-center rounded-full";

  return (
    <TouchableOpacity
      onPress={() => router.push("/store/buy-coins" as any)}
      activeOpacity={0.7}
      className={containerClassName}
      style={{
        backgroundColor: CoralPalette.greyVeryLight,
        borderColor: CoralPalette.border,
        borderWidth: 1,
      }}
    >
      <View className="mr-2 h-8 w-8 items-center justify-center">
        <Image source={images.token} style={{ width: 34, height: 34 }} resizeMode="contain" />
      </View>
      <Text className="text-sm font-semibold" style={[{ color: CoralPalette.dark }, FONT]}>
        {(userProfile?.coins ?? 0).toLocaleString()}
      </Text>
      <View className="ml-1 mr-2">
        <Plus size={16} color={CoralPalette.primary} strokeWidth={2.5} />
      </View>
    </TouchableOpacity>
  );
}
