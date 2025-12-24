import React from "react";
import { View } from "react-native";
import { CoralPalette } from "@/constants/colors";

type DividerProps = {
  marginTop?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;

  
  opacity?: number;
  color?: string;
};

export default function Divider({
  marginTop = 8,
  marginBottom = 8,
  marginLeft = 0,
  marginRight = 0,
  opacity = 0.6,
  color = CoralPalette.greyMedium,
}: DividerProps) {
  return (
    <View
      style={{
        height: 1,
        width: "100%",
        backgroundColor: color,
        opacity,
        marginTop,
        marginBottom,
        marginLeft,
        marginRight,
      }}
    />
  );
}
