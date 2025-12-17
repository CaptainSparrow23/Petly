import { useGlobalContext } from "@/lib/GlobalProvider";
import { useInsights } from "@/hooks/useInsights";

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

/**
 * Hook to check if user has any claimable goal rewards (daily or weekly)
 * Returns true if there are goals that have been reached but not yet claimed
 */
export function useHasClaimableGoals(): boolean {
  const { userProfile } = useGlobalContext();
  const userId = String(userProfile?.userId || "");
  const todayMinutesFromProfile = userProfile?.timeActiveTodayMinutes ?? 0;
  const minutesByHourFromProfile = userProfile?.minutesByHour ?? Array(24).fill(0);

  const { currentWeekTotal } = useInsights(userId, todayMinutesFromProfile, minutesByHourFromProfile);

  const dailyGoal = 60;
  const weeklyGoal = 300;
  
  // Check if goals are reached
  const dailyGoalReached = todayMinutesFromProfile >= dailyGoal;
  const weeklyGoalReached = currentWeekTotal >= weeklyGoal;

  // Check if already claimed
  const todayStr = getTodayString();
  const weekStr = getWeekString();
  const dailyClaimed = userProfile?.lastDailyGoalClaim === todayStr;
  const weeklyClaimed = userProfile?.lastWeeklyGoalClaim === weekStr;

  // Determine claimable status
  const dailyClaimable = dailyGoalReached && !dailyClaimed;
  const weeklyClaimable = weeklyGoalReached && !weeklyClaimed;
  
  return dailyClaimable || weeklyClaimable;
}
