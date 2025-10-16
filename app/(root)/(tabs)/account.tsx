import { MenuButton } from "@/components/MenuButton";
import { useGlobalContext } from "@/lib/global-provider";
import { useWeeklyFocusData } from "@/hooks/account";
import { Camera } from "lucide-react-native";
import React, { useCallback, useMemo } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";

const PRIMARY_BLUE = "#2563eb";
const GRID_LINE_COLOR = "#e5e7eb";
const DASH_LINE_COLOR = PRIMARY_BLUE;
const CHART_HEIGHT = 200;
const BAR_MAX_HEIGHT = 120;
const BAR_MIN_ACTIVE_HEIGHT = 8;
const BAR_MIN_INACTIVE_HEIGHT = 2;
const MAX_CHART_HOURS = 10;
const MAX_CHART_MINUTES = MAX_CHART_HOURS * 60;
const Y_AXIS_STEP_HOURS = 2;
const Y_AXIS_LABELS = Array.from(
  { length: MAX_CHART_HOURS / Y_AXIS_STEP_HOURS + 1 },
  (_, idx) => MAX_CHART_HOURS - idx * Y_AXIS_STEP_HOURS,
);
const Y_AXIS_LABEL_WIDTH = 25;
const DAY_ORDER: string[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const formatTotalHours = (minutes: number) => {
  if (!minutes) return "0";
  const hours = minutes / 60;
  return Number.isInteger(hours) ? `${hours}` : hours.toFixed(1);
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

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  return (
    <SafeAreaView className="h-full bg-white">
      <View className="w-full flex-row items-center justify-between px-6 pt-4">
        <MenuButton />
        <View className="w-12" />
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
        contentContainerClassName="pb-20 px-7"
        className="w-full px-4"
      >
        <View className="flex-row justify-center flex mt-5">
          <View className="flex flex-col items-center relative">
            <Image
              source={{ uri: user?.avatar }}
              className="size-44 relative rounded-full"
            />
            <TouchableOpacity className="absolute bottom-11 right-2 bg-white rounded-full p-2 shadow-md">
              <Camera size={20} color="#000" />
            </TouchableOpacity>
            <Text className="text-2xl top-3 font-rubik-bold mt-2">{user?.name}</Text>
          </View>
        </View>

        {/* Weekly Focus Chart Section */}
        <View className="mt-10 rounded-2xl border border-gray-200 bg-white p-6">
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
          <View className="mt-6 rounded-2xl border border-gray-200 bg-white p-5">
            <Text className="text-sm font-rubik-medium text-gray-500 mb-4">
              Weekly Summary
            </Text>
            <View className="flex-row justify-between">
              <View className="flex-1">
                <Text className="text-sm text-gray-600">Total Week</Text>
                <Text className="text-lg font-rubik-bold text-blue-600">
                  {totalFocusedMinutes} mins
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-sm text-gray-600">Best Day</Text>
                <Text className="text-lg font-rubik-bold text-blue-600">
                  {bestDayMinutes} mins
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-sm text-gray-600">Avg/Day</Text>
                <Text className="text-lg font-rubik-bold text-blue-400">
                  {averagePerDay} mins
                </Text>
              </View>
            </View>
          </View>
        )}

        <View className="flex-1 mt-10 border-t border-gray-200"></View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Account;
