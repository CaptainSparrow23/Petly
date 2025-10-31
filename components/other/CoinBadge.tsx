import React from "react";
import { View, Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useGlobalContext } from "@/lib/GlobalProvider";

export default function CoinBadge() {
  const { userProfile } = useGlobalContext();

  return (
    <View className="absolute -top-11 right-0 z-20 mt-2 mr-4 flex-row items-center rounded-full bg-gray-200">
        <View className="mr-2 h-9 w-9 items-center justify-center rounded-full bg-amber-400">
            <MaterialCommunityIcons name="currency-usd" size={18} color="#92400e" />
        </View>
        <Text className="text-sm font-semibold mr-4 text-slate-700 ">{userProfile?.coins}</Text>
    </View>
    );
}
