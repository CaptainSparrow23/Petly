import React from "react";
import { View, ViewStyle } from "react-native";
import Rive, { Fit } from "rive-react-native";

type Props = {
  source?: number;
  containerStyle?: ViewStyle;
  animationStyle?: ViewStyle;
};

const PetAnimation: React.FC<Props> = ({ source, containerStyle, animationStyle }) => {
  if (!source) return null;

  return (
    <View
      style={[
        {
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
        },
        containerStyle,
      ]}
    >
      <Rive
        source={source}
        style={[{ width: "100%", height: "100%" }, animationStyle]}
        fit={Fit.Contain}
        autoplay
      />
    </View>
  );
};

export default PetAnimation;
