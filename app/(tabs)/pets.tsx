import { MenuButton } from '@/components/other/MenuButton';
import React from 'react';
import { Text, View, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import room_backgound from '@/assets/images/room_background.png';


const Profile = () => {
  return (
    <SafeAreaView className="h-full bg-white">
      <View className="w-full flex-row items-center px-6 pt-2">
        <View className="flex-1">
          <MenuButton />
        </View>
        <View className="flex-1 items-center">
          <Text className="text-2xl font-rubik-medium text-gray-900">My Pets</Text>
        </View>
        <View className="flex-1 items-end" />
      </View>

      <View className="-mt-2 items-start">
        <Image
          source={room_backgound}
          className="w-full"
          style={{ height: 400 }}
          resizeMode="contain"
        />
      </View>
    </SafeAreaView>
  );
};

export default Profile;
