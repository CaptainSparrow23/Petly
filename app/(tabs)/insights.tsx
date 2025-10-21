// app/(tabs)/account/FocusScreen.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';

import { useMonthlyFocusSummary, useWeeklyFocusData, WeeklyFocusData } from '@/hooks/useInsights';

import TodayFocusCard from '@/components/insights/TodayFocusCard';
import StreakCard from '@/components/insights/StreakCard';
import GoalsCard from '@/components/insights/GoalsCard';
import FocusChart, { ChartDatum, ChartRange } from '@/components/insights/FocusChart';
import ModeBreakdownDonut, { ModeBreakdownSegment } from '@/components/insights/ModeBreakdownDonut';

const PRIMARY_BLUE = '#2563eb';
const DAY_ORDER: string[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAILY_GOAL_MINUTES = 60;   // 1h
const WEEKLY_GOAL_MINUTES = 300; // 5h

const MODE_COLORS: Record<string, string> = {
  Study: '#0ea5e9',
  Work: '#f59e0b',
  Break: '#22c55e',
  Rest:  '#a855f7',
};

const MODE_RANGE_LABELS: Record<'today' | 'week' | 'lifetime', string> = {
  today: 'Today',
  week: 'This Week',
  lifetime: 'All Time',
};

const CHART_RANGE_LABELS: Record<ChartRange, string> = {
  today: 'Today',
  week: 'This Week',
  sixMonths: 'Last 6 Months',
};


const formatGoalProgress = (minutes: number, goalMinutes: number) => {
  const totalHours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  const goalHours = Math.floor(goalMinutes / 60);
  const goalLabel = goalHours > 0 ? `${goalHours}h` : `${goalMinutes}m`;
  return totalHours > 0 ? `${totalHours}h${remainingMinutes ? ` ${remainingMinutes}m` : ''} / ${goalLabel}` : `${remainingMinutes}m / ${goalLabel}`;
};

export default function FocusScreen() {
  const { weeklyData, loading, error, refetch, summary, streak } = useWeeklyFocusData();
  const { monthlyData, loading: monthlyLoading, error: monthlyError, hasFetched: monthlyHasFetched, refetch: fetchMonthlySummary } =
    useMonthlyFocusSummary();

  const [modeRange, setModeRange] = useState<'today' | 'week' | 'lifetime'>('week');
  const [chartRange, setChartRange] = useState<ChartRange>('week');
  const [isRangeMenuOpen, setIsRangeMenuOpen] = useState(false);

  useEffect(() => {
    if (chartRange === 'sixMonths' && !monthlyHasFetched) fetchMonthlySummary();
  }, [chartRange, monthlyHasFetched, fetchMonthlySummary]);

  // Weekly ordered data (fill missing days)
  const orderedWeeklyData = useMemo(() => {
    const map: Record<string, WeeklyFocusData> = {};
    weeklyData.forEach((d) => (map[d.dayName] = d));
    return DAY_ORDER.map((dayName) => map[dayName] ?? { date: `missing-${dayName}`, dayName, totalMinutes: 0, timeString: '0 mins', modes: {} as any });
  }, [weeklyData]);

  const totalFocusedMinutes = orderedWeeklyData.reduce((s, d) => s + (d.totalMinutes ?? 0), 0);

  // Today
  const todayDateISO = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todayShortName = useMemo(() => new Date().toLocaleDateString('en-US', { weekday: 'short' }), []);
  const todayTotals = useMemo(() => orderedWeeklyData.find((d) => d.dayName === todayShortName) ?? { date: `placeholder-${todayShortName}`, dayName: todayShortName, totalMinutes: 0, timeString: '0 mins' }, [orderedWeeklyData, todayShortName]);

  const todaySessions = useMemo(() => {
    const todaysEntry = weeklyData.find((d) => d.date === todayDateISO);
    return Array.isArray(todaysEntry?.sessions) ? todaysEntry!.sessions : [];
  }, [todayDateISO, weeklyData]);

  const todayHourlyBuckets: ChartDatum[] = useMemo(() => {
    const hourMs = 60 * 60 * 1000;
    const now = new Date();
    const end = new Date(now); end.setMilliseconds(0); end.setSeconds(0); end.setMinutes(0);
    const startWindow = new Date(end.getTime() - hourMs * 6);

    const buckets: ChartDatum[] = [];
    for (let i = 0; i < 6; i++) {
      const bucketStart = new Date(startWindow.getTime() + i * hourMs);
      const bucketEnd = new Date(bucketStart.getTime() + hourMs);
      let totalMinutes = 0;

      todaySessions.forEach((s) => {
        const ss = new Date(s.startTime); const se = new Date(s.endTime);
        if (Number.isNaN(ss.getTime()) || Number.isNaN(se.getTime())) return;
        const overlapStart = Math.max(bucketStart.getTime(), ss.getTime());
        const overlapEnd = Math.min(bucketEnd.getTime(), se.getTime());
        if (overlapEnd > overlapStart) totalMinutes += (overlapEnd - overlapStart) / (60 * 1000);
      });

      const label = bucketEnd.toLocaleTimeString('en-US', { hour: 'numeric' });
      buckets.push({ key: bucketEnd.toISOString(), label, totalMinutes: Math.round(totalMinutes) });
    }
    return buckets;
  }, [todaySessions]);

  // Chart dataset by range
  const chartDataset: ChartDatum[] = useMemo(() => {
    if (chartRange === 'today') return todayHourlyBuckets;
    if (chartRange === 'sixMonths')
      return monthlyData.map((e) => ({ key: e.month, label: e.label, totalMinutes: typeof e.totalMinutes === 'number' ? e.totalMinutes : Math.floor((e.totalSeconds ?? 0) / 60) }));
    return orderedWeeklyData.map((d) => ({ key: d.date, label: d.dayName, totalMinutes: d.totalMinutes ?? 0 }));
  }, [chartRange, monthlyData, orderedWeeklyData, todayHourlyBuckets]);

  const chartSummaryLabel = chartRange === 'sixMonths' ? 'the last 6 months' : chartRange === 'today' ? 'today' : 'this week';
  const chartLoading = chartRange === 'sixMonths' ? monthlyLoading : loading;
  const chartError = chartRange === 'sixMonths' ? monthlyError : error;

  // Mode breakdown ranges
  const todayModeTotalsFallback = useMemo(() => {
    const todaysEntry = weeklyData.find((d) => d.date === todayDateISO);
    if (!todaysEntry) return {} as Record<string, number>;
    const totals: Record<string, number> = {};
    Object.entries(todaysEntry.modes ?? {}).forEach(([k, v]) => {
      const seconds = typeof v?.totalSeconds === 'number' ? v.totalSeconds : (v?.totalMinutes ?? 0) * 60;
      totals[k] = seconds;
    });
    return totals;
  }, [todayDateISO, weeklyData]);

  const weeklyModeTotalsFallback = useMemo(() => {
    const totals: Record<string, number> = {};
    weeklyData.forEach((d) =>
      Object.entries(d.modes ?? {}).forEach(([k, v]) => {
        const seconds = typeof v?.totalSeconds === 'number' ? v.totalSeconds : (v?.totalMinutes ?? 0) * 60;
        totals[k] = (totals[k] ?? 0) + seconds;
      })
    );
    return totals;
  }, [weeklyData]);

  const lifetimeModeTotalsFallback = useMemo(() => {
    const totals: Record<string, number> = {};
    Object.entries(summary.lifetime?.modes ?? {}).forEach(([k, v]) => {
      totals[k] = typeof v?.totalSeconds === 'number' ? v.totalSeconds : (v?.totalMinutes ?? 0) * 60;
    });
    return totals;
  }, [summary]);

  const modeBreakdownSegments = useMemo<ModeBreakdownSegment[]>(() => {
    const summaryModes = (summary as any)[modeRange]?.modes ?? {};
    return Object.keys(MODE_COLORS).map((modeKey) => {
      const seconds =
        summaryModes[modeKey]?.totalSeconds ??
        (modeRange === 'today'
          ? todayModeTotalsFallback[modeKey] ?? 0
          : modeRange === 'week'
          ? weeklyModeTotalsFallback[modeKey] ?? 0
          : lifetimeModeTotalsFallback[modeKey] ?? 0);
      return { label: modeKey, value: Math.floor(seconds / 60), seconds, color: MODE_COLORS[modeKey] };
    });
  }, [summary, modeRange, todayModeTotalsFallback, weeklyModeTotalsFallback, lifetimeModeTotalsFallback]);

  const modeBreakdownTotalSeconds = useMemo(() => modeBreakdownSegments.reduce((s, seg) => s + seg.seconds, 0), [modeBreakdownSegments]);
  const hasModeBreakdownData = modeBreakdownTotalSeconds > 0;



  // Goals
  const todayMinutes = todayTotals.totalMinutes ?? 0;
  const dailyProgressRatio = Math.min(todayMinutes / DAILY_GOAL_MINUTES, 1);
  const weeklyProgressRatio = Math.min(totalFocusedMinutes / WEEKLY_GOAL_MINUTES, 1);

  const dailyProgressLabel = formatGoalProgress(todayMinutes, DAILY_GOAL_MINUTES);
  const weeklyProgressLabel = formatGoalProgress(totalFocusedMinutes, WEEKLY_GOAL_MINUTES);

  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color={PRIMARY_BLUE} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }} contentContainerClassName="px-4" className="w-full px-4">
        <View className="mt-6 flex-row gap-4">
          <TodayFocusCard />
          <StreakCard streak={streak} />
        </View>

        <GoalsCard
          dailyProgressRatio={dailyProgressRatio}
          weeklyProgressRatio={weeklyProgressRatio}
          dailyLabel={dailyProgressLabel}
          weeklyLabel={weeklyProgressLabel}
          onEdit={() => {}}
        />

        <FocusChart
          range={chartRange}
          onChangeRange={(r) => setChartRange(r)}
          dataset={chartDataset}
          loading={chartLoading}
          error={chartError}
          onRetry={() => (chartRange === 'sixMonths' ? fetchMonthlySummary() : refetch())}
          summaryContextLabel={chartSummaryLabel}
        />

        {!loading && !error && (
          <View className="mt-6 rounded-2xl border border-gray-200 bg-white p-5">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-sm font-rubik-medium text-gray-500">Focus Mode Breakdown</Text>
              <View style={{ position: 'relative', zIndex: 20 }}>
                <TouchableOpacity activeOpacity={0.85} onPress={() => setIsRangeMenuOpen((p) => !p)}>
                  <Text className="text-sm font-rubik-medium" style={{ color: PRIMARY_BLUE }}>
                    {MODE_RANGE_LABELS[modeRange]}
                  </Text>
                </TouchableOpacity>
                {isRangeMenuOpen && (
                  <View
                    style={{
                      position: 'absolute',
                      top: 26,
                      right: 0,
                      width: 140,
                      borderRadius: 12,
                      backgroundColor: '#ffffff',
                      borderWidth: 1,
                      borderColor: '#e2e8f0',
                      shadowColor: '#0f172a',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.15,
                      shadowRadius: 8,
                      elevation: 6,
                      zIndex: 30,
                    }}
                  >
                    {Object.entries(MODE_RANGE_LABELS).map(([value, label]) => (
                      <TouchableOpacity
                        key={value}
                        activeOpacity={0.85}
                        onPress={() => {
                          setModeRange(value as typeof modeRange);
                          setIsRangeMenuOpen(false);
                        }}
                        style={{ paddingVertical: 10, paddingHorizontal: 12, backgroundColor: modeRange === value ? '#eff6ff' : 'transparent' }}
                      >
                        <Text className="text-xs font-rubik-medium" style={{ color: modeRange === value ? PRIMARY_BLUE : '#0f172a' }}>
                          {label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>

            <View style={{ alignItems: 'center' }}>
              <ModeBreakdownDonut key={modeRange} segments={modeBreakdownSegments} hasData={hasModeBreakdownData} />
            </View>

            <View style={{ marginTop: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              {hasModeBreakdownData ? (
                modeBreakdownSegments.map((segment) => (
                  <View
                    key={segment.label}
                    style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 4, paddingHorizontal: 4 }}
                  >
                    <View className="h-3 w-3 rounded-full" style={{ backgroundColor: segment.color }} />
                    <Text className="ml-2 text-sm text-gray-700" style={{ textAlign: 'center' }}>
                      {segment.label}
                    </Text>
                  </View>
                ))
              ) : (
                <Text className="text-xs text-gray-500">Focus by mode will appear once you log a session.</Text>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
