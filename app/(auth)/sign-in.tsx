import icons from "@/constants/icons";
import images from "@/constants/images";
import { login } from "@/lib/appwrite";
import { useGlobalContext } from "@/lib/global-provider";
import { Redirect } from "expo-router";
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

const API_BASE_URL = Constants.expoConfig?.extra?.backendUrl as string;

const SignIn = () => {
  const { refetch, loading, isLoggedIn, user } = useGlobalContext();
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [needsProfileSetup, setNeedsProfileSetup] = useState<boolean | null>(null);

  // Check if user exists in Firebase (authenticated) when page loads
  useEffect(() => {
    const checkUserStatus = async () => {
      if (isLoggedIn && user?.$id) {
        setIsCheckingStatus(true);
        try {
          console.log(`🔍 Checking if user has username: ${user.$id}`);
          const response = await fetch(
            `${API_BASE_URL}/api/auth/check-user-status`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ userId: user.$id }),
            }
          );
          const data = await response.json();
          
          console.log("📦 User status response:", JSON.stringify(data, null, 2));
          
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
      } else if (!isLoggedIn) {
        // Reset when logged out
        setNeedsProfileSetup(null);
      }
    };
    checkUserStatus();
  }, [isLoggedIn, user?.$id]);

  // Redirect logic
  if (!loading && isLoggedIn) {
    // If we're still checking status, show loading
    if (needsProfileSetup === null || isCheckingStatus) {
      return (
        <SafeAreaView className="bg-white h-full items-center justify-center">
          <ActivityIndicator size="large" color="#0066FF" />
          <Text className="mt-4 text-base font-rubik text-gray-600">
            Checking your profile...
          </Text>
        </SafeAreaView>
      );
    }
    
    // If user needs profile setup (no username in Firebase)
    if (needsProfileSetup) {
      console.log("🔄 Redirecting to set-profile (user needs username)");
      return <Redirect href="/(auth)/set-profile" />;
    }
    
    // If user has username in Firebase, go to main app
    console.log("✅ Redirecting to main app (user has username)");
    return <Redirect href="/(tabs)" />;
  }

  const handleLogin = async () => {
    const result = await login();

    if (result) {
      refetch();
    } else {
      Alert.alert("Login failed", "Please try again");
    }
  };

  return (
    <SafeAreaView className="bg-white h-full">
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
