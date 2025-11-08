import React, { useMemo } from "react";
import { Image, ImageSourcePropType, Text, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import images from "@/constants/images";

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
      className="flex-1 w-full rounded-2xl bg-white shadow-lg shadow-black relative border border-gray-300"
      style={{
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 7,
      }}
    >
      {/* Rounded clipping so top image & bottom bg align with corners */}
      <View className="rounded-2xl overflow-hidden">
        {/* Top image area (centered, not cropped) */}
        <View className="w-full items-center justify-center bg-white h-48">
          <Image source={imageSource} resizeMode="contain" style={{ width: 136, height: 136 }} />
        </View>

        {/* Bottom section full-width different background */}
        <View className="w-full bg-white px-4 py-4">
          <Text className="text-base font-bold text-black-300" numberOfLines={1}>
            {name}
          </Text>
          <Text className="text-xs font-rubik text-black-200 mt-0.5">
            {formatSpecies(species)}
          </Text>

          <View className="flex-row items-center mt-3">
            <View className="h-6 w-6 items-center justify-center rounded-full bg-amber-400">
              <MaterialCommunityIcons name="currency-usd" size={14} color="#92400e" />
            </View>
            <Text className="ml-1.5 text-base font-rubik-bold text-primary-300">
              {priceCoins.toLocaleString()}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default Tile;
