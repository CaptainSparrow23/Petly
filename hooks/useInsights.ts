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

const API_BASE =
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:4000";

export function useDailyStreak(userId?: string) {
  const [streak, setStreak] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(!!userId);
  const [error, setError] = useState<string | null>(null);

  // --------------------- 1️⃣ FETCH DAILY STREAK ---------------------
  const getStreak = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/get_streak/${encodeURIComponent(userId)}`);
      const json: StreakResponse = await res.json();
      if (!res.ok || !json.success || !json.data) {
        throw new Error(json.error || `HTTP ${res.status}`);
      }
      setStreak(json.data.dailyStreak ?? 0);
    } catch (e: any) {
      setError(e?.message || "Failed to load streak");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) getStreak();
  }, [userId, getStreak]);

  // --------------------- 2️⃣ FETCH TODAY INSIGHTS ---------------------
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

  // --------------------- RETURN COMBINED STATE ---------------------
  return {
    // streak data
    streak,
    loading,
    error,
    refreshStreak: getStreak,

    // today insights data
    today,
    insightsLoading,
    insightsError,
    refreshToday: getTodayInsights,
  };
}
