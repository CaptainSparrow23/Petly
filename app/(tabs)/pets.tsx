import React from "react";
import { ImageBackground, View } from "react-native";
import room_background from "@/assets/images/room_background.png";

const PetsScreen = () => {
  return (
    <View className="flex-1 bg-gray-500">
      <ImageBackground
        source={room_background}
        className="flex-1"
        resizeMode="cover"
        imageStyle={{ transform: [{ translateY: -70 }] }}
      />
    </View>
  );
};

export default PetsScreen;
