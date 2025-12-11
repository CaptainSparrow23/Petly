import React from "react";
import { View, Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useGlobalContext } from "@/lib/GlobalProvider";
import { CoralPalette } from "@/constants/colors";

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
      <View
        className="mr-2 h-9 w-9 items-center justify-center rounded-full"
        style={{ backgroundColor: CoralPalette.coinBg }}
      >
        <MaterialCommunityIcons name="heart" size={12} color={CoralPalette.coinIcon} />
      </View>
      <Text className="text-sm font-semibold mr-3" style={{ color: CoralPalette.dark }}>
        {(userProfile?.coins ?? 0).toLocaleString()}
      </Text>
    </View>
  );
}
