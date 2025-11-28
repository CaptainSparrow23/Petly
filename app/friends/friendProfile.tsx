import React, { useCallback, useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";
import { router, useLocalSearchParams } from "expo-router";
import Constants from "expo-constants";
import { ProfilePicture } from "@/components/other/ProfilePicture";
import { CoralPalette } from "@/constants/colors";

const API_BASE_URL = Constants.expoConfig?.extra?.backendUrl as string;
const FONT = { fontFamily: "Nunito" };

export default function FriendProfile() {
  const { userId } = useLocalSearchParams<{ userId?: string }>();
  const [profile, setProfile] = useState<any>(null);

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

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: CoralPalette.surface }}>
      <View className="flex-row items-center justify-between px-4 py-4">
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={24} color={CoralPalette.dark} />
        </TouchableOpacity>
        <Text className="text-[17px] ml-4 font-bold" style={[{ color: CoralPalette.dark }, FONT]}>
          Profile
        </Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
      >
        <View
          className="rounded-3xl px-8 py-8 mt-16 shadow-sm"
          style={{ backgroundColor: CoralPalette.surfaceAlt, borderColor: CoralPalette.border, borderWidth: 1 }}
        >
          <View className="items-center">
            <View className="-mt-24">
              <View
                className="relative rounded-full overflow-hidden border-4 border-white"
                style={{ width: 120, height: 120 }}
              >
                <ProfilePicture profileId={profile?.profileId || 1} size={120} />
              </View>
            </View>
            <Text className="mt-1 text-2xl font-bold" style={[{ color: CoralPalette.dark }, FONT]}>
              {profile?.displayName || "Petly Explorer"}
            </Text>
            <Text className="mt-2 text-lg" style={[{ color: CoralPalette.mutedDark }, FONT]}>
              @{profile?.username || "not set"}
            </Text>
          </View>

          <View className="flex-row items-center justify-between mt-6">
            <View className="flex-1 items-center justify-center">
              <Text className="text-base" style={[{ color: CoralPalette.dark }, FONT]}>
                Highest Streak
              </Text>
              <Text className="mt-2 text-4xl font-bold" style={[{ color: CoralPalette.primary }, FONT]}>
                {`${profile?.highestStreak ?? 0}`}
              </Text>
            </View>
            <View className="flex-1 items-center justify-center">
              <Text className="text-base" style={[{ color: CoralPalette.dark }, FONT]}>
                Total Focus Hours
              </Text>
              <Text className="mt-2 text-4xl font-bold" style={[{ color: CoralPalette.primary }, FONT]}>
                {((profile?.totalFocusSeconds ?? 0) / 3600).toFixed(0)}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};


