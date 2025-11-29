import { useCallback, useEffect, useState, useMemo } from "react";

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

type WeekResponse = {
  success: boolean;
  data?: {
    tz: string;
    weekStart: string; // YYYY-MM-DD
    days: { date: string; label: string; totalMinutes: number }[];
    currentWeekTotal?: number; // Total minutes for current week
  };
  error?: string;
};

const API_BASE =
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "https://petly-gsxb.onrender.com";
const LONDON_TZ = "Europe/London";

export function useInsights(
  userId?: string, 
  todayMinutesFromProfile?: number,
  minutesByHourFromProfile?: number[]
) {
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

  // today chart data - from profile
  const today: ChartDatum[] = useMemo(() => {
    const mins = minutesByHourFromProfile ?? Array(24).fill(0);
    return Array.from({ length: 24 }, (_, h) => ({
      key: String(h).padStart(2, "0"),
      label: `${String(h).padStart(2, "0")}:00`,
      totalMinutes: Math.max(0, Math.floor(mins[h] ?? 0)),
    }));
  }, [minutesByHourFromProfile]);

  // week + six weeks (same endpoint)
  const [week, setWeek] = useState<ChartDatum[]>([]);
  const [currentWeekTotal, setCurrentWeekTotal] = useState<number>(0);
  const [weekLoading, setWeekLoading] = useState<boolean>(false);
  const [weekError, setWeekError] = useState<string | null>(null);

  const getWeekFocus = useCallback(async (todayMins?: number | null) => {
    if (!userId) return;
    setWeekLoading(true);
    setWeekError(null);

    try {
      // Use todayMinutesFromProfile first, then fallback to parameter, then let backend calculate
      const minutesToUse = todayMinutesFromProfile ?? todayMins;
      const todayParam = minutesToUse !== undefined && minutesToUse !== null 
        ? `&todayMinutes=${encodeURIComponent(minutesToUse)}` 
        : '';
      
      const url = `${API_BASE}/api/get_week_focus/${encodeURIComponent(userId)}?tz=${encodeURIComponent(LONDON_TZ)}${todayParam}`;
      const res = await fetch(url);
      const json: WeekResponse = await res.json();
      if (!res.ok || !json.success || !json.data) throw new Error(json.error || `HTTP ${res.status}`);

      const weekRows: ChartDatum[] = json.data.days.map((d) => ({
        key: d.label,
        label: d.label,
        totalMinutes: Math.max(0, Math.floor(d.totalMinutes || 0)),
      }));
      setWeek(weekRows);
      
      setCurrentWeekTotal(json.data.currentWeekTotal ?? 0);
    } catch (e: any) {
      setWeekError(e?.message || "Failed to load week data");
      setWeek([]);
      setCurrentWeekTotal(0);
    } finally {
      setWeekLoading(false);
    }
  }, [userId, todayMinutesFromProfile]);

  // Fetch week data with today's minutes from profile
  useEffect(() => {
    if (!userId) return;
    getWeekFocus(todayMinutesFromProfile);
  }, [userId, todayMinutesFromProfile, getWeekFocus]);

  // expose a single page-level loading helper
  const anyLoading = weekLoading || streakLoading;

  return {
    // streak
    streak,
    streakLoading,
    streakError,
    refreshStreak: getStreak,

    // today (from profile)
    today,

    // week + six-week
    week,
    currentWeekTotal,
    weekLoading,
    weekError,
    refreshWeek: getWeekFocus,

    // page-level helpers
    anyLoading,
  };
}
