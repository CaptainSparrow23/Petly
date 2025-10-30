import icons from "@/constants/icons";
import images from "@/constants/images";
import { login } from "@/lib/appwrite";
import { useGlobalContext } from "@/lib/GlobalProvider";
import { Redirect, useLocalSearchParams } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Constants from "expo-constants";
import { Banner } from "@/components/other/Banner";

const API_BASE_URL = Constants.expoConfig?.extra?.backendUrl as string;

const SignIn = () => {
  const { refetch, loading, isLoggedIn, userProfile } = useGlobalContext();
  const { loggedOut } = useLocalSearchParams();
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [needsProfileSetup, setNeedsProfileSetup] = useState<boolean | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  // Show banner if user just logged out
  useEffect(() => {
    if (loggedOut === "true") {
      setShowBanner(true);
    }
  }, [loggedOut]);

  // After login, check if user has username and redirect accordingly
  useEffect(() => {
    const checkUserStatus = async () => {
      // Only run this check if we're logged in AND don't have a status yet
      if (isLoggedIn && userProfile?.userId && needsProfileSetup === null) {
        setIsCheckingStatus(true);
        try {
          // Save user info to Firestore
          console.log('💾 Saving user info to Firestore...');
          await fetch(`${API_BASE_URL}/api/auth/save-user-info`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: userProfile.userId,
              email: userProfile.email,
              displayName: userProfile.displayName,
            }),
          });
          
          // Check if user has username set
          console.log(`🔍 Checking if user has username: ${userProfile.userId}`);
          const response = await fetch(
            `${API_BASE_URL}/api/auth/check-user-status`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ userId: userProfile.userId }),
            }
          );
          const data = await response.json();
          
          if (data.success) {
            const needsSetup = data.data.needsProfileSetup;
            console.log(`${needsSetup ? '🆕 User needs to set username' : '✅ User has username - profile complete'}`);
            setNeedsProfileSetup(needsSetup);
          } else {
            console.log("⚠️ Status check failed, assuming needs setup");
            setNeedsProfileSetup(true);
          }
        } catch (error) {
          console.error("❌ Error checking user status:", error);
          setNeedsProfileSetup(true);
        } finally {
          setIsCheckingStatus(false);
        }
      }
    };

    checkUserStatus();
  }, [isLoggedIn, userProfile?.userId, needsProfileSetup]);

  // Redirect logic - only after we've checked the status
  if (!loading && isLoggedIn && needsProfileSetup !== null) {
    if (needsProfileSetup) {
      console.log("🔄 Redirecting to set-profile (user needs username)");
      return <Redirect href="/(auth)/set-profile" />;
    }
    
    console.log("✅ Redirecting to main app (user has username)");
    return <Redirect href={{ pathname: "/(tabs)", params: { loggedIn: "true" } }} />;
  }

  // Show loading while checking status
  if (isCheckingStatus || (isLoggedIn && needsProfileSetup === null)) {
    return (
      <SafeAreaView className="bg-white h-full items-center justify-center">
        <ActivityIndicator size="large" color="#0066FF" />
        <Text className="mt-4 text-base font-rubik text-gray-600">
          Checking your profile...
        </Text>
      </SafeAreaView>
    );
  }

  const handleLogin = async () => {
    const result = await login();

    if (result) {
      await refetch();
    } else {
      Alert.alert("Login failed", "Please try again");
    }
  };

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
        <Image
          source={images.catFamily}
          className="w-full h-4/6"
          resizeMode="contain"
        />
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
            onPress={handleLogin}
            disabled={loading}
          >
            <View className="flex flex-row items-center justify-center">
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <>
                  <Image
                    source={icons.google}
                    className="w-5 h-5"
                    resizeMode="contain"
                  />
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
