import icons from "@/constants/icons";
import images from "@/constants/images";
import React, { useMemo } from "react";
import {
  Image,
  ImageSourcePropType,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Coins, Heart, Star } from "lucide-react-native";

export type PetSpecies = "cat" | "dog" | "fox" | "bunny" | "owl";
export type PetRarity = "common" | "rare" | "epic";

export interface PetTileItem {
  id: string;
  name: string;
  species: PetSpecies;
  rarity: PetRarity;
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

const rarityMeta: Record<
  PetRarity,
  { label: string; badgeText: string; cardBackground: string; pillBackground: string; pillText: string }
> = {
  common: {
    label: "Common",
    badgeText: "#0f172a",
    cardBackground: "#d1fae5",
    pillBackground: "rgba(16, 185, 129, 0.32)",
    pillText: "#047857",
  },
  rare: {
    label: "Rare",
    badgeText: "#fff",
    cardBackground: "#dbeafe",
    pillBackground: "rgba(37, 99, 235, 0.32)",
    pillText: "#1d4ed8",
  },
  epic: {
    label: "Epic",
    badgeText: "#fff",
    cardBackground: "#ede9fe",
    pillBackground: "rgba(139, 92, 246, 0.32)",
    pillText: "#6d28d9",
  },
};

const speciesPlaceholder: Record<PetSpecies, ImageSourcePropType> = {
  cat: icons.skye,
  dog: icons.lancelot,
  fox: images.lighting,
  bunny: images.lighting,
  owl: images.lighting,
};

const petImageLookup: Record<string, ImageSourcePropType> = {
  skye: icons.skye,
  lancelot: icons.lancelot,
};

const resolvePetImage = (
  imageKey: string | null | undefined,
  species: PetSpecies
): ImageSourcePropType => {
  if (imageKey && petImageLookup[imageKey]) {
    return petImageLookup[imageKey];
  }
  return speciesPlaceholder[species] ?? images.lighting;
};

const formatSpecies = (species: PetSpecies) =>
  species.charAt(0).toUpperCase() + species.slice(1);

const truncate = (value: string | undefined, length = 48) => {
  if (!value) return "";
  return value.length > length ? `${value.slice(0, length)}…` : value;
};

const PriceTag = ({ value }: { value: number }) => (
  <View className="flex-row items-center bg-white/20 px-2 py-1 rounded-full">
    <Coins size={14} color="#facc15" strokeWidth={1.5} />
    <Text className="ml-1 text-sm font-rubik-bold text-white">
      {value.toLocaleString()}
    </Text>
  </View>
);

const PetStars = ({ rarity, tint = "#facc15" }: { rarity: PetRarity; tint?: string }) => {
  const counts: Record<PetRarity, number> = { common: 3, rare: 4, epic: 5 };
  return (
    <View className="flex-row gap-1">
      {Array.from({ length: counts[rarity] }).map((_, idx) => (
        <Star key={idx} size={14} color={tint} fill={tint} strokeWidth={1.2} />
      ))}
    </View>
  );
};

export const FeaturedTile = ({ item, onPress }: TileProps) => {
  const { name, rarity, species, priceCoins, imageKey, imageUrl } =
    item;
  const imageSource = useMemo(() => {
    if (imageUrl) {
      return { uri: imageUrl };
    }
    return resolvePetImage(imageKey, species);
  }, [imageKey, imageUrl, species]);
  const rarityInfo = rarityMeta[rarity];

  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex flex-col items-start w-60 h-80 relative overflow-hidden rounded-2xl"
      style={{ backgroundColor: rarityMeta[rarity].cardBackground }}
      activeOpacity={0.9}
    >
      <Image source={imageSource} className="size-full" resizeMode="cover" />
      <View
        style={{
          backgroundColor: rarityInfo.pillBackground,
          alignSelf: "flex-start",
          borderColor: `${rarityInfo.pillText}50`,
          borderWidth: 1,
        }}
        className="flex flex-row items-center px-3 py-1 rounded-full absolute top-5 left-5"
      >
        <Text
          className="text-xs font-rubik-bold"
          style={{ color: rarityInfo.pillText }}
        >
          {rarityInfo.label}
        </Text>
      </View>

      <View className="flex flex-col items-start absolute bottom-5 inset-x-5">
        <Text
          className="text-xl font-rubik-extra-bold text-white"
          numberOfLines={1}
        >
          {name}
        </Text>
        <Text className="text-sm font-rubik text-white/80" numberOfLines={1}>
          {formatSpecies(species)}
        </Text>
        <View className="mt-2">
          <PetStars rarity={rarity} tint="#facc15" />
        </View>
        <View className="flex flex-row items-center justify-between w-full mt-3">
          <PriceTag value={priceCoins} />
          <Heart size={18} color="#fda4af" strokeWidth={1.5} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const Tile = ({ item, onPress }: TileProps) => {
  const { name, rarity, species, priceCoins, imageKey, imageUrl } =
    item;
  const imageSource = useMemo(() => {
    if (imageUrl) {
      return { uri: imageUrl };
    }
    return resolvePetImage(imageKey, species);
  }, [imageKey, imageUrl, species]);
  const rarityInfo = rarityMeta[rarity];

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      className="flex-1 w-full px-3 py-4 rounded-lg shadow-lg shadow-black/10 relative"
      style={{ backgroundColor: rarityMeta[rarity].cardBackground }}
    >
      <Image
        source={imageSource}
        className="w-full h-40 rounded-lg"
        resizeMode="cover"
      />
      <View className="flex flex-col mt-3">
        <Text className="text-base font-rubik-bold text-black-300">
          {name}
        </Text>
        <Text className="text-xs font-rubik text-black-200 mt-0.5">
          {formatSpecies(species)}
        </Text>
        <View className="mt-2">
          <PetStars rarity={rarity} tint="#facc15" />
        </View>
        <View className="flex flex-row items-center justify-between mt-3">
          <View className="flex-row items-center">
            <Coins size={16} color="#0f172a" strokeWidth={1.6} />
            <Text className="ml-1 text-base font-rubik-bold text-primary-300">
              {priceCoins.toLocaleString()}
            </Text>
          </View>
          <Heart size={18} color="#1f2937" strokeWidth={1.4} />
        </View>
      </View>
    </TouchableOpacity>
  );
};
