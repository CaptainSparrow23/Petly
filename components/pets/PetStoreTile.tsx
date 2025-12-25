import React from "react";
import { Image, Text, TouchableOpacity, View, ViewStyle } from "react-native";
import { CoralPalette } from "@/constants/colors";
import { petAnimations } from "@/constants/animations";
import PetAnimation from "@/components/focus/PetAnimation";
import images from "@/constants/images";

const FONT = { fontFamily: "Nunito" };

const DEFAULT_TILE_RIVE_STYLE = {
  containerStyle: { width: "100%", height: "100%" } as ViewStyle,
  animationStyle: { width: "200%", height: "200%" } as ViewStyle,
};

const TILE_RIVE_STYLES: Record<string, { containerStyle: ViewStyle; animationStyle: ViewStyle }> = {
  pet_smurf: {
    containerStyle: { width: "100%", height: "100%" },
    animationStyle: { width: "200%", height: "200%", transform: [{ translateX: 0 }, { translateY: 18 }] },
  },
  pet_chedrick: {
    containerStyle: { width: "100%", height: "100%" },
    animationStyle: { width: "200%", height: "200%", transform: [{ translateX: 5 }, { translateY: 50 }] },
  },
  pet_pebbles: {
    containerStyle: { width: "100%", height: "100%" },
    animationStyle: { width: "200%", height: "200%", transform: [{ translateX: 3 }, { translateY: 55 }] },
  },
  pet_gooner: {
    containerStyle: { width: "100%", height: "100%" },
    animationStyle: { width: "200%", height: "200%", transform: [{ translateX: 0 }, { translateY: 65 }] },
  },
  pet_kitty: {
    containerStyle: { width: "100%", height: "100%" },
    animationStyle: { width: "200%", height: "200%", transform: [{ translateX: 5 }, { translateY: 55 }] },
  },
};

type Props = {
  petId: string;
  name: string;
  priceKeys?: number;
  onPress?: () => void;
  height?: number;
};

export default function PetStoreTile({ petId, name, priceKeys, onPress, height = 220 }: Props) {
  const config = petAnimations[petId];
  const source = config?.altSource ?? config?.source;
  const riveStyle = TILE_RIVE_STYLES[petId] ?? DEFAULT_TILE_RIVE_STYLE;

  const content = (
    <View style={{ flex: 1 }}>
      <View
        style={{
          height,
          borderRadius: 5,
          backgroundColor: CoralPalette.white,
          shadowColor: "#000",
          shadowOpacity: 0.1,
          shadowOffset: { width: 0, height: 4 },
          shadowRadius: 10,
          elevation: 5,
        }}
      >
        <View style={{ flex: 1, borderRadius: 5, overflow: "hidden", padding: 12 }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <View
            style={{
              width: "100%",
              height: "100%",
              borderRadius: 0,
              backgroundColor: CoralPalette.greyLighter,
              overflow: "hidden",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <PetAnimation
              source={source}
              stateMachineName={config?.stateMachineName}
              focusInputName={config?.focusInputName}
              focusValue={0}
              containerStyle={riveStyle.containerStyle}
              animationStyle={riveStyle.animationStyle}
            />
          </View>
        </View>

        <View style={{ flex: 0.2, alignItems: "center", justifyContent: "center", paddingTop: 8 }}>
          <Text style={[FONT, { fontSize: 16, fontWeight: "800", color: CoralPalette.dark }]} numberOfLines={1}>
            {name}
          </Text>
        </View>
        </View>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 10 }}>
        <Image source={images.key} style={{ width: 15, height: 15, marginRight: 10 }} resizeMode="contain" />
        <Text style={[FONT, { color: CoralPalette.dark, fontSize: 14, fontWeight: "800" }]}>
          {(priceKeys ?? 1).toLocaleString()}
        </Text>
      </View>
    </View>
  );

  if (!onPress) return content;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={{ flex: 1 }}>
      {content}
    </TouchableOpacity>
  );
}
