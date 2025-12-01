import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import images from "@/constants/images";
import { CoralPalette } from "@/constants/colors";
import Rive, { Fit } from "rive-react-native";
import smurfAlt from "@/assets/animations/smurfAlt.riv";
import chedrickAlt from "@/assets/animations/chedrickAlt.riv";
import pebblesAlt from "@/assets/animations/pebblesAlt.riv";
import goonerAlt from "@/assets/animations/goonerAlt.riv";

const altAnimations: Record<string, number> = {
  pet_smurf: smurfAlt,
  pet_chedrick: chedrickAlt,
  pet_pebbles: pebblesAlt,
  pet_gooner: goonerAlt,
};

const FONT = { fontFamily: "Nunito" };

export type StoreCategory = "Pet" | "Hat" | "Collar" | "Gadget";

export interface StoreItem {
 id: string;
 name: string;
 category: StoreCategory;
 priceCoins: number;
 imageKey?: string | null;
 imageUrl?: string | null;
 description?: string;
 owned?: boolean;
}

interface TileProps {
 item: StoreItem;
 onPress?: () => void;
}

export const Tile: React.FC<TileProps> = ({ item, onPress }) => {
 const { name, priceCoins, owned } = item;

 return (
 <TouchableOpacity
   onPress={onPress}
   accessibilityRole="button"
   accessibilityLabel={`${name}, costs ${priceCoins} coins`}
  className="flex-1 w-full"
  style={{
    backgroundColor: CoralPalette.white,
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
   }}
  >
   {owned && (
    <View
     style={{
      position: "absolute",
      top: 12,
      left: 12,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: `${CoralPalette.primaryLight}55`,
    }}
    >
     <Text className="text-xs font-bold" style={[{ color: CoralPalette.primary }, FONT]}>
      Owned
     </Text>
    </View>
   )}

   <View
    className="relative items-center justify-center"
    style={{
     backgroundColor: CoralPalette.white,
     borderRadius: 14,
     paddingVertical: 10,

    }}
   >
      {item.category === "Pet" && altAnimations[item.id] ? (
        <View style={{ width: 400, height: 120, overflow: "hidden" }}>
        <Rive
          source={altAnimations[item.id]}
          stateMachineName="State Machine 1"
          style={{ width: 400, height: 250, transform: [{ translateY: -20 }] }}
          fit={Fit.Contain}
          autoplay
        />
        </View>
      ) : (
        <Image
          source={images[item.id as keyof typeof images] ?? images.lighting}
          resizeMode="contain"
          style={{ width: 120, height: 120 }}
        />
      )}
   </View>

   <View className="w-full mt-5">
    <Text className="text-xl font-extrabold ml-2" style={[{ color: CoralPalette.dark }, FONT]} numberOfLines={1}>
     {name}
    </Text>

    <View className="flex-row items-center mt-3 ml-2">
     <View
      className="h-7 w-7 items-center justify-center rounded-full"
      style={{ backgroundColor: CoralPalette.primary }}
     >
      <MaterialCommunityIcons name="currency-usd" size={13} color={CoralPalette.white} />
     </View>
     <Text className="ml-2 text-lg font-semibold" style={[{ color: CoralPalette.dark }, FONT]}>
      {priceCoins.toLocaleString()}
     </Text>
    </View>
   </View>
  </TouchableOpacity>
 );
};

export default Tile;
