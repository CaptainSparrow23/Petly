// components/StreakCard.tsx
import React from 'react';
import { View, Text } from 'react-native';

export default function StreakCard({ streak }: { streak: number }) {
  return (
    <View className="flex-[1] rounded-2xl border border-gray-200 bg-white p-4 items-center justify-center">
      <View className="flex-row items-center justify-center mt-3.5">
        <Text style={{ fontSize: 38 }}>🔥</Text>
        <Text className="ml-1 top-1.5 text-4xl font-rubik-bold text-black-300">{streak}</Text>
      </View>
      <Text className="mt-2 text-xs text-gray-400">Focus streak</Text>
    </View>
  );
}
