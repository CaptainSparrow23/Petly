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

const formatHours = (totalSeconds: number) => {
  const hours = totalSeconds / 3600;
  if (hours >= 10) return `${hours.toFixed(0)} hrs`;
  if (hours >= 1) return `${hours.toFixed(1)} hrs`;
  return `${hours.toFixed(2)} hrs`;
};

export default function TodayFocusCard() {
  const { userProfile, appSettings } = useGlobalContext();

  // Support both correct and misspelled field names; accept number (secs) or a "Xm Ys" string.
  const raw = userProfile?.timeActiveToday ?? 0;

  const totalSeconds = useMemo(() => {
    if (typeof raw === 'number') return Math.max(0, Math.floor(raw));       // assume seconds
    if (typeof raw === 'string') return parseTimeStringToSeconds(raw);       // parse "mins / secs"
    return 0;
  }, [raw]);

  const durationLabel = useMemo(() => {
    if (!totalSeconds) return '';
    return appSettings.displayFocusInHours ? formatHours(totalSeconds) : formatDetailedDuration(totalSeconds);
  }, [totalSeconds, appSettings.displayFocusInHours]);

  return (
    <View className="w-[65%] relative rounded-2xl border border-gray-200 bg-gray-50 p-3">
      <Text className="text-m text-gray-700">Today&apos;s Focus</Text>
      <Text className="absolute bottom-2 right-3 text-3xl font-semibold text-black-300">
        {totalSeconds > 0
          ? durationLabel
          : appSettings.displayFocusInHours ? "0 hrs" : "0 mins 0 secs"}
      </Text>
    </View>
  );
}
