import { MenuButton } from '@/components/other/MenuButton';
import React from 'react';
import { Text, View, ImageBackground, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import room_backgound from '@/assets/images/room_background.png';
import { Card } from '@/components/other/PetCard';
import { petData } from '@/constants/petdata';


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

      <ImageBackground
        source={room_backgound}
        className="-mt-2 w-full"
        style={{ height: 400 }}
        resizeMode="contain"
      >
        <View className="flex-1" />
      </ImageBackground>

      <FlatList
        data={petData}
        renderItem={({ item, index }) => (
          <View
            style={{
              flex: 1,
              marginRight: index % 2 === 0 ? 8 : 0,
              marginLeft: index % 2 === 1 ? 8 : 0,
            }}
          >
            <Card item={item} onPress={() => {}} />
          </View>
        )}
        keyExtractor={(item, index) =>
          `pet-${item?.name ?? 'unknown'}-${index}`
        }
        numColumns={2}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 10,
          paddingHorizontal: 20,
          paddingTop: 0,
        }}
        columnWrapperStyle={{ marginBottom: 16 }}
      />

    </SafeAreaView>
  );
};

export default Profile;
