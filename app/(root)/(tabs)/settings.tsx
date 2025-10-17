import { MenuButton } from "@/components/MenuButton";
import { logout } from "@/lib/appwrite";
import { useGlobalContext } from "@/lib/global-provider";
import type { LucideIcon } from "lucide-react-native";
import { Camera, ChevronRight, LogOut } from "lucide-react-native";
import React from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View, Image} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface SettingsItemsProps {
  icon: LucideIcon;
  title: string;
  onPress?: () => void;
  textStyle?: string;
  showArrow?: boolean;
}

const SettingsItem = ({
  icon: Icon,
  title,
  onPress,
  textStyle,
  showArrow = true,
}: SettingsItemsProps) => (
  <TouchableOpacity
    className="flex flex-row justify-between items-center py-3"
    onPress={onPress}
  >
    <View className="flex flex-row items-center gap-3">
      <Icon size={24} color="#000" />
      <Text className={`text-xl font-rubik-medium text-black-300 ${textStyle}`}>
        {title}
      </Text>
    </View>
    {showArrow && <ChevronRight size={20} color="#666" />}
  </TouchableOpacity>
);

const Settings = () => {
  const { user, refetch } = useGlobalContext();

  const handleLogout = async () => {
    const result = await logout();

    if (result) {
      Alert.alert("Success", "You have been logged out");
      refetch();
    } else {
      Alert.alert(
        "Error",
        "An error occurred while logging out, please try again"
      );
    }
  };

  return (
    <SafeAreaView className="h-full bg-white">
      <View className="w-full flex-row items-center justify-between px-6 pt-4">
        <MenuButton />
        <View className="w-12" />
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
        contentContainerClassName="pb-8 px-7"
        className="w-full px-4"
      >
        <View className="flex-row justify-center flex mt-5">
                  <View className="flex flex-col items-center relative">
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
        <View className="flex-1 justify-center items-center">
  
        </View>

        <View className="flex flex-col items-center mt-5 border-t pt-5 border-gray-200 w-full">
          <SettingsItem
            icon={LogOut}
            title="Log Out"
            textStyle="text-red-500 "
            showArrow={false}
            onPress={handleLogout}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Settings;
