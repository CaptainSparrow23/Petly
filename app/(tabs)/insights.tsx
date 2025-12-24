import React, { useCallback, useState, useMemo, useEffect } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { RefreshControl, ScrollView, View, Text, TouchableOpacity } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing } from "react-native-reanimated";
import { Calendar } from "lucide-react-native";

// Insight components
import TodayFocusCard from "@/components/insights/TodayFocusCard";
import TodayActivityChart from "@/components/insights/TodayActivityChart";
import GoalsCard from "@/components/insights/GoalsCard";
import FocusChart from "@/components/insights/FocusChart";
import TagDistributionChart from "@/components/insights/TagDistributionChart";
import {
  FONT,
  FireIcon,
  ClockIcon,
  TargetIcon,
  StatListItem,
  WeekDayBar,
} from "@/components/insights/InsightSharedComponents";

// Hooks and utilities
import { useGlobalContext } from "@/providers/GlobalProvider";
import { useInsights } from "@/hooks/useInsights";
import { usePets } from "@/hooks/usePets";
import { CoralPalette } from "@/constants/colors";
import {
  TodayFocusCardSkeleton,
  GoalsCardSkeleton,
  FocusChartSkeleton,
  TagDistributionChartSkeleton,
  Skeleton,
} from "@/components/other/Skeleton";

type TabMode = "dashboard" | "analytics";

export default function InsightsScreen() {
  const { userProfile, appSettings, refetchUserProfile } = useGlobalContext();
  const userId = String(userProfile?.userId || "");

  // Refresh user profile when screen is focused to get latest data
  useFocusEffect(
    useCallback(() => {
      refetchUserProfile().catch((err) => {
        console.error("❌ Failed to refetch profile on insights focus:", err);
      });
    }, [refetchUserProfile])
  );
  const [activeTab, setActiveTab] = useState<TabMode>("dashboard");
  const [tabLayouts, setTabLayouts] = useState<{ [key: string]: { x: number; width: number } }>({});

  // Get today's data from global profile
  const todayMinutesFromProfile = userProfile?.timeActiveTodayMinutes ?? 0;
  const minutesByHourFromProfile = userProfile?.minutesByHour ?? Array(24).fill(0);
  const showHours = appSettings.displayFocusInHours;

  const {
    streak,
    currentWeekTotal,
    week,
    anyLoading,
    refreshStreak,
    refreshWeek,
  } = useInsights(userId, todayMinutesFromProfile, minutesByHourFromProfile);

  const { pets } = usePets({
    ownedPets: userProfile?.ownedPets,
    selectedPet: userProfile?.selectedPet,
    userId: userProfile?.userId,
  });

  const [refreshing, setRefreshing] = useState(false);

  // Animated pill position
  const pillPosition = useSharedValue(0);

  useEffect(() => {
    const tabIndex = activeTab === "dashboard" ? 0 : 1;
    pillPosition.value = withTiming(tabIndex, {
      duration: 250,
      easing: Easing.out(Easing.cubic),
    });
  }, [activeTab, pillPosition]);

  const animatedPillStyle = useAnimatedStyle(() => {
    if (!tabLayouts["dashboard"]) return { opacity: 0 };
    const tabWidth = tabLayouts["dashboard"].width;
    return {
      transform: [{ translateX: pillPosition.value * tabWidth }],
      width: tabWidth,
      opacity: 1,
    };
  }, [tabLayouts]);

  const handleRefresh = useCallback(async () => {
    if (!userId || refreshing) return;
    setRefreshing(true);
    try {
      // Add minimum duration so refresh feels intentional
      const [,] = await Promise.all([
        Promise.all([refreshStreak(), refreshWeek(todayMinutesFromProfile)]),
        new Promise(resolve => setTimeout(resolve, 800)), // Minimum 800ms
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [userId, refreshing, refreshStreak, refreshWeek, todayMinutesFromProfile]);

  // Derived statistics
  const totalFocusHours = useMemo(() => {
    const seconds = userProfile?.totalFocusSeconds ?? 0;
    return Math.floor(seconds / 3600);
  }, [userProfile?.totalFocusSeconds]);

  const totalFocusFormatted = useMemo(() => {
    const seconds = userProfile?.totalFocusSeconds ?? 0;
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours === 0) return `${mins} mins`;
    if (mins === 0) return `${hours} hrs`;
    return `${hours} hrs ${mins} mins`;
  }, [userProfile?.totalFocusSeconds]);

  const highestStreak = userProfile?.highestStreak ?? 0;
  const dailyStreak = userProfile?.dailyStreak ?? 0;

  // Collection counts
  const petsCount = userProfile?.ownedPets?.length ?? 0;
  const hatsCount = userProfile?.ownedHats?.length ?? 0;
  const collarsCount = userProfile?.ownedCollars?.length ?? 0;
  const gadgetsCount = userProfile?.ownedGadgets?.length ?? 0;
  const accessoriesCount = hatsCount + collarsCount;

  // Weekly average
  const weeklyAverage = useMemo(() => {
    if (currentWeekTotal === 0) return "0 mins";
    const avgMins = Math.round(currentWeekTotal / 7);
    if (showHours) {
      const hrs = avgMins / 60;
      if (hrs >= 1) {
        return `${hrs.toFixed(1)} ${hrs === 1 ? "hr" : "hrs"}`;
      }
      return `${avgMins} ${avgMins === 1 ? "min" : "mins"}`;
    }
    return `${avgMins} ${avgMins === 1 ? "min" : "mins"}`;
  }, [currentWeekTotal, showHours]);

  // Best day this week
  const bestDayThisWeek = useMemo(() => {
    if (!week || week.length === 0) return { day: "N/A", minutes: 0 };
    const best = week.reduce((max, day) => 
      day.totalMinutes > max.totalMinutes ? day : max, week[0]);
    return { day: best.label, minutes: best.totalMinutes };
  }, [week]);
  // Pet friendships
  const petFriendships = userProfile?.petFriendships ?? {};
  const ownedPets = userProfile?.ownedPets ?? [];

  const petFriendshipData = useMemo(() => {
    return ownedPets.map((petId) => {
      const pet = pets.find((p) => p.id === petId);
      const friendshipData = petFriendships[petId];
      const level = friendshipData?.level ?? 1;
      const xpIntoLevel = friendshipData?.xpIntoLevel ?? 0;
      const xpToNextLevel = friendshipData?.xpToNextLevel ?? 50;
      const xpTotal = xpIntoLevel + xpToNextLevel;
      const progress = xpTotal > 0 ? xpIntoLevel / xpTotal : 0;
      const totalFocusSeconds = friendshipData?.totalFocusSeconds ?? 0;
      const focusHours = Math.floor(totalFocusSeconds / 3600);

      return {
        petId,
        petName: pet?.name ?? petId.replace("pet_", "").charAt(0).toUpperCase() + petId.replace("pet_", "").slice(1),
        level,
        progress,
        focusHours,
      };
    });
  }, [ownedPets, pets, petFriendships]);

  // Favorite pet (most time focused)
  const favoritePet = useMemo(() => {
    if (petFriendshipData.length === 0) return null;
    return petFriendshipData.reduce((fav, pet) =>
      pet.focusHours > fav.focusHours ? pet : fav, petFriendshipData[0]);
  }, [petFriendshipData]);

  const showBigLoader = anyLoading && !refreshing;

  // Dashboard Skeleton - inline JSX to avoid remounting
  const dashboardSkeleton = (
    <View style={{ gap: 16 }}>
      <TodayFocusCardSkeleton />
      <GoalsCardSkeleton />
      <Skeleton width="100%" height={200} radius={5} />
      <Skeleton width="100%" height={150} radius={5} />
    </View>
  );

  // Analytics Skeleton - inline JSX to avoid remounting
  const analyticsSkeleton = (
    <View style={{ gap: 16 }}>
      <FocusChartSkeleton />
      <TagDistributionChartSkeleton />
      <Skeleton width="100%" height={200} radius={5} />
    </View>
  );

  // Calculate max minutes for week bar chart
  const maxWeekMinutes = useMemo(() => {
    if (!week || week.length === 0) return 60;
    return Math.max(...week.map((d) => d.totalMinutes), 60);
  }, [week]);

  // Calculate monday date for weekly breakdown header
  const mondayDateLabel = useMemo(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    return `${monday.getDate()}/${monday.getMonth() + 1}`;
  }, []);

  // Dashboard content - rendered inline to avoid remounting
  const dashboardContent = (
    <View style={{ gap: 16 }}>
      {/* Today Focus Card */}
      <View>
        <TodayFocusCard />
      </View>

      {/* Goals Card */}
      <View>
        <GoalsCard
          todayTotalMinutes={todayMinutesFromProfile}
          currentWeekTotal={currentWeekTotal}
        />
      </View>

      {/* Today's Activity Chart */}
      <TodayActivityChart data={minutesByHourFromProfile} />

      {/* Overview Stats Section */}
      <View
        style={{
          backgroundColor: CoralPalette.white,
          borderRadius: 20,
          padding: 6,
          borderColor: `${CoralPalette.primary}20`,
          borderWidth: 1,
          shadowColor: CoralPalette.primary,
          shadowOpacity: 0.1,
          shadowOffset: { width: 0, height: 3 },
          shadowRadius: 8,
          elevation: 6,
        }}
      >
        <StatListItem
          icon={FireIcon}
          label="Current Streak"
          value={`${dailyStreak} ${dailyStreak === 1 ? "day" : "days"}`}
          subValue={`Best: ${highestStreak} ${highestStreak === 1 ? "day" : "days"}`}
          color={CoralPalette.primary}
        />
        <StatListItem
          icon={ClockIcon}
          label="Total Focus"
          value={`${totalFocusHours}h`}
          subValue="lifetime"
          color={CoralPalette.blue}
        />
        <StatListItem
          icon={TargetIcon}
          label="This Week's Average"
          value={weeklyAverage}
          subValue="per day"
          color={CoralPalette.forestTeal}
          isLast
        />
      </View>
    </View>
  );

  // Analytics content - rendered inline to avoid remounting
  const analyticsContent = (
    <View style={{ gap: 16 }}>
      {/* Focus Chart */}
      <View>
        <FocusChart title="Time Distribution" />
      </View>

      {/* Tag Distribution */}
      <View>
        <TagDistributionChart title="Tag Distribution" />
      </View>

      {/* Weekly Breakdown Section - Visual Bar Chart */}
      <View
        style={[
          {
            borderRadius: 20,
            backgroundColor: CoralPalette.white,
            borderColor: `${CoralPalette.primary}20`,
            borderWidth: 1,
            overflow: "hidden",
          },
          {
            shadowColor: CoralPalette.primary,
            shadowOpacity: 0.15,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 12,
            elevation: 8,
          },
        ]}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            padding: 18,
            paddingBottom: 14,
          }}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: `${CoralPalette.primary}15`,
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12,
            }}
          >
            <Calendar size={20} color={CoralPalette.primary} strokeWidth={2.5} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[{ color: CoralPalette.dark, fontSize: 16, fontWeight: "700" }, FONT]}>
              Weekly Breakdown
            </Text>
          </View>
          <View
            style={{
              backgroundColor: `${CoralPalette.primary}15`,
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 8,
            }}
          >
            <Text style={[{ color: CoralPalette.primary, fontSize: 12, fontWeight: "700" }, FONT]}>
              From {mondayDateLabel}
            </Text>
          </View>
        </View>

        {/* Content */}
        <View style={{ padding: 16, paddingTop: 0 }}>
          {week.length > 0 ? (
            week.map((day) => (
              <WeekDayBar
                key={day.key}
                day={day.label.slice(0, 3)}
                minutes={day.totalMinutes}
                maxMinutes={maxWeekMinutes}
                isBestDay={day.label === bestDayThisWeek.day && day.totalMinutes > 0}
                color={CoralPalette.primary}
              />
            ))
          ) : (
            <Text style={[{ color: CoralPalette.mutedDark, textAlign: "center", paddingVertical: 12 }, FONT]}>
              No data available
            </Text>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <View className="flex-1" style={{ backgroundColor: CoralPalette.greyLighter }}>
      {/* Tab Switcher */}
      <View className="px-6 pt-4 pb-2">
        <View
          className="flex-row relative"
          style={{
            borderRadius: 5,
            backgroundColor: CoralPalette.white,
            padding: 5,
          }}
          onLayout={(e) => {
            const containerWidth = e.nativeEvent.layout.width;
            const padding = 5;
            const tabWidth = (containerWidth - padding * 2) / 2;
            setTabLayouts({
              dashboard: { x: padding, width: tabWidth },
              analytics: { x: padding + tabWidth, width: tabWidth },
            });
          }}
        >
          {/* Animated pill background */}
          {tabLayouts["dashboard"] && (
            <Animated.View
              pointerEvents="none"
              style={[
                {
                  position: "absolute",
                  left: tabLayouts["dashboard"].x,
                  top: 5,
                  bottom: 5,
                  backgroundColor: CoralPalette.primary,
                  borderRadius: 5,
                },
                animatedPillStyle,
              ]}
            />
          )}

          <TouchableOpacity
            className="flex-1 px-4 z-10"
            onPress={() => setActiveTab("dashboard")}
            style={{ paddingVertical: 3, borderRadius: 5 }}
          >
            <Text
              className="text-center font-semibold"
              style={[
                { 
                  color: activeTab === "dashboard" ? "#fff" : CoralPalette.mutedDark,
                },
                FONT,
              ]}
            >
              Dashboard
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 px-4 z-10"
            onPress={() => setActiveTab("analytics")}
            style={{ paddingVertical: 3, borderRadius: 5 }}
          >
            <Text
              className="text-center font-semibold"
              style={[
                { 
                  color: activeTab === "analytics" ? "#fff" : CoralPalette.mutedDark,
                },
                FONT,
              ]}
            >
              Analytics
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content - both tabs rendered but only active one visible (prevents remounting) */}
      <View style={{ flex: 1 }}>
        {/* Dashboard Tab */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          className="w-full px-6"
          style={{ display: activeTab === "dashboard" ? "flex" : "none" }}
          refreshControl={
            !showBigLoader ? (
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={handleRefresh}
                progressViewOffset={20}
                tintColor={CoralPalette.primary}
                colors={[CoralPalette.primary]}
              />
            ) : undefined
          }
          contentContainerStyle={{ paddingBottom: 32, paddingTop: 8 }}
        >
          {showBigLoader ? dashboardSkeleton : dashboardContent}
        </ScrollView>

        {/* Analytics Tab */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          className="w-full px-6"
          style={{ display: activeTab === "analytics" ? "flex" : "none" }}
          refreshControl={
            !showBigLoader ? (
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={handleRefresh}
                progressViewOffset={20}
                tintColor={CoralPalette.primary}
                colors={[CoralPalette.primary]}
              />
            ) : undefined
          }
          contentContainerStyle={{ paddingBottom: 32, paddingTop: 8 }}
        >
          {showBigLoader ? analyticsSkeleton : analyticsContent}
        </ScrollView>
      </View>
    </View>
  );
}
