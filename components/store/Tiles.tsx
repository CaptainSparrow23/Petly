import icons from "@/constants/icons";
import images from "@/constants/images";
import React from "react";
import {
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Coins, Heart, Star } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

export type PetSpecies =
  | "cat"
  | "dog"
  | "fox"
  | "bunny"
  | "owl"
  | "dragon"
  | "phoenix"
  | "griffin"
  | "unicorn"
  | "kraken"
  | "kitsune"
  | "sphinx"
  | "pegasus"
  | "leviathan"
  | "wyvern";
export type PetRarity = "common" | "rare" | "epic" | "legendary";

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

interface BaseTileProps extends TileProps {
  borderWidth: number;
  containerClassName: string;
  imageClassName: string;
  children: React.ReactNode;
  overlay?: React.ReactNode;
}

const BaseTile = ({
  item,
  onPress,
  borderWidth,
  containerClassName,
  imageClassName,
  overlay,
  children,
}: BaseTileProps) => {
  const imageSource = resolvePetImage(item);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      className={containerClassName}
      style={{
        backgroundColor: "#fff",
        borderColor: rarityMeta[item.rarity].borderColor,
        borderWidth,
      }}
    >
      <Image source={imageSource} className={imageClassName} resizeMode="cover" />
      {overlay}
      {children}
    </TouchableOpacity>
  );
};

const rarityMeta: Record<PetRarity, { borderColor: string }> = {
  common: {
    borderColor: "#10b981",
  },
  rare: {
    borderColor: "#2563eb",
  },
  epic: {
    borderColor: "#8b5cf6",
  },
  legendary: {
    borderColor: "#f59e0b",
  },
};

export const rarityStarCount: Record<PetRarity, number> = {
  common: 3,
  rare: 4,
  epic: 5,
  legendary: 6,
};

const resolvePetImage = (item: PetTileItem): ImageSourcePropType => {
  if (item.imageUrl) {
    return { uri: item.imageUrl };
  }

  const fromKey =
    item.imageKey &&
    (icons[item.imageKey as keyof typeof icons] as ImageSourcePropType | undefined);
  if (fromKey) {
    return fromKey;
  }

  const fallback =
    (icons[item.species as keyof typeof icons] as ImageSourcePropType | undefined) ??
    (images[item.species as keyof typeof images] as ImageSourcePropType | undefined);
  return fallback ?? images.lighting;
};

const formatSpecies = (species: PetSpecies) =>
  species.charAt(0).toUpperCase() + species.slice(1);

const PriceTag = ({ value }: { value: number }) => (
  <View className="flex-row items-center bg-white/20 px-2 py-1 rounded-full">
    <Coins size={14} color="#facc15" strokeWidth={1.5} />
    <Text className="ml-1 text-sm font-rubik-bold text-white">
      {value.toLocaleString()}
    </Text>
  </View>
);

const PetStars = ({ rarity, tint = "#facc15" }: { rarity: PetRarity; tint?: string }) => {
  return (
    <View className="flex-row gap-1">
      {Array.from({ length: rarityStarCount[rarity] }).map((_, idx) => (
        <Star key={idx} size={14} color={tint} fill={tint} strokeWidth={1.2} />
      ))}
    </View>
  );
};

export const FeaturedTile = ({ item, onPress }: TileProps) => {
  const { name, rarity, species, priceCoins } = item;

  return (
    <BaseTile
      item={item}
      onPress={onPress}
      borderWidth={4}
      containerClassName="flex flex-col items-start w-60 h-80 relative overflow-hidden rounded-2xl"
      imageClassName="size-full"
      overlay={
        <LinearGradient
          pointerEvents="none"
          colors={["rgba(15,23,42,0)", "rgba(15,23,42,0.85)"]}
          locations={[0, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.featuredGradientOverlay}
        />
      }
    >
      <View className="flex flex-col items-start absolute bottom-5 inset-x-5">
        <Text className="text-xl font-bold text-white" numberOfLines={1}>
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
         
        </View>
      </View>
    </BaseTile>
  );
};

const styles = StyleSheet.create({
  featuredGradientOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    top: "45%",
  },
});

export const Tile = ({ item, onPress }: TileProps) => {
  const { name, rarity, species, priceCoins } = item;

  return (
    <BaseTile
      item={item}
      onPress={onPress}
      borderWidth={3}
      containerClassName="flex-1 w-full px-3 py-4 rounded-2xl shadow-lg shadow-black/10 relative"
      imageClassName="w-full h-40 rounded-xl"
    >
      <View className="flex flex-col mt-3 ml-2">
        <Text className="text-base font-bold text-black-300">
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

        </View>
      </View>
    </BaseTile>
  );
};
