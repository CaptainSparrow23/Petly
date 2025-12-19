import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import images from "@/constants/images";
import { CoralPalette } from "@/constants/colors";
import Rive, { Fit } from "rive-react-native";
import smurfAlt from "@/assets/animations/smurfAlt.riv";
import chedrickAlt from "@/assets/animations/chedrickAlt.riv";
import pebblesAlt from "@/assets/animations/pebblesAlt.riv";
import goonerAlt from "@/assets/animations/goonerAlt.riv";
import kittyAlt from "@/assets/animations/kittyAlt.riv";
import { getPetUnlockLevel } from "@/utils/petUnlocks";

const altAnimations: Record<string, number> = {
  pet_smurf: smurfAlt,
  pet_chedrick: chedrickAlt,
  pet_pebbles: pebblesAlt,
  pet_gooner: goonerAlt,
  pet_kitty: kittyAlt,
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
 featured?: boolean;
}

interface TileProps {
 item: StoreItem;
 onPress?: () => void;
 userLevel?: number;
}

export const Tile: React.FC<TileProps> = ({ item, onPress, userLevel = 1 }) => {
 const { name, priceCoins, owned, category } = item;
 const isPet = category === "Pet";
 const unlockLevel = isPet ? getPetUnlockLevel(item.id) : null;
 const isLocked = isPet && unlockLevel !== null && (userLevel < unlockLevel || !owned);

 return (
 <TouchableOpacity
   onPress={onPress}
   accessibilityRole="button"
   accessibilityLabel={`${name}, costs ${priceCoins} coins`}
  className="flex-1 w-full"
  style={{
    backgroundColor: CoralPalette.white,
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
   }}
  >

   <View
    className="items-center justify-center"
    style={{
     paddingVertical: 8,
    }}
   >
      {item.category === "Pet" && altAnimations[item.id] ? (
        <View style={{ width: 300, height: 90, overflow: "hidden" }}>
        <Rive
          source={altAnimations[item.id]}
          stateMachineName="State Machine 1"
          style={{ width: 300, height: 188, transform: [{ translateY: -15 }] }}
          fit={Fit.Contain}
          autoplay
        />
        </View>
      ) : (
        <Image
          source={images[item.id as keyof typeof images] ?? images.lighting}
          resizeMode="contain"
          style={{ width: 90, height: 90 }}
        />
      )}
   </View>

   <View className="w-full mt-3">
    <Text className="text-lg font-extrabold ml-2" style={[{ color: CoralPalette.dark }, FONT]} numberOfLines={1}>
     {name}
    </Text>

    <View className="flex-row items-center mt-2 ml-2">
     {isPet && unlockLevel !== null ? (
       <>
         <Text className="text-sm font-semibold" style={[{ color: isLocked ? CoralPalette.mutedDark : CoralPalette.primary }, FONT]}>
           {isLocked ? `Unlocks at Level ${unlockLevel}` : "Unlocked"}
         </Text>
       </>
     ) : (
       <>
         <View className="h-6 w-6 items-center justify-center">
           <Image source={images.token} style={{ width: 16, height: 16 }} resizeMode="contain" />
         </View>
         <Text className="ml-2 text-base font-semibold" style={[{ color: CoralPalette.dark }, FONT]}>
           {priceCoins.toLocaleString()}
         </Text>
       </>
     )}
    </View>
   </View>
  </TouchableOpacity>
 );
};

export default Tile;
