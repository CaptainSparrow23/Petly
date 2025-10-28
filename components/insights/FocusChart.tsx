import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import {
  VictoryAxis,
  VictoryBar,
  VictoryChart,
  VictoryLabel,
} from 'victory-native';

export type ChartRange = 'today' | 'week' | 'sixMonths';
export type ChartDatum = { key: string; label: string; totalMinutes: number };

type FocusChartProps = {
  data?: {
    // For "today", pass 24 hourly points (00–23). If omitted, dummy data is used.
    today?: ChartDatum[];
    week?: ChartDatum[];
    sixMonths?: ChartDatum[];
  };
  initialRange?: ChartRange;
  title?: string;
};

/* ---------------- Dummy data ---------------- */
const makeDummyToday = (): ChartDatum[] => {
  // 24 hours of minutes (example values)
  const mins = [5,10,0,0,0,8,12,20,25,15,5,0,0,30,40,35,0,10,5,0,0,12,18,6];
  return Array.from({ length: 24 }, (_, h) => ({
    key: String(h).padStart(2, '0'),
    label: `${String(h).padStart(2, '0')}:00`,
    totalMinutes: mins[h] ?? 0,
  }));
};

const DUMMY_DATA = {
  today: makeDummyToday(),
  week: [
    { key: 'Mon', label: 'Mon', totalMinutes: 60 },
    { key: 'Tue', label: 'Tue', totalMinutes: 30 },
    { key: 'Wed', label: 'Wed', totalMinutes: 90 },
    { key: 'Thu', label: 'Thu', totalMinutes: 10 },
    { key: 'Fri', label: 'Fri', totalMinutes: 120 },
    { key: 'Sat', label: 'Sat', totalMinutes: 40 },
    { key: 'Sun', label: 'Sun', totalMinutes: 12 },
  ],
  sixMonths: [
    { key: 'May', label: 'May', totalMinutes: 240 },
    { key: 'Jun', label: 'Jun', totalMinutes: 180 },
    { key: 'Jul', label: 'Jul', totalMinutes: 320 },
    { key: 'Aug', label: 'Aug', totalMinutes: 200 },
    { key: 'Sep', label: 'Sep', totalMinutes: 260 },
    { key: 'Oct', label: 'Oct', totalMinutes: 300 },
  ],
};
/* -------------------------------------------- */

const RANGE_LABELS: Record<ChartRange, string> = {
  today: 'Today',
  week: 'This Week',
  sixMonths: 'Last 6 Months',
};

// 0–23 hours -> 8 slots of 3 hours each, labeled 12am, 3am, …, 9pm
const hourLabel = (h: number) => {
  if (h === 0) return '12am';
  if (h < 12) return `${h}am`;
  if (h === 12) return '12pm';
  return `${h - 12}pm`;
};
const groupInto3HourSlots = (hours: ChartDatum[]): ChartDatum[] => {
  const out: ChartDatum[] = [];
  for (let start = 0; start < 24; start += 3) {
    const total = hours
      .slice(start, start + 3)
      .reduce((s, d) => s + d.totalMinutes, 0);
    out.push({
      key: `slot-${start}`,
      label: hourLabel(start),
      totalMinutes: total,
    });
  }
  return out; // 8 bars: 12am, 3am, 6am, 9am, 12pm, 3pm, 6pm, 9pm
};

export default function FocusChart({
  data,
  initialRange = 'week',
  title = 'Focused Time Distribution',
}: FocusChartProps) {
  const [range, setRange] = useState<ChartRange>(initialRange);
  const [menuOpen, setMenuOpen] = useState(false);
  const [chartWidth, setChartWidth] = useState(0);

  // pick dataset (props or dummy)
  const raw: ChartDatum[] = useMemo(() => {
    const src = { ...DUMMY_DATA, ...(data || {}) };
    if (range === 'today') return src.today ?? DUMMY_DATA.today;
    if (range === 'sixMonths') return src.sixMonths ?? DUMMY_DATA.sixMonths;
    return src.week ?? DUMMY_DATA.week;
  }, [data, range]);

  // for "today", group into 3h slots; otherwise use as-is
  const dataset: ChartDatum[] = useMemo(() => {
    if (range !== 'today') return raw;
    const hours = raw.length === 24 ? raw : DUMMY_DATA.today;
    return groupInto3HourSlots(hours);
  }, [raw, range]);

  const hasData = dataset.some(d => d.totalMinutes > 0);
  const victoryData = useMemo(
    () => dataset.map(d => ({ x: d.label, y: d.totalMinutes, actualMinutes: d.totalMinutes })),
    [dataset]
  );
  const xTickValues = useMemo(() => dataset.map(d => d.label), [dataset]);
  const maxY = useMemo(() => Math.max(1, ...dataset.map(d => d.totalMinutes)), [dataset]);

  return (
    <View className="relative my-4 rounded-2xl border border-gray-200 bg-gray-50 p-3">
      {/* Header */}
      <View className="mb-4 flex-row items-center justify-between">
        <Text className="text-m text-gray-900">{title}</Text>

        <View className="relative">
          <TouchableOpacity onPress={() => setMenuOpen(p => !p)} activeOpacity={0.85}>
            <Text className="text-sm font-rubik-medium text-blue-500">
              {RANGE_LABELS[range]}
            </Text>
          </TouchableOpacity>
          {menuOpen && (
            <View
              className="absolute right-0 top-0 w-40 rounded-xl border border-gray-200 bg-gray-50 shadow-lg"
              style={{ zIndex: 50, elevation: 50 }}
            >
              {(['today', 'week', 'sixMonths'] as ChartRange[]).map(val => (
                <TouchableOpacity
                  key={val}
                  onPress={() => {
                    setRange(val);
                    setMenuOpen(false);
                  }}
                  className={`px-3 py-2 ${range === val ? 'bg-blue-100' : ''}`}
                >
                  <Text
                    className={`text-xs font-rubik-medium ${
                      range === val ? 'text-blue-600' : 'text-slate-900'
                    }`}
                  >
                    {RANGE_LABELS[val]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* Chart */}
      <View
        className="relative mt-2"
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          if (w !== chartWidth) setChartWidth(w);
        }}
      >
        {chartWidth > 0 && (
          <VictoryChart
            width={chartWidth}
            height={250}
            domain={{ y: [0, Math.ceil(maxY * 1.1)] }}           
            domainPadding={{ x: 28, y: [0, 8] }}                
            padding={{ top: 8, bottom: 30, left: 30, right: 0 }} 
            categories={{ x: xTickValues }}
          >
            {/* X axis */}
            <VictoryAxis
              tickValues={xTickValues}
              style={{
                axis: { stroke: '#e2e8f0' },
                ticks: { stroke: 'transparent' },
                tickLabels: { fill: '#0f172a', fontSize: 12, padding: 12, fontFamily: 'Rubik-Medium' },
                grid: { stroke: 'transparent' },
              }}
            />

            {/* Y axis */}
            <VictoryAxis
              dependentAxis
              style={{
                axis: { stroke: 'transparent' },
                ticks: { stroke: 'transparent' },
                tickLabels: { fill: '#94a3b8', fontSize: 12, padding: 6, fontFamily: 'Rubik-Regular' },
                grid: { stroke: '#e5e7eb', strokeDasharray: '4,4' },
              }}
            />

            {/* Bars for all ranges (today already grouped into 3h slots) */}
            <VictoryBar
              data={victoryData}
              barWidth={18}
              cornerRadius={{ top: 8, bottom: 0 }}
              labels={({ datum }) => (datum.actualMinutes > 0 ? `${datum.actualMinutes}m` : '')}
              labelComponent={
                <VictoryLabel
                  dy={-2}
                  style={{ fill: '#64748b', fontSize: 11, fontFamily: 'Rubik-Medium' }}
                />
              }
              style={{
                data: {
                  fill: ({ datum }: any) => (datum.actualMinutes > 0 ? '#3B82F6' : '#e5e7eb'),
                },
              }}
            />
          </VictoryChart>
        )}

        {!hasData && (
          <Text className="absolute top-[45%] self-center text-[14px] font-rubik-medium text-blue-200">
            No data
          </Text>
        )}
      </View>
    </View>
  );
}
