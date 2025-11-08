import { Platform } from "react-native";
import Constants from "expo-constants";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import {
  GoogleAuthProvider,
  signInWithCredential,
  signOut,
  UserCredential,
} from "firebase/auth";
import { auth } from "@/utils/firebase";

type GoogleClientConfig = {
  webClientId?: string;
  iosClientId?: string;
};

const googleClientConfig: GoogleClientConfig = {
  webClientId: Constants.expoConfig?.extra?.googleWebClientId,
  iosClientId: Constants.expoConfig?.extra?.googleIosClientId,
};

const { webClientId, iosClientId } = googleClientConfig;

if (__DEV__) {
  console.log("[firebaseAuth] Google client IDs", {
    webClientId,
    iosClientId,
  });
}

GoogleSignin.configure({
  webClientId,
  iosClientId,
  offlineAccess: true,
  forceCodeForRefreshToken: false,
});

function ensureGoogleConfig() {
  if (!googleClientConfig.webClientId) {
    throw new Error(
      "Missing Google web client ID. Set expo.extra.googleWebClientId in app.json."
    );
  }
  if (Platform.OS === "ios" && !googleClientConfig.iosClientId) {
    throw new Error(
      "Missing Google iOS client ID. Set expo.extra.googleIosClientId in app.json."
    );
  }
}

export async function signInWithGoogle(): Promise<UserCredential> {
  ensureGoogleConfig();

  if (Platform.OS === "android") {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  }

  const userInfo = await GoogleSignin.signIn();

  let idToken = userInfo.idToken;
  let accessToken = userInfo.accessToken;

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
