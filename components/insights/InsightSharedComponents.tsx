import React from "react";
import { View, Text, Image } from "react-native";
import { CoralPalette } from "@/constants/colors";

// Custom PNG icons
import fireIcon from "@/assets/images/fire.png";
import clockIcon from "@/assets/images/clock.png";
import targetIcon from "@/assets/images/target.png";

// --- Constants ---
export const FONT = { fontFamily: "Nunito" };

// --- Icon Wrappers ---
export const FireIcon = ({ size = 24 }: { size?: number; color?: string }) => (
  <Image source={fireIcon} style={{ width: size, height: size }} resizeMode="contain" />
);

export const ClockIcon = ({ size = 24 }: { size?: number; color?: string }) => (
  <Image source={clockIcon} style={{ width: size, height: size }} resizeMode="contain" />
);

export const TargetIcon = ({ size = 24 }: { size?: number; color?: string }) => (
  <Image source={targetIcon} style={{ width: size, height: size }} resizeMode="contain" />
);

// --- Stat List Item ---
type StatListItemProps = {
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  label: string;
  value: string | number;
  subValue?: string;
  color: string;
  isLast?: boolean;
};

export const StatListItem = ({
  icon: Icon,
  label,
  value,
  subValue,
  color,
  isLast = false,
}: StatListItemProps) => (
  <View
    style={{
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 14,
      paddingHorizontal: 14,
      borderBottomWidth: isLast ? 0 : 1,
      borderBottomColor: CoralPalette.greyLight,
    }}
  >
    <View
      style={{
        width: 44,
        height: 44,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 14,
      }}
    >
      <Icon size={28} color={color} strokeWidth={2.5} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={[{ color: CoralPalette.dark, fontSize: 14, fontWeight: "600" }, FONT]}>
        {label}
      </Text>
      {subValue && (
        <Text style={[{ color: CoralPalette.mutedDark, fontSize: 11, marginTop: 1 }, FONT]}>
          {subValue}
        </Text>
      )}
    </View>
    <Text style={[{ color: color, fontSize: 20, fontWeight: "800" }, FONT]}>
      {value}
    </Text>
  </View>
);

// --- Week Day Bar ---
type WeekDayBarProps = {
  day: string;
  minutes: number;
  maxMinutes: number;
  isBestDay: boolean;
  color: string;
};

export const WeekDayBar = ({
  day,
  minutes,
  maxMinutes,
  isBestDay,
  color,
}: WeekDayBarProps) => {
  const percentage = maxMinutes > 0 ? (minutes / maxMinutes) * 100 : 0;

  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
      <Text
        style={[
          {
            width: 40,
            color: isBestDay ? color : CoralPalette.mutedDark,
            fontSize: 13,
            fontWeight: isBestDay ? "700" : "500",
          },
          FONT,
        ]}
      >
        {day}
      </Text>
      <View
        style={{
          flex: 1,
          height: 28,
          backgroundColor: CoralPalette.greyLight,
          borderRadius: 8,
          marginHorizontal: 10,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            width: `${Math.max(percentage, 2)}%`,
            height: "100%",
            backgroundColor: isBestDay ? color : `${color}70`,
            borderRadius: 8,
            justifyContent: "center",
            paddingLeft: 8,
          }}
        >
          {percentage > 20 && (
            <Text style={[{ color: "#fff", fontSize: 11, fontWeight: "700" }, FONT]}>
              {minutes}m
            </Text>
          )}
        </View>
      </View>
      <Text
        style={[
          {
            width: 45,
            textAlign: "right",
            color: isBestDay ? color : CoralPalette.mutedDark,
            fontSize: 13,
            fontWeight: isBestDay ? "700" : "500",
          },
          FONT,
        ]}
      >
        {minutes > 0 ? `${minutes}m` : "-"}
      </Text>
    </View>
  );
};
