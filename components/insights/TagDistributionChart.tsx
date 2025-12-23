import React, { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Platform } from "react-native";
import { VictoryPie } from "victory-native";
import { useGlobalContext } from "@/lib/GlobalProvider";
import { CoralPalette } from "@/constants/colors";
import { Picker } from "@react-native-picker/picker";
import { getApiBaseUrl } from "@/utils/api";
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing } from "react-native-reanimated";
import { PieChart, ChevronDown, Clock } from "lucide-react-native";
import BaseModal from "@/components/common/BaseModal";

// --- Types ---
type TagDistribution = {
  tagId: string;
  totalMinutes: number;
  totalSeconds: number;
  sessionCount: number;
};

type ViewState = { mode: "day" | "month" | "year" | "all"; day: number; month: number; year: number };
type TagDistributionChartProps = { title?: string };

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

// Color palette for tags (will cycle through if more tags than colors)
const TAG_COLORS = [
  CoralPalette.primary,
  CoralPalette.green,
  CoralPalette.blue,
  CoralPalette.primaryMuted,
  CoralPalette.yellow,
  CoralPalette.primaryMuted,
  CoralPalette.greenLight,
  CoralPalette.blueLight,
  CoralPalette.primaryLight,
  CoralPalette.yellowLight,
];

// --- Helper Functions ---
const getLabel = (v: ViewState) => {
  if (v.mode === "day") return `${v.day} ${MONTH_NAMES[v.month]} ${v.year}`;
  if (v.mode === "month") return `${MONTH_NAMES[v.month]} ${v.year}`;
  if (v.mode === "year") return `${v.year}`;
  return "All Time";
};

// --- Main Component ---
export default function TagDistributionChart({ title = "Tag Distribution" }: TagDistributionChartProps) {
  const { appSettings, userProfile } = useGlobalContext();
  const userId = userProfile?.userId;
  const showHours = appSettings.displayFocusInHours;
  const tz = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/London", []);

  // Get user's tags to match colors
  const userTags = useMemo(() => {
    if (userProfile?.tagList && Array.isArray(userProfile.tagList)) {
      return userProfile.tagList as Array<{ id: string; label: string; color: string; activity?: string }>;
    }
    return [];
  }, [userProfile?.tagList]);

  // Active View State
  const today = new Date();
  const [view, setView] = useState<ViewState>({
    mode: "month",
    day: today.getDate(),
    month: today.getMonth(),
    year: today.getFullYear(),
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [distribution, setDistribution] = useState<TagDistribution[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chartWidth, setChartWidth] = useState(0);
  const [chartAnimKey, setChartAnimKey] = useState(0);

  // Create complete legend data with all user tags (including 0% ones)
  const completeLegendData = useMemo(() => {
    const knownTagIds = new Set(userTags.map((t) => t.id));
    const totalSeconds = distribution.reduce((sum, d) => sum + (d?.totalSeconds || 0), 0);

    const secondsByTagId = new Map(distribution.map((d) => [d.tagId, d.totalSeconds]));
    let otherSeconds = 0;
    distribution.forEach((d) => {
      if (!knownTagIds.has(d.tagId)) otherSeconds += d.totalSeconds;
    });

    const rows = userTags.map((tag, i) => {
      const sec = secondsByTagId.get(tag.id) ?? 0;
      const percentage = totalSeconds > 0 ? ((sec / totalSeconds) * 100).toFixed(1) : "0.0";
      return {
        tagId: tag.id,
        tag: tag.label,
        totalMinutes: Math.round(sec / 60),
        percentage,
        color: tag.color || TAG_COLORS[i % TAG_COLORS.length],
        hasData: sec > 0,
      };
    });

    if (otherSeconds > 0) {
      rows.push({
        tagId: "__other__",
        tag: "Other",
        totalMinutes: Math.round(otherSeconds / 60),
        percentage: totalSeconds > 0 ? ((otherSeconds / totalSeconds) * 100).toFixed(1) : "0.0",
        color: CoralPalette.grey,
        hasData: true,
      });
    }

    return rows;
  }, [distribution, userTags]);

  // Fetch Data
  const fetchData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ mode: view.mode, tz });
      if (view.mode === "day") {
        params.set("date", `${view.year}-${String(view.month + 1).padStart(2, "0")}-${String(view.day).padStart(2, "0")}`);
      } else if (view.mode === "month") {
        params.set("year", String(view.year));
        params.set("month", String(view.month + 1));
      } else if (view.mode === "year") {
        params.set("year", String(view.year));
      }
      // "all" mode doesn't need additional params

      const API_BASE = getApiBaseUrl();
      const url = `${API_BASE}/api/get_tag_distribution/${encodeURIComponent(userId)}?${params.toString()}`;

      const res = await fetch(url);
      const text = await res.text();
      
      // Check if response is HTML (likely a 404 or error page)
      if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<!doctype') || text.trim().startsWith('<html')) {
        throw new Error(`Endpoint not found. Please ensure the backend server is running and the route is registered.`);
      }
      
      let json;
      try {
        json = JSON.parse(text);
      } catch (parseError) {
        console.error('[TagDistributionChart] Parse error:', parseError, 'Response:', text.slice(0, 200));
        throw new Error(`Invalid server response: ${text.slice(0, 100)}...`);
      }

      if (!res.ok || !json.success) {
        const errorMsg = json.error || `HTTP ${res.status}`;
        // Handle quota/resource exhaustion errors with user-friendly message
        if (errorMsg.includes("RESOURCE_EXHAUSTED") || errorMsg.includes("Quota exceeded")) {
          throw new Error("Service temporarily unavailable. Please try again in a moment.");
        }
        throw new Error(errorMsg);
      }
      const raw = Array.isArray(json.data?.distribution) ? json.data.distribution : [];
      const normalized: TagDistribution[] = raw
        .map((d: any) => {
          const tagId = String(d?.tagId ?? d?.tag ?? "").trim();
          const totalSecondsRaw = Number(d?.totalSeconds);
          const totalMinutesRaw = Number(d?.totalMinutes);
          const totalSeconds =
            Number.isFinite(totalSecondsRaw) && totalSecondsRaw >= 0
              ? totalSecondsRaw
              : Math.max(0, Math.round((Number.isFinite(totalMinutesRaw) ? totalMinutesRaw : 0) * 60));
          const totalMinutes = Math.round(totalSeconds / 60);
          const sessionCount = Number.isFinite(Number(d?.sessionCount)) ? Number(d.sessionCount) : 0;
          return { tagId, totalSeconds, totalMinutes, sessionCount };
        })
        .filter((d: TagDistribution) => d.tagId.length > 0 && d.totalSeconds > 0);
      setDistribution(normalized);
    } catch (err: any) {
      console.error("[TagDistributionChart] Error:", err);
      setError(err?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [userId, view.mode, view.year, view.month, view.day, tz]);

  // Track previous view to detect changes
  const prevViewKeyRef = useRef<string>("");

  const viewKey = useMemo(
    () => `${view.mode}-${view.year}-${view.month}-${view.day}`,
    [view.mode, view.year, view.month, view.day]
  );

  useEffect(() => {
    const viewChanged = viewKey !== prevViewKeyRef.current;

    if (viewChanged) {
      prevViewKeyRef.current = viewKey;
      setError(null);
      setDistribution([]);
      setChartAnimKey((k) => k + 1);
      setLoading(true);
    }
  }, [viewKey, view]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalSeconds = useMemo(() => distribution.reduce((acc, curr) => acc + (curr.totalSeconds || 0), 0), [distribution]);

  const otherSeconds = useMemo(() => {
    const knownTagIds = new Set(userTags.map((t) => t.id));
    return distribution.reduce((sum, d) => (knownTagIds.has(d.tagId) ? sum : sum + d.totalSeconds), 0);
  }, [distribution, userTags]);

  // Prepare chart data
  const victoryData = useMemo(() => {
    if (distribution.length === 0 || totalSeconds === 0) return [];

    const secondsByTagId = new Map(distribution.map((d) => [d.tagId, d.totalSeconds]));
    const slices: any[] = [];

    userTags.forEach((tag, i) => {
      const sec = secondsByTagId.get(tag.id) ?? 0;
      if (!sec) return;
      slices.push({
        x: tag.label,
        y: showHours ? sec / 3600 : sec / 60,
        rawSeconds: sec,
        color: tag.color || TAG_COLORS[i % TAG_COLORS.length],
        percentage: Number(((sec / totalSeconds) * 100).toFixed(1)),
      });
    });

    if (otherSeconds > 0) {
      slices.push({
        x: "Other",
        y: showHours ? otherSeconds / 3600 : otherSeconds / 60,
        rawSeconds: otherSeconds,
        color: CoralPalette.grey,
        percentage: Number(((otherSeconds / totalSeconds) * 100).toFixed(1)),
      });
    }

    return slices;
  }, [distribution, showHours, userTags, totalSeconds, otherSeconds]);

  const hasData = useMemo(() => victoryData.length > 0 && victoryData.some((d) => d.rawSeconds > 0), [victoryData]);

  const chartKey = useMemo(() => `${chartAnimKey}-${viewKey}`, [chartAnimKey, viewKey]);

  const formattedTime = useMemo(() => {
    const totalMinutes = Math.round(totalSeconds / 60);
    const s = { color: CoralPalette.primary };
    if (showHours && totalMinutes < 60) {
      const hours = (totalMinutes / 60).toFixed(1);
      return (
        <>
          <Text style={s}>{hours}</Text> hours
        </>
      );
    }
    if (totalMinutes < 60)
      return (
        <>
          <Text style={s}>{totalMinutes}</Text> minutes
        </>
      );
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return m > 0 ? (
      <>
        <Text style={s}>{h}</Text> hours <Text style={s}>{m}</Text> minutes
      </>
    ) : (
      <>
        <Text style={s}>{h}</Text> hours
      </>
    );
  }, [totalSeconds, showHours]);

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
            <PieChart size={20} color={CoralPalette.primary} strokeWidth={2.5} />
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
          <Text style={[{ color: CoralPalette.primary, fontSize: 13, fontWeight: "700" }, FONT]}>
            {getLabel(view)}
          </Text>
          <ChevronDown size={16} color={CoralPalette.primary} strokeWidth={2.5} style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      </View>

      {/* Chart Area - Horizontal layout with pie on left, legend on right */}
      <View style={{ padding: 25, paddingTop: 8 }} onLayout={(e) => setChartWidth(e.nativeEvent.layout.width)}>
        <View style={{ flexDirection: "row", alignItems: "center", minHeight: 180 }}>
          {/* Pie Chart - Left side */}
          <View style={{ width: 160, height: 160, position: "relative" }}>
            {chartWidth > 0 && (
              <VictoryPie
                key={chartKey}
                data={victoryData}
                width={160}
                height={160}
                innerRadius={45}
                padding={0}
                labels={() => ""}
                style={{
                  data: {
                    fill: ({ datum }: any) => datum.color,
                  },
                }}
                animate={!loading && hasData ? { duration: 500, onLoad: { duration: 500 } } : false}
              />
            )}

            {/* Loading overlay */}
            {loading && distribution.length === 0 && (
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
                <Text style={[{ color: CoralPalette.mutedDark, fontSize: 12, fontWeight: "600" }, FONT]}>
                  Loading...
                </Text>
              </View>
            )}

            {/* No data overlay */}
            {!loading && !hasData && distribution.length === 0 && (
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
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 8,
                  }}
                >
                  <Text style={[{ color: CoralPalette.mutedDark, fontSize: 11, fontWeight: "600" }, FONT]}>
                    No data
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Legend - Right side */}
          {userTags.length > 0 && (
            <View
              style={{
                flex: 1,
                marginLeft: 30,
                gap: 6,
              }}
            >
              {completeLegendData.map((item) => (
                <View
                  key={item.tagId}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: item.color,
                      marginRight: 8,
                      opacity: item.hasData ? 1 : 0.4,
                    }}
                  />
                  <Text
                    style={[
                      {
                        width: 50,
                        color: item.hasData ? CoralPalette.dark : CoralPalette.mutedDark,
                        fontSize: 12,
                        fontWeight: "600",
                      },
                      FONT,
                    ]}
                    numberOfLines={1}
                  >
                    {item.tag}
                  </Text>
                  <Text
                    style={[
                      {
                        color: item.hasData ? item.color : CoralPalette.mutedDark,
                        fontSize: 12,
                        fontWeight: "700",
                      },
                      FONT,
                    ]}
                  >
                    {item.percentage}%
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>

      {error && (
        <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
          <Text style={[{ color: "#ef4444", fontSize: 12, textAlign: "center" }, FONT]}>
            {error}
          </Text>
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
function FilterModal({
  visible,
  initialView,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  initialView: ViewState;
  onClose: () => void;
  onConfirm: (v: ViewState) => void;
}) {
  const [draft, setDraft] = useState(initialView);
  const [tabLayouts, setTabLayouts] = useState<{ [key: string]: { x: number; width: number } }>({});
  const tabContainerRef = useRef<View>(null);

  const pillPosition = useSharedValue(0);

  useEffect(() => {
    const modeIndex = { day: 0, month: 1, year: 2, all: 3 }[draft.mode] ?? 0;
    pillPosition.value = withTiming(modeIndex, {
      duration: 300,
      easing: Easing.out(Easing.cubic),
    });
  }, [draft.mode, pillPosition]);

  const { today, todayYear, todayMonth, todayDate } = useMemo(() => {
    const t = new Date();
    return {
      today: t,
      todayYear: t.getFullYear(),
      todayMonth: t.getMonth(),
      todayDate: t.getDate(),
    };
  }, []);

  useEffect(() => {
    if (visible) {
      setDraft(initialView);
    }
  }, [visible, initialView.mode, initialView.year, initialView.month, initialView.day]);

  const maxMonth = useMemo(
    () => (draft.year === todayYear ? todayMonth : 11),
    [draft.year, todayYear, todayMonth]
  );

  const maxDay = useMemo(
    () =>
      draft.year === todayYear && draft.month === todayMonth
        ? todayDate
        : new Date(draft.year, draft.month + 1, 0).getDate(),
    [draft.year, draft.month, todayYear, todayMonth, todayDate]
  );

  useEffect(() => {
    if (draft.month > maxMonth) setDraft((p) => ({ ...p, month: maxMonth }));
  }, [draft.year, maxMonth]);

  useEffect(() => {
    if (draft.day > maxDay) setDraft((p) => ({ ...p, day: maxDay }));
  }, [draft.year, draft.month, maxDay]);

  const years = useMemo(() => {
    const arr = [];
    for (let y = Math.max(2018, todayYear - 10); y <= todayYear; y++) arr.push(y);
    return arr;
  }, [todayYear]);

  const months = useMemo(
    () => Array.from({ length: maxMonth + 1 }, (_, i) => ({ label: MONTH_NAMES[i], value: i })),
    [maxMonth]
  );
  const days = useMemo(() => Array.from({ length: maxDay }, (_, i) => i + 1), [maxDay]);

  const pickerStyle = { color: CoralPalette.dark };
  const pickerItemStyle = Platform.select({
    ios: { height: 120, color: CoralPalette.dark, fontFamily: "Nunito" },
  });

  const animatedPillStyle = useAnimatedStyle(() => {
    if (!tabLayouts["day"]) {
      return { opacity: 0 };
    }

    const tabWidth = tabLayouts["day"].width;
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
        className="flex-row p-1 mb-3 relative"
        style={{ borderRadius: 5, backgroundColor: CoralPalette.greyVeryLight }}
        onLayout={(e) => {
          const containerWidth = e.nativeEvent.layout.width;
          const padding = 4;
          const tabWidth = (containerWidth - padding * 2) / 4;
          setTabLayouts({
            day: { x: padding, width: tabWidth },
            month: { x: padding + tabWidth, width: tabWidth },
            year: { x: padding + tabWidth * 2, width: tabWidth },
            all: { x: padding + tabWidth * 3, width: tabWidth },
          });
        }}
      >
        {tabLayouts["day"] && (
          <Animated.View
            style={[
              {
                position: "absolute",
                left: tabLayouts["day"].x,
                top: 4,
                bottom: 4,
                backgroundColor: CoralPalette.primary,
                borderRadius: 5,
              },
              animatedPillStyle,
            ]}
          />
        )}
        {(["day", "month", "year", "all"] as const).map((m) => (
          <TouchableOpacity
            key={m}
            className="flex-1 py-2 z-10"
            onPress={() => setDraft((p) => ({ ...p, mode: m }))}
            style={{ borderRadius: 5 }}
          >
            <Text
              className="text-center text-sm font-semibold"
              style={[{ color: draft.mode === m ? "#fff" : CoralPalette.dark }, FONT]}
            >
              {m === "all" ? "All" : m.charAt(0).toUpperCase() + m.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text className="text-center text-xl font-bold py-2" style={[{ color: CoralPalette.dark }, FONT]}>
        {getLabel(draft)}
      </Text>

      {/* Pickers - Always render container to prevent height snap */}
      <View className="rounded-2xl overflow-hidden" style={{ backgroundColor: CoralPalette.white, minHeight: 150 }}>
        {draft.mode === "day" && (
          <Picker
            selectedValue={draft.day}
            onValueChange={(d) => setDraft((p) => ({ ...p, day: d }))}
            style={pickerStyle}
            itemStyle={pickerItemStyle}
          >
            {days.map((d) => (
              <Picker.Item
                key={d}
                label={
                  d === todayDate && draft.month === todayMonth && draft.year === todayYear ? "Today" : `${d}`
                }
                value={d}
                color={CoralPalette.dark}
              />
            ))}
          </Picker>
        )}
        {draft.mode === "month" && (
          <Picker
            selectedValue={draft.month}
            onValueChange={(m) => setDraft((p) => ({ ...p, month: m }))}
            style={pickerStyle}
            itemStyle={pickerItemStyle}
          >
            {months.map((m) => (
              <Picker.Item key={m.value} label={m.label} value={m.value} color={CoralPalette.dark} />
            ))}
          </Picker>
        )}
        {draft.mode === "year" && (
          <Picker
            selectedValue={draft.year}
            onValueChange={(y) => setDraft((p) => ({ ...p, year: y }))}
            style={pickerStyle}
            itemStyle={pickerItemStyle}
          >
            {years.map((y) => (
              <Picker.Item key={y} label={`${y}`} value={y} color={CoralPalette.dark} />
            ))}
          </Picker>
        )}
      </View>

      {/* Buttons */}
      <View className="flex-row gap-3 -mt-6">
        <TouchableOpacity
          className="flex-1 rounded-2xl py-3 items-center"
          style={{ backgroundColor: CoralPalette.greyLighter }}
          onPress={onClose}
        >
          <Text className="text-base font-semibold text-black" style={FONT}>
            Cancel
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 rounded-2xl py-3 items-center"
          style={{ backgroundColor: CoralPalette.primary }}
          onPress={() => onConfirm(draft)}
        >
          <Text className="text-base font-bold text-white" style={FONT}>
            Confirm
          </Text>
        </TouchableOpacity>
      </View>
    </BaseModal>
  );
}
