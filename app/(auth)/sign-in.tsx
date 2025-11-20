import images from "@/constants/images";
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
import { signInWithGoogle } from "@/lib/firebaseAuth";

const API_BASE_URL = Constants.expoConfig?.extra?.backendUrl as string;

const SignIn = () => {
 const {
  refetchUserProfile,
  loading,
  isLoggedIn,
  authUser,
 } = useGlobalContext();
 const { loggedOut } = useLocalSearchParams();
 const [isCheckingStatus, setIsCheckingStatus] = useState(false);
 const [needsProfileSetup, setNeedsProfileSetup] = useState<boolean | null>(null);
 const [showBanner, setShowBanner] = useState(false);
 const [isSigningIn, setIsSigningIn] = useState(false);

 // Show banner if user just logged out
 useEffect(() => {
  if (loggedOut === "true") {
   setShowBanner(true);
  }
 }, [loggedOut]);

 // After login, check if user has username and redirect accordingly
 useEffect(() => {
  if (!authUser) {
   setNeedsProfileSetup(null);
   return;
  }

  const checkUserStatus = async () => {
   if (needsProfileSetup !== null || isCheckingStatus) return;

   setIsCheckingStatus(true);
   try {
    console.log("💾 Saving user info to Firestore...");
    await fetch(`${API_BASE_URL}/api/auth/save-user-info`, {
     method: "POST",
     headers: {
      "Content-Type": "application/json",
     },
     body: JSON.stringify({
      userId: authUser.uid,
      email: authUser.email,
      displayName: authUser.displayName,
     }),
    });

    console.log(`🔍 Checking if user has username: ${authUser.uid}`);
    const response = await fetch(
     `${API_BASE_URL}/api/auth/check-user-status`,
     {
      method: "POST",
      headers: {
       "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId: authUser.uid }),
     }
    );
    const data = await response.json();

    if (data.success) {
     const needsSetup = data.data.needsProfileSetup;
     console.log(
      `${
       needsSetup
        ? "🆕 User needs to set username"
        : "✅ User has username - profile complete"
      }`
     );
     setNeedsProfileSetup(needsSetup);
     if (!needsSetup) {
      await refetchUserProfile();
     }
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
  };

  checkUserStatus();
 }, [authUser, needsProfileSetup, isCheckingStatus, refetchUserProfile]);

 // Redirect logic - only after we've checked the status
 if (!loading && authUser && needsProfileSetup !== null) {
  if (needsProfileSetup) {
   console.log("🔄 Redirecting to set-profile (user needs username)");
   return <Redirect href="/(auth)/set-profile" />;
  }
  
  if (isLoggedIn) {
   console.log("✅ Redirecting to main app (user has username)");
   return <Redirect href={{ pathname: "/(tabs)", params: { loggedIn: "true" } }} />;
  }
 }

 // Show loading while checking status
 if (isCheckingStatus || (authUser && needsProfileSetup === null)) {
  return (
   <SafeAreaView className="bg-white h-full items-center justify-center">
    <ActivityIndicator size="large" color="#0066FF" />
    <Text className="mt-4 text-base text-gray-600">
     Checking your profile...
    </Text>
   </SafeAreaView>
  );
 }

 const handleLogin = async () => {
  if (isSigningIn) return;

  try {
   setIsSigningIn(true);
   await signInWithGoogle();
   await refetchUserProfile();
  } catch (error) {
   console.error("❌ Google Sign-In failed:", error);
   Alert.alert("Login failed", "Please try again");
  } finally {
   setIsSigningIn(false);
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
     <Text className="py-3 text-base text-center uppercase text-black-200">
      Welcome to Petly !
     </Text>
     <Text className="text-3xl font-bold text-black-300 text-center mt-2">
      Start a focus session{"\n"}
      <Text className="text-primary-300">with your pet friend</Text>
     </Text>

     <TouchableOpacity
      className="bg-white shadow-md shadow-zinc-300 rounded-full w-full py-4 px-4 mt-10"
      onPress={handleLogin}
      disabled={isSigningIn}
     >
      <View className="flex flex-row items-center justify-center">
       {isSigningIn ? (
        <ActivityIndicator color="#000" />
       ) : (
        <>
         <Image
          source={images.google}
          className="w-5 h-5"
          resizeMode="contain"
         />
         <Text className="text-lg font-medium text-black-300 ml-2">
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
