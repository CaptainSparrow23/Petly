import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useFocusEffect } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useGlobalContext } from '@/lib/GlobalProvider';
import { CoralPalette } from '@/constants/colors';
import images from '@/constants/images';
import Constants from 'expo-constants';

const FONT = { fontFamily: 'Nunito' };
const CARD_SHADOW = {
  shadowColor: '#191d31',
  shadowOpacity: 0.25,
  shadowOffset: { width: 3, height: 5 },
  shadowRadius: 2,
  elevation: 10,
};

const API_BASE_URL = Constants.expoConfig?.extra?.backendUrl as string | undefined;

interface GoalsCardProps {
  todayTotalMinutes?: number;
  currentWeekTotal?: number;
}

const getTodayString = (): string => new Date().toISOString().split('T')[0];

const getWeekString = (): string => {
  const date = new Date();
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
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
  const dailyRewardXp = 25;
  const weeklyRewardXp = 50;
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

  // Calculate progress values (needed before animateBars)
  const dailyProgress = Math.min(100, Math.round((todayTotalMinutes / dailyGoal) * 100));
  const weeklyProgress = Math.min(100, Math.round((currentWeekTotal / weeklyGoal) * 100));

  // Animated progress (Reanimated)
  const dailyAnim = useSharedValue(0);
  const weeklyAnim = useSharedValue(0);

  const animateBars = useCallback(() => {
    dailyAnim.value = 0;
    weeklyAnim.value = 0;
    dailyAnim.value = withTiming(dailyProgress, { duration: 500, easing: Easing.out(Easing.cubic) });
    weeklyAnim.value = withTiming(weeklyProgress, { duration: 500, easing: Easing.out(Easing.cubic) });
  }, [dailyAnim, weeklyAnim, dailyProgress, weeklyProgress]);

  useEffect(() => {
    animateBars();
  }, [animateBars]);

  useFocusEffect(
    useCallback(() => {
      animateBars();
      return () => {};
    }, [animateBars])
  );

  const claimGoalReward = async (goalType: 'daily' | 'weekly'): Promise<{ success: boolean; xp?: number }> => {
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
      if (data.success && data.data?.xpAwarded !== undefined) {
        return { success: true, xp: data.data.xpAwarded as number };
      }
      return { success: false };
    } catch {
      return { success: false };
    }
  };

  const handleClaim = async () => {
    if (claiming || !canClaim) return;
    setClaiming(true);

    let totalRewardXp = 0;

    try {
      // Claim daily if available
      if (dailyClaimable) {
        const result = await claimGoalReward('daily');
        if (result.success && result.xp !== undefined) {
          totalRewardXp += dailyRewardXp;
        }
      }

      // Claim weekly if available
      if (weeklyClaimable) {
        const result = await claimGoalReward('weekly');
        if (result.success && result.xp !== undefined) {
          totalRewardXp += weeklyRewardXp;
        }
      }

      if (totalRewardXp > 0) {
        // Optimistically mark as claimed locally
        updateUserProfile({
          lastDailyGoalClaim: dailyClaimable ? todayStr : userProfile?.lastDailyGoalClaim ?? null,
          lastWeeklyGoalClaim: weeklyClaimable ? weekStr : userProfile?.lastWeeklyGoalClaim ?? null,
        });

        // Refetch profile so XP/level updates everywhere
        refetchUserProfile?.();

        showBanner({ 
          title: 'Rewards claimed!', 
          message: `+${totalRewardXp} XP`, 
          preset: 'done', 
          haptic: 'success',
        });
      }
    } catch (error) {
      showBanner({ 
        title: 'Failed to claim', 
        message: 'Please try again', 
        preset: 'error', 
        haptic: 'error',
      });
    } finally {
      setClaiming(false);
    }
  };

  const formatMinutesLabel = (minutes: number) => {
    if (!showHours) return `${minutes} mins`;
    const hours = minutes / 60;
    if (hours >= 10) return `${hours.toFixed(0)} hrs`;
    return `${hours.toFixed(1)} hrs`;
  };

  const AnimatedProgressFill = ({ progressAnim, color }: { progressAnim: typeof dailyAnim; color: string }) => {
    const animStyle = useAnimatedStyle(() => ({
      width: `${Math.max(0, Math.min(100, progressAnim.value))}%`,
      height: '100%',
      backgroundColor: color,
      borderRadius: 999,
    }));
    return <Animated.View style={animStyle} />;
  };

  const renderProgress = (
    label: string,
    targetLabel: string,
    progressPercent: number,
    accent: string,
    rewardXp: number,
    isReached: boolean,
    isClaimed: boolean,
    progressAnim?: typeof dailyAnim
  ) => (
    <View className="mt-4">
      <View className="flex-row justify-between items-center">
        <Text style={[{ color: CoralPalette.mutedDark }, FONT]}>{label}</Text>
        <Text style={[{ color: CoralPalette.dark, fontWeight: '600' }, FONT]}>{targetLabel}</Text>
      </View>
      <View
        className="mt-2 h-2.5 w-full overflow-hidden rounded-full"
        style={{ backgroundColor: `${CoralPalette.border}55` }}
      >
        {progressAnim ? (
          <AnimatedProgressFill progressAnim={progressAnim} color={accent} />
        ) : (
          <View
            className="h-full rounded-full"
            style={{ width: `${progressPercent}%`, backgroundColor: accent }}
          />
        )}
      </View>
      <View className="mt-2 flex-row items-center justify-between">
        <Text className="text-xs" style={[{ color: CoralPalette.mutedDark }, FONT]}>
          {progressPercent}% complete
        </Text>
        <View className="relative h-6 w-16 justify-center items-end">
          {isClaimed ? (
            // Green tick when claimed - same spot as XP bubble
            <View className="absolute right-0 flex-row items-center">
              <MaterialCommunityIcons name="check" size={20} color="#22c55e" />
            </View>
          ) : (
            // XP bubble - grayed out if not reached, colored if reached
            <View className="absolute right-0 flex-row items-center">
              <View className="h-5 w-5 items-center justify-center">
                <Image
                  source={images.xp}
                  style={{ width: 14, height: 14, opacity: isReached ? 1 : 0.5 }}
                  resizeMode="contain"
                />
              </View>
              <Text
                style={[
                  {
                    color: isReached ? CoralPalette.dark : CoralPalette.mutedDark,
                    marginLeft: 6,
                    fontWeight: '600',
                    opacity: isReached ? 1 : 0.5,
                  },
                  FONT,
                ]}
              >
                {rewardXp}
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
        style={[
          { backgroundColor: CoralPalette.surfaceAlt, borderColor: CoralPalette.surfaceAlt, borderWidth: 1 },
          CARD_SHADOW,
        ]}
      >
        <View className="flex-row justify-between items-center">
          <Text style={[{ color: CoralPalette.dark, fontSize: 16, fontWeight: '700' }, FONT]}>Goals</Text>
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
                  <Text style={[{ color: CoralPalette.white, fontWeight: '600' }, FONT]}>Claim</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {renderProgress(
          'Daily focus goal',
          formatMinutesLabel(dailyGoal),
          dailyProgress,
          CoralPalette.primary,
          dailyRewardXp,
          dailyGoalReached,
          dailyClaimed,
          dailyAnim
        )}
        {renderProgress(
          'Weekly focus goal',
          formatMinutesLabel(weeklyGoal),
          weeklyProgress,
          CoralPalette.primary,
          weeklyRewardXp,
          weeklyGoalReached,
          weeklyClaimed,
          weeklyAnim
        )}
      </View>
    </>
  );
}
