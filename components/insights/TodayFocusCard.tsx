import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { useGlobalContext } from '@/lib/global-provider';

const parseTimeStringToSeconds = (timeString?: string | null) => {
  if (!timeString) return 0;
  const minuteMatch = timeString.match(/(\d+)\s*min/);
  const secondMatch = timeString.match(/(\d+)\s*sec/);
  const minutes = minuteMatch ? parseInt(minuteMatch[1], 10) : 0;
  const seconds = secondMatch ? parseInt(secondMatch[1], 10) : 0;
  return minutes * 60 + seconds;
};

const formatDetailedDuration = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours} hr${hours === 1 ? '' : 's'}`);
  if (minutes > 0) parts.push(`${minutes} min${minutes === 1 ? '' : 's'}`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds} sec${seconds === 1 ? '' : 's'}`);
  return parts.join(' ');
};

export default function TodayFocusCard() {
  const { userProfile } = useGlobalContext();

  // Support both correct and misspelled field names; accept number (secs) or a "Xm Ys" string.
  const raw = userProfile?.timeActiveToday ?? 0;

  const totalSeconds = useMemo(() => {
    if (typeof raw === 'number') return Math.max(0, Math.floor(raw));       // assume seconds
    if (typeof raw === 'string') return parseTimeStringToSeconds(raw);       // parse "mins / secs"
    return 0;
  }, [raw]);

  const durationLabel = useMemo(() => (totalSeconds ? formatDetailedDuration(totalSeconds) : ''), [totalSeconds]);

  return (
    <View className="flex-[2.5] rounded-2xl border border-gray-200 bg-white p-4">
      <Text className="text-sm font-rubik-medium text-gray-500">Today&apos;s Focus</Text>
      {totalSeconds > 0 ? (
        <>
          <Text className="mt-3 text-3xl font-rubik-bold text-blue-600">{durationLabel}</Text>
          <Text className="mt-2 text-xs text-gray-400">Total focused time across all modes today</Text>
        </>
      ) : (
        <>
          <Text className="mt-3 text-3xl font-rubik-bold text-blue-600">0 mins 0 secs</Text>
          <Text className="mt-3 text-sm text-gray-500">No focus sessions logged yet today</Text>
        </>
      )}
    </View>
  );
}
