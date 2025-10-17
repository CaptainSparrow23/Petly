import { MenuButton } from "@/components/other/MenuButton";
import { useWeeklyFocusData } from "@/hooks/account";
import React, { useCallback, useMemo } from "react";
import { ScrollView, Text, TouchableOpacity, View, ActivityIndicator, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useGlobalContext } from "@/lib/global-provider";
import { useRouter } from "expo-router";
import Svg, { Circle } from "react-native-svg";

const PRIMARY_BLUE = "#2563eb";
const GRID_LINE_COLOR = "#e5e7eb";
const DASH_LINE_COLOR = PRIMARY_BLUE;
const CHART_HEIGHT = 200;
const BAR_MAX_HEIGHT = 120;
const BAR_MIN_ACTIVE_HEIGHT = 8;
const BAR_MIN_INACTIVE_HEIGHT = 2;
const MAX_CHART_HOURS = 8;
const MAX_CHART_MINUTES = MAX_CHART_HOURS * 60;
const DAILY_GOAL_MINUTES = 60; // 1 hour goal
const WEEKLY_GOAL_MINUTES = 300; // 5 hours goal
const Y_AXIS_STEP_HOURS = 2;
const Y_AXIS_LABELS = Array.from(
  { length: MAX_CHART_HOURS / Y_AXIS_STEP_HOURS + 1 },
  (_, idx) => MAX_CHART_HOURS - idx * Y_AXIS_STEP_HOURS,
);
const Y_AXIS_LABEL_WIDTH = 25;
const DAY_ORDER: string[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const MODE_BREAKDOWN = [
  { label: "Study", value: 120, color: "#0ea5e9" },
  { label: "Work", value: 90, color: "#f59e0b" },
  { label: "Break", value: 45, color: "#22c55e" },
  { label: "Rest", value: 30, color: "#a855f7" },
];

const MODE_BREAKDOWN_TOTAL = MODE_BREAKDOWN.reduce((sum, item) => sum + item.value, 0);


const formatTotalHours = (minutes: number) => {
  if (!minutes) return "0";
  const hours = minutes / 60;
  return Number.isInteger(hours) ? `${hours}` : hours.toFixed(1);
};

const parseTimeStringToSeconds = (timeString?: string | null) => {
  if (!timeString) return 0;
  const minuteMatch = timeString.match(/(\d+)\s*min/);
  const secondMatch = timeString.match(/(\d+)\s*sec/);
  const minutes = minuteMatch ? parseInt(minuteMatch[1], 10) : 0;
  const seconds = secondMatch ? parseInt(secondMatch[1], 10) : 0;
  return minutes * 60 + seconds;
};

const formatDetailedDuration = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts: string[] = [];
  if (hours > 0) {
    parts.push(`${hours} hr${hours === 1 ? "" : "s"}`);
  }
  parts.push(`${minutes} min${minutes === 1 ? "" : "s"}`);
  parts.push(`${seconds} sec${seconds === 1 ? "" : "s"}`);
  return parts.join(" ");
};

const formatGoalProgress = (minutes: number, goalMinutes: number) => {
  const totalHours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  const goalHours = Math.floor(goalMinutes / 60);
  const goalLabel =
    goalHours > 0
      ? `${goalHours}h`
      : `${goalMinutes}m`;

  if (totalHours > 0) {
    return `${totalHours}h${remainingMinutes > 0 ? ` ${remainingMinutes}m` : ""} / ${goalLabel}`;
  }
  return `${remainingMinutes}m / ${goalLabel}`;
};

const formatMinutes = (minutes: number) => {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs > 0) {
    return `${hrs}h${mins > 0 ? ` ${mins}m` : ""}`;
  }
  return `${mins}m`;
};

const ModeBreakdownDonut = () => {
  const size = 180;
  const center = size / 2;
  const radius = 60;
  const strokeWidth = 22;
  const circumference = 2 * Math.PI * radius;

  let currentOffset = circumference;
  const arcs = MODE_BREAKDOWN.map((segment) => {
    const segmentLength = MODE_BREAKDOWN_TOTAL
      ? (segment.value / MODE_BREAKDOWN_TOTAL) * circumference
      : 0;
    currentOffset -= segmentLength;
    return (
      <Circle
        key={segment.label}
        cx={center}
        cy={center}
        r={radius}
        stroke={segment.color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={`${segmentLength} ${circumference}`}
        strokeDashoffset={currentOffset}
        strokeLinecap="butt"
        transform={`rotate(-90 ${center} ${center})`}
      />
    );
  });

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle
        cx={center}
        cy={center}
        r={radius}
        stroke="#e2e8f0"
        strokeWidth={strokeWidth}
        fill="none"
      />
      {arcs}
    </Svg>
  );
};

const Account = () => {
  const { user } = useGlobalContext();
  const { weeklyData, loading, error, refetch } = useWeeklyFocusData();
  const orderedWeeklyData = useMemo(() => {
    const dataByDay = weeklyData.reduce<Record<string, (typeof weeklyData)[number]>>(
      (acc, item) => {
        acc[item.dayName] = item;
        return acc;
      },
      {},
    );

    return DAY_ORDER.map((dayName) => {
      const existing = dataByDay[dayName];
      if (existing) {
        return existing;
      }
      return {
        date: `missing-${dayName}`,
        dayName,
        totalMinutes: 0,
        timeString: "0 mins",
      };
    });
  }, [weeklyData]);

  const totalFocusedMinutes = orderedWeeklyData.reduce((sum, day) => sum + day.totalMinutes, 0);
  const hasData = orderedWeeklyData.some(day => day.totalMinutes > 0);
  const formattedTotalHours = formatTotalHours(totalFocusedMinutes);
  const bestDayMinutes = orderedWeeklyData.length ? Math.max(...orderedWeeklyData.map(day => day.totalMinutes)) : 0;
  const averagePerDay = orderedWeeklyData.length ? Math.floor(totalFocusedMinutes / orderedWeeklyData.length) : 0;
  const todayShortName = useMemo(
    () => new Date().toLocaleDateString("en-US", { weekday: "short" }),
    [],
  );
  const todayTotals = useMemo(() => {
    const found = orderedWeeklyData.find((day) => day.dayName === todayShortName);
    if (found) return found;
    return {
      date: `placeholder-${todayShortName}`,
      dayName: todayShortName,
      totalMinutes: 0,
      timeString: "0 mins",
    };
  }, [orderedWeeklyData, todayShortName]);
  const streakCount = useMemo(() => {
    const sortedByDate = [...weeklyData].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    let count = 0;
    for (const day of sortedByDate) {
      if ((day.totalMinutes ?? 0) > 0) {
        count += 1;
      } else {
        break;
      }
    }
    return count;
  }, [weeklyData]);
  const todayTotalSeconds = useMemo(() => {
    const parsed = parseTimeStringToSeconds(todayTotals.timeString);
    if (parsed > 0) {
      return parsed;
    }
    return (todayTotals.totalMinutes ?? 0) * 60;
  }, [todayTotals]);

  const todayDurationLabel = useMemo(() => {
    if (!todayTotalSeconds) return "";
    return formatDetailedDuration(todayTotalSeconds);
  }, [todayTotalSeconds]);
  const todayMinutes = todayTotals.totalMinutes ?? 0;
  const dailyProgressRatio = Math.min(todayMinutes / DAILY_GOAL_MINUTES, 1);
  const weeklyProgressRatio = Math.min(totalFocusedMinutes / WEEKLY_GOAL_MINUTES, 1);
  const dailyProgressLabel = formatGoalProgress(todayMinutes, DAILY_GOAL_MINUTES);
  const weeklyProgressLabel = formatGoalProgress(totalFocusedMinutes, WEEKLY_GOAL_MINUTES);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  return (
    <SafeAreaView className="h-full bg-white">
      <View className="w-full flex-row items-center px-6 pt-4">
        <View className="flex-1">
          <MenuButton />
        </View>
        <View className="flex-1 items-center pb-2">
          <Text className="text-2xl font-rubik-medium text-gray-900">Insights</Text>
        </View>
        <View className="flex-1 items-end">
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {}}
          >
            <Image
              source={{ uri: user?.avatar }}
              className="h-12 w-12 rounded-full border border-white bottom-0.5"
            />
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
        contentContainerClassName="px-4"
        className="w-full px-4"
      >
        <View className="mt-6 flex-row gap-4">
          <View className="flex-[3] rounded-2xl border border-gray-200 bg-white p-4">
            <Text className="text-sm font-rubik-medium text-gray-500">Today&apos;s Focus</Text>

            {todayTotalSeconds > 0 ? (
              <>
                <Text className="mt-3 text-3xl font-rubik-bold text-blue-600">
                  {todayDurationLabel}
                </Text>
                <Text className="mt-2 text-xs text-gray-400">
                  Total focused time across all modes today
                </Text>
              </>
            ) : (
              <Text className="mt-3 text-sm text-gray-500">
                No focus sessions logged yet today
              </Text>
            )}
          </View>

          <View className="flex-[1] rounded-2xl border border-gray-200 bg-white p-4 items-center justify-center">
            <View className="flex-row items-center justify-center mt-3.5">
              <Text style={{ fontSize: 38 }}>🔥</Text>
              <Text className="ml-1 top-1.5 text-4xl font-rubik-bold text-black-300">
                {streakCount}
              </Text>
            </View>
            <Text className="mt-2 text-xs text-gray-400">Focus streak</Text>
          </View>
        </View>

        <View className="mt-6 rounded-2xl border border-gray-200 bg-white p-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-rubik-medium text-gray-500">Goals</Text>
            <TouchableOpacity>
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
                style={{
                  width: `${dailyProgressRatio * 100}%`,
                  backgroundColor: PRIMARY_BLUE,
                }}
              />
            </View>
            <Text className="mt-2 text-xs text-gray-500">{dailyProgressLabel}</Text>
          </View>

          <View className="mt-5">
            <Text className="text-sm text-gray-700">Weekly focus goal</Text>
            <View className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
              <View
                className="h-full rounded-full"
                style={{
                  width: `${weeklyProgressRatio * 100}%`,
                  backgroundColor: PRIMARY_BLUE,
                }}
              />
            </View>
            <Text className="mt-2 text-xs text-gray-500">{weeklyProgressLabel}</Text>
          </View>
        </View>

        {/* Weekly Focus Chart Section */}
        <View className="mt-6 rounded-2xl border border-gray-200 bg-white p-4">
          <Text className="text-lg font-rubik-medium text-gray-900">
            Focused Time Distribution
          </Text>
          <Text className="mt-1 text-sm text-gray-600">
            Total focused time:{" "}
            <Text className="font-rubik-medium" style={{ color: PRIMARY_BLUE }}>
              {formattedTotalHours}
            </Text>{" "}
            hours
          </Text>

          {loading ? (
            <View className="flex-row items-center justify-center py-8">
              <ActivityIndicator size="large" color={PRIMARY_BLUE} />
            </View>
          ) : error ? (
            <View className="py-8">
              <Text className="text-red-500 text-center mb-2">Error loading data</Text>
              <Text className="text-gray-600 text-center text-sm">{error}</Text>
              <TouchableOpacity 
                onPress={refetch}
                className="bg-blue-500 rounded-lg px-4 py-2 mt-3 self-center"
              >
                <Text className="text-white font-rubik-medium">Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="mt-6">
              <View style={{ height: CHART_HEIGHT }}>
                <View style={{ flexDirection: "row", height: "100%" }}>
                  <View
                    style={{
                      width: Y_AXIS_LABEL_WIDTH,
                      justifyContent: "space-between",
                      alignItems: "flex-end",
                      paddingVertical: 12,
                    }}
                  >
                    {Y_AXIS_LABELS.map((label, index) => (
                      <Text
                        key={`y-label-${label}-${index}`}
                        style={{ fontSize: 12, color: "#94a3b8" }}
                      >
                        {`${label} h`}
                      </Text>
                    ))}
                  </View>
                  <View
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      position: "relative",
                    }}
                  >
                    <View style={{ flex: 1, justifyContent: "space-between" }}>
                      {Y_AXIS_LABELS.slice(0, -1).map((_, index) => (
                        <View
                          key={`grid-line-${index}`}
                          style={{
                            borderBottomWidth: 1,
                            borderBottomColor: GRID_LINE_COLOR,
                          }}
                        />
                      ))}
                      <View
                        style={{
                          borderBottomWidth: 1,
                          borderBottomColor: DASH_LINE_COLOR,
                          borderStyle: "dashed",
                        }}
                      />
                    </View>

                    <View
                      style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        top: 12,
                        bottom: 12,
                        flexDirection: "row",
                        alignItems: "flex-end",
                        paddingHorizontal: 8,
                      }}
                    >
                      {orderedWeeklyData.map((day) => {
                        const normalized = Math.min(day.totalMinutes, MAX_CHART_MINUTES) / MAX_CHART_MINUTES;
                        const barHeight = Math.max(
                          normalized * BAR_MAX_HEIGHT,
                          day.totalMinutes > 0 ? BAR_MIN_ACTIVE_HEIGHT : BAR_MIN_INACTIVE_HEIGHT,
                        );

                        return (
                          <View key={day.date} style={{ flex: 1, alignItems: "center" }}>
                            <Text style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>
                              {day.totalMinutes > 0 ? `${day.totalMinutes}m` : ""}
                            </Text>
                            <View
                              style={{
                                width: 16,
                                height: barHeight,
                                borderRadius: 8,
                                backgroundColor: day.totalMinutes > 0 ? PRIMARY_BLUE : GRID_LINE_COLOR,
                              }}
                            />
                          </View>
                        );
                      })}
                    </View>

                    {!hasData && (
                      <Text
                        className="font-rubik-medium"
                        style={{
                          position: "absolute",
                          alignSelf: "center",
                          top: "45%",
                          fontSize: 14,
                          color: "#cbd5f5",
                        }}
                      >
                        No data
                      </Text>
                    )}
                  </View>
                </View>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginLeft: Y_AXIS_LABEL_WIDTH,
                  paddingHorizontal: 8,
                  marginTop: 12,
                }}
              >
                {orderedWeeklyData.map((day) => (
                  <View key={`${day.date}-label`} style={{ flex: 1, alignItems: "center" }}>
                    <Text className="text-xs font-rubik-medium text-gray-800">
                      {day.dayName}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {!loading && !error && (
          <>
            <View className="mt-6 rounded-2xl border border-gray-200 bg-white p-4">
              <Text className="text-sm font-rubik-medium text-gray-500 mb-4">
                Weekly Summary
              </Text>
              <View className="flex-row justify-between gap-4">
                <View className="flex-1 items-center">
                  <Text className="text-sm text-gray-600 text-center">Total Week</Text>
                  <Text className="text-lg font-rubik-bold text-blue-600 text-center">
                    {totalFocusedMinutes} mins
                  </Text>
                </View>
                <View className="flex-1 items-center">
                  <Text className="text-sm text-gray-600 text-center">Best Day</Text>
                  <Text className="text-lg font-rubik-bold text-blue-600 text-center">
                    {bestDayMinutes} mins
                  </Text>
                </View>
                <View className="flex-1 items-center">
                  <Text className="text-sm text-gray-600 text-center">Avg/Day</Text>
                  <Text className="text-lg font-rubik-bold text-blue-600 text-center">
                    {averagePerDay} mins
                  </Text>
                </View>
              </View>
            </View>

            <View className="mt-6 rounded-2xl border border-gray-200 bg-white p-5">
              <Text className="text-sm font-rubik-medium text-gray-500 mb-4">
                Focus Mode Breakdown
              </Text>
              <View className="flex-row items-center">
                <ModeBreakdownDonut />
                <View className="ml-6 flex-1 gap-3">
                  {MODE_BREAKDOWN.map((segment) => (
                    <View key={segment.label} className="flex-row items-center">
                      <View
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: segment.color }}
                      />
                      <Text className="ml-2 flex-1 text-sm text-gray-700">
                        {segment.label}
                      </Text>
                      <Text className="text-sm font-rubik-medium text-gray-900">
                        {formatMinutes(segment.value)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </>
        )}

     
      </ScrollView>
    </SafeAreaView>
  );
};

export default Account;
