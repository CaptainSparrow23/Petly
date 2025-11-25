import React, { useMemo } from "react";
import { Image, ImageSourcePropType, Text, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import images from "@/constants/images";
import { CoralPalette } from "@/constants/colors";

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

/* exports kept for other modules (e.g., Sheets.tsx) */
export const resolveItemImage = (item: StoreItem): ImageSourcePropType => {
  const key = `${(item.imageKey || item.name || "").toLowerCase()}_head`;
  const found = images[key as keyof typeof images] as ImageSourcePropType | undefined;
  return found ?? images.lighting;
};

export const Tile: React.FC<TileProps> = ({ item, onPress }) => {
 const { name, priceCoins, owned } = item;
 const imageSource = useMemo(() => resolveItemImage(item), [item]);

 return (
 <TouchableOpacity
   onPress={onPress}
   accessibilityRole="button"
   accessibilityLabel={`${name}, costs ${priceCoins} coins`}
  className="flex-1 w-full"
  style={{
    backgroundColor: CoralPalette.white,
    borderRadius: 18,
    padding: 12,
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
     <Text className="text-xs font-bold" style={{ color: CoralPalette.primary }}>
      Owned
     </Text>
    </View>
   )}

   <View
    className="items-center justify-center mb-4"
    style={{
     backgroundColor: CoralPalette.white,
     borderRadius: 14,
     paddingVertical: 16,
    }}
   >
    <Image source={imageSource} resizeMode="contain" style={{ width: 130, height: 130 }} />
   </View>

   <View className="w-full">
    <Text className="text-xl font-extrabold ml-2" style={{ color: CoralPalette.dark }} numberOfLines={1}>
     {name}
    </Text>

    <View className="flex-row items-center mt-3">
     <View
      className="h-8 w-8 items-center justify-center rounded-full"
      style={{ backgroundColor: CoralPalette.primary }}
     >
      <MaterialCommunityIcons name="currency-usd" size={15} color={CoralPalette.white} />
     </View>
     <Text className="ml-2 text-lg font-semibold" style={{ color: CoralPalette.dark }}>
      {priceCoins.toLocaleString()}
     </Text>
    </View>
   </View>
  </TouchableOpacity>
 );
};

export default Tile;
