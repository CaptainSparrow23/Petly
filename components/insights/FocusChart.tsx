import React, { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Platform } from "react-native";
import { VictoryAxis, VictoryBar, VictoryChart, VictoryLabel } from "victory-native";
import { useGlobalContext } from "@/providers/GlobalProvider";
import { CoralPalette } from "@/constants/colors";
import { Picker } from "@react-native-picker/picker";
import { getApiBaseUrl } from "@/lib/api";
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing } from "react-native-reanimated";
import { BarChart3, ChevronDown, Clock } from "lucide-react-native";
import BaseModal from "@/components/common/BaseModal";

// --- Types ---
export type ChartDatum = { key: string; label: string; totalMinutes: number; totalSeconds?: number };
type ViewState = { mode: "day" | "month" | "year"; day: number; month: number; year: number };
type FocusChartProps = { title?: string };

// --- Constants ---
const FONT = { fontFamily: "Nunito" };
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const CARD_SHADOW = {
  shadowColor: CoralPalette.primary,
  shadowOpacity: 0.15,
  shadowOffset: { width: 0, height: 4 },
  shadowRadius: 12,
  elevation: 8,
};

// Tick format lookup sets for O(1) performance
const DAY_TICK_SET = new Set(["00:00", "06:00", "12:00", "18:00", "23:00"]);
const YEAR_TICK_SET = new Set(["Jan", "Mar", "May", "Aug", "Oct", "Dec"]);

// --- Helper Functions ---
const getLabel = (v: ViewState) => {
  if (v.mode === "day") return `${v.day} ${MONTH_NAMES[v.month]} ${v.year}`;
  if (v.mode === "month") return `${MONTH_NAMES[v.month]} ${v.year}`;
  return `${v.year}`;
};

// --- Main Component ---
export default function FocusChart({ title = "Time Distribution" }: FocusChartProps) {
  const { appSettings, userProfile } = useGlobalContext();
  const userId = userProfile?.userId;
  const showHours = appSettings.displayFocusInHours;
  const tz = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/London", []);

  // Active View State (Source of Truth for Chart)
  // Calculate today fresh on each render to ensure it's current
  const today = new Date();
  const [view, setView] = useState<ViewState>({
    mode: "month",
    day: today.getDate(),
    month: today.getMonth(),
    year: today.getFullYear(),
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [chartPoints, setChartPoints] = useState<ChartDatum[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chartWidth, setChartWidth] = useState(0);
  const [selectedBar, setSelectedBar] = useState<{ x: string; y: number; rawSeconds: number } | null>(null);
  const [chartAnimKey, setChartAnimKey] = useState(0);

  // Fetch Data - use individual view properties to avoid unnecessary re-fetches
  const fetchData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ mode: view.mode, tz: "Europe/London" });
      params.set("tz", tz);
      if (view.mode === "day") {
        params.set("date", `${view.year}-${String(view.month + 1).padStart(2, "0")}-${String(view.day).padStart(2, "0")}`);
      } else {
        params.set("year", String(view.year));
        if (view.mode === "month") params.set("month", String(view.month + 1));
      }

      const API_BASE = getApiBaseUrl();
      const url = `${API_BASE}/api/get_focus_range/${encodeURIComponent(userId)}?${params.toString()}`;

      const res = await fetch(url);
      const text = await res.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch {
        throw new Error(`Invalid server response: ${text.slice(0, 50)}...`);
      }

      if (!res.ok || !json.success) {
        const errorMsg = json.error || `HTTP ${res.status}`;
        // Handle quota/resource exhaustion errors with user-friendly message
        if (errorMsg.includes("RESOURCE_EXHAUSTED") || errorMsg.includes("Quota exceeded")) {
          throw new Error("Service temporarily unavailable. Please try again in a moment.");
        }
        throw new Error(errorMsg);
      }
      setChartPoints(json.data?.points ?? []);
    } catch (err: any) {
      console.error("[FocusChart] Error:", err);
      setError(err?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [userId, view.mode, view.year, view.month, view.day, tz]);

  // Track previous view to detect changes
  const prevViewRef = useRef<ViewState>(view);
  const prevViewKeyRef = useRef<string>('');
  
  // Create view-based key that changes immediately when view changes (before data loads)
  const viewKey = useMemo(
    () => `${view.mode}-${view.year}-${view.month}-${view.day}`,
    [view.mode, view.year, view.month, view.day]
  );
  
  // When view changes, immediately clear old data and prepare for new data
  useEffect(() => {
    const viewChanged = viewKey !== prevViewKeyRef.current;
    
    if (viewChanged) {
      prevViewRef.current = view;
      prevViewKeyRef.current = viewKey;
      setSelectedBar(null);
      setError(null);
      setChartPoints([]); // Clear old data immediately - no trace of old data
      setChartAnimKey((k) => k + 1); // New animation key for fresh start
      setLoading(true);
    }
  }, [viewKey, view]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Chart Data Prep
  const victoryData = useMemo(
    () =>
      chartPoints.map((d, i) => {
        const rawSeconds = d.totalSeconds ?? (d.totalMinutes || 0) * 60;
        return {
          x: d.label ?? d.key ?? String(i + 1),
          y: showHours ? rawSeconds / 3600 : rawSeconds / 60,
          rawSeconds,
        };
      }),
    [chartPoints, showHours]
  );

  const totalSeconds = useMemo(
    () => chartPoints.reduce((acc, curr) => acc + (curr.totalSeconds ?? (curr.totalMinutes || 0) * 60), 0),
    [chartPoints]
  );

  const hasData = useMemo(() => victoryData.some((d) => d.rawSeconds > 0), [victoryData]);

  const xTickValues = useMemo(() => victoryData.map(d => d.x), [victoryData]);
  const maxY = useMemo(() => Math.max(1, ...victoryData.map(d => d.y)), [victoryData]);

  // Use totalMinutes instead of recalculating - preserves remount behavior for animations
  // chartKey changes immediately when viewKey changes (before data loads) to force remount
  const chartKey = useMemo(
    () => `${chartAnimKey}-${viewKey}`,
    [chartAnimKey, viewKey]
  );
  
  const barKey = useMemo(() => {
    return `${viewKey}-${chartPoints.length}-${totalSeconds}`;
  }, [viewKey, chartPoints.length, totalSeconds]);
  
  const barWidth = useMemo(() => {
    if (!chartWidth || !victoryData.length) return 10;
    return Math.min((chartWidth - 40) / victoryData.length * 0.6, 18);
  }, [chartWidth, victoryData.length]);

  // Memoize time formatting to avoid recreating on every render
  const formattedTime = useMemo(() => {
    const totalMinutes = Math.round(totalSeconds / 60);
    const s = { color: CoralPalette.primary };
    if (showHours && totalMinutes < 60) {
      const hours = (totalMinutes / 60).toFixed(1);
      return <><Text style={s}>{hours}</Text> hours</>;
    }
    if (totalMinutes < 60) return <><Text style={s}>{totalMinutes}</Text> minutes</>;
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return m > 0 ? <><Text style={s}>{h}</Text> hours <Text style={s}>{m}</Text> minutes</> : <><Text style={s}>{h}</Text> hours</>;
  }, [totalSeconds, showHours]);

  // Memoize tick format function to avoid recreating on every render
  const tickFormat = useCallback((t: string) => {
    if (view.mode === "day") return DAY_TICK_SET.has(t) ? t : "";
    if (view.mode === "year") return YEAR_TICK_SET.has(t) ? t : "";
    if (view.mode === "month") {
      const d = parseInt(t, 10);
      const lastDay = new Date(view.year, view.month + 1, 0).getDate();
      if ([1, 8, 15, 22].includes(d) || d === lastDay) return `${t}/${view.month + 1}`;
      return "";
    }
    return t;
  }, [view.mode, view.year, view.month]);

  // Memoize axis styles to avoid recreating on every render
  const xAxisStyle = useMemo(() => ({
    axis: { stroke: "#f3d9cf" },
    ticks: { stroke: "transparent" },
    tickLabels: { fill: CoralPalette.dark, fontSize: 12, fontFamily: "Nunito", fontWeight: "600" as const, padding: 12 },
    grid: { stroke: "transparent" }
  }), []);

  const yAxisStyle = useMemo(() => ({
    axis: { stroke: "transparent" },
    ticks: { stroke: "transparent" },
    tickLabels: { fill: "#a0a0a0", fontSize: 12, fontFamily: "Nunito", fontWeight: "400" as const, padding: 6 },
    grid: { stroke: "#e5e7eb", strokeDasharray: "4,4" }
  }), []);

  // Memoize bar style function
  const barStyleFunction = useCallback(({ datum }: any) => {
    return datum.rawSeconds > 0 
      ? (selectedBar?.x === datum.x ? CoralPalette.primaryMuted : CoralPalette.primary)
      : CoralPalette.greyLight;
  }, [selectedBar?.x]);

  // Memoize bar labels function
  const barLabelsFunction = useCallback(({ datum }: any) => {
    return selectedBar?.x === datum.x && datum.rawSeconds > 0 
      ? (showHours ? `${(datum.rawSeconds / 3600).toFixed(1)}h` : `${Math.round(datum.rawSeconds / 60)}m`)
      : "";
  }, [selectedBar?.x, showHours]);

  return (
    <View
      style={[
        {
          borderRadius: 20,
          backgroundColor: CoralPalette.white,
          borderColor: `${CoralPalette.primary}20`,
          borderWidth: 1,
          overflow: "hidden",
        },
        CARD_SHADOW,
      ]}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          padding: 18,
          paddingBottom: 14,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
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
            <BarChart3 size={20} color={CoralPalette.primary} strokeWidth={2.5} />
          </View>
          <View>
            <Text style={[{ color: CoralPalette.dark, fontSize: 16, fontWeight: "700" }, FONT]}>{title}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
              <Clock size={12} color={CoralPalette.mutedDark} strokeWidth={2} />
              <Text style={[{ color: CoralPalette.mutedDark, fontSize: 12, fontWeight: "600", marginLeft: 4 }, FONT]}>
                {formattedTime}
              </Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: `${CoralPalette.primary}12`,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: `${CoralPalette.primary}25`,
          }}
          onPress={() => setModalVisible(true)}
        >
          <Text style={[{ color: CoralPalette.primary, fontSize: 13, fontWeight: "700" }, FONT]}>{getLabel(view)}</Text>
          <ChevronDown size={16} color={CoralPalette.primary} strokeWidth={2.5} style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      </View>

      {/* Chart Area */}
      <View style={{ padding: 16, paddingTop: 8 }}>
        <View style={{ minHeight: 250, position: "relative" }} onLayout={(e) => setChartWidth(e.nativeEvent.layout.width)}>
          {loading && chartPoints.length === 0 && (
            <View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 20,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: `${CoralPalette.white}E6`,
                borderRadius: 12,
              }}
            >
              <Text style={[{ color: CoralPalette.mutedDark, fontSize: 14, fontWeight: "600" }, FONT]}>Loading...</Text>
            </View>
          )}
          {!loading && !hasData && chartPoints.length === 0 && (
            <View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 10,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <View
                style={{
                  backgroundColor: CoralPalette.greyLight,
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  borderRadius: 12,
                }}
              >
                <Text style={[{ color: CoralPalette.mutedDark, fontSize: 14, fontWeight: "600" }, FONT]}>No data to display</Text>
              </View>
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
              tickValues={xTickValues.length > 0 ? xTickValues : ['']}
              tickFormat={tickFormat}
              style={xAxisStyle}
            />
            <VictoryAxis dependentAxis style={yAxisStyle} />
            <VictoryBar
              key={`${barKey}-${chartAnimKey}`}
              data={victoryData}
              animate={!loading && victoryData.length > 0 ? { duration: 300, onLoad: { duration: 300} } : false}
              barWidth={barWidth}
              cornerRadius={{ top: 4, bottom: 0 }}
              style={{ data: { fill: barStyleFunction } }}
              labels={barLabelsFunction}
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
                      if (datum.rawSeconds > 0) {
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
      </View>
      
      {error && (
        <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
          <Text style={[{ color: "#ef4444", fontSize: 12, textAlign: "center" }, FONT]}>{error}</Text>
        </View>
      )}

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
  const [tabLayouts, setTabLayouts] = useState<{ [key: string]: { x: number; width: number } }>({});
  const tabContainerRef = useRef<View>(null);
  
  // Animated value for pill position (0 = day, 1 = month, 2 = year)
  const pillPosition = useSharedValue(0);
  
  // Update pill position when mode changes
  useEffect(() => {
    const modeIndex = { day: 0, month: 1, year: 2 }[draft.mode] ?? 0;
    pillPosition.value = withTiming(modeIndex, {
      duration: 300,
      easing: Easing.out(Easing.cubic),
    });
  }, [draft.mode, pillPosition]);
  
  // Memoize today values to avoid recalculating on every render
  const { today, todayYear, todayMonth, todayDate } = useMemo(() => {
    const t = new Date();
    return {
      today: t,
      todayYear: t.getFullYear(),
      todayMonth: t.getMonth(),
      todayDate: t.getDate()
    };
  }, []);

  // Reset draft when modal opens - use individual properties to avoid unnecessary resets
  useEffect(() => {
    if (visible) {
      setDraft(initialView);
    }
  }, [visible, initialView.mode, initialView.year, initialView.month, initialView.day]);

  // Memoize limits
  const maxMonth = useMemo(() => 
    draft.year === todayYear ? todayMonth : 11,
    [draft.year, todayYear, todayMonth]
  );

  const maxDay = useMemo(() => 
    (draft.year === todayYear && draft.month === todayMonth)
      ? todayDate
      : new Date(draft.year, draft.month + 1, 0).getDate(),
    [draft.year, draft.month, todayYear, todayMonth, todayDate]
  );

  // Auto-correct limits
  useEffect(() => {
    if (draft.month > maxMonth) setDraft(p => ({ ...p, month: maxMonth }));
  }, [draft.year, maxMonth]);

  useEffect(() => {
    if (draft.day > maxDay) setDraft(p => ({ ...p, day: maxDay }));
  }, [draft.year, draft.month, maxDay]);


  // Options Generation
  const years = useMemo(() => {
      const arr = [];
      for (let y = Math.max(2018, todayYear - 10); y <= todayYear; y++) arr.push(y);
      return arr;
  }, [todayYear]);

  const months = useMemo(() => Array.from({ length: maxMonth + 1 }, (_, i) => ({ label: MONTH_NAMES[i], value: i })), [maxMonth]);
  const days = useMemo(() => Array.from({ length: maxDay }, (_, i) => i + 1), [maxDay]);

  const pickerStyle = { color: CoralPalette.dark };
  const pickerItemStyle = Platform.select({ ios: { height: 120, color: CoralPalette.dark, fontFamily: "Nunito" } });

  // Animated style for the pill background
  const animatedPillStyle = useAnimatedStyle(() => {
    if (!tabLayouts['day']) {
      return { opacity: 0 };
    }
    
    const tabWidth = tabLayouts['day'].width;
    const translateX = pillPosition.value * tabWidth;
    
    return {
      transform: [{ translateX }],
      width: tabWidth,
      opacity: 1,
    };
  }, [tabLayouts]);

  return (
    <BaseModal
      visible={visible}
      onClose={onClose}
      animationType="fade"
      contentStyle={{
        width: '90%',
        maxWidth: 400,
        borderRadius: 30,
        backgroundColor: CoralPalette.white,
        padding: 28,
      }}
    >
      {/* Tabs */}
      <View 
        ref={tabContainerRef}
        className="flex-row p-1 mb-4 relative"
        style={{ borderRadius: 5, backgroundColor: CoralPalette.greyVeryLight}}
        onLayout={(e) => {
          // Measure container and calculate tab width
          const containerWidth = e.nativeEvent.layout.width;
          const padding = 4; // p-1 = 4px
          const tabWidth = (containerWidth - padding * 2) / 3;
          setTabLayouts({
            day: { x: padding, width: tabWidth },
            month: { x: padding + tabWidth, width: tabWidth },
            year: { x: padding + tabWidth * 2, width: tabWidth },
          });
        }}
      >
        {/* Animated pill background */}
        {tabLayouts['day'] && (
          <Animated.View
            style={[
              {
                position: 'absolute',
                left: tabLayouts['day'].x,
                top: 4,
                bottom: 4,
                backgroundColor: CoralPalette.primary,
                borderRadius: 5,
              },
              animatedPillStyle,
            ]}
          
        />
        )}
        
        {(["day", "month", "year"] as const).map((m) => (
          <TouchableOpacity
            key={m}
            className="flex-1 py-2 z-10"
            onPress={() => setDraft(p => ({ ...p, mode: m }))}
            style={{ borderRadius: 5 }}
          >
            <Text className="text-center text-sm font-semibold" style={[{ color: draft.mode === m ? "#fff" : CoralPalette.dark }, FONT]}>
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text className="text-center text-xl font-bold py-2" style={[{ color: CoralPalette.dark }, FONT]}>
        {getLabel(draft)}
      </Text>

      {/* Pickers */}
      <View className="rounded-2xl overflow-hidden" style={{  backgroundColor: CoralPalette.white }}>
        {draft.mode === "day" && (
           <Picker selectedValue={draft.day} onValueChange={d => setDraft(p => ({...p, day: d}))} style={pickerStyle} itemStyle={pickerItemStyle}>
             {days.map(d => <Picker.Item key={d} label={d === todayDate && draft.month === todayMonth && draft.year === todayYear ? "Today" : `${d}`} value={d} color={CoralPalette.dark} />)}
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
      <View className="flex-row gap-3">
        <TouchableOpacity className="flex-1 rounded-2xl py-3 items-center" style={{ backgroundColor: CoralPalette.greyLighter }} onPress={onClose}>
          <Text className="text-base font-semibold text-black" style={FONT}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity className="flex-1 rounded-2xl py-3 items-center" style={{ backgroundColor: CoralPalette.primary }} onPress={() => onConfirm(draft)}>
          <Text className="text-base font-bold text-white" style={FONT}>Confirm</Text>
        </TouchableOpacity>
      </View>
    </BaseModal>
  );
}
