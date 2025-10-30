import { useGlobalContext } from "@/lib/GlobalProvider";
import { Redirect } from "expo-router";
import { ActivityIndicator, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
  const { loading, isLoggedIn } = useGlobalContext();

  if (loading) {
    return (
      <SafeAreaView className="bg-white h-full flex justify-center items-center">
        <ActivityIndicator size="large" color="#2563eb" />
      </SafeAreaView>
    );
  }

  // If authenticated: go to tabs (profile will be fetched automatically by global provider)
  // If not authenticated: go to sign-in page
  if (isLoggedIn) {
    console.log("✅ User authenticated - redirecting to tabs");
    return <Redirect href="/(tabs)" />;
  }
  
  console.log("🔐 User not authenticated - redirecting to sign-in");
  return <Redirect href="/(auth)/sign-in" />;
}