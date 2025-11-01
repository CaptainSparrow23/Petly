import React from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
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
    // individual loading flags (kept for logic only)
    streakLoading,
    insightsLoading,
    weekLoading,
    today,
    week,
    sixWeeks,

    // derived helpers
    // pageLoading: show big loader until either route completes (today OR week)
    // i.e., show only if BOTH are still loading
    pageLoadingAll,
  } = useDailyStreak(userId);

  const showBigLoader = pageLoadingAll; // change to `insightsLoading || weekLoading || streakLoading` if you want "until everything finishes"

  return (
    <View className="bg-white flex-1">
      {showBigLoader ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} className="w-full px-6">
          <View className="mt-6 mb-4 flex-row gap-4">
            <TodayFocusCard />
            {/* StreakCard no longer handles loading; parent chooses when to show loader */}
            <StreakCard streak={streak} />
          </View>

          <GoalsCard />

          <FocusChart
            data={{ today, week, sixWeeks }}
            initialRange="today"
            title="Focused Time Distribution"
          />
        </ScrollView>
      )}
    </View>
  );
}
