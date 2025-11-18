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
    sixWeekSummary?: {
      weekId: string;        // e.g. "2025-W41"
      start: string;         // YYYY-MM-DD
      end: string;           // YYYY-MM-DD
      totalMinutes: number;
      sessionsCount: number;
      isCurrentWeek?: boolean;
      label: string;         // e.g. "6th Jun" (from backend)
    }[];
    currentWeekTotal?: number; // Total minutes for current week
  };
  error?: string;
};

type GoalsResponse = {
  success: boolean;
  data?: {
    dailyGoalMinutes: number;
    weeklyGoalMinutes: number;
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
  const [sixWeeks, setSixWeeks] = useState<ChartDatum[]>([]);
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

      const sixRows: ChartDatum[] = (json.data.sixWeekSummary ?? []).map((w) => ({
        key: w.weekId,
        label: w.label,
        totalMinutes: Math.max(0, Math.floor(w.totalMinutes || 0)),
      }));
      setSixWeeks(sixRows);
      
      setCurrentWeekTotal(json.data.currentWeekTotal ?? 0);
    } catch (e: any) {
      setWeekError(e?.message || "Failed to load week data");
      setWeek([]);
      setSixWeeks([]);
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

  // goals
  const [dailyGoal, setDailyGoal] = useState<number>(120);
  const [weeklyGoal, setWeeklyGoal] = useState<number>(600);
  const [goalsLoading, setGoalsLoading] = useState<boolean>(!!userId);
  const [goalsError, setGoalsError] = useState<string | null>(null);

  const getGoals = useCallback(async () => {
    if (!userId) return;
    setGoalsLoading(true);
    setGoalsError(null);
    try {
      const res = await fetch(`${API_BASE}/api/get_goals/${encodeURIComponent(userId)}`);
      const json: GoalsResponse = await res.json();
      if (!res.ok || !json.success || !json.data) throw new Error(json.error || `HTTP ${res.status}`);
      setDailyGoal(json.data.dailyGoalMinutes);
      setWeeklyGoal(json.data.weeklyGoalMinutes);
    } catch (e: any) {
      setGoalsError(e?.message || "Failed to load goals");
    } finally {
      setGoalsLoading(false);
    }
  }, [userId]);

  const updateGoals = useCallback(async (dailyGoalMinutes: number, weeklyGoalMinutes: number) => {
    if (!userId) throw new Error("User ID is required");
    
    setGoalsLoading(true);
    setGoalsError(null);
    try {
      const res = await fetch(`${API_BASE}/api/update_goals/${encodeURIComponent(userId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dailyGoalMinutes, weeklyGoalMinutes }),
      });
      
      const json: GoalsResponse = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || `HTTP ${res.status}`);
      
      setDailyGoal(dailyGoalMinutes);
      setWeeklyGoal(weeklyGoalMinutes);
      return true;
    } catch (e: any) {
      setGoalsError(e?.message || "Failed to update goals");
      throw e;
    } finally {
      setGoalsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) getGoals();
  }, [userId, getGoals]);

  // expose a single page-level loading helper
  const anyLoading = weekLoading || streakLoading || goalsLoading;

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
    sixWeeks,
    currentWeekTotal,
    weekLoading,
    weekError,
    refreshWeek: getWeekFocus,

    // goals
    dailyGoal,
    weeklyGoal,
    goalsLoading,
    goalsError,
    updateGoals,
    refreshGoals: getGoals,

    // page-level helpers
    anyLoading,
  };
}
