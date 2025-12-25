import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { Plus } from "lucide-react-native";
import { useGlobalContext } from "@/providers/GlobalProvider";
import { CoralPalette } from "@/constants/colors";
import images from "@/constants/images";

const FONT = { fontFamily: "Nunito" };

type KeyBadgeProps = {
  variant?: "floating" | "inline";
};

export default function KeyBadge({ variant = "floating" }: KeyBadgeProps) {
  const { userProfile } = useGlobalContext();
  const containerClassName =
    variant === "floating"
      ? "absolute top-3 right-0 z-20 mr-2 flex-row items-center rounded-full"
      : "flex-row items-center rounded-full";

  return (
    <TouchableOpacity
      onPress={() => {}}
      activeOpacity={0.7}
      className={containerClassName}
      style={{
        backgroundColor: CoralPalette.greyVeryLight,
        borderColor: CoralPalette.border,
        borderWidth: 1,
      }}
    >
      <View className="mr-1 h-9 w-9 items-center justify-center">
        <Image source={images.key} style={{ width: 20, height: 20, padding: 1 }} resizeMode="contain" />
      </View>
      <Text className="text-sm font-semibold" style={[{ color: CoralPalette.dark }, FONT]}>
        {(userProfile?.petKey ?? 0).toLocaleString()}
      </Text>
      <View className="ml-2 mr-2">
        <Plus size={16} color={CoralPalette.mutedDark} strokeWidth={2.5} />
      </View>
    </TouchableOpacity>
  );
}

