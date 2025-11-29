import React from "react";
import { View, Text } from "react-native";
import { CoralPalette } from "@/constants/colors";

const FONT = { fontFamily: "Nunito" };

export default function StreakCard({ streak = 0 }: { streak?: number }) {
  return (
    <View
      className="rounded-3xl p-4 justify-between items-end"
      style={{ width: "31%", backgroundColor: CoralPalette.surfaceAlt, borderColor: CoralPalette.border, borderWidth: 1 }}
    >
      <Text style={[{ color: CoralPalette.mutedDark, fontSize: 14 }, FONT]}>Focus streak</Text>
      <View className="mt-1 items-end justify-between">
        <View className='items-end'>
          <Text className="text-6xl pt-2 font-extrabold" style={[{ color: CoralPalette.primary }, FONT]}>
            {String(streak)}
          </Text>
          <Text className="text-sm -mt-3" style={[{ color: CoralPalette.mutedDark }, FONT]}>
            day{streak === 1 ? "" : "s"} in a row
          </Text>
        </View>
      </View>
    </View>
  );
}
