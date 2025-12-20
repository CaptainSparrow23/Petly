import React from "react";
import { Text, View, FlatList, Image, TouchableOpacity } from "react-native";
import images from "@/constants/images";
import { CoralPalette } from "@/constants/colors";
import { PetItem } from "@/hooks/usePets";

const FONT = { fontFamily: "Nunito" };

interface PetsTabProps {
  pets: PetItem[];
  focusedPet: string | null;
  setFocusedPet: (petId: string) => void;
}

const PetsTab = ({ pets, focusedPet, setFocusedPet }: PetsTabProps) => {
  
  return (
    <FlatList
      data={pets}
      keyExtractor={(item) => item.id}
      numColumns={2}
      showsVerticalScrollIndicator={false}
      scrollEnabled={true}
      contentContainerStyle={{
        paddingHorizontal: 22,
    
        paddingBottom: 0,
        flexGrow: 1,
      }}
      columnWrapperStyle={{ columnGap: 16, marginBottom: 14 }}
      ListHeaderComponent={
        <View className="w-full py-4 px-3 -mt-2">
          <Text
            className="text-lg font-bold"
            style={[{ color: CoralPalette.mutedDark }, FONT]}
          >
            Choose your companion...
          </Text>
        </View>
      }
      ListEmptyComponent={
        <View className="w-full items-center py-8">
          <Text
            className="text-base font-bold"
            style={[{ color: CoralPalette.dark }, FONT]}
          >
            No pets yet
          </Text>
          <Text
            className="mt-2 text-sm text-center"
            style={[{ color: CoralPalette.mutedDark }, FONT]}
          >
            Rank up to adopt your first companion.
          </Text>
        </View>
      }
      renderItem={({ item }) => {
        const isFocused = item.id === focusedPet;

        return (
          <View className="w-[48%]">
            <TouchableOpacity
              onPress={() => setFocusedPet(item.id)}
              activeOpacity={0.9}
              className="flex-row items-center"
              style={[
                {
                  paddingHorizontal: 12,
                  paddingVertical: 12,
                  borderRadius: 10,
                  borderWidth: 5,
                  borderColor: CoralPalette.white,
                  backgroundColor: CoralPalette.white,
                  shadowColor: "#000",
                  shadowOpacity: 0.15,
                  shadowRadius: 4,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: 2,
                },
                isFocused && {
                  borderColor: CoralPalette.primaryMuted,
                  borderWidth: 5,
                  shadowOpacity: 0.14,
                },
              ]}
            >
              <Image
                source={
                  images[item.id as keyof typeof images] ?? images.lighting
                }
                className="w-16 h-20 rounded-2xl mr-3 ml-1"
                resizeMode="contain"
              />

              <View className="flex-1">
                <View className="flex-row items-center justify-between">
                  <Text
                    className="text-lg font-extrabold"
                    style={[{ color: CoralPalette.dark }, FONT]}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        );
      }}
    />
  );
};

export default PetsTab;
