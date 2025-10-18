import { useGlobalContext } from "@/lib/global-provider";
import { Redirect } from "expo-router";
import { ActivityIndicator } from "react-native";
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

  // Simple: logged in = go to tabs, logged out = go to sign-in
  if (isLoggedIn) {
    return <Redirect href="/(tabs)" />;
  }
  
  return <Redirect href="/(auth)/sign-in" />;
}