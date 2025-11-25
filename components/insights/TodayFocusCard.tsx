import React, { useMemo } from "react";
import { View, Text } from "react-native";
import { useGlobalContext } from "@/lib/GlobalProvider";
import { CoralPalette } from "@/constants/colors";

const FONT = { fontFamily: "Nunito" };

const parseTimeStringToSeconds = (timeString?: string | null) => {
  if (!timeString) return 0;
  const minuteMatch = timeString.match(/(\d+)\s*min/);
  const secondMatch = timeString.match(/(\d+)\s*sec/);
  const minutes = minuteMatch ? parseInt(minuteMatch[1], 10) : 0;
  const seconds = secondMatch ? parseInt(secondMatch[1], 10) : 0;
  return minutes * 60 + seconds;
};

const truncateToSingleDecimal = (value: number) => Math.floor(value * 10) / 10;

const formatSingleUnit = (totalSeconds: number) => {
  const secs = Math.max(0, Math.floor(totalSeconds));

  if (secs >= 3600) {
    const hours = truncateToSingleDecimal(secs / 3600);
    return `${hours.toFixed(1)} hr`;
  }

  if (secs >= 60) {
    return `${Math.floor(secs / 60)} m`;
  }

  return `${secs} s`;
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

  const durationLabel = useMemo(() => formatSingleUnit(totalSeconds), [totalSeconds]);
  const statusMessage = useMemo(() => {
    if (totalSeconds < 60) return "Get back to work!";
    if (totalSeconds < 3600) return "Keep working hard!";
    if (totalSeconds < 7200) return "You're doing great!";
    if (totalSeconds < 10800) return "Amazing work today!";
    if (totalSeconds < 14400) return "Someone's a workaholic!";
    return "Maybe a break now?";
  }, [totalSeconds]);


  return (
    <View
      className="w-[65%] rounded-3xl p-5"
      style={{ backgroundColor: CoralPalette.surfaceAlt, borderColor: CoralPalette.border, borderWidth: 1 }}
    >
      <View className="items-end">
        <Text style={[{ color: CoralPalette.mutedDark, fontSize: 16 }, FONT]}>Today's Focus</Text>
       
      </View>

      <Text className="" style={[{ fontSize: 40, fontWeight: "800", color: CoralPalette.dark, textAlign: "right" }, FONT]}>
        {durationLabel}
      </Text>
      <Text className="text-right" style={[{ fontSize: 13, color: CoralPalette.primary, fontWeight: "700" }, FONT]}>
        {statusMessage}
      </Text>
    </View>
  );
}
