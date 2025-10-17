import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import type { ImageSourcePropType } from "react-native";
import { Star } from "lucide-react-native";

interface PetCardItem {
  image?: string | ImageSourcePropType;
  rating?: number;
  name?: string;
  type?: string;
}

interface Props {
  item: PetCardItem;
  onPress?: () => void;
}


export const Card = ({ item: { image, name, type }, onPress }: Props) => {
  const resolvedImage: ImageSourcePropType | undefined =
    typeof image === "string" ? { uri: image } : image;

  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-1 px-4 py-3 rounded-2xl bg-white border border-gray-200 flex-row items-center"
    >
      {resolvedImage && (
        <Image source={resolvedImage} className="w-16 h-16 rounded-xl mr-4" />
      )}

      <View className="flex-1">
        <Text className="text-lg font-bold text-black-300" numberOfLines={1}>
          {name}
        </Text>
        <Text className="text-xs font-rubik text-black-200 capitalize">
          {type}
        </Text>

        <View className="flex-row items-center mt-1">
          {Array.from({ length: 3 }).map((_, index) => (
            <Star
              key={`pet-card-star-${index}`}
              size={16}
              color="#FACC15"
              fill="#FACC15"
              style={index > 0 ? { marginLeft: 4 } : undefined}
            />
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
};
