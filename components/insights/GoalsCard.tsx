// components/GoalsCard.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

const PRIMARY_BLUE = '#2563eb';

export default function GoalsCard({
  dailyProgressRatio,
  weeklyProgressRatio,
  dailyLabel,
  weeklyLabel,
  onEdit,
}: {
  dailyProgressRatio: number;
  weeklyProgressRatio: number;
  dailyLabel: string;
  weeklyLabel: string;
  onEdit?: () => void;
}) {
  return (
    <View className="mt-6 rounded-2xl border border-gray-200 bg-white p-4">
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-rubik-medium text-gray-500">Goals</Text>
        <TouchableOpacity onPress={onEdit}>
          <Text className="text-sm font-rubik-medium" style={{ color: PRIMARY_BLUE }}>
            Edit Goals
          </Text>
        </TouchableOpacity>
      </View>

      <View className="mt-4">
        <Text className="text-sm text-gray-700">Daily focus goal</Text>
        <View className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
          <View
            className="h-full rounded-full"
            style={{ width: `${Math.min(1, dailyProgressRatio) * 100}%`, backgroundColor: PRIMARY_BLUE }}
          />
        </View>
        <Text className="mt-2 text-xs text-gray-500">{dailyLabel}</Text>
      </View>

      <View className="mt-5">
        <Text className="text-sm text-gray-700">Weekly focus goal</Text>
        <View className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
          <View
            className="h-full rounded-full"
            style={{ width: `${Math.min(1, weeklyProgressRatio) * 100}%`, backgroundColor: PRIMARY_BLUE }}
          />
        </View>
        <Text className="mt-2 text-xs text-gray-500">{weeklyLabel}</Text>
      </View>
    </View>
  );
}
