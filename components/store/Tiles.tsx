import React from "react";
import { Image, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import images from "@/constants/images";
import { CoralPalette } from "@/constants/colors";

const FONT = { fontFamily: "Nunito" };

// Stamp-specific colors
const stampColors = {
  cream: "#FDF8F0",
  paper: "#FAF6F1",
  goldFoil: "#D4AF37",
  inkBrown: "#3D2B1F",
  mutedInk: "#5C4A3D",
};

export type StoreCategory = "Pet" | "Hat" | "Collar" | "Gadget";

// Category tag colors (from CoralPalette)
const CATEGORY_TAG_COLOR: Record<StoreCategory, string> = {
  Pet: CoralPalette.forestTeal,
  Hat: CoralPalette.deepRose,
  Collar: CoralPalette.slateBlue,
  Gadget: CoralPalette.plumPurple,
};

// Perforation dots for stamp edges (adjusted for larger stamp)
const PERF_HORIZONTAL = Array.from({ length: 12 }, (_, i) => i);
const PERF_VERTICAL = Array.from({ length: 15 }, (_, i) => i);

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
  onPress?: (item: StoreItem) => void;
}

export const Tile = React.memo(function Tile({ item, onPress }: TileProps) {
  const { name, priceCoins } = item;
  const categoryTagColor = CATEGORY_TAG_COLOR[item.category];
  const { width: screenWidth } = useWindowDimensions();
  
  // Calculate tile width: (screen - container padding - gaps) / 2 columns
  // Container padding: 8*2 = 16, item padding: 10*4 = 40, total = 56
  const tileWidth = (screenWidth - 90) / 2;

  return (
    <TouchableOpacity
      onPress={() => onPress?.(item)}
      accessibilityRole="button"
      accessibilityLabel={`${name}, costs ${priceCoins} coins`}
      activeOpacity={0.92}
      style={{ width: tileWidth, alignSelf: "center" }}
    >
      {/* Stamp container */}
      <View
        style={{
          backgroundColor: stampColors.cream,
          borderRadius: 4,
          borderWidth: 2.5,
          borderColor: categoryTagColor,
          shadowColor: "#000",
          shadowOpacity: 0.18,
          shadowRadius: 6,
          shadowOffset: { width: 2, height: 3 },
          elevation: 5,
          overflow: "visible",
          position: "relative",
        }}
      >
        {/* Perforated edges - Top */}
        <View
          style={{
            position: "absolute",
            top: -4,
            left: 4,
            right: 4,
            height: 8,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {PERF_HORIZONTAL.map((i) => (
            <View
              key={`top-${i}`}
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: "#E8E4DF",
              }}
            />
          ))}
        </View>

        {/* Perforated edges - Bottom */}
        <View
          style={{
            position: "absolute",
            bottom: -4,
            left: 4,
            right: 4,
            height: 8,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {PERF_HORIZONTAL.map((i) => (
            <View
              key={`bottom-${i}`}
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: "#E8E4DF",
              }}
            />
          ))}
        </View>

        {/* Perforated edges - Left */}
        <View
          style={{
            position: "absolute",
            left: -4,
            top: 4,
            bottom: 4,
            width: 8,
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {PERF_VERTICAL.map((i) => (
            <View
              key={`left-${i}`}
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: "#E8E4DF",
              }}
            />
          ))}
        </View>

        {/* Perforated edges - Right */}
        <View
          style={{
            position: "absolute",
            right: -4,
            top: 4,
            bottom: 4,
            width: 8,
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {PERF_VERTICAL.map((i) => (
            <View
              key={`right-${i}`}
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: "#E8E4DF",
              }}
            />
          ))}
        </View>

        {/* Inner decorative frame */}
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 6,
            left: 6,
            right: 6,
            bottom: 6,
            borderWidth: 1,
            borderColor: stampColors.goldFoil,
            opacity: 0.5,
          }}
        />

        {/* Category tag - top right corner, slanted */}
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 7,
            right: 7,
   
            backgroundColor: categoryTagColor,
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 3,
            zIndex: 20,
          }}
        >
          <Text
            style={[
              {
                color: "#FFF",
                fontSize: 9,
                fontWeight: "800",
                letterSpacing: 0.5,
                textTransform: "uppercase",
              },
              FONT,
            ]}
          >
            {item.category}
          </Text>
        </View>

        {/* Main content area */}
        <View style={{ padding: 12 }}>
          {/* Image container with vintage vignette style */}
          <View
            style={{
              width: "100%",
              aspectRatio: 1,
              backgroundColor: stampColors.paper,
              borderRadius: 3,
              borderWidth: 1,
              borderColor: "rgba(0,0,0,0.08)",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 10,
              overflow: "hidden",
            }}
          >
            <Image
              source={images[item.id as keyof typeof images] ?? images.lighting}
              resizeMode="contain"
              style={{ width: 90, height: 90 }}
            />
          </View>

          {/* Name */}
          <Text
            style={[
              {
                color: stampColors.inkBrown,
                fontSize: 12,
                fontWeight: "700",
                textAlign: "center",
                letterSpacing: 0.5,
                textTransform: "uppercase",
                lineHeight: 15,
              },
              FONT,
            ]}
            numberOfLines={2}
          >
            {name}
          </Text>
        </View>
      </View>

      {/* Price below stamp */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          marginTop: 12,
        }}
      >
        <Image
          source={images.token}
          style={{ width: 15, height: 15, marginRight: 4 }}
          resizeMode="contain"
        />
        <Text
          style={[
            {
              color: stampColors.mutedInk,
              fontSize: 14,
              fontWeight: "700",
            },
            FONT,
          ]}
        >
          {priceCoins.toLocaleString()}
        </Text>
      </View>
    </TouchableOpacity>
  );
});

export default Tile;
