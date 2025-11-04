import { auth } from '@/utils/firebase';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, signInWithCredential, signOut, User } from 'firebase/auth';

// Complete the auth session for web browser
WebBrowser.maybeCompleteAuthSession();

// Google Web Client ID for Firebase
const GOOGLE_WEB_CLIENT_ID =
  'https://1003587548441-2pngh6notc42r4mp58f2nflton6lgg43.apps.googleusercontent.com';

export interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

/** 
 * Sign out from Firebase 
 */
export async function logout(): Promise<boolean> {
  try {
    console.log('🚪 Signing out...');
    // Sign out from Firebase
    await signOut(auth);
    console.log('✅ Logout successful');
    return true;
  } catch (error) {
    console.error('❌ Logout error:', error);
    return false;
  }
}

/** 
 * Get the currently authenticated user 
 */
export async function getCurrentUser(): Promise<FirebaseUser | null> {
  try {
    const user = auth.currentUser;
    if (!user) {
      return null;
    }

    // Return user info in a format compatible with the app
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
    };
  } catch (error) {
    console.error('❌ Error getting current user:', error);
    return null;
  }
}

/** 
 * Listen to authentication state changes 
 */
export function onAuthStateChanged(callback: (user: User | null) => void) {
  return auth.onAuthStateChanged(callback);
}
