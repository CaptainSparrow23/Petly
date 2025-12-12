import React from "react";
import { View, Text, Image } from "react-native";
import { useGlobalContext } from "@/lib/GlobalProvider";
import { CoralPalette } from "@/constants/colors";
import images from "@/constants/images";

const FONT = { fontFamily: "Nunito" };

export default function CoinBadge() {
  const { userProfile } = useGlobalContext();

  return (
    <View
      className="absolute top-1 right-0 z-20 mr-2 flex-row items-center rounded-full"
      style={{
        backgroundColor: CoralPalette.surfaceAlt,
        borderColor: CoralPalette.border,
        borderWidth: 1,
      }}
    >
      <View className="mr-2 h-9 w-9 items-center justify-center">
        <Image source={images.token} style={{ width: 34, height: 34 }} resizeMode="contain" />
      </View>
      <Text className="text-sm font-semibold mr-3" style={[{ color: CoralPalette.dark }, FONT]}>
        {(userProfile?.coins ?? 0).toLocaleString()}
      </Text>
    </View>
  );
}
