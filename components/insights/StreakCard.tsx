import React, { useEffect, useState, useCallback } from "react";
import { View, Text } from "react-native";
import { CoralPalette } from "@/constants/colors";
import { useFocusEffect } from "expo-router";
import { Easing, runOnJS, useDerivedValue, useSharedValue, withTiming } from "react-native-reanimated";

const FONT = { fontFamily: "Nunito" };
const CARD_SHADOW = {
  shadowColor: "#191d31",
  shadowOpacity: 0.25,
  shadowOffset: { width: 3, height: 5},
  shadowRadius: 2,
  elevation: 10,
};

export default function StreakCard({ streak = 0 }: { streak?: number }) {
  const anim = useSharedValue(0);
  const [displayStreak, setDisplayStreak] = useState(0);

  useEffect(() => {
    anim.value = withTiming(streak, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
  }, [streak, anim]);

  useFocusEffect(
    useCallback(() => {
      anim.value = 0;
      anim.value = withTiming(streak, {
        duration: 600,
        easing: Easing.out(Easing.cubic),
      });
      return () => {};
    }, [anim, streak])
  );

  useDerivedValue(() => {
    runOnJS(setDisplayStreak)(anim.value);
  }, [anim]);

  const roundedStreak = Math.round(displayStreak);

  return (
    <View
      className="rounded-3xl p-4 justify-between items-end"
      style={[
        { width: "31%", backgroundColor: CoralPalette.surfaceAlt , borderColor: CoralPalette.surfaceAlt, borderWidth: 1 },
        CARD_SHADOW,
      ]}
    >
      <Text style={[{ color: CoralPalette.mutedDark, fontSize: 14 }, FONT]}>Focus streak</Text>
      <View className="items-end justify-between">
        <View className='items-end'>
          <Text className="-mt-2" style={[{ fontSize: 54, fontWeight: "800", color: CoralPalette.primary }, FONT]}>
            {String(roundedStreak)}
          </Text>
          <Text className="text-sm -mt-3" style={[{ color: CoralPalette.mutedDark }, FONT]}>
            day{roundedStreak === 1 ? "" : "s"} in a row
          </Text>
        </View>
      </View>
    </View>
  );
}
