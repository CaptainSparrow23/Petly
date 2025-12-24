import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useFocusEffect } from 'expo-router';
import { Check, Gift } from 'lucide-react-native';
import { useGlobalContext } from '@/providers/GlobalProvider';
import { CoralPalette } from '@/constants/colors';
import Constants from 'expo-constants';

const FONT = { fontFamily: 'Nunito' };

const API_BASE_URL = Constants.expoConfig?.extra?.backendUrl as string | undefined;

// Animated circle component
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

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

// Circle Progress Ring Component
const CircleProgress = ({
  progress,
  size,
  strokeWidth,
  progressColor,
  backgroundColor,
}: {
  progress: { value: number };
  size: number;
  strokeWidth: number;
  progressColor: string;
  backgroundColor: string;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const animatedProps = useAnimatedProps(() => {
    const clampedProgress = Math.min(100, Math.max(0, progress.value));
    const strokeDashoffset = circumference * (1 - clampedProgress / 100);
    return {
      strokeDashoffset,
    };
  });

  return (
    <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
      {/* Background circle */}
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={backgroundColor}
        strokeWidth={strokeWidth}
        fill="none"
      />
      {/* Progress circle */}
      <AnimatedCircle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={progressColor}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        animatedProps={animatedProps}
        strokeLinecap="round"
      />
    </Svg>
  );
};

// Single Goal Card Component
const GoalCard = ({
  title,
  subtitle,
  targetMinutes,
  currentMinutes,
  rewardXp,
  isClaimable,
  isClaimed,
  isReached,
  progressColor,
  progressBgColor,
  cardBgColor,
  onClaim,
  claiming,
  showHours,
}: {
  title: string;
  subtitle: string;
  targetMinutes: number;
  currentMinutes: number;
  rewardXp: number;
  isClaimable: boolean;
  isClaimed: boolean;
  isReached: boolean;
  progressColor: string;
  progressBgColor: string;
  cardBgColor: string;
  onClaim: () => void;
  claiming: boolean;
  showHours: boolean;
}) => {
  const progressValue = useSharedValue(0);
  const progress = Math.min(100, Math.round((currentMinutes / targetMinutes) * 100));

  const animateProgress = useCallback(() => {
    progressValue.value = 0;
    progressValue.value = withTiming(progress, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, progressValue]);

  useEffect(() => {
    animateProgress();
  }, [animateProgress]);

  useFocusEffect(
    useCallback(() => {
      animateProgress();
      return () => {};
    }, [animateProgress])
  );

  const formatTarget = () => {
    if (showHours) {
      const hours = targetMinutes / 60;
      return hours >= 1 ? `${hours.toFixed(hours % 1 === 0 ? 0 : 1)}h` : `${targetMinutes}m`;
    }
    return `${targetMinutes}m`;
  };

  const CIRCLE_SIZE = 110;
  const STROKE_WIDTH = 12;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: cardBgColor,
        borderRadius: 20,
        padding: 18,
        alignItems: 'center',
        position: 'relative',
        borderWidth: 1,
        borderColor: `${progressColor}25`,
        shadowColor: progressColor,
        shadowOpacity: 0.15,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 12,
        elevation: 8,
      }}
    >
      {/* Green tick badge when claimed */}
      {isClaimed && (
        <View
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: '#22c55e',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            shadowColor: '#22c55e',
            shadowOpacity: 0.4,
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 4,
            elevation: 4,
          }}
        >
          <Check size={16} color="#fff" strokeWidth={3} />
        </View>
      )}

      {/* Claimable notification dot */}
      {isClaimable && !isClaimed && (
        <View
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            width: 16,
            height: 16,
            borderRadius: 8,
            backgroundColor: '#FF3B30',
            zIndex: 10,
            shadowColor: '#FF3B30',
            shadowOpacity: 0.5,
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 4,
            elevation: 4,
          }}
        />
      )}

      {/* Title */}
      <Text
        style={[
          {
            color: progressColor,
            fontSize: 12,
            fontWeight: '700',
            letterSpacing: 0.5,
            textTransform: 'uppercase',
          },
          FONT,
        ]}
      >
        {title}
      </Text>

      {/* Subtitle */}
      <Text
        style={[
          {
            color: CoralPalette.mutedDark,
            fontSize: 11,
            marginTop: 2,
            marginBottom: 14,
          },
          FONT,
        ]}
      >
        {subtitle}
      </Text>

      {/* Circular Progress */}
      <View style={{ position: 'relative', width: CIRCLE_SIZE, height: CIRCLE_SIZE }}>
        <CircleProgress
          progress={progressValue}
          size={CIRCLE_SIZE}
          strokeWidth={STROKE_WIDTH}
          progressColor={progressColor}
          backgroundColor={progressBgColor}
        />

        {/* Center Content */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isClaimable && !isClaimed ? (
            // Claim button in center
            <TouchableOpacity
              onPress={onClaim}
              disabled={claiming}
              style={{
                backgroundColor: progressColor,
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 16,
                shadowColor: progressColor,
                shadowOpacity: 0.4,
                shadowOffset: { width: 0, height: 3 },
                shadowRadius: 6,
                elevation: 6,
              }}
            >
              {claiming ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Gift size={14} color="#fff" />
                  <Text style={[{ color: '#fff', fontWeight: '800', fontSize: 13 }, FONT]}>
                    Claim
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ) : (
            // Percentage display
            <Text
              style={[
                {
                  color: progressColor,
                  fontSize: 28,
                  fontWeight: '800',
                },
                FONT,
              ]}
            >
              {progress}%
            </Text>
          )}
        </View>
      </View>

      {/* XP Reward */}
      <View
        style={{
          marginTop: 14,
          opacity: isReached || isClaimed ? 1 : 0.5,
        }}
      >
        <View
          style={{
            backgroundColor: isClaimed ? '#22c55e' : `${progressColor}20`,
            paddingHorizontal: 12,
            paddingVertical: 5,
            borderRadius: 12,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Text
            style={[
              {
                color: isClaimed ? '#fff' : progressColor,
                fontSize: 12,
                fontWeight: '800',
              },
              FONT,
            ]}
          >
            +{rewardXp} XP
          </Text>
        </View>
      </View>
    </View>
  );
};

export default function GoalsCard({
  todayTotalMinutes = 0,
  currentWeekTotal = 0,
}: GoalsCardProps) {
  const { appSettings, updateUserProfile, userProfile, showBanner, refetchUserProfile } =
    useGlobalContext();
  const [claimingDaily, setClaimingDaily] = useState(false);
  const [claimingWeekly, setClaimingWeekly] = useState(false);

  const dailyGoal = 60;
  const weeklyGoal = 300;
  const dailyRewardXp = 25;
  const weeklyRewardXp = 50;
  const showHours = appSettings.displayFocusInHours;

  // Check if goals are reached
  const dailyGoalReached = todayTotalMinutes >= dailyGoal;
  const weeklyGoalReached = currentWeekTotal >= weeklyGoal;

  // Check if already claimed
  const todayStr = getTodayString();
  const weekStr = getWeekString();
  const dailyClaimed = userProfile?.lastDailyGoalClaim === todayStr;
  const weeklyClaimed = userProfile?.lastWeeklyGoalClaim === weekStr;

  // Determine claimable status
  const dailyClaimable = dailyGoalReached && !dailyClaimed;
  const weeklyClaimable = weeklyGoalReached && !weeklyClaimed;

  const claimGoalReward = async (
    goalType: 'daily' | 'weekly'
  ): Promise<{ success: boolean; xp?: number }> => {
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

  const handleClaimDaily = async () => {
    if (claimingDaily || !dailyClaimable) return;
    setClaimingDaily(true);

    try {
      const result = await claimGoalReward('daily');
      if (result.success) {
        updateUserProfile({
          lastDailyGoalClaim: todayStr,
        });
        refetchUserProfile?.();
        showBanner({
          title: 'Daily goal claimed!',
          message: `+${dailyRewardXp} XP`,
          preset: 'done',
          haptic: 'success',
        });
      }
    } catch {
      showBanner({
        title: 'Failed to claim',
        message: 'Please try again',
        preset: 'error',
        haptic: 'error',
      });
    } finally {
      setClaimingDaily(false);
    }
  };

  const handleClaimWeekly = async () => {
    if (claimingWeekly || !weeklyClaimable) return;
    setClaimingWeekly(true);

    try {
      const result = await claimGoalReward('weekly');
      if (result.success) {
        updateUserProfile({
          lastWeeklyGoalClaim: weekStr,
        });
        refetchUserProfile?.();
        showBanner({
          title: 'Weekly goal claimed!',
          message: `+${weeklyRewardXp} XP`,
          preset: 'done',
          haptic: 'success',
        });
      }
    } catch {
      showBanner({
        title: 'Failed to claim',
        message: 'Please try again',
        preset: 'error',
        haptic: 'error',
      });
    } finally {
      setClaimingWeekly(false);
    }
  };

  return (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      {/* Daily Goal Card - Green theme */}
      <GoalCard
        title="Daily Goal"
        subtitle="Focus 1 hour today"
        targetMinutes={dailyGoal}
        currentMinutes={todayTotalMinutes}
        rewardXp={dailyRewardXp}
        isClaimable={dailyClaimable}
        isClaimed={dailyClaimed}
        isReached={dailyGoalReached}
        progressColor={CoralPalette.green}
        progressBgColor="#E8F5E9"
        cardBgColor="#FAFFFE"
        onClaim={handleClaimDaily}
        claiming={claimingDaily}
        showHours={showHours}
      />

      {/* Weekly Goal Card - Purple theme */}
      <GoalCard
        title="Weekly Goal"
        subtitle="Focus 5 hours this week"
        targetMinutes={weeklyGoal}
        currentMinutes={currentWeekTotal}
        rewardXp={weeklyRewardXp}
        isClaimable={weeklyClaimable}
        isClaimed={weeklyClaimed}
        isReached={weeklyGoalReached}
        progressColor={CoralPalette.purple}
        progressBgColor="#F3E8FF"
        cardBgColor="#FDFAFF"
        onClaim={handleClaimWeekly}
        claiming={claimingWeekly}
        showHours={showHours}
      />
    </View>
  );
}
