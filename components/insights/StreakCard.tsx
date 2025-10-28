import React from 'react';
import { View, Text } from 'react-native';

export default function StreakCard() {
  return (
    <View className="flex-1 relative rounded-2xl border border-gray-200 bg-gray-50 p-3 h-[110px]">
      <Text className="text-m text-gray-700">Focus streak</Text>
      <Text className="absolute -bottom-1 right-3 text-7xl font-semibold font-rubik-bold text-blue-600">0</Text>
    </View>
  );
}
