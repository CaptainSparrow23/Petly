import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { useGlobalContext } from '@/lib/GlobalProvider';

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
    <View className="w-[60%] relative rounded-2xl border border-gray-200 bg-gray-50 p-3">
      <Text className="text-m text-gray-700">Today's Focus</Text>
      {totalSeconds > 0 ? (
          <Text className="absolute bottom-2 right-3 text-3xl font-semibold font-rubik-bold text-blue-600">{durationLabel}</Text>
      ) : (
          <Text className="absolute bottom-2 right-3 text-3xl font-semibold font-rubik-bold text-blue-600">0 mins 0 secs</Text>
      )}
    </View>
  );
}
