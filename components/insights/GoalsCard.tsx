import React, { useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useGlobalContext } from "@/lib/GlobalProvider";
import { CoralPalette } from "@/constants/colors";
import Constants from "expo-constants";

const API_BASE_URL = Constants.expoConfig?.extra?.backendUrl as string;
const FONT = { fontFamily: "Nunito" };

interface GoalsCardProps {
  todayTotalMinutes?: number;
  currentWeekTotal?: number;
}

// Helper to get today's date in YYYY-MM-DD format
const getTodayString = (): string => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

// Helper to get current ISO week string (YYYY-Www)
const getWeekString = (): string => {
  const d = new Date();
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
};

export default function GoalsCard({
  todayTotalMinutes = 0,
  currentWeekTotal = 0,
}: GoalsCardProps) {
  const { appSettings, updateUserProfile, userProfile, showBanner, refetchUserProfile } = useGlobalContext();
  const [claiming, setClaiming] = useState(false);
  
  const dailyGoal = 60;
  const weeklyGoal = 300;
  const dailyReward = 25;
  const weeklyReward = 50;
  const showHours = appSettings.displayFocusInHours;

  // Check if goals are reached
  const dailyGoalReached = todayTotalMinutes >= dailyGoal;
  const weeklyGoalReached = currentWeekTotal >= weeklyGoal;

  // Check if already claimed (comparing dates/weeks)
  const todayStr = getTodayString();
  const weekStr = getWeekString();
  const dailyClaimed = userProfile?.lastDailyGoalClaim === todayStr;
  const weeklyClaimed = userProfile?.lastWeeklyGoalClaim === weekStr;

  // Determine claimable status
  const dailyClaimable = dailyGoalReached && !dailyClaimed;
  const weeklyClaimable = weeklyGoalReached && !weeklyClaimed;
  const canClaim = dailyClaimable || weeklyClaimable;

  const claimGoalReward = async (goalType: 'daily' | 'weekly'): Promise<{ success: boolean; coins?: number }> => {
    if (!userProfile?.userId || !API_BASE_URL) {
      return { success: false };
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/claim_goal_reward/${userProfile.userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalType }),
      });
      const data = await response.json();
      if (data.success && data.data?.coins !== undefined) {
        return { success: true, coins: data.data.coins };
      }
      return { success: false };
    } catch {
      return { success: false };
    }
  };

  const handleClaim = async () => {
    if (claiming || !canClaim) return;
    setClaiming(true);

    let totalReward = 0;
    let newCoins = userProfile?.coins ?? 0;

    try {
      // Claim daily if available
      if (dailyClaimable) {
        const result = await claimGoalReward('daily');
        if (result.success && result.coins !== undefined) {
          totalReward += dailyReward;
          newCoins = result.coins;
        }
      }

      // Claim weekly if available
      if (weeklyClaimable) {
        const result = await claimGoalReward('weekly');
        if (result.success && result.coins !== undefined) {
          totalReward += weeklyReward;
          newCoins = result.coins;
        }
      }

      if (totalReward > 0) {
        // Update local state optimistically
        updateUserProfile({
          coins: newCoins,
          lastDailyGoalClaim: dailyClaimable ? todayStr : userProfile?.lastDailyGoalClaim ?? null,
          lastWeeklyGoalClaim: weeklyClaimable ? weekStr : userProfile?.lastWeeklyGoalClaim ?? null,
        });
        showBanner({ 
          title: "Rewards claimed!", 
          message: `+${totalReward} coins`, 
          preset: "done", 
          haptic: "success" 
        });
      }
    } catch (error) {
      showBanner({ 
        title: "Failed to claim", 
        message: "Please try again", 
        preset: "error", 
        haptic: "error" 
      });
    } finally {
      setClaiming(false);
    }
  };

  const dailyProgress = Math.min(100, Math.round((todayTotalMinutes / dailyGoal) * 100));
  const weeklyProgress = Math.min(100, Math.round((currentWeekTotal / weeklyGoal) * 100));

  const formatMinutesLabel = (minutes: number) => {
    if (!showHours) return `${minutes} mins`;
    const hours = minutes / 60;
    if (hours >= 10) return `${hours.toFixed(0)} hrs`;
    return `${hours.toFixed(1)} hrs`;
  };

  const renderProgress = (
    label: string,
    targetLabel: string,
    progressPercent: number,
    accent: string,
    rewardCoins: number,
    isReached: boolean,
    isClaimed: boolean
  ) => (
    <View className="mt-4">
      <View className="flex-row justify-between items-center">
        <Text style={[{ color: CoralPalette.mutedDark }, FONT]}>{label}</Text>
        <Text style={[{ color: CoralPalette.dark, fontWeight: "600" }, FONT]}>{targetLabel}</Text>
      </View>
      <View
        className="mt-2 h-2.5 w-full overflow-hidden rounded-full"
        style={{ backgroundColor: `${CoralPalette.border}55` }}
      >
        <View
          className="h-full rounded-full"
          style={{ width: `${progressPercent}%`, backgroundColor: accent }}
        />
      </View>
      <View className="mt-2 flex-row items-center justify-between">
        <Text className="text-xs" style={[{ color: CoralPalette.mutedDark }, FONT]}>
          {progressPercent}% complete
        </Text>
        <View className="relative h-6 w-16 justify-center items-end">
          {isClaimed ? (
            // Green tick when claimed - same spot as coin bubble
            <View className="absolute right-0 flex-row items-center">

                <MaterialCommunityIcons name="check" size={20} color="#22c55e" />
              </View>
      
          ) : (
            // Coin bubble - grayed out if not reached, colored if reached
            <View className="absolute right-0 flex-row items-center">
              <View
                className="h-5 w-5 items-center justify-center rounded-full"
                style={{ 
                  backgroundColor: isReached ? CoralPalette.coinBg : CoralPalette.border,
                  opacity: isReached ? 1 : 0.5,
                }}
              >
                <MaterialCommunityIcons 
                  name="heart" 
                  size={10} 
                  color={isReached ? CoralPalette.coinIcon : CoralPalette.mutedDark} 
                />
              </View>
              <Text 
                style={[
                  { 
                    color: isReached ? CoralPalette.dark : CoralPalette.mutedDark, 
                    marginLeft: 6, 
                    fontWeight: "600",
                    opacity: isReached ? 1 : 0.5
                  }, 
                  FONT
                ]}
              >
                {rewardCoins}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <>
      <View
        className="rounded-3xl p-5 mt-2"
        style={{ backgroundColor: CoralPalette.surfaceAlt, borderColor: CoralPalette.border, borderWidth: 1 }}
      >
        <View className="flex-row justify-between items-center">
          <Text style={[{ color: CoralPalette.dark, fontSize: 16, fontWeight: "700" }, FONT]}>Goals</Text>
          <View className="min-w-[70px] h-[30px]">
            {canClaim && (
              <TouchableOpacity
                onPress={handleClaim}
                disabled={claiming}
                className="rounded-full px-4 py-1.5 items-center justify-center h-full"
                style={{ backgroundColor: CoralPalette.primary }}
              >
                {claiming ? (
                  <ActivityIndicator size="small" color={CoralPalette.white} style={{ height: 18 }} />
                ) : (
                  <Text style={[{ color: CoralPalette.white, fontWeight: "600" }, FONT]}>Claim</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {renderProgress(
          "Daily focus goal", 
          formatMinutesLabel(dailyGoal), 
          dailyProgress, 
          CoralPalette.primary, 
          dailyReward,
          dailyGoalReached,
          dailyClaimed
        )}
        {renderProgress(
          "Weekly focus goal", 
          formatMinutesLabel(weeklyGoal), 
          weeklyProgress, 
          CoralPalette.primaryMuted, 
          weeklyReward,
          weeklyGoalReached,
          weeklyClaimed
        )}
      </View>
    </>
  );
}
