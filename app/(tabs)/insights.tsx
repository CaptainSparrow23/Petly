// app/insights/FocusScreen.tsx
import React from "react";
import { ScrollView, View } from "react-native";
import TodayFocusCard from "@/components/insights/TodayFocusCard";
import StreakCard from "@/components/insights/StreakCard";
import GoalsCard from "@/components/insights/GoalsCard";
import FocusChart from "@/components/insights/FocusChart";
import { useGlobalContext } from "@/lib/GlobalProvider";
import { useDailyStreak } from "@/hooks/useInsights";

export default function FocusScreen() {
  const { userProfile } = useGlobalContext();
  const userId = String(userProfile?.userId || "");

  const {
    streak,
    loading: streakLoading,
    today,
    insightsLoading,
    week,
    weekLoading,
  } = useDailyStreak(userId);

  return (
    <View className="bg-white flex-1">
      <ScrollView showsVerticalScrollIndicator={false} className="w-full px-6">
        <View className="mt-6 mb-4 flex-row gap-4">
          <TodayFocusCard />
          <StreakCard streak={streak} loading={streakLoading} />
        </View>

        <GoalsCard />

        <FocusChart
          data={{ today, week }}
          loading={{ today: insightsLoading, week: weekLoading }}
          initialRange="today"
          title="Focused Time Distribution"
        />
      </ScrollView>
    </View>
  );
}
