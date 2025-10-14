import icons from "@/constants/icons";
import images from "@/constants/images";
import { login } from "@/lib/appwrite";
import { useGlobalContext } from "@/lib/global-provider";
import { Redirect } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SignIn = () => {
  const { refetch, loading, isLoggedIn } = useGlobalContext();

  if (!loading && isLoggedIn) return <Redirect href="/" />;

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
