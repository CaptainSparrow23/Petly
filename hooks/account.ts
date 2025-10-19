import { useState, useEffect, useCallback } from 'react';
import { useGlobalContext } from '@/lib/global-provider';
import Constants from 'expo-constants';

interface ModeTotals {
  totalSeconds: number;
  totalMinutes: number;
  timeString: string;
}

interface WeeklyFocusData {
  date: string; // YYYY-MM-DD format
  dayName: string; // Mon, Tue, Wed, etc.
  totalMinutes: number;
  timeString: string; // "5 mins 30 secs"
  modes: Record<string, ModeTotals>;
  sessions?: Array<{
    startTime: string;
    endTime: string;
    durationSeconds?: number;
    durationMinutes?: number;
    mode?: string;
  }>;
}

interface FocusSummary {
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
  message?: string;
}

interface MonthlyFocusEntry {
  month: string;
  label: string;
  totalSeconds: number;
  totalMinutes: number;
}

interface MonthlyFocusResponse {
  success: boolean;
  data: MonthlyFocusEntry[];
  range?: {
    startMonth: string | null;
    endMonth: string | null;
  };
  message?: string;
}

const API_BASE_URL = Constants.expoConfig?.extra?.backendUrl as string;

export const useWeeklyFocusData = () => {
  const { user } = useGlobalContext();
  const [weeklyData, setWeeklyData] = useState<WeeklyFocusData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  const fetchWeeklyFocusData = useCallback(async () => {
    if (!user?.$id) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/api/account/weekly-focus/${user.$id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

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
                  durationSeconds: (() => {
                    if (typeof session?.durationSeconds === 'number') {
                      return Math.round(session.durationSeconds);
                    }
                    if (typeof session?.durationMinutes === 'number') {
                      return Math.round(session.durationMinutes * 60);
                    }
                    return undefined;
                  })(),
                  durationMinutes: (() => {
                    if (typeof session?.durationMinutes === 'number') {
                      return Math.round(session.durationMinutes);
                    }
                    if (typeof session?.durationSeconds === 'number') {
                      return Math.round(session.durationSeconds / 60);
                    }
                    return undefined;
                  })(),
                  mode: typeof session?.mode === 'string' ? session.mode : undefined,
                }))
                .filter((session) => session.startTime && session.endTime)
            : [],
        }));
        setWeeklyData(sanitizedData);
        const sanitizeSummary = (value?: FocusSummary) => ({
          totalSeconds: value?.totalSeconds ?? 0,
          totalMinutes: value?.totalMinutes ?? 0,
          timeString: value?.timeString ?? '0 mins 0 secs',
          modes: value?.modes ?? {},
        });
        setSummary({
          today: sanitizeSummary(result.summary?.today),
          week: sanitizeSummary(result.summary?.week),
          lifetime: sanitizeSummary(result.summary?.lifetime),
        });
        console.log('📊 Weekly focus data loaded:', result.data);
      } else {
        setError(result.message || 'Failed to fetch weekly data');
      }
    } catch (err) {
      console.error('Error fetching weekly focus data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [user?.$id]);

  // Auto-fetch when component mounts or user changes
  useEffect(() => {
    fetchWeeklyFocusData();
  }, [fetchWeeklyFocusData]);

  return {
    weeklyData,
    loading,
    error,
    summary,
    refetch: fetchWeeklyFocusData,
  };
};

export const useMonthlyFocusSummary = () => {
  const { user } = useGlobalContext();
  const [monthlyData, setMonthlyData] = useState<MonthlyFocusEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchMonthlySummary = useCallback(async () => {
    if (!user?.$id) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/api/focus/monthly-summary/${user.$id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: MonthlyFocusResponse = await response.json();

      if (result.success) {
        setMonthlyData(
          (result.data ?? []).map((entry) => ({
            month: entry.month,
            label: entry.label,
            totalSeconds: entry.totalSeconds ?? 0,
            totalMinutes: entry.totalMinutes ?? Math.floor((entry.totalSeconds ?? 0) / 60),
          }))
        );
        setHasFetched(true);
      } else {
        setError(result.message || 'Failed to fetch monthly summary');
      }
    } catch (err) {
      console.error('Error fetching monthly focus summary:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [user?.$id]);

  return {
    monthlyData,
    loading,
    error,
    hasFetched,
    refetch: fetchMonthlySummary,
  };
};

// Helper function to get the last 7 days including today
export const getLastSevenDays = (): { date: string; dayName: string }[] => {
  const days = [];
  const today = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    
    const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' }); // Mon, Tue, etc.
    
    days.push({ date: dateString, dayName });
  }
  
  return days;
};
