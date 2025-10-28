import React from 'react';
import { ScrollView, View } from 'react-native';
import TodayFocusCard from '@/components/insights/TodayFocusCard';
import StreakCard from '@/components/insights/StreakCard';
import GoalsCard from '@/components/insights/GoalsCard';
import FocusChart from '@/components/insights/FocusChart';    

export default function FocusScreen() {
  return (
    <View className="bg-white flex-1">
      <ScrollView
        showsVerticalScrollIndicator={false}
        className="w-full px-6"
      >
        <View className="mt-6 mb-4 flex-row gap-4">
          <TodayFocusCard />
          <StreakCard />
        </View>

        <GoalsCard />

        <FocusChart />

      </ScrollView>
    </View>
  );
}
