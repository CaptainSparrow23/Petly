import React from "react";
import { ImageBackground, Text, View } from "react-native";
import room_background from "@/assets/images/room_background.png";


const PetsScreen = () => {
  return (
    <View className="flex-1 bg-gray-500">
      <ImageBackground
        source={room_background}
        className="flex-1 mt-5"
        resizeMode="cover"
        imageStyle={{ transform: [{ translateX: -4 }, { translateY: -250 }] }}
      >
        <View className="flex-1" />

        <View className="px-8 pb-8 pt-6 rounded-t-3xl bg-white/90 h-[430px] shadow-2xl" >
          <Text className="text-lg">
            My Pets
          </Text>
        </View>
      </ImageBackground>
    </View>
  );
};

export default PetsScreen;
