import React, { useMemo, useState, useCallback, useEffect } from "react";
import { View, Text, TouchableOpacity, Modal, Platform, ActivityIndicator, Pressable } from "react-native";
import { VictoryAxis, VictoryBar, VictoryChart, VictoryLabel } from "victory-native";
import { useGlobalContext } from "@/lib/GlobalProvider";
import { CoralPalette } from "@/constants/colors";
import { Picker } from "@react-native-picker/picker";
import { useFocusEffect } from "expo-router";

// --- Types ---
export type ChartDatum = { key: string; label: string; totalMinutes: number };
type ViewState = { mode: "day" | "month" | "year"; day: number; month: number; year: number };
type FocusChartProps = { title?: string };

// --- Constants ---
const FONT = { fontFamily: "Nunito" };
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "https://petly-gsxb.onrender.com";

// --- Helper Functions ---
const getLabel = (v: ViewState) => {
  if (v.mode === "day") return `${v.day} ${MONTH_NAMES[v.month]} ${v.year}`;
  if (v.mode === "month") return `${MONTH_NAMES[v.month]} ${v.year}`;
  return `${v.year}`;
};

// --- Main Component ---
export default function FocusChart({ title = "Focused Time Distribution" }: FocusChartProps) {
  const { appSettings, userProfile } = useGlobalContext();
  const userId = userProfile?.userId;
  const showHours = appSettings.displayFocusInHours;

  // Active View State (Source of Truth for Chart)
  const today = useMemo(() => new Date(), []);
  const [view, setView] = useState<ViewState>({
    mode: "day",
    day: today.getDate(),
    month: today.getMonth(),
    year: today.getFullYear(),
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [chartPoints, setChartPoints] = useState<ChartDatum[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chartWidth, setChartWidth] = useState(0);
  const [selectedBar, setSelectedBar] = useState<{ x: string; y: number; raw: number } | null>(null);
  const [chartAnimKey, setChartAnimKey] = useState(0);

  // Fetch Data
  const fetchData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ mode: view.mode, tz: "Europe/London" });
      if (view.mode === "day") {
        params.set("date", `${view.year}-${String(view.month + 1).padStart(2, "0")}-${String(view.day).padStart(2, "0")}`);
      } else {
        params.set("year", String(view.year));
        if (view.mode === "month") params.set("month", String(view.month + 1));
      }

      const url = `${API_BASE}/api/get_focus_range/${encodeURIComponent(userId)}?${params.toString()}`;
      console.log("[FocusChart] Fetching:", url);

      const res = await fetch(url);
      const text = await res.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch {
        throw new Error(`Invalid server response: ${text.slice(0, 50)}...`);
      }

      if (!res.ok || !json.success) throw new Error(json.error || `HTTP ${res.status}`);
      setChartPoints(json.data?.points ?? []);
    } catch (err: any) {
      console.error("[FocusChart] Error:", err);
      setError(err?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [userId, view]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Clear selected bar when view changes
  useEffect(() => { setSelectedBar(null); }, [view]);

  // Bump animation key when screen gains focus
  useFocusEffect(
    useCallback(() => {
      setChartAnimKey((k) => k + 1);
    }, [])
  );

  // Chart Data Prep
  const victoryData = useMemo(() => chartPoints.map((d, i) => ({
    x: d.label ?? d.key ?? String(i + 1),
    y: showHours ? d.totalMinutes / 60 : d.totalMinutes,
    raw: d.totalMinutes
  })), [chartPoints, showHours]);

  const totalMinutes = useMemo(() => chartPoints.reduce((acc, curr) => acc + (curr.totalMinutes || 0), 0), [chartPoints]);

  const hasData = useMemo(() => victoryData.some(d => d.raw > 0), [victoryData]);

  const xTickValues = useMemo(() => victoryData.map(d => d.x), [victoryData]);
  const maxY = useMemo(() => Math.max(1, ...victoryData.map(d => d.y)), [victoryData]);
  const barKey = useMemo(() => {
    const total = chartPoints.reduce((acc, curr) => acc + (curr.totalMinutes || 0), 0);
    return `${view.mode}-${view.year}-${view.month}-${view.day}-${chartPoints.length}-${total}`;
  }, [view.mode, view.year, view.month, view.day, chartPoints]);
  const chartKey = useMemo(
    () => `${chartAnimKey}-${view.mode}-${view.year}-${view.month}-${chartPoints.length}`,
    [chartAnimKey, view.mode, view.year, view.month, chartPoints.length]
  );
  
  const barWidth = useMemo(() => {
    if (!chartWidth || !victoryData.length) return 10;
    return Math.min((chartWidth - 40) / victoryData.length * 0.6, 18);
  }, [chartWidth, victoryData.length]);

  return (
    <View className="relative my-4 rounded-3xl p-5" style={{ backgroundColor: CoralPalette.surfaceAlt, borderColor: CoralPalette.border, borderWidth: 1 }}>
      {/* Header */}
      <View className="mb-4 flex-row justify-between items-center">
        <Text style={[{ color: CoralPalette.dark, fontSize: 16, fontWeight: "700" }, FONT]}>{title}</Text>
        <TouchableOpacity
          className="rounded-full px-3 py-1"
          style={{ backgroundColor: `${CoralPalette.primaryLight}55` }}
          onPress={() => setModalVisible(true)}
        >
          <Text className="text-sm font-medium" style={[{ color: CoralPalette.primary }, FONT]}>{getLabel(view)}</Text>
        </TouchableOpacity>
      </View>
      
      <View className="-mt-3">
        <Text style={[{ color: CoralPalette.mutedDark, fontSize: 12, fontWeight: "600" }, FONT]}>
          Total Focused Time: {(() => {
            const total = Math.floor(totalMinutes);
            const s = { color: CoralPalette.primary };
            if (showHours && total < 60) {
              const hours = (total / 60).toFixed(1);
              return <><Text style={s}>{hours}</Text> hours</>;
            }
            if (total < 60) return <><Text style={s}>{total}</Text> minutes</>;
            const h = Math.floor(total / 60);
            const m = total % 60;
            return m > 0 ? <><Text style={s}>{h}</Text> hours <Text style={s}>{m}</Text> minutes</> : <><Text style={s}>{h}</Text> hours</>;
          })()}
        </Text>
      </View>

      {/* Chart Area */}
      <View className="relative mt-2" onLayout={(e) => setChartWidth(e.nativeEvent.layout.width)}>
        {!loading && !hasData && (
          <View className="absolute inset-0 z-10 items-center justify-center">
            <Text className="text-sm font-semibold" style={[{ color: CoralPalette.mutedDark }, FONT]}>No data to display</Text>
          </View>
        )}
        
        {chartWidth > 0 && (
          <VictoryChart
            key={chartKey}
            width={chartWidth}
            height={250}
            domain={{ y: [0, Math.ceil(maxY * 1.1)] }}
            domainPadding={{ x: 30, y: [0, 8] }}
            padding={{ top: 8, bottom: 30, left: 30, right: 0 }}
          >
            <VictoryAxis
              tickValues={xTickValues}
              tickFormat={(t) => {
                if (view.mode === "day") return ["00:00", "06:00", "12:00", "18:00", "23:00"].includes(t) ? t : "";
                if (view.mode === "year") return ["Jan", "Mar", "May", "Aug", "Oct", "Dec"].includes(t) ? t : "";
                if (view.mode === "month") {
                   const d = parseInt(t, 10);
                   const lastDay = new Date(view.year, view.month + 1, 0).getDate();
                   if ([1, 8, 15, 22].includes(d) || d === lastDay) return `${t}/${view.month + 1}`;
                   return "";
                }
                return t;
              }}
              style={{ axis: { stroke: "#f3d9cf" }, ticks: { stroke: "transparent" }, tickLabels: { fill: CoralPalette.dark, fontSize: 12, fontFamily: "Nunito", fontWeight: "600", padding: 12 }, grid: { stroke: "transparent" } }}
            />
            <VictoryAxis dependentAxis style={{ axis: { stroke: "transparent" }, ticks: { stroke: "transparent" }, tickLabels: { fill: "#a0a0a0", fontSize: 12, fontFamily: "Nunito", fontWeight: "400", padding: 6 }, grid: { stroke: "#e5e7eb", strokeDasharray: "4,4" } }} />
            <VictoryBar
              key={`${barKey}-${chartAnimKey}`}
              data={victoryData}
              animate={{ duration: 300, onLoad: { duration: 300} }}
              barWidth={barWidth}
              cornerRadius={{ top: 4, bottom: 0 }}
              style={{ data: { fill: ({ datum }: any) => datum.raw > 0 ? (selectedBar?.x === datum.x ? CoralPalette.primaryMuted : CoralPalette.primary) : CoralPalette.border } }}
              labels={({ datum }: any) => selectedBar?.x === datum.x && datum.raw > 0 ? (showHours ? `${(datum.raw / 60).toFixed(1)}h` : `${datum.raw}m`) : ""}
              labelComponent={
                <VictoryLabel
                  dy={-8}
                  style={{
                    fill: CoralPalette.dark,
                    fontSize: 11,
                    fontFamily: "Nunito",
                    fontWeight: "700",
                  }}
                />
              }
              events={[{
                target: "data",
                eventHandlers: {
                  onPressIn: () => [{
                    target: "data",
                    mutation: (props: any) => {
                      const datum = props.datum;
                      if (datum.raw > 0) {
                        setSelectedBar(datum);
                      }
                      return null;
                    }
                  }],
                  onPressOut: () => [{
                    target: "data",
                    mutation: () => {
                      setSelectedBar(null);
                      return null;
                    }
                  }]
                }
              }]}
            />
          </VictoryChart>
        )}
      </View>
      
      {error && <Text className="text-center text-xs mt-2 text-red-500" style={FONT}>{error}</Text>}

      <FilterModal
        visible={modalVisible}
        initialView={view}
        onClose={() => setModalVisible(false)}
        onConfirm={(newView: ViewState) => {
          setView(newView);
          setModalVisible(false);
        }}
      />
    </View>
  );
}

// --- Filter Modal Component ---
function FilterModal({ visible, initialView, onClose, onConfirm }: { visible: boolean; initialView: ViewState; onClose: () => void; onConfirm: (v: ViewState) => void }) {
  const [draft, setDraft] = useState(initialView);
  
  // Reset draft when modal opens
  useEffect(() => { if (visible) setDraft(initialView); }, [visible, initialView]);

  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();

  // Limits
  const maxMonth = draft.year === todayYear ? todayMonth : 11;
  const maxDay = (draft.year === todayYear && draft.month === todayMonth) 
    ? today.getDate() 
    : new Date(draft.year, draft.month + 1, 0).getDate();

  // Auto-correct limits
  useEffect(() => {
    if (draft.month > maxMonth) setDraft(p => ({ ...p, month: maxMonth }));
  }, [draft.year, maxMonth]);

  useEffect(() => {
     const daysInCurrent = new Date(draft.year, draft.month + 1, 0).getDate();
     const actualMaxDay = (draft.year === todayYear && draft.month === todayMonth) ? today.getDate() : daysInCurrent;
     if (draft.day > actualMaxDay) setDraft(p => ({ ...p, day: actualMaxDay }));
  }, [draft.year, draft.month, maxDay, todayYear, todayMonth]);


  // Options Generation
  const years = useMemo(() => {
      const arr = [];
      for (let y = Math.max(2018, todayYear - 10); y <= todayYear; y++) arr.push(y);
      return arr;
  }, [todayYear]);

  const months = useMemo(() => Array.from({ length: maxMonth + 1 }, (_, i) => ({ label: MONTH_NAMES[i], value: i })), [maxMonth]);
  const days = useMemo(() => Array.from({ length: maxDay }, (_, i) => i + 1), [maxDay]);

  const pickerStyle = { color: CoralPalette.dark };
  const pickerItemStyle = Platform.select({ ios: { height: 160, color: CoralPalette.dark, fontFamily: "Nunito" } });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/40 justify-center items-center">
        <View className="w-[90%] max-w-md rounded-3xl p-5" style={{ backgroundColor: CoralPalette.surfaceAlt, borderColor: CoralPalette.border, borderWidth: 1 }}>
          {/* Tabs */}
          <View className="flex-row bg-[#f7ece7] rounded-full p-1 mb-4">
            {(["day", "month", "year"] as const).map((m) => (
              <TouchableOpacity
                key={m}
                className="flex-1 rounded-full py-2"
                style={{ backgroundColor: draft.mode === m ? CoralPalette.primary : "transparent" }}
                onPress={() => setDraft(p => ({ ...p, mode: m }))}
              >
                <Text className="text-center text-sm font-semibold" style={[{ color: draft.mode === m ? "#fff" : CoralPalette.dark }, FONT]}>
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text className="text-center text-lg font-semibold mb-4" style={[{ color: CoralPalette.dark }, FONT]}>
            {getLabel(draft)}
          </Text>

          {/* Pickers */}
          <View className="rounded-2xl overflow-hidden border border-gray-200">
            {draft.mode === "day" && (
               <Picker selectedValue={draft.day} onValueChange={d => setDraft(p => ({...p, day: d}))} style={pickerStyle} itemStyle={pickerItemStyle}>
                 {days.map(d => <Picker.Item key={d} label={d === today.getDate() && draft.month === todayMonth && draft.year === todayYear ? "Today" : `${d}`} value={d} color={CoralPalette.dark} />)}
               </Picker>
            )}
            {draft.mode === "month" && (
               <Picker selectedValue={draft.month} onValueChange={m => setDraft(p => ({...p, month: m}))} style={pickerStyle} itemStyle={pickerItemStyle}>
                 {months.map(m => <Picker.Item key={m.value} label={m.label} value={m.value} color={CoralPalette.dark} />)}
               </Picker>
            )}
            {draft.mode === "year" && (
               <Picker selectedValue={draft.year} onValueChange={y => setDraft(p => ({...p, year: y}))} style={pickerStyle} itemStyle={pickerItemStyle}>
                 {years.map(y => <Picker.Item key={y} label={`${y}`} value={y} color={CoralPalette.dark} />)}
               </Picker>
            )}
          </View>

          {/* Buttons */}
          <View className="flex-row gap-3 mt-6">
            <TouchableOpacity className="flex-1 rounded-2xl py-3 items-center bg-gray-200/50" onPress={onClose}>
              <Text className="text-base font-semibold text-gray-500" style={FONT}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 rounded-2xl py-3 items-center" style={{ backgroundColor: CoralPalette.primary }} onPress={() => onConfirm(draft)}>
              <Text className="text-base font-semibold text-white" style={FONT}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
