import { MenuButton } from "@/components/MenuButton";
import { useGlobalContext } from "@/lib/global-provider";
import { Camera } from "lucide-react-native";
import React from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Account = () => {
  const { user } = useGlobalContext();
  return (
    <SafeAreaView className="h-full bg-white">
      <MenuButton />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
        contentContainerClassName="pb-20 px-7"
        className="w-full px-4"
      >
        <View className="flex-row justify-center flex mt-5">
          <View className="flex flex-col items-center relative mt-5">
            <Image
              source={{ uri: user?.avatar }}
              className="size-44 relative rounded-full"
            />
            <TouchableOpacity className="absolute bottom-11 right-2 bg-white rounded-full p-2 shadow-md">
              <Camera size={20} color="#000" />
            </TouchableOpacity>
            <Text className="text-2xl top-3 font-rubik-bold mt-2">{user?.name}</Text>
          </View>
        </View>
        <View className="flex-1 mt-10 border-t border-gray-200"></View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Account;
