import React from "react";
import { View, Text } from "react-native";
import { CoralPalette } from "@/constants/colors";

export default function StreakCard({ streak = 0 }: { streak?: number }) {
  return (
    <View
      className="flex-1 rounded-3xl p-5 justify-between"
      style={{ backgroundColor: CoralPalette.surfaceAlt, borderColor: CoralPalette.border, borderWidth: 1 }}
    >
      <Text style={{ color: CoralPalette.mutedDark, fontSize: 14 }}>Focus streak</Text>
      <View className="flex-row mt-2 items-end justify-between">
        <View>
          <Text className="text-6xl mt-2 font-extrabold" style={{ color: CoralPalette.primary }}>
            {String(streak)}
          </Text>
          <Text className="text-sm -mt-2" style={{ color: CoralPalette.mutedDark }}>
            day{streak === 1 ? "" : "s"} in a row
          </Text>
        </View>
      </View>
    </View>
  );
}
