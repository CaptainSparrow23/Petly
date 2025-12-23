import React, { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";
import { router, useLocalSearchParams } from "expo-router";
import Constants from "expo-constants";
import Svg, { Path } from "react-native-svg";
import { ProfilePicture } from "@/components/other/ProfilePicture";
import { CoralPalette } from "@/constants/colors";
import { useGlobalContext } from "@/lib/GlobalProvider";

const API_BASE_URL = Constants.expoConfig?.extra?.backendUrl as string;
const FONT = { fontFamily: "Nunito" };

const CARD_SHADOW = {
  shadowColor: "#000",
  shadowOpacity: 0.12,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 4 },
  elevation: 3,
};

const DropdownBadge = ({
  labelBottom,
  top,
  labelTop,
  width = 60,
  height = 70,
  fontSize = 18,
  smallFontSize = 11,
}: {
  labelBottom: string;
  labelTop: string;
  width?: number;
  height?: number;
  fontSize?: number;
  smallFontSize?: number;
  top: number;
}) => {
  const rectH = Math.max(24, Math.max(32, height - 16));
  const pointY = height;
  const midX = width / 2;

  return (
    <View
      style={{ position: "absolute", top: 0, right: 20, alignSelf: "center" }}
    >
      <View
        style={{
          width,
          height,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          <Path
            d={`M 0 0 L ${width} 0 L ${width} ${rectH} L ${midX} ${pointY} L 0 ${rectH} Z`}
            fill={CoralPalette.primaryMuted}
          />
        </Svg>
        <View
          style={{
            position: "absolute",
            top: top,
            alignItems: "center",
          }}
        >
          <Text
            className="font-bold"
            style={[
              FONT,
              {
                fontSize,
                color: CoralPalette.surface,
                lineHeight: fontSize + 2,
                fontWeight: "800",
              },
            ]}
          >
            {labelTop}
          </Text>
          <Text
            style={[
              FONT,
              {
                fontSize: smallFontSize,
                color: CoralPalette.surfaceAlt,
                marginTop: 1,
                fontWeight: "600",
              },
            ]}
          >
            {labelBottom}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default function FriendProfile() {
  const { userId } = useLocalSearchParams<{ userId?: string }>();
  const [profile, setProfile] = useState<any>(null);
  const [removing, setRemoving] = useState(false);
  const { userProfile, showBanner } = useGlobalContext();

  console.log("[FriendProfile] Mounted with userId:", userId);

  const fetchProfile = useCallback(async () => {
    console.log("[FriendProfile] fetchProfile called, userId:", userId);
    if (!userId) {
      return;
    }
    try {
      const url = `${API_BASE_URL}/api/get_user_profile/${userId}`;
      console.log("[FriendProfile] Fetching:", url);
      const res = await fetch(url);
      const json = await res.json();
      console.log("[FriendProfile] Response:", json);
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "Failed to load profile");
      }
      setProfile(json.data);
    } catch (err) {
      console.error("[FriendProfile] Error:", err);
    }
  }, [userId]);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  const handleRemoveFriend = useCallback(async () => {
    if (!userProfile?.userId || !userId) return;
    setRemoving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/friends/remove`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userProfile.userId, friendId: userId }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "Failed to remove friend");
      }
      showBanner?.({
        title: "Friend removed",
        preset: "done",
        haptic: "success",
      });
      router.back();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to remove friend";
      Alert.alert("Error", message);
      showBanner?.({
        title: message,
        preset: "error",
        haptic: "error",
      });
    } finally {
      setRemoving(false);
    }
  }, [showBanner, userId, userProfile?.userId]);

  const totalFocusHours = ((profile?.totalFocusSeconds ?? 0) / 3600).toFixed(0);

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: CoralPalette.greyLighter }}>
      {/* Header with primaryMuted background */}
      <View style={{ backgroundColor: CoralPalette.primaryMuted }}>
        <View className="flex-row items-center justify-between px-4 py-4">
          <TouchableOpacity 
            onPress={() => router.back()}
            style={{ width: 70 }}
          >
            <ChevronLeft size={24} color={CoralPalette.white} />
          </TouchableOpacity>
          <Text className="text-[17px] font-bold" style={[{ color: CoralPalette.white }, FONT]}>
            Profile
          </Text>
          <TouchableOpacity
            disabled={removing}
            onPress={handleRemoveFriend}
            style={{
              width: 70,
              alignItems: "flex-end",
              opacity: removing ? 0.7 : 1,
            }}
          >
            <Text style={[{ fontSize: 14, color: CoralPalette.white, fontWeight: "700" }, FONT]}>
              Remove
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
      >
        {/* Profile Card */}
        <View
          className="rounded-2xl mt-16"
          style={[{ backgroundColor: CoralPalette.white }, CARD_SHADOW]}
        >
          {/* Today's Focus Badge */}
          <DropdownBadge
            labelTop={`${profile?.timeActiveTodayMinutes ?? 0}m`}
            labelBottom="today"
            width={50}
            height={65}
            fontSize={15}
            smallFontSize={11}
            top={10}
          />

          {/* Profile Info */}
          <View className="items-center px-6 pt-6 pb-5">
            <View className="-mt-20">
              <View
                className="rounded-full overflow-hidden border-4"
                style={{ width: 100, height: 100, borderColor: CoralPalette.white }}
              >
                <ProfilePicture profileId={profile?.profileId || 1} size={100} />
              </View>
            </View>
            <Text className="mt-3 text-xl font-bold" style={[{ color: CoralPalette.dark }, FONT]}>
              {profile?.displayName || "Petly Explorer"}
            </Text>
            {profile?.username && (
              <Text className="mt-1 text-sm" style={[{ color: CoralPalette.mutedDark }, FONT]}>
                @{profile.username}
              </Text>
            )}
          </View>

          {/* Stats Row - inside the same card */}
          <View 
            className="flex-row border-t mx-4 pt-4 pb-4"
            style={{ borderColor: CoralPalette.greyLight }}
          >
            {/* Streak */}
            <View className="flex-1 items-center">
              <Text className="text-sm font-semibold" style={[{ color: CoralPalette.mutedDark }, FONT]}>
                Highest Streak
              </Text>
              <Text className="mt-1 text-3xl font-bold" style={[{ color: CoralPalette.primary }, FONT]}>
                {profile?.highestStreak ?? 0}
              </Text>
              <Text className="text-xs" style={[{ color: CoralPalette.mutedDark }, FONT]}>
                days
              </Text>
            </View>

            {/* Divider */}
            <View style={{ width: 1, backgroundColor: CoralPalette.greyLight }} />

            {/* Focus Hours */}
            <View className="flex-1 items-center">
              <Text className="text-sm font-semibold" style={[{ color: CoralPalette.mutedDark }, FONT]}>
                Total Focus
              </Text>
              <Text className="mt-1 text-3xl font-bold" style={[{ color: CoralPalette.primary }, FONT]}>
                {totalFocusHours}
              </Text>
              <Text className="text-xs" style={[{ color: CoralPalette.mutedDark }, FONT]}>
                hours
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
