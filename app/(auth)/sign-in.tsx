// app/(auth)/sign-in.tsx
import images from "@/constants/images";
import { useGlobalContext } from "@/lib/GlobalProvider";
import { Redirect, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Banner } from "@/components/other/Banner";
import { useGoogleIdTokenLogin } from "@/hooks/useAuth";
import Constants from "expo-constants";


const API_BASE_URL = Constants.expoConfig?.extra?.backendUrl as string;

const GOOGLE_CLIENT_ID =
  "1003587548441-pam82dcadi8gmitp0hmunkbrv5alo5h7.apps.googleusercontent.com";
const REDIRECT_URI = "https://auth.expo.io/@bobbydavidson/petly";

const SignIn = () => {
  const { refetchUserProfile, loading, isLoggedIn, userProfile } = useGlobalContext();
  const { loggedOut } = useLocalSearchParams();

  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [needsProfileSetup, setNeedsProfileSetup] = useState<boolean | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  const { isLoading, isGoogleDisabled, handleGoogleSignIn } = useGoogleIdTokenLogin({
    apiBaseUrl: API_BASE_URL,
    clientId: GOOGLE_CLIENT_ID,
    redirectUri: REDIRECT_URI,
    refetchUserProfile,
  });

  useEffect(() => {
    if (loggedOut === "true") setShowBanner(true);
  }, [loggedOut]);

  // Same user status check as before
  useEffect(() => {
    const checkUserStatus = async () => {
      if (isLoggedIn && userProfile?.userId && needsProfileSetup === null) {
        setIsCheckingStatus(true);
        try {
          await fetch(`${API_BASE_URL}/api/auth/save-user-info`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: userProfile.userId,
              email: userProfile.email,
              displayName: userProfile.displayName,
            }),
          });

          const response = await fetch(`${API_BASE_URL}/api/auth/check-user-status`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: userProfile.userId }),
          });

          const data = await response.json();
          setNeedsProfileSetup(data.success ? data.data.needsProfileSetup : true);
        } catch (error) {
          setNeedsProfileSetup(true);
        } finally {
          setIsCheckingStatus(false);
        }
      }
    };
    checkUserStatus();
  }, [isLoggedIn, userProfile?.userId, needsProfileSetup]);

  if (!loading && isLoggedIn && needsProfileSetup !== null) {
    console.log("[Auth] Redirecting based on profile setup...");
    if (needsProfileSetup) return <Redirect href="/(auth)/set-profile" />;
    return <Redirect href={{ pathname: "/(tabs)", params: { loggedIn: "true" } }} />;
  }

  if (isCheckingStatus || (isLoggedIn && needsProfileSetup === null)) {
    console.log("[Auth] Checking profile status screen...");
    return (
      <SafeAreaView className="bg-white h-full items-center justify-center">
        <ActivityIndicator size="large" color="#0066FF" />
        <Text className="mt-4 text-base font-rubik text-gray-600">
          Checking your profile...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="bg-white h-full">
      <Banner
        message="You have been logged out successfully"
        type="success"
        visible={showBanner}
        onHide={() => setShowBanner(false)}
        duration={3000}
      />
      <ScrollView contentContainerClassName="h-full">
        <Image source={images.catFamily} className="w-full h-4/6" resizeMode="contain" />
        <View className="flex-1 items-center px-10 pb-20">
          <Text className="py-3 text-base text-center uppercase font-rubik text-black-200">
            Welcome to Petly !
          </Text>
          <Text className="text-3xl font-rubik-bold text-black-300 text-center mt-2">
            Start a focus session{"\n"}
            <Text className="text-primary-300">with your pet friend</Text>
          </Text>

          <TouchableOpacity
            className="bg-white shadow-md shadow-zinc-300 rounded-full w-full py-4 px-4 mt-10"
            onPress={handleGoogleSignIn}
            disabled={isGoogleDisabled}
          >
            <View className="flex flex-row items-center justify-center">
              {isLoading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <>
                  <Image source={images.google} className="w-5 h-5" resizeMode="contain" />
                  <Text className="text-lg font-rubik-medium text-black-300 ml-2">
                    Continue with Google
                  </Text>
                </>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SignIn;
