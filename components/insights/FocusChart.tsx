import React, { useMemo, useState, useCallback } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { VictoryAxis, VictoryBar, VictoryChart, VictoryLabel } from "victory-native";
import { useGlobalContext } from "@/lib/GlobalProvider";

export type ChartRange = "today" | "week" | "sixWeeks";
export type ChartDatum = { key: string; label: string; totalMinutes: number };

type FocusChartProps = {
  data?: { today?: ChartDatum[]; week?: ChartDatum[]; sixWeeks?: ChartDatum[] };
  initialRange?: ChartRange;
  title?: string;
};

const RANGE_LABELS: Record<ChartRange, string> = {
  today: "Today",
  week: "This Week",
  sixWeeks: "Last 6 Weeks",
};

const DAYS_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const hourLabel = (h: number) => {
  if (h === 0) return "12am";
  if (h < 12) return `${h}am`;
  if (h === 12) return "12pm";
  return `${h - 12}pm`;
};

const groupInto3HourSlots = (hours: ChartDatum[]): ChartDatum[] => {
  const out: ChartDatum[] = [];
  for (let start = 0; start < 24; start += 3) {
    const total = hours.slice(start, start + 3).reduce((s, d) => s + d.totalMinutes, 0);
    out.push({ key: `slot-${start}`, label: hourLabel(start), totalMinutes: total });
  }
  return out;
};

export default function FocusChart({
  data,
  initialRange = "today",
  title = "Focused Time Distribution",
}: FocusChartProps) {
  const { appSettings } = useGlobalContext();
  const [range, setRange] = useState<ChartRange>(initialRange);
  const [menuOpen, setMenuOpen] = useState(false);
  const [chartWidth, setChartWidth] = useState(0);
  const showHours = appSettings.displayFocusInHours;

  const rawToday: ChartDatum[] = data?.today ?? [];
  const rawWeek: ChartDatum[] = data?.week ?? [];
  const rawSixWeeks: ChartDatum[] = data?.sixWeeks ?? [];

  const paddedWeek: ChartDatum[] = useMemo(() => {
    const map = new Map(rawWeek.map((d) => [d.label, d.totalMinutes]));
    return DAYS_ORDER.map((day) => ({
      key: day,
      label: day,
      totalMinutes: map.get(day) ?? 0,
    }));
  }, [rawWeek]);

  const raw: ChartDatum[] = useMemo(() => {
    if (range === "today") return rawToday;
    if (range === "week") return paddedWeek;
    return rawSixWeeks;
  }, [range, rawToday, paddedWeek, rawSixWeeks]);

  const dataset: ChartDatum[] = useMemo(() => {
    if (range !== "today") return raw;
    const hours = Array.from({ length: 24 }, (_, h) => {
      const found = raw[h];
      return found ?? { key: String(h).padStart(2, "0"), label: `${String(h).padStart(2, "0")}:00`, totalMinutes: 0 };
    });
    return groupInto3HourSlots(hours);
  }, [raw, range]);

  const convertValue = useCallback(
    (minutes: number) => (showHours ? minutes / 60 : minutes),
    [showHours]
  );

  const formatValueLabel = useCallback(
    (value: number) => {
      if (showHours) {
        if (value >= 10) return `${value.toFixed(0)} hrs`;
        return `${value.toFixed(1)} hrs`;
      }
      return `${Math.round(value)} mins`;
    },
    [showHours]
  );

  const victoryData = useMemo(
    () =>
      dataset.map((d) => ({
        x: d.label,
        y: convertValue(d.totalMinutes),
        displayValue: convertValue(d.totalMinutes),
      })),
    [dataset, convertValue]
  );
  const xTickValues = useMemo(() => dataset.map((d) => d.label), [dataset]);
  const maxY = useMemo(
    () => Math.max(1, ...dataset.map((d) => convertValue(d.totalMinutes))),
    [dataset, convertValue]
  );

  return (
    <View className="relative my-4 rounded-2xl border border-gray-200 bg-gray-50 p-3">
      <View className="mb-4 flex-row justify-between">
        <Text className="text-m text-gray-900">{title}</Text>
        <View className="relative">
          <TouchableOpacity className="rounded-xl p-2 bg-white border border-gray-200" onPress={() => setMenuOpen((p) => !p)} activeOpacity={0.85}>
            <Text className="text-sm font-rubik-medium text-black-300">{RANGE_LABELS[range]}</Text>
          </TouchableOpacity>
          {menuOpen && (
            <View
              className="absolute -right-1 -top-1 w-40 rounded-xl overflow-hidden z-10 bg-white border border-gray-200">
              {(["today", "week", "sixWeeks"] as ChartRange[]).map((val) => (
                <TouchableOpacity
                  key={val}
                  onPress={() => {
                    setRange(val);
                    setMenuOpen(false);
                  }}
                  className={`px-3 py-2 ${range === val ? "bg-black-300" : ""}`}
                >
                  <Text
                    className={`text-xs font-rubik-medium ${
                      range === val ? "text-white" : "text-slate-900"
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
            <VictoryAxis
              tickValues={xTickValues}
              style={{
                axis: { stroke: "#e2e8f0" },
                ticks: { stroke: "transparent" },
                tickLabels: { fill: "#0f172a", fontSize: 12, padding: 12, fontFamily: "Rubik-Medium" },
                grid: { stroke: "transparent" },
              }}
            />
            <VictoryAxis
              dependentAxis
              style={{
                axis: { stroke: "transparent" },
                ticks: { stroke: "transparent" },
                tickLabels: { fill: "#94a3b8", fontSize: 12, padding: 6, fontFamily: "Rubik-Regular" },
                grid: { stroke: "#e5e7eb", strokeDasharray: "4,4" },
              }}
            />
            <VictoryBar
              data={victoryData}
              barWidth={18}
              cornerRadius={{ top: 8, bottom: 0 }}
              labels={({ datum }) => (datum.displayValue > 0 ? formatValueLabel(datum.displayValue) : "")}
              labelComponent={<VictoryLabel dy={-2} style={{ fill: "#64748b", fontSize: 11, fontFamily: "Rubik-Medium" }} />}
              style={{
                data: {
                  fill: ({ datum }: any) => (datum.displayValue > 0 ? "#191d31" : "#e5e7eb"),
                },
              }}
            />
          </VictoryChart>
        )}
      </View>
    </View>
  );
}
