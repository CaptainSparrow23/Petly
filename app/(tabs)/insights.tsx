// app/insights/FocusScreen.tsx
import React from "react";
import { ScrollView, View } from "react-native";
import TodayFocusCard from "@/components/insights/TodayFocusCard";
import StreakCard from "@/components/insights/StreakCard";
import GoalsCard from "@/components/insights/GoalsCard";
import FocusChart from "@/components/insights/FocusChart";
import { useGlobalContext } from "@/lib/GlobalProvider";
import { useDailyStreak } from "@/hooks/useInsights"; // or useInsights if you renamed it

export default function FocusScreen() {
  const { userProfile } = useGlobalContext();
  const userId = String(userProfile?.userId || "");

  // Get streak and daily insights data from the combined hook
  const {
    streak,
    loading: streakLoading,
    today,
    insightsLoading,
  } = useDailyStreak(userId);

  return (
    <View className="bg-white flex-1">
      <ScrollView showsVerticalScrollIndicator={false} className="w-full px-6">
        {/* Top Row: Today and Streak Cards */}
        <View className="mt-6 mb-4 flex-row gap-4">
          <TodayFocusCard />
          <StreakCard streak={streak} loading={streakLoading} />
        </View>

        {/* Goals Section */}
        <GoalsCard />

        {/* Focus Time Chart */}
        <FocusChart
          data={{ today }}
          initialRange="today"
          title={
            insightsLoading
              ? "Focused Time Distribution (loading…)"
              : "Focused Time Distribution"
          }
        />
      </ScrollView>
    </View>
  );
}
