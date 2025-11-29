import React, { useCallback, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, View } from "react-native";
import TodayFocusCard from "@/components/insights/TodayFocusCard";
import StreakCard from "@/components/insights/StreakCard";
import GoalsCard from "@/components/insights/GoalsCard";
import FocusChart from "@/components/insights/FocusChart";
import { useGlobalContext } from "@/lib/GlobalProvider";
import { useInsights } from "@/hooks/useInsights";
import { CoralPalette } from "@/constants/colors";

export default function FocusScreen() {
  const { userProfile, showBanner } = useGlobalContext();
  const userId = String(userProfile?.userId || "");
  
  // Get today's data from global profile
  const todayMinutesFromProfile = userProfile?.timeActiveTodayMinutes ?? 0;
  const minutesByHourFromProfile = userProfile?.minutesByHour ?? Array(24).fill(0);

  const {
    streak,
    currentWeekTotal,
    dailyGoal,
    weeklyGoal,
    updateGoals,
    anyLoading,
    refreshStreak,
    refreshWeek,
    refreshGoals,
  } = useInsights(userId, todayMinutesFromProfile, minutesByHourFromProfile);

  const handleUpdateGoals = async (daily: number, weekly: number) => {
    try {
      const result = await updateGoals(daily, weekly);
      if (result) {
          showBanner({
            title: "Your new goals have been saved.",
            preset: "done",
            haptic: "success",
          });
      }
      return result;
    } catch (error) {
      showBanner('Failed to update goals', 'error');
      throw error;
    }
  };

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    if (!userId) return;
    setRefreshing(true);
    try {
      await Promise.all([
        refreshStreak(),
        refreshWeek(todayMinutesFromProfile),
        refreshGoals(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [userId, refreshStreak, refreshWeek, refreshGoals, todayMinutesFromProfile]);

  const showBigLoader = anyLoading && !refreshing;

  return (
    <View className="flex-1" style={{ backgroundColor: CoralPalette.surface }}>
      {showBigLoader ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          className="w-full px-6"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          <View className="mt-6 mb-4 flex-row gap-4">
            <TodayFocusCard />
            {/* StreakCard no longer handles loading; parent chooses when to show loader */}
            <StreakCard streak={streak} />
          </View>

          <GoalsCard 
            todayTotalMinutes={todayMinutesFromProfile} 
            currentWeekTotal={currentWeekTotal}
            dailyGoal={dailyGoal}
            weeklyGoal={weeklyGoal}
            onUpdateGoals={handleUpdateGoals}
          />

          <FocusChart title="Focused Time Distribution" />
        </ScrollView>
      )}
    </View>
  );
}
