import React from "react";
import { View, Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useGlobalContext } from "@/lib/GlobalProvider";
import { CoralPalette } from "@/constants/colors";

export default function CoinBadge() {
  const { userProfile } = useGlobalContext();

  return (
    <View
      className="absolute -top-14 right-0 z-20 mr-4 flex-row items-center rounded-full px-1 py-1"
      style={{
        backgroundColor: CoralPalette.surfaceAlt,
        borderColor: CoralPalette.border,
        borderWidth: 1,
      }}
    >
      <View
        className="mr-2 h-9 w-9 items-center justify-center rounded-full"
        style={{ backgroundColor: CoralPalette.primary }}
      >
        <MaterialCommunityIcons name="currency-usd" size={18} color={CoralPalette.white} />
      </View>
      <Text className="text-sm font-semibold mr-2" style={{ color: CoralPalette.dark }}>
        {userProfile?.coins ?? 0}
      </Text>
    </View>
  );
}
