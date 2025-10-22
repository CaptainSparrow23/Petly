// components/FocusChart.tsx
import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import {
  VictoryAxis,
  VictoryBar,
  VictoryChart,
  VictoryLabel,
  VictoryLine,
  VictoryScatter,
} from 'victory-native';

const PRIMARY_BLUE = '#2563eb';
const GRID_LINE_COLOR = '#e5e7eb';
const DASH_LINE_COLOR = PRIMARY_BLUE;
const CHART_HEIGHT = 200;
const Y_AXIS_LABEL_WIDTH = 30;

export type ChartRange = 'today' | 'week' | 'sixMonths';
export type ChartDatum = { key: string; label: string; totalMinutes: number };

const CHART_RANGE_LABELS: Record<ChartRange, string> = {
  today: 'Today',
  week: 'This Week',
  sixMonths: 'Last 6 Months',
};

const formatTotalHours = (minutes: number) => {
  if (!minutes) return '0';
  const hours = minutes / 60;
  return Number.isInteger(hours) ? `${hours}` : hours.toFixed(1);
};

export default function FocusChart({
  range,
  onChangeRange,
  dataset,
  loading,
  error,
  onRetry,
  summaryContextLabel,
}: {
  range: ChartRange;
  onChangeRange: (r: ChartRange) => void;
  dataset: ChartDatum[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  summaryContextLabel: string; // 'today' | 'this week' | 'the last 6 months'
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [chartWidth, setChartWidth] = useState(0);

  const best = useMemo(() => dataset.reduce((m, d) => Math.max(m, d.totalMinutes), 0), [dataset]);
  const underHour = best < 60;
  const overFiveHours = best > 300;
  const intervalCount = underHour ? 2 : 5;
  const intervalMinutes = underHour ? 30 : overFiveHours ? 120 : 60;
  const maxMinutes = intervalMinutes * intervalCount;
  const domainMax = useMemo(() => (maxMinutes ? maxMinutes + Math.max(intervalMinutes * 0.04, 1) : 1), [maxMinutes, intervalMinutes]);

  const victoryData = useMemo(
    () => dataset.map((d) => ({ x: d.label, y: Math.min(d.totalMinutes, maxMinutes), actualMinutes: d.totalMinutes })),
    [dataset, maxMinutes]
  );
  const hasData = useMemo(() => dataset.some((d) => d.totalMinutes > 0), [dataset]);
  const totalMinutes = useMemo(() => dataset.reduce((s, d) => s + d.totalMinutes, 0), [dataset]);
  const formattedTotalHours = useMemo(() => formatTotalHours(totalMinutes), [totalMinutes]);

  const yTickValues = useMemo(
    () => Array.from({ length: intervalCount + 1 }, (_, idx) => idx * intervalMinutes),
    [intervalCount, intervalMinutes]
  );
  const formatYAxisTick = useCallback(
    (value: number) => {
      if (underHour) return value === 60 ? '1h' : `${value}m`;
      if (value === 0) return '0m';
      const h = Math.round(value / 60);
      return `${h}h`;
    },
    [underHour]
  );
  const xTickValues = useMemo(() => dataset.map((d) => d.label), [dataset]);

  return (
    <View className="mt-6 rounded-2xl border border-gray-200 bg-white p-4">
      <View className="flex-row items-center justify-between">
        <Text className="text-lg font-rubik-medium text-gray-900">Focused Time Distribution</Text>
        <View style={{ position: 'relative', zIndex: 30 }}>
          <TouchableOpacity activeOpacity={0.85} onPress={() => setIsMenuOpen((p) => !p)}>
            <Text className="text-sm font-rubik-medium" style={{ color: PRIMARY_BLUE }}>
              {CHART_RANGE_LABELS[range]}
            </Text>
          </TouchableOpacity>
          {isMenuOpen && (
            <View
              style={{
                position: 'absolute',
                top: 28,
                right: 0,
                width: 150,
                borderRadius: 12,
                backgroundColor: '#ffffff',
                borderWidth: 1,
                borderColor: '#e2e8f0',
                shadowColor: '#0f172a',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
                elevation: 6,
                zIndex: 40,
              }}
            >
              {(Object.keys(CHART_RANGE_LABELS) as ChartRange[]).map((value) => (
                <TouchableOpacity
                  key={value}
                  activeOpacity={0.85}
                  onPress={() => {
                    onChangeRange(value);
                    setIsMenuOpen(false);
                  }}
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    backgroundColor: range === value ? '#eff6ff' : 'transparent',
                  }}
                >
                  <Text className="text-xs font-rubik-medium" style={{ color: range === value ? PRIMARY_BLUE : '#0f172a' }}>
                    {CHART_RANGE_LABELS[value]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      <View className="mt-3">
        <Text className="text-sm text-gray-600" numberOfLines={2}>
          Total focused time {summaryContextLabel}:{' '}
          <Text style={{ color: PRIMARY_BLUE }}>{formattedTotalHours}</Text> hours
        </Text>
      </View>

      {loading ? (
        <View className="flex-row items-center justify-center py-8">
          <ActivityIndicator size="large" color={PRIMARY_BLUE} />
        </View>
      ) : error ? (
        <View className="py-8">
          <Text className="text-red-500 text-center mb-2">Error loading data</Text>
          <Text className="text-gray-600 text-center text-sm">{error}</Text>
          <TouchableOpacity onPress={onRetry} className="bg-blue-500 rounded-lg px-4 py-2 mt-3 self-center">
            <Text className="text-white font-rubik-medium">Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View className="mt-6">
          <View
            style={{ height: CHART_HEIGHT + 24, position: 'relative' }}
            onLayout={(e) => {
              const { width } = e.nativeEvent.layout;
              if (width !== chartWidth) setChartWidth(width);
            }}
          >
            {chartWidth > 0 && (
              <VictoryChart
                width={chartWidth}
                height={CHART_HEIGHT + 16}
                domain={{ y: [0, domainMax] }}
                domainPadding={{
                  x: 24,
                  y: maxMinutes > 0 ? [0, Math.max(intervalMinutes * 0.04, 1)] : [0, 1],
                }}
                categories={{ x: xTickValues }}
                padding={{ top: 8, bottom: 28, left: Y_AXIS_LABEL_WIDTH + 12, right: 24 }}
              >
                <VictoryAxis
                  dependentAxis
                  tickValues={yTickValues}
                  tickFormat={formatYAxisTick}
                  style={{
                    axis: { stroke: 'transparent' },
                    ticks: { stroke: 'transparent' },
                    tickLabels: { fill: '#94a3b8', fontSize: 12, padding: 2, fontFamily: 'Rubik-Regular' },
                    grid: { stroke: GRID_LINE_COLOR, strokeDasharray: '4,4' },
                  }}
                />
                <VictoryAxis
                  tickValues={xTickValues}
                  style={{
                    axis: { stroke: '#e2e8f0', strokeWidth: 1 },
                    ticks: { stroke: 'transparent' },
                    tickLabels: { fill: '#0f172a', fontSize: 12, padding: 8, fontFamily: 'Rubik-Medium' },
                  }}
                />
                {range !== 'today' && maxMinutes > 0 && (
                  <VictoryLine
                    y={() => maxMinutes}
                    style={{ data: { stroke: DASH_LINE_COLOR, strokeWidth: 1, strokeDasharray: '6,4' } }}
                  />
                )}
                {range === 'today' ? (
                  (() => {
                    const pointsWithData = victoryData.filter((d) => d.actualMinutes > 0);
                    const blocks = [
                      <VictoryScatter
                        key="scatter"
                        data={pointsWithData}
                        size={4}
                        style={{ data: { fill: PRIMARY_BLUE } }}
                        labels={({ datum }) => (datum.actualMinutes > 0 ? `${datum.actualMinutes}m` : '')}
                        labelComponent={<VictoryLabel dy={-8} style={{ fill: '#64748b', fontSize: 11, fontFamily: 'Rubik-Medium' }} />}
                      />,
                    ];
                    if (pointsWithData.length > 1) {
                      blocks.unshift(
                        <VictoryLine
                          key="line"
                          data={pointsWithData}
                          interpolation="monotoneX"
                          style={{ data: { stroke: PRIMARY_BLUE, strokeWidth: 3 } }}
                        />
                      );
                    }
                    return blocks;
                  })()
                ) : (
                  <VictoryBar
                    data={victoryData}
                    barWidth={16}
                    cornerRadius={{ top: 8, bottom: 0 }}
                    labels={({ datum }) => (datum.actualMinutes > 0 ? `${datum.actualMinutes}m` : '')}
                    labelComponent={<VictoryLabel dy={-1} style={{ fill: '#64748b', fontSize: 11, fontFamily: 'Rubik-Medium' }} />}
                    style={{
                      data: { fill: ({ datum }: any) => (datum.actualMinutes > 0 ? PRIMARY_BLUE : GRID_LINE_COLOR) },
                    }}
                  />
                )}
              </VictoryChart>
            )}
            {!hasData && (
              <Text
                className="font-rubik-medium"
                style={{ position: 'absolute', alignSelf: 'center', top: '45%', fontSize: 14, color: '#cbd5f5' }}
              >
                No data
              </Text>
            )}
          </View>
        </View>
      )}
    </View>
  );
}
