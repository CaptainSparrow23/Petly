import { useGlobalContext } from "@/providers/GlobalProvider";

/**
 * Hook to check if user has any unclaimed level rewards
 * Returns true if there are any levels from 1 to currentLevel that haven't been claimed
 */
export function useHasUnclaimedRewards(): boolean {
  const { userProfile } = useGlobalContext();
  const currentLevel = userProfile?.level ?? 1;
  const claimedLevelRewards: number[] = Array.isArray(userProfile?.claimedLevelRewards)
    ? (userProfile.claimedLevelRewards as number[])
    : [];

  // Check if any level from 1 to currentLevel is not in claimedLevelRewards
  for (let level = 1; level <= currentLevel; level++) {
    if (!claimedLevelRewards.includes(level)) {
      return true;
    }
  }

  return false;
}
