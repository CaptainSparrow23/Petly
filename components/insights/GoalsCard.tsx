import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export default function GoalsCard() {
  const dailyProgress = 60; 
  const weeklyProgress = 30; 

  return (
    <View className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
      <View className="flex-row items-center justify-between">
        <Text className="text-m text-gray-700">Goals</Text>
        <TouchableOpacity>
          <Text className="text-sm font-rubik-medium text-black-300" style={{ color: '#3B82F6' }}>
            Edit Goals
          </Text>
        </TouchableOpacity>
      </View>

      {/* Daily focus goal */}
      <View className="mt-6">
        <Text className="text-sm text-gray-700">Daily focus goal (static data)</Text>
        <View className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
          <View
            className="h-full rounded-full"
            style={{ width: `${dailyProgress}%`, backgroundColor: '#3B82F6' }}
          />
        </View>
        <Text className="mt-2 text-xs text-gray-500">{dailyProgress}% complete</Text>
      </View>

      {/* Weekly focus goal */}
      <View className="mt-5">
        <Text className="text-sm text-gray-700">Weekly focus goal (static data)</Text>
        <View className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
          <View
            className="h-full rounded-full"
            style={{ width: `${weeklyProgress}%`, backgroundColor: '#3B82F6' }}
          />
        </View>
        <Text className="mt-2 text-xs text-gray-500">{weeklyProgress}% complete</Text>
      </View>
    </View>
  );
}
