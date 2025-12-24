import { Platform } from "react-native";
import Constants from "expo-constants";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import {
  GoogleAuthProvider,
  signInWithCredential,
  signOut,
  UserCredential,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

const webClientId = Constants.expoConfig?.extra?.googleWebClientId;
const iosClientId = Constants.expoConfig?.extra?.googleIosClientId;

if (__DEV__) {
  console.log("[firebaseAuth] Google client IDs", { webClientId, iosClientId });
}

GoogleSignin.configure({
  webClientId,
  iosClientId,
  offlineAccess: true,
  forceCodeForRefreshToken: false,
});

const assertClientConfig = () => {
  if (!webClientId) {
    throw new Error(
      "Missing googleWebClientId. Update expo.extra.googleWebClientId in app.json."
    );
  }
  if (Platform.OS === "ios" && !iosClientId) {
    throw new Error(
      "Missing googleIosClientId. Update expo.extra.googleIosClientId in app.json."
    );
  }
};

export async function signInWithGoogle(): Promise<UserCredential> {
  assertClientConfig();

  if (Platform.OS === "android") {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  }

  const userInfo = await GoogleSignin.signIn();

  let { idToken, accessToken } = userInfo;

  if (!idToken) {
    try {
      const tokens = await GoogleSignin.getTokens();
      if (__DEV__) {
        console.log("[firebaseAuth] tokens fetched via getTokens");
      }
      idToken = tokens.idToken ?? undefined;
      accessToken = tokens.accessToken ?? accessToken;
    } catch (tokenError) {
      console.warn("Failed to fetch Google tokens", tokenError);
    }
  }

  if (!idToken) {
    throw new Error("Google Sign-In failed: missing idToken");
  }

  const credential = GoogleAuthProvider.credential(idToken, accessToken);
  return signInWithCredential(auth, credential);
}

export async function signOutFromFirebase(): Promise<void> {
  try {
    await GoogleSignin.signOut();
  } catch (error) {
    console.warn("Google sign out warning:", error);
  }
  await signOut(auth);
}
