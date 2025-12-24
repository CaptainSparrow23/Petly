import { useHasFriendRequests } from '@/utils/hasFriendRequests';
import { useHasUnclaimedRewards } from '@/utils/hasUnclaimedRewards';
import { useHasClaimableGoals } from '@/utils/hasClaimableGoals';

/**
 * Centralized notifications hook
 * Combines all notification types into a single hook for convenience
 * Individual hooks are still available for granular access when needed
 * 
 * @param currentRoute - Optional current route name to filter out notifications 
 *                       for the page the user is currently on
 */
export interface NotificationState {
  friendRequests: boolean;
  unclaimedRewards: boolean;
  claimableGoals: boolean;
  hasAny: boolean; // Convenience: true if any notification exists (filtered by current route)
}

export function useNotifications(currentRoute?: string): NotificationState {
  const friendRequests = useHasFriendRequests();
  const unclaimedRewards = useHasUnclaimedRewards();
  const claimableGoals = useHasClaimableGoals();

  // Filter out notifications for the current page
  // Routes are in format: "tabs/friends", "account/progress-map", "tabs/insights"
  const isOnFriendsPage = currentRoute && (
    currentRoute.includes('friends') && 
    !currentRoute.includes('friendProfile') // Don't filter on friend profile pages
  );
  const isOnProgressMapPage = currentRoute?.includes('progress-map') ?? false;
  const isOnInsightsPage = currentRoute?.includes('insights') ?? false;
  
  const filteredFriendRequests = isOnFriendsPage ? false : friendRequests;
  const filteredUnclaimedRewards = isOnProgressMapPage ? false : unclaimedRewards;
  const filteredClaimableGoals = isOnInsightsPage ? false : claimableGoals;

  return {
    friendRequests: filteredFriendRequests,
    unclaimedRewards: filteredUnclaimedRewards,
    claimableGoals: filteredClaimableGoals,
    hasAny: filteredFriendRequests || filteredUnclaimedRewards || filteredClaimableGoals,
  };
}
