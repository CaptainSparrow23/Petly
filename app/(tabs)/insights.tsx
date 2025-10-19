import { MenuButton } from "@/components/other/MenuButton";
import { useMonthlyFocusSummary, useWeeklyFocusData } from "@/hooks/account";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useGlobalContext } from "@/lib/global-provider";
import { useRouter } from "expo-router";
import Svg, { Circle } from "react-native-svg";
import {
  VictoryPie,
  VictoryChart,
  VictoryAxis,
  VictoryBar,
  VictoryLabel,
  VictoryLine,
  VictoryScatter,
} from "victory-native";

const PRIMARY_BLUE = "#2563eb";
const GRID_LINE_COLOR = "#e5e7eb";
const DASH_LINE_COLOR = PRIMARY_BLUE;
const CHART_HEIGHT = 200;
const DAILY_GOAL_MINUTES = 60; // 1 hour goal
const WEEKLY_GOAL_MINUTES = 300; // 5 hours goal
const Y_AXIS_LABEL_WIDTH = 30;
const DAY_ORDER: string[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MODE_DONUT_SIZE = 180;

const MODE_COLORS: Record<string, string> = {
  Study: "#0ea5e9",
  Work: "#f59e0b",
  Break: "#22c55e",
  Rest: "#a855f7",
};

const MODE_RANGE_LABELS: Record<"today" | "week" | "lifetime", string> = {
  today: "Today",
  week: "This Week",
  lifetime: "All Time",
};
const CHART_RANGE_LABELS: Record<"today" | "week" | "sixMonths", string> = {
  today: "Today",
  week: "This Week",
  sixMonths: "Last 6 Months",
};

type ModeBreakdownSegment = {
  label: string;
  value: number;
  color: string;
  seconds: number;
};

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
  if (minutes > 0) {
    parts.push(`${minutes} min${minutes === 1 ? "" : "s"}`);
  }
  if (seconds > 0 || parts.length === 0) {
    parts.push(`${seconds} sec${seconds === 1 ? "" : "s"}`);
  }
  return parts.join(" ");
};

const formatGoalProgress = (minutes: number, goalMinutes: number) => {
  const totalHours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  const goalHours = Math.floor(goalMinutes / 60);
  const goalLabel = goalHours > 0 ? `${goalHours}h` : `${goalMinutes}m`;

  if (totalHours > 0) {
    return `${totalHours}h${remainingMinutes > 0 ? ` ${remainingMinutes}m` : ""} / ${goalLabel}`;
  }
  return `${remainingMinutes}m / ${goalLabel}`;
};

const ModeBreakdownDonut = ({
  segments,
  hasData,
}: {
  segments: ModeBreakdownSegment[];
  hasData: boolean;
}) => {
  const containerRef = useRef<View | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [tooltipSize, setTooltipSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });
  const size = MODE_DONUT_SIZE;
  const outerRadius = size / 2 - 10;
  const innerRadius = outerRadius * 0.45;
  const activeSegment =
    activeIndex !== null ? segments[activeIndex] ?? null : null;

  if (!hasData) {
    return (
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={outerRadius}
          stroke="#e2e8f0"
          strokeWidth={outerRadius - innerRadius}
          fill="none"
        />
      </Svg>
    );
  }

  const totalSeconds = segments.reduce(
    (sum, segment) => sum + segment.seconds,
    0
  );
  const minVisibleValue = Math.max(totalSeconds * 0.01, 1);
  const chartData = segments.map((segment, index) => ({
    x: index,
    y: segment.seconds > 0 ? segment.seconds : minVisibleValue,
  }));
  const colorScale = segments.map((segment) => segment.color);
  const tooltipWidth = tooltipSize.width || 150;
  const tooltipHeight = tooltipSize.height || 56;

  return (
    <View
      ref={containerRef}
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      <VictoryPie
        width={size}
        height={size}
        innerRadius={innerRadius}
        padAngle={0}
        padding={{ top: 0, bottom: 0, left: 0, right: 0 }}
        standalone
        data={chartData}
        colorScale={colorScale}
        labels={() => null}
        style={{
          data: {
            strokeWidth: 0,
          },
        }}
        startAngle={-90}
        endAngle={270}
        events={[
          {
            target: "data",
            eventHandlers: {
              onPressIn: (evt, props) => {
                const index = props.index as number;
                const selected = segments[index];
                if (selected && selected.seconds > 0) {
                  const pressEvent = evt.nativeEvent as any;
                  const { pageX, pageY, locationX, locationY } = pressEvent;
                  const fallbackX = locationX;
                  const fallbackY = locationY;
                  const applyPosition = (offsetX = 0, offsetY = 0) => {
                    const relativeX =
                      typeof pageX === "number" ? pageX - offsetX : fallbackX;
                    const relativeY =
                      typeof pageY === "number" ? pageY - offsetY : fallbackY;
                    setActiveIndex(index);
                    setTooltipPosition({ x: relativeX, y: relativeY });
                  };

                  if (typeof containerRef.current?.measureInWindow === "function") {
                    containerRef.current.measureInWindow((x, y) => {
                      applyPosition(x, y);
                    });
                  } else {
                    applyPosition();
                  }
                } else {
                  setActiveIndex(null);
                  setTooltipPosition(null);
                }
                return [];
              },
              onPressOut: () => {
                setActiveIndex(null);
                setTooltipPosition(null);
                return [];
              },
            },
          },
        ]}
      />
      {activeSegment && tooltipPosition ? (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: Math.max(
              0,
              Math.min(
                tooltipPosition.x - tooltipWidth / 2,
                size - tooltipWidth
              )
            ),
            top: tooltipPosition.y - tooltipHeight - 18,
            alignItems: "center",
          }}
        >
          <View
            onLayout={(event) => {
              const { width, height } = event.nativeEvent.layout;
              if (
                width !== tooltipSize.width ||
                height !== tooltipSize.height
              ) {
                setTooltipSize({ width, height });
              }
            }}
            style={{
              backgroundColor: "#ffffff",
              paddingHorizontal: 14,
              paddingVertical: 6,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: "#e2e8f0",
              shadowColor: "#0f172a",
              shadowOpacity: 0.08,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 3 },
              elevation: 4,
            }}
          >
            <Text className="text-sm font-rubik-medium text-gray-900 text-center">
              {activeSegment.label}
            </Text>
            <Text className="mt-1 text-xs text-gray-600 text-center">
            {formatDetailedDuration(activeSegment.seconds)}
          </Text>
        </View>
          <View
            style={{
              width: 12,
              height: 12,
              backgroundColor: "#ffffff",
              borderBottomWidth: 1,
              borderRightWidth: 1,
              borderColor: "#e2e8f0",
              transform: [{ rotate: "45deg" }],
              marginTop: -6,
            }}
          />
        </View>
      ) : null}
    </View>
  );
};

const Account = () => {
  const { user } = useGlobalContext();
  const { weeklyData, loading, error, refetch, summary } = useWeeklyFocusData();
  const {
    monthlyData,
    loading: monthlyLoading,
    error: monthlyError,
    hasFetched: monthlyHasFetched,
    refetch: fetchMonthlySummary,
  } = useMonthlyFocusSummary();
  const [modeRange, setModeRange] = useState<"today" | "week" | "lifetime">(
    "week"
  );
  const [isRangeMenuOpen, setIsRangeMenuOpen] = useState(false);
  const [chartRange, setChartRange] = useState<"today" | "week" | "sixMonths">(
    "week"
  );
  const [isChartRangeMenuOpen, setIsChartRangeMenuOpen] = useState(false);
  useEffect(() => {
    if (chartRange === "sixMonths" && !monthlyHasFetched) {
      fetchMonthlySummary();
    }
  }, [chartRange, monthlyHasFetched, fetchMonthlySummary]);
  const orderedWeeklyData = useMemo(() => {
    const dataByDay = weeklyData.reduce<
      Record<string, (typeof weeklyData)[number]>
    >((acc, item) => {
      acc[item.dayName] = item;
      return acc;
    }, {});

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

  const totalFocusedMinutes = orderedWeeklyData.reduce(
    (sum, day) => sum + day.totalMinutes,
    0
  );
  const todayDateISO = useMemo(
    () => new Date().toISOString().split("T")[0],
    []
  );
  const todayModeTotalsFallback = useMemo(() => {
    const todaysEntry = weeklyData.find((day) => day.date === todayDateISO);
    if (!todaysEntry) return {};
    const totals: Record<string, number> = {};
    Object.entries(todaysEntry.modes ?? {}).forEach(([modeKey, modeValue]) => {
      const seconds =
        typeof modeValue?.totalSeconds === "number"
          ? modeValue.totalSeconds
          : (modeValue?.totalMinutes ?? 0) * 60;
      totals[modeKey] = seconds;
    });
    return totals;
  }, [todayDateISO, weeklyData]);
  const weeklyModeTotalsFallback = useMemo(() => {
    const totals: Record<string, number> = {};
    weeklyData.forEach((day) => {
      Object.entries(day.modes ?? {}).forEach(([modeKey, modeValue]) => {
        const seconds =
          typeof modeValue?.totalSeconds === "number"
            ? modeValue.totalSeconds
            : (modeValue?.totalMinutes ?? 0) * 60;
        totals[modeKey] = (totals[modeKey] ?? 0) + seconds;
      });
    });
    return totals;
  }, [weeklyData]);
  const lifetimeModeTotalsFallback = useMemo(() => {
    const totals: Record<string, number> = {};
    Object.entries(summary.lifetime?.modes ?? {}).forEach(
      ([modeKey, modeValue]) => {
        totals[modeKey] =
          typeof modeValue?.totalSeconds === "number"
            ? modeValue.totalSeconds
            : (modeValue?.totalMinutes ?? 0) * 60;
      }
    );
    return totals;
  }, [summary]);
  const modeBreakdownSegments = useMemo<ModeBreakdownSegment[]>(() => {
    const summaryModes = summary[modeRange]?.modes ?? {};
    return Object.keys(MODE_COLORS).map((modeKey) => {
      const seconds =
        summaryModes[modeKey]?.totalSeconds ??
        (modeRange === "today"
          ? todayModeTotalsFallback[modeKey] ?? 0
          : modeRange === "week"
          ? weeklyModeTotalsFallback[modeKey] ?? 0
          : lifetimeModeTotalsFallback[modeKey] ?? 0);
      return {
        label: modeKey,
        value: Math.floor(seconds / 60),
        seconds,
        color: MODE_COLORS[modeKey],
      };
    });
  }, [
    lifetimeModeTotalsFallback,
    modeRange,
    summary,
    todayModeTotalsFallback,
    weeklyModeTotalsFallback,
  ]);
  const modeBreakdownTotalSeconds = useMemo(
    () => modeBreakdownSegments.reduce((sum, segment) => sum + segment.seconds, 0),
    [modeBreakdownSegments]
  );
  const hasModeBreakdownData = modeBreakdownTotalSeconds > 0;
  const todayShortName = useMemo(
    () => new Date().toLocaleDateString("en-US", { weekday: "short" }),
    []
  );
  const todayTotals = useMemo(() => {
    const found = orderedWeeklyData.find(
      (day) => day.dayName === todayShortName
    );
    if (found) return found;
    return {
      date: `placeholder-${todayShortName}`,
      dayName: todayShortName,
      totalMinutes: 0,
      timeString: "0 mins",
    };
  }, [orderedWeeklyData, todayShortName]);
  const todaySessions = useMemo(() => {
    const todaysEntry = weeklyData.find((day) => day.date === todayDateISO);
    if (!todaysEntry || !Array.isArray(todaysEntry.sessions)) {
      return [] as Array<{
        startTime: string;
        endTime: string;
        durationSeconds?: number;
        durationMinutes?: number;
        mode?: string;
      }>;
    }
    return todaysEntry.sessions;
  }, [todayDateISO, weeklyData]);
  const todayHourlyBuckets = useMemo(() => {
    const hourMs = 60 * 60 * 1000;
    const now = new Date();
    const end = new Date(now);
    end.setMilliseconds(0);
    end.setSeconds(0);
    end.setMinutes(0);
    const startWindow = new Date(end.getTime() - hourMs * 6);

    const buckets: Array<{ key: string; label: string; totalMinutes: number }> = [];

    for (let i = 0; i < 6; i += 1) {
      const bucketStart = new Date(startWindow.getTime() + i * hourMs);
      const bucketEnd = new Date(bucketStart.getTime() + hourMs);
      let totalMinutes = 0;

      todaySessions.forEach((session) => {
        const sessionStart = new Date(session.startTime);
        const sessionEnd = new Date(session.endTime);
        if (Number.isNaN(sessionStart.getTime()) || Number.isNaN(sessionEnd.getTime())) {
          return;
        }

        const overlapStart = Math.max(bucketStart.getTime(), sessionStart.getTime());
        const overlapEnd = Math.min(bucketEnd.getTime(), sessionEnd.getTime());

        if (overlapEnd > overlapStart) {
          totalMinutes += (overlapEnd - overlapStart) / (60 * 1000);
        }
      });

      const label = bucketEnd.toLocaleTimeString("en-US", {
        hour: "numeric",
      });

      buckets.push({
        key: bucketEnd.toISOString(),
        label,
        totalMinutes: Math.round(totalMinutes),
      });
    }

    return buckets;
  }, [todaySessions]);

  const chartSourceData = useMemo(() => {
    if (chartRange === "today") {
      return todayHourlyBuckets;
    }
    if (chartRange === "sixMonths") {
      return monthlyData.map((entry) => ({
        key: entry.month,
        label: entry.label,
        totalMinutes:
          typeof entry.totalMinutes === "number"
            ? entry.totalMinutes
            : Math.floor((entry.totalSeconds ?? 0) / 60),
      }));
    }
    return orderedWeeklyData.map((day) => ({
      key: day.date,
      label: day.dayName,
      totalMinutes: day.totalMinutes ?? 0,
    }));
  }, [chartRange, monthlyData, orderedWeeklyData, todayHourlyBuckets]);
  const chartBestMinutes = useMemo(
    () =>
      chartSourceData.reduce(
        (max, item) => Math.max(max, item.totalMinutes),
        0
      ),
    [chartSourceData]
  );
  const chartUnderHour = chartBestMinutes < 60;
  const chartOverFiveHours = chartBestMinutes > 300;
  const chartIntervalCount = chartUnderHour ? 2 : 5;
  const chartIntervalMinutes = chartUnderHour ? 30 : chartOverFiveHours ? 120 : 60;
  const chartMaxMinutes = chartIntervalMinutes * chartIntervalCount;
  const chartDomainMax = useMemo(() => {
    if (!chartMaxMinutes) return 1;
    const extra = Math.max(chartIntervalMinutes * 0.04, 1);
    return chartMaxMinutes + extra;
  }, [chartMaxMinutes, chartIntervalMinutes]);
  const chartVictoryData = useMemo(
    () =>
      chartSourceData.map((item) => ({
        x: item.label,
        y: Math.min(item.totalMinutes, chartMaxMinutes),
        actualMinutes: item.totalMinutes,
      })),
    [chartSourceData, chartMaxMinutes]
  );
  const chartHasData = useMemo(
    () => chartSourceData.some((item) => item.totalMinutes > 0),
    [chartSourceData]
  );
  const chartRangeSummaryLabel =
    chartRange === "sixMonths"
      ? "the last 6 months"
      : chartRange === "today"
      ? "today"
      : "this week";
  const chartLoading = chartRange === "sixMonths" ? monthlyLoading : loading;
  const chartError = chartRange === "sixMonths" ? monthlyError : error;

  const chartTotalMinutes = useMemo(() => {
    if (chartRange === "today") {
      return todayTotals.totalMinutes ?? 0;
    }
    return chartSourceData.reduce((sum, item) => sum + item.totalMinutes, 0);
  }, [chartRange, chartSourceData, todayTotals.totalMinutes]);
  const chartFormattedTotalHours = useMemo(
    () => formatTotalHours(chartTotalMinutes),
    [chartTotalMinutes]
  );

  const yAxisTickValues = useMemo(
    () =>
      Array.from(
        { length: chartIntervalCount + 1 },
        (_, idx) => idx * chartIntervalMinutes
      ),
    [chartIntervalCount, chartIntervalMinutes]
  );
  const formatYAxisTick = useCallback(
    (value: number) => {
      if (chartUnderHour) {
        if (value === 0) return "0m";
        return value === 60 ? "1h" : `${value}m`;
      }
      if (value === 0) return "0m";
      const hours = Math.round(value / 60);
      return `${hours}h`;
    },
    [chartUnderHour]
  );

  const streakCount = useMemo(() => {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
    const sortedByDate = [...weeklyData].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    let count = 0;
    for (const day of sortedByDate) {
      // Skip today if it has 0 minutes (day not complete yet)
      if (day.date === today && (day.totalMinutes ?? 0) === 0) {
        continue;
      }
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
  const weeklyProgressRatio = Math.min(
    totalFocusedMinutes / WEEKLY_GOAL_MINUTES,
    1
  );
  const dailyProgressLabel = formatGoalProgress(
    todayMinutes,
    DAILY_GOAL_MINUTES
  );
  const weeklyProgressLabel = formatGoalProgress(
    totalFocusedMinutes,
    WEEKLY_GOAL_MINUTES
  );
  const xAxisTickValues = useMemo(
    () => chartSourceData.map((item) => item.label),
    [chartSourceData]
  );
  const [chartWidth, setChartWidth] = useState(0);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  return (
    <SafeAreaView className="h-full bg-white">
      <View className="w-full flex-row items-center px-6 pt-4">
        <View className="flex-1">
          <MenuButton />
        </View>
        <View className="flex-1 items-center pb-2">
          <Text className="text-2xl font-rubik-medium text-gray-900">
            Insights
          </Text>
        </View>
        <View className="flex-1 items-end">
          <TouchableOpacity activeOpacity={0.8} onPress={() => {}}>
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
          <View className="flex-[2.5] rounded-2xl border border-gray-200 bg-white p-4">
            <Text className="text-sm font-rubik-medium text-gray-500">
              Today&apos;s Focus
            </Text>

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
              <>
                <Text className="mt-3 text-3xl font-rubik-bold text-blue-600">
                  0 mins 0 secs
                </Text>
                <Text className="mt-3 text-sm text-gray-500">
                  No focus sessions logged yet today
                </Text>
              </>
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
            <Text className="text-sm font-rubik-medium text-gray-500">
              Goals
            </Text>
            <TouchableOpacity>
              <Text
                className="text-sm font-rubik-medium"
                style={{ color: PRIMARY_BLUE }}
              >
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
            <Text className="mt-2 text-xs text-gray-500">
              {dailyProgressLabel}
            </Text>
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
            <Text className="mt-2 text-xs text-gray-500">
              {weeklyProgressLabel}
            </Text>
          </View>
        </View>

        {/* Focus Chart Section */}
        <View className="mt-6 rounded-2xl border border-gray-200 bg-white p-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-lg font-rubik-medium text-gray-900">
              Focused Time Distribution
            </Text>
            <View style={{ position: "relative", zIndex: 30 }}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setIsChartRangeMenuOpen((prev) => !prev)}
              >
                <Text
                  className="text-sm font-rubik-medium"
                  style={{ color: PRIMARY_BLUE }}
                >
                  {CHART_RANGE_LABELS[chartRange]}
                </Text>
              </TouchableOpacity>
              {isChartRangeMenuOpen && (
                <View
                  style={{
                    position: "absolute",
                    top: 28,
                    right: 0,
                    width: 150,
                    borderRadius: 12,
                    backgroundColor: "#ffffff",
                    borderWidth: 1,
                    borderColor: "#e2e8f0",
                    shadowColor: "#0f172a",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.15,
                    shadowRadius: 8,
                    elevation: 6,
                    zIndex: 40,
                  }}
                >
                  {Object.entries(CHART_RANGE_LABELS).map(([value, label]) => (
                    <TouchableOpacity
                      key={value}
                      activeOpacity={0.85}
                      onPress={() => {
                        setChartRange(value as typeof chartRange);
                        setIsChartRangeMenuOpen(false);
                      }}
                      style={{
                        paddingVertical: 10,
                        paddingHorizontal: 12,
                        backgroundColor:
                          chartRange === value ? "#eff6ff" : "transparent",
                      }}
                    >
                      <Text
                        className="text-xs font-rubik-medium"
                        style={{
                          color: chartRange === value ? PRIMARY_BLUE : "#0f172a",
                        }}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
          <View className="mt-3">
            <Text className="text-sm text-gray-600" numberOfLines={2}>
              Total focused time {chartRangeSummaryLabel}:{" "}
              <Text style={{ color: PRIMARY_BLUE }}>
                {chartFormattedTotalHours}
              </Text>{" "}
              hours
            </Text>
          </View>

          {chartLoading ? (
            <View className="flex-row items-center justify-center py-8">
              <ActivityIndicator size="large" color={PRIMARY_BLUE} />
            </View>
          ) : chartError ? (
            <View className="py-8">
              <Text className="text-red-500 text-center mb-2">
                Error loading data
              </Text>
              <Text className="text-gray-600 text-center text-sm">
                {chartError}
              </Text>
              <TouchableOpacity
                onPress={() =>
                  chartRange === "sixMonths" ? fetchMonthlySummary() : refetch()
                }
                className="bg-blue-500 rounded-lg px-4 py-2 mt-3 self-center"
              >
                <Text className="text-white font-rubik-medium">Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="mt-6">
              <View
                style={{
                  height: CHART_HEIGHT + 24,
                  position: "relative",
                }}
                onLayout={(event) => {
                  const { width } = event.nativeEvent.layout;
                  if (width !== chartWidth) {
                    setChartWidth(width);
                  }
                }}
              >
                {chartWidth > 0 && (
                  <VictoryChart
                    width={chartWidth}
                    height={CHART_HEIGHT + 16}
                    domain={{ y: [0, chartDomainMax] }}
                    domainPadding={{
                      x: 24,
                      y:
                        chartMaxMinutes > 0
                          ? [0, Math.max(chartIntervalMinutes * 0.04, 1)]
                          : [0, 1],
                    }}
                    categories={{ x: xAxisTickValues }}
                    padding={{
                      top: 8,
                      bottom: 28,
                      left: Y_AXIS_LABEL_WIDTH + 12,
                      right: 24,
                    }}
                  >
                    <VictoryAxis
                      dependentAxis
                      tickValues={yAxisTickValues}
                      tickFormat={formatYAxisTick}
                      style={{
                        axis: { stroke: "transparent" },
                        ticks: { stroke: "transparent" },
                        tickLabels: {
                          fill: "#94a3b8",
                          fontSize: 12,
                          padding: 2,
                          fontFamily: "Rubik-Regular",
                        },
                        grid: {
                          stroke: GRID_LINE_COLOR,
                          strokeDasharray: "4,4",
                        },
                      }}
                    />
                    <VictoryAxis
                      tickValues={xAxisTickValues}
                      style={{
                        axis: { stroke: "#e2e8f0", strokeWidth: 1 },
                        ticks: { stroke: "transparent" },
                        tickLabels: {
                          fill: "#0f172a",
                          fontSize: 12,
                          padding: 8,
                          fontFamily: "Rubik-Medium",
                        },
                      }}
                    />
                    {chartRange !== "today" && chartMaxMinutes > 0 && (
                      <VictoryLine
                        y={() => chartMaxMinutes}
                        style={{
                          data: {
                            stroke: DASH_LINE_COLOR,
                            strokeWidth: 1,
                            strokeDasharray: "6,4",
                          },
                        }}
                      />
                    )}
                    {chartRange === "today"
                      ? (() => {
                          const pointsWithData = chartVictoryData.filter(
                            (datum) => datum.actualMinutes > 0
                          );
                          const components = [
                            <VictoryScatter
                              key="today-scatter"
                              data={pointsWithData}
                              size={4}
                              style={{
                                data: { fill: PRIMARY_BLUE },
                              }}
                              labels={({ datum }) =>
                                datum.actualMinutes > 0
                                  ? `${datum.actualMinutes}m`
                                  : ""
                              }
                              labelComponent={
                                <VictoryLabel
                                  dy={-8}
                                  style={{
                                    fill: "#64748b",
                                    fontSize: 11,
                                    fontFamily: "Rubik-Medium",
                                  }}
                                />
                              }
                            />,
                          ];
                          if (pointsWithData.length > 1) {
                            components.unshift(
                              <VictoryLine
                                key="today-line"
                                data={pointsWithData}
                                interpolation="monotoneX"
                                style={{
                                  data: {
                                    stroke: PRIMARY_BLUE,
                                    strokeWidth: 3,
                                  },
                                }}
                              />
                            );
                          }
                          return components;
                        })()
                      : (
                        <VictoryBar
                          data={chartVictoryData}
                          barWidth={16}
                          cornerRadius={{ top: 8, bottom: 0 }}
                          labels={({ datum }) =>
                          datum.actualMinutes > 0 ? `${datum.actualMinutes}m` : ""
                        }
                        labelComponent={
                          <VictoryLabel
                            dy={-1}
                            style={{
                              fill: "#64748b",
                              fontSize: 11,
                              fontFamily: "Rubik-Medium",
                            }}
                          />
                        }
                        style={{
                          data: {
                            fill: ({ datum }) =>
                              datum.actualMinutes > 0
                                ? PRIMARY_BLUE
                                : GRID_LINE_COLOR,
                          },
                        }}
                      />
                    )}
                  </VictoryChart>
                )}
                {!chartHasData && (
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
          )}
        </View>

        {!loading && !error && (
          <>
            <View className="mt-6 rounded-2xl border border-gray-200 bg-white p-5">
              <View className="mb-4 flex-row items-center justify-between">
                <Text className="text-sm font-rubik-medium text-gray-500">
                  Focus Mode Breakdown
                </Text>
                <View style={{ position: "relative", zIndex: 20 }}>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => setIsRangeMenuOpen((prev) => !prev)}
                  >
                    <Text
                      className="text-sm font-rubik-medium"
                      style={{ color: PRIMARY_BLUE }}
                    >
                      {MODE_RANGE_LABELS[modeRange]}
                    </Text>
                  </TouchableOpacity>
                  {isRangeMenuOpen && (
                    <View
                      style={{
                        position: "absolute",
                        top: 26,
                        right: 0,
                        width: 140,
                        borderRadius: 12,
                        backgroundColor: "#ffffff",
                        borderWidth: 1,
                        borderColor: "#e2e8f0",
                        shadowColor: "#0f172a",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.15,
                        shadowRadius: 8,
                        elevation: 6,
                        zIndex: 30,
                      }}
                    >
                      {Object.entries(MODE_RANGE_LABELS).map(
                        ([value, label]) => (
                          <TouchableOpacity
                            key={value}
                            activeOpacity={0.85}
                            onPress={() => {
                              setModeRange(value as typeof modeRange);
                              setIsRangeMenuOpen(false);
                            }}
                            style={{
                              paddingVertical: 10,
                              paddingHorizontal: 12,
                              backgroundColor:
                                modeRange === value
                                  ? "#eff6ff"
                                  : "transparent",
                            }}
                          >
                            <Text
                              className="text-xs font-rubik-medium"
                              style={{
                                color:
                                  modeRange === value ? PRIMARY_BLUE : "#0f172a",
                              }}
                            >
                              {label}
                            </Text>
                          </TouchableOpacity>
                        )
                      )}
                    </View>
                  )}
                </View>
              </View>
              <View style={{ alignItems: "center" }}>
                <ModeBreakdownDonut
                  key={modeRange}
                  segments={modeBreakdownSegments}
                  hasData={hasModeBreakdownData}
                />
              </View>
              <View
                style={{
                  marginTop: 20,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  width: "100%",
                }}
              >
                {hasModeBreakdownData ? (
                  modeBreakdownSegments.map((segment) => (
                    <View
                      key={segment.label}
                      style={{
                        flex: 1,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        marginVertical: 4,
                        paddingHorizontal: 4,
                      }}
                    >
                      <View
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: segment.color }}
                      />
                      <Text
                        className="ml-2 text-sm text-gray-700"
                        style={{ textAlign: "center" }}
                      >
                        {segment.label}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text className="text-xs text-gray-500">
                    Focus by mode will appear once you log a session.
                  </Text>
                )}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Account;
