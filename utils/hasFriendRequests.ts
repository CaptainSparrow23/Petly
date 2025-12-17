import { useGlobalContext } from "@/lib/GlobalProvider";
import { useFriendRequestsListener } from "@/utils/useFriendRequestsListener";

/**
 * Hook to check if user has any pending friend requests
 * Uses real-time Firestore listener for instant updates
 */
export function useHasFriendRequests(): boolean {
  const { userProfile } = useGlobalContext();
  return useFriendRequestsListener(userProfile?.userId ?? null);
}
