import React, { useMemo } from "react";
import { Image, ImageSourcePropType, Text, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import images from "@/constants/images";
import { CoralPalette } from "@/constants/colors";

export type PetSpecies =
 | "cat" | "dog" | "rabbit" | "bird";

export interface PetTileItem {
 id: string;
 name: string;
 species: PetSpecies;
 priceCoins: number;
 imageKey?: string | null;
 imageUrl?: string | null;
 description?: string;
 owned?: boolean;
}

interface TileProps {
 item: PetTileItem;
 onPress?: () => void;
}

/* exports kept for other modules (e.g., Sheets.tsx) */
export const resolvePetImage = (item: PetTileItem): ImageSourcePropType => {
 if (item.imageUrl) return { uri: item.imageUrl };

 const byKey =
  item.imageKey &&
  (images[item.imageKey as keyof typeof images] as ImageSourcePropType | undefined);
 if (byKey) return byKey;

 const bySpecies =
  images[item.species as keyof typeof images] as ImageSourcePropType | undefined;

 return bySpecies ?? images.lighting;
};

const formatSpecies = (species: PetSpecies) =>
 species.charAt(0).toUpperCase() + species.slice(1);

export const formatSpeciesUtil = formatSpecies;

export const Tile: React.FC<TileProps> = ({ item, onPress }) => {
 const { name, species, priceCoins } = item;
 const imageSource = useMemo(() => resolvePetImage(item), [item]);

 return (
  <TouchableOpacity
   onPress={onPress}
   accessibilityRole="button"
   accessibilityLabel={`${name}, ${formatSpecies(species)}, costs ${priceCoins} coins`}
   className="flex-1 w-full rounded-2xl shadow-lg shadow-black relative"
   style={{
    backgroundColor: CoralPalette.surfaceAlt,
    borderColor: CoralPalette.border,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
   }}
  >
   <View className="rounded-2xl overflow-hidden">
    <View
     className="w-full items-center justify-center h-48"
     style={{ backgroundColor: CoralPalette.white }}
    >
     <Image source={imageSource} resizeMode="contain" style={{ width: 136, height: 136 }} />
    </View>

    <View className="w-full px-4 py-4" style={{ backgroundColor: CoralPalette.surfaceAlt }}>
     <Text className="text-base font-bold" style={{ color: CoralPalette.dark }} numberOfLines={1}>
      {name}
     </Text>
     <Text className="text-xs mt-0.5" style={{ color: CoralPalette.mutedDark }}>
      {formatSpecies(species)}
     </Text>

     <View className="flex-row items-center mt-3">
      <View
       className="h-6 w-6 items-center justify-center rounded-full"
       style={{ backgroundColor: CoralPalette.primary }}
      >
       <MaterialCommunityIcons name="currency-usd" size={14} color={CoralPalette.white} />
      </View>
      <Text className="ml-1.5 text-base font-bold" style={{ color: CoralPalette.primary }}>
       {priceCoins.toLocaleString()}
      </Text>
     </View>
    </View>
   </View>
  </TouchableOpacity>
 );
};

export default Tile;
