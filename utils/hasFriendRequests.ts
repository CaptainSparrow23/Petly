import { useGlobalContext } from "@/lib/GlobalProvider";

/**
 * Hook to check if user has any pending friend requests
 * Reads the hasFriendRequests boolean from userProfile (computed on backend from requests array)
 */
export function useHasFriendRequests(): boolean {
  const { userProfile } = useGlobalContext();
  return userProfile?.hasFriendRequests === true;
}
