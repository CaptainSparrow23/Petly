import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/utils/firebase';

/**
 * Real-time listener hook for friend requests
 * Watches the user's document for changes to the requests array
 */
export function useFriendRequestsListener(userId: string | null): boolean {
  const [hasFriendRequests, setHasFriendRequests] = useState(false);

  useEffect(() => {
    if (!userId) {
      setHasFriendRequests(false);
      return;
    }

    const userRef = doc(db, 'users', userId);
    
    const unsubscribe = onSnapshot(
      userRef,
      (snapshot) => {
        const data = snapshot.data();
        const requests = Array.isArray(data?.requests) ? data.requests : [];
        setHasFriendRequests(requests.length > 0);
      },
      (error) => {
        console.error('❌ Error listening to friend requests:', error);
        setHasFriendRequests(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  return hasFriendRequests;
}
