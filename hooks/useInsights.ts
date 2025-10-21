// hooks/useFocusData.ts
import { useState, useEffect, useCallback } from 'react';
import { useGlobalContext } from '@/lib/global-provider';
import Constants from 'expo-constants';

export interface ModeTotals {
  totalSeconds: number;
  totalMinutes: number;
  timeString: string;
}

export interface WeeklySession {
  startTime: string;
  endTime: string;
  durationSeconds?: number;
  durationMinutes?: number;
  mode?: string;
}

export interface WeeklyFocusData {
  date: string; // YYYY-MM-DD
  dayName: string; // Mon, Tue, ...
  totalMinutes: number;
  timeString: string; // "5 mins 30 secs"
  modes: Record<string, ModeTotals>;
  sessions?: WeeklySession[];
}

export interface FocusSummary {
  totalSeconds: number;
  totalMinutes: number;
  timeString: string;
  modes: Record<string, ModeTotals>;
}

interface WeeklyFocusResponse {
  success: boolean;
  data: WeeklyFocusData[];
  summary?: {
    today: FocusSummary;
    week: FocusSummary;
    lifetime: FocusSummary;
  };
  streak?: number;
  message?: string;
}

export interface MonthlyFocusEntry {
  month: string;
  label: string;
  totalSeconds: number;
  totalMinutes: number;
}

interface MonthlyFocusResponse {
  success: boolean;
  data: MonthlyFocusEntry[];
  range?: { startMonth: string | null; endMonth: string | null };
  message?: string;
}

const API_BASE_URL = Constants.expoConfig?.extra?.backendUrl as string;

export const useWeeklyFocusData = () => {
  const { userProfile } = useGlobalContext();
  const [weeklyData, setWeeklyData] = useState<WeeklyFocusData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);

  const createEmptySummary = (): FocusSummary => ({
    totalSeconds: 0,
    totalMinutes: 0,
    timeString: '0 mins 0 secs',
    modes: {},
  });

  const [summary, setSummary] = useState<{
    today: FocusSummary;
    week: FocusSummary;
    lifetime: FocusSummary;
  }>(() => ({
    today: createEmptySummary(),
    week: createEmptySummary(),
    lifetime: createEmptySummary(),
  }));

  const computeFallbackStreak = useCallback((data: WeeklyFocusData[]) => {
    const today = new Date().toISOString().split('T')[0];
    const sorted = [...data].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    let count = 0;
    for (const day of sorted) {
      if (day.date === today && (day.totalMinutes ?? 0) === 0) continue;
      if ((day.totalMinutes ?? 0) > 0) count += 1;
      else break;
    }
    return count;
  }, []);

  const fetchWeeklyFocusData = useCallback(async () => {
    if (!userProfile?.userId) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/api/get_weekly_data/${userProfile.userId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const result: WeeklyFocusResponse = await response.json();

      if (result.success) {
        const sanitizedData = result.data.map((entry) => ({
          ...entry,
          modes: entry.modes ?? {},
          sessions: Array.isArray(entry.sessions)
            ? entry.sessions
                .map((session) => ({
                  startTime: typeof session?.startTime === 'string' ? session.startTime : '',
                  endTime: typeof session?.endTime === 'string' ? session.endTime : '',
                  durationSeconds:
                    typeof session?.durationSeconds === 'number'
                      ? Math.round(session.durationSeconds)
                      : typeof session?.durationMinutes === 'number'
                      ? Math.round(session.durationMinutes * 60)
                      : undefined,
                  durationMinutes:
                    typeof session?.durationMinutes === 'number'
                      ? Math.round(session.durationMinutes)
                      : typeof session?.durationSeconds === 'number'
                      ? Math.round(session.durationSeconds / 60)
                      : undefined,
                  mode: typeof session?.mode === 'string' ? session.mode : undefined,
                }))
                .filter((s) => s.startTime && s.endTime)
            : [],
        }));
        setWeeklyData(sanitizedData);

        const sanitizeSummary = (v?: FocusSummary): FocusSummary => ({
          totalSeconds: v?.totalSeconds ?? 0,
          totalMinutes: v?.totalMinutes ?? 0,
          timeString: v?.timeString ?? '0 mins 0 secs',
          modes: v?.modes ?? {},
        });

        setSummary({
          today: sanitizeSummary(result.summary?.today),
          week: sanitizeSummary(result.summary?.week),
          lifetime: sanitizeSummary(result.summary?.lifetime),
        });

        setStreak(result.streak ?? computeFallbackStreak(sanitizedData));
      } else {
        setError(result.message || 'Failed to fetch weekly data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [userProfile?.userId, computeFallbackStreak]);

  useEffect(() => {
    fetchWeeklyFocusData();
  }, [fetchWeeklyFocusData]);

  return { weeklyData, loading, error, summary, streak, refetch: fetchWeeklyFocusData };
};

export const useMonthlyFocusSummary = () => {
  const { userProfile } = useGlobalContext();
  const [monthlyData, setMonthlyData] = useState<MonthlyFocusEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchMonthlySummary = useCallback(async () => {
    if (!userProfile?.userId) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/api/get_monthly_data/${userProfile.userId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const result: MonthlyFocusResponse = await response.json();

      if (result.success) {
        setMonthlyData(
          (result.data ?? []).map((e) => ({
            month: e.month,
            label: e.label,
            totalSeconds: e.totalSeconds ?? 0,
            totalMinutes: e.totalMinutes ?? Math.floor((e.totalSeconds ?? 0) / 60),
          }))
        );
        setHasFetched(true);
      } else {
        setError(result.message || 'Failed to fetch monthly summary');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [userProfile?.userId]);

  return { monthlyData, loading, error, hasFetched, refetch: fetchMonthlySummary };
};

// Optional helper if you still need it elsewhere
export const getLastSevenDays = (): { date: string; dayName: string }[] => {
  const days = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateString = date.toISOString().split('T')[0];
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    days.push({ date: dateString, dayName });
  }
  return days;
};
