import React, { useCallback, useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import TodayFocusCard from "@/components/insights/TodayFocusCard";
import StreakCard from "@/components/insights/StreakCard";
import GoalsCard from "@/components/insights/GoalsCard";
import FocusChart from "@/components/insights/FocusChart";
import TagDistributionChart from "@/components/insights/TagDistributionChart";
import { useGlobalContext } from "@/lib/GlobalProvider";
import { useInsights } from "@/hooks/useInsights";
import { CoralPalette } from "@/constants/colors";
import {
  TodayFocusCardSkeleton,
  StreakCardSkeleton,
  GoalsCardSkeleton,
  FocusChartSkeleton,
  TagDistributionChartSkeleton,
} from "@/components/other/Skeleton";

export default function FocusScreen() {
  const { userProfile } = useGlobalContext();
  const userId = String(userProfile?.userId || "");
  
  // Get today's data from global profile
  const todayMinutesFromProfile = userProfile?.timeActiveTodayMinutes ?? 0;
  const minutesByHourFromProfile = userProfile?.minutesByHour ?? Array(24).fill(0);

  const {
    streak,
    currentWeekTotal,
    anyLoading,
    refreshStreak,
    refreshWeek,
  } = useInsights(userId, todayMinutesFromProfile, minutesByHourFromProfile);

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    if (!userId) return;
    setRefreshing(true);
    try {
      await Promise.all([
        refreshStreak(),
        refreshWeek(todayMinutesFromProfile),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [userId, refreshStreak, refreshWeek, todayMinutesFromProfile]);

  const showBigLoader = anyLoading && !refreshing;

  const LoadingState = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      className="w-full px-6"
      contentContainerStyle={{ paddingBottom: 32 }}
    >
      <View className="mt-6 mb-4 flex-row gap-4">
        <TodayFocusCardSkeleton />
        <StreakCardSkeleton />
      </View>
      <GoalsCardSkeleton />
      <FocusChartSkeleton />
      <TagDistributionChartSkeleton />
    </ScrollView>
  );

  return (
    <View className="flex-1" style={{ backgroundColor: CoralPalette.greyLighter }}>
      {showBigLoader ? (
        <LoadingState />
      ) : (
        
        <ScrollView
          showsVerticalScrollIndicator={false}
          className="w-full px-6"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          <View className="mt-4 mb-4 flex-row gap-4">
     
            <TodayFocusCard />
            {/* StreakCard no longer handles loading; parent chooses when to show loader */}
            <StreakCard streak={streak} />
          </View>

          <GoalsCard 
            todayTotalMinutes={todayMinutesFromProfile} 
            currentWeekTotal={currentWeekTotal}
          />

          <FocusChart title="Focused Time Distribution" />

          <TagDistributionChart title="Tag Distribution" />
        </ScrollView>
      )}
    </View>
  );
}
