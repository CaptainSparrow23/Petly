// hooks/useGoogleIdTokenLogin.ts
import { useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";

WebBrowser.maybeCompleteAuthSession();

type UseGoogleIdTokenLoginArgs = {
  apiBaseUrl: string;       // e.g. "http://localhost:3000/api"
  clientId: string;         // web client ID (Expo proxy flow)
  redirectUri: string;      // e.g. "https://auth.expo.io/@<acct>/<slug>"
  refetchUserProfile: () => Promise<any>;
};

type UseGoogleIdTokenLoginReturn = {
  isLoading: boolean;
  isGoogleDisabled: boolean;
  handleGoogleSignIn: () => Promise<void>;
};

export function useGoogleIdTokenLogin({
  apiBaseUrl,
  clientId,
  redirectUri,
  refetchUserProfile,
}: UseGoogleIdTokenLoginArgs): UseGoogleIdTokenLoginReturn {
  const [isLoading, setIsLoading] = useState(false);

  console.log("[Auth] Initializing Google Sign-In request...");
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId,
    redirectUri,
    extraParams: { prompt: "select_account" },
  });

  useEffect(() => {
    console.log("[Auth] Google request created?", !!request);
  }, [request]);

  useEffect(() => {
    console.log("[Auth] Google response received:", response);
    if (!response) return;

    if (response.type === "success") {
      const idToken = response.params?.id_token;
      console.log("[Auth] Sign-in success from Google. Token exists?", !!idToken);
      void handleGoogleSignInSuccess(idToken);
    } else if (response.type === "error") {
      console.error("[Auth] Google OAuth error:", response.error);
      Alert.alert("Error", "Google sign-in failed. Please try again.");
    } else {
      console.log("[Auth] Response type:", response.type);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  const handleGoogleSignInSuccess = async (idToken?: string) => {
    console.log("[Auth] handleGoogleSignInSuccess called");
    try {
      if (!idToken) {
        console.error("[Auth] No ID token received from Google");
        Alert.alert("Error", "No ID token received from Google");
        return;
      }
      console.log("[Auth] Sending token to backend:", `${apiBaseUrl}/google`);
      setIsLoading(true);

      const apiResponse = await fetch(`${apiBaseUrl}/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      console.log("[Auth] Backend responded. Status:", apiResponse.status);
      const data = await apiResponse.json().catch((e) => {
        console.error("[Auth] Error parsing backend JSON:", e);
        return null;
      });
      console.log("[Auth] Backend response data:", data);

      if (data?.success) {
        console.log("[Auth] Backend authentication successful.");
        try {
          console.log("[Auth] Refetching user profile...");
          await refetchUserProfile();
          console.log("[Auth] User profile refetched successfully.");
        } catch (e) {
          console.warn("[Auth] Failed to refetch user profile:", e);
        }

        Alert.alert("Success", `Welcome ${data.user?.name || data.user?.email || "back"}!`);
      } else {
        console.error("[Auth] Backend auth error:", data);
        Alert.alert("Error", data?.message || "Authentication failed");
      }
    } catch (err) {
      console.error("[Auth] Google sign-in error:", err);
      Alert.alert(
        "Error",
        "Failed to connect to backend. Make sure the server is running and reachable."
      );
    } finally {
      setIsLoading(false);
      console.log("[Auth] Sign-in flow finished.");
    }
  };

  const handleGoogleSignIn = async () => {
    console.log("[Auth] handleGoogleSignIn()");
    if (!request) {
      console.warn("[Auth] Google Sign-In is still initializing.");
      Alert.alert("Please wait", "Google Sign-In is still initializing.");
      return;
    }
    console.log("[Auth] Launching Google Sign-In flow (Expo proxy)...");
    const result = await promptAsync(); // Expo proxy flow: no options needed
    console.log("[Auth] promptAsync returned:", result?.type);
  };

  const isGoogleDisabled = useMemo(() => isLoading || !request, [isLoading, request]);

  return { isLoading, isGoogleDisabled, handleGoogleSignIn };
}
