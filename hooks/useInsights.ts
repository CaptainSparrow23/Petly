import { useCallback, useEffect, useState } from "react";

type StreakResponse = {
  success: boolean;
  data?: {
    dailyStreak: number;
    lastUpdatedDailyStreak?: string;
    status: "ok" | "reset" | "updated";
  };
  error?: string;
};

export type ChartDatum = { key: string; label: string; totalMinutes: number };

type TodayResponse = {
  success: boolean;
  data?: { minutesByHour: number[]; totalMinutes: number };
  error?: string;
};

type WeekResponse = {
  success: boolean;
  data?: {
    tz: string;
    weekStart: string; // YYYY-MM-DD
    days: { date: string; label: string; totalMinutes: number }[];
    sixWeekSummary?: {
      weekId: string;        // e.g. "2025-W41"
      start: string;         // YYYY-MM-DD
      end: string;           // YYYY-MM-DD
      totalMinutes: number;
      sessionsCount: number;
      isCurrentWeek?: boolean;
      label: string;         // e.g. "6th Jun" (from backend)
    }[];
  };
  error?: string;
};

const API_BASE =
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:4000";
const LONDON_TZ = "Europe/London";

export function useDailyStreak(userId?: string) {
  // streak
  const [streak, setStreak] = useState<number>(0);
  const [streakLoading, setStreakLoading] = useState<boolean>(!!userId);
  const [streakError, setStreakError] = useState<string | null>(null);

  const getStreak = useCallback(async () => {
    if (!userId) return;
    setStreakLoading(true);
    setStreakError(null);
    try {
      const res = await fetch(`${API_BASE}/api/get_streak/${encodeURIComponent(userId)}`);
      const json: StreakResponse = await res.json();
      if (!res.ok || !json.success || !json.data) throw new Error(json.error || `HTTP ${res.status}`);
      setStreak(json.data.dailyStreak ?? 0);
    } catch (e: any) {
      setStreakError(e?.message || "Failed to load streak");
    } finally {
      setStreakLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) getStreak();
  }, [userId, getStreak]);

  // today
  const [today, setToday] = useState<ChartDatum[]>([]);
  const [insightsLoading, setInsightsLoading] = useState<boolean>(!!userId);
  const [insightsError, setInsightsError] = useState<string | null>(null);

  const getTodayInsights = useCallback(async () => {
    if (!userId) return;
    setInsightsLoading(true);
    setInsightsError(null);
    try {
      const res = await fetch(`${API_BASE}/api/get_today_focus/${encodeURIComponent(userId)}`);
      const json: TodayResponse = await res.json();
      if (!res.ok || !json.success || !json.data || !Array.isArray(json.data.minutesByHour)) {
        throw new Error(json.error || `HTTP ${res.status}`);
      }

      const mins = json.data.minutesByHour;
      const rows: ChartDatum[] = Array.from({ length: 24 }, (_, h) => ({
        key: String(h).padStart(2, "0"),
        label: `${String(h).padStart(2, "0")}:00`,
        totalMinutes: Math.max(0, Math.floor(mins[h] ?? 0)),
      }));
      setToday(rows);
    } catch (e: any) {
      setInsightsError(e?.message || "Failed to load insights");
      setToday([]);
    } finally {
      setInsightsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) getTodayInsights();
  }, [userId, getTodayInsights]);

  // week + six weeks (same endpoint)
  const [week, setWeek] = useState<ChartDatum[]>([]);
  const [sixWeeks, setSixWeeks] = useState<ChartDatum[]>([]);
  const [weekLoading, setWeekLoading] = useState<boolean>(false);
  const [weekError, setWeekError] = useState<string | null>(null);

  const getWeekFocus = useCallback(async () => {
    if (!userId) return;
    setWeekLoading(true);
    setWeekError(null);

    try {
      const url = `${API_BASE}/api/get_week_focus/${encodeURIComponent(userId)}?tz=${encodeURIComponent(LONDON_TZ)}`;
      const res = await fetch(url);
      const json: WeekResponse = await res.json();
      if (!res.ok || !json.success || !json.data) throw new Error(json.error || `HTTP ${res.status}`);

      const weekRows: ChartDatum[] = json.data.days.map((d) => ({
        key: d.label,
        label: d.label,
        totalMinutes: Math.max(0, Math.floor(d.totalMinutes || 0)),
      }));
      setWeek(weekRows);

      const sixRows: ChartDatum[] = (json.data.sixWeekSummary ?? []).map((w) => ({
        key: w.weekId,
        label: w.label,
        totalMinutes: Math.max(0, Math.floor(w.totalMinutes || 0)),
      }));
      setSixWeeks(sixRows);
    } catch (e: any) {
      setWeekError(e?.message || "Failed to load week data");
      setWeek([]);
      setSixWeeks([]);
    } finally {
      setWeekLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      getWeekFocus();
    }
  }, [userId, getWeekFocus]);

  // expose a single page-level loading helper if you want it
  const pageLoadingAll = insightsLoading && weekLoading; // loader shows until either finishes -> parent can invert logic if desired
  const anyLoading = insightsLoading || weekLoading || streakLoading;

  return {
    // streak
    streak,
    streakLoading,
    streakError,
    refreshStreak: getStreak,

    // today
    today,
    insightsLoading,
    insightsError,
    refreshToday: getTodayInsights,

    // week + six-week
    week,
    sixWeeks,
    weekLoading,
    weekError,
    refreshWeek: getWeekFocus,

    // page-level helpers
    pageLoadingAll,
    anyLoading,
  };
}
