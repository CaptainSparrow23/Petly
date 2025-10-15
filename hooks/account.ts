import { useState, useEffect } from 'react';
import { useGlobalContext } from '@/lib/global-provider';

interface WeeklyFocusData {
  date: string; // YYYY-MM-DD format
  dayName: string; // Mon, Tue, Wed, etc.
  totalMinutes: number;
  timeString: string; // "5 mins 30 secs"
}

interface WeeklyFocusResponse {
  success: boolean;
  data: WeeklyFocusData[];
  message?: string;
}

export const useWeeklyFocusData = () => {
  const { user } = useGlobalContext();
  const [weeklyData, setWeeklyData] = useState<WeeklyFocusData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeeklyFocusData = async () => {
    if (!user?.$id) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`http://localhost:3000/api/account/weekly-focus/${user.$id}`, {
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
        setWeeklyData(result.data);
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
  };

  // Auto-fetch when component mounts or user changes
  useEffect(() => {
    fetchWeeklyFocusData();
  }, [user?.$id]);

  return {
    weeklyData,
    loading,
    error,
    refetch: fetchWeeklyFocusData,
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