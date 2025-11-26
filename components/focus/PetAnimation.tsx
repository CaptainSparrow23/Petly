import React, { useEffect, useRef } from "react";
import { View, ViewStyle } from "react-native";
import Rive, { Fit } from "rive-react-native";

type Props = {
  source?: number;
  containerStyle?: ViewStyle;
  animationStyle?: ViewStyle;
  stateMachineName?: string;
  focusInputName?: string;
  isFocus?: boolean;
};

const PetAnimation: React.FC<Props> = ({
  source,
  containerStyle,
  animationStyle,
  stateMachineName,
  focusInputName,
  isFocus = false,
}) => {
  if (!source) return null;

  const riveRef = useRef<any>(null);

  useEffect(() => {
    if (!riveRef.current || !stateMachineName || !focusInputName) return;
    try {
      riveRef.current.setInputState(stateMachineName, focusInputName, isFocus);
    } catch (err) {
      // noop; if state machine/input not found, we simply skip toggling
    }
  }, [focusInputName, isFocus, stateMachineName]);

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
        ref={riveRef}
        source={source}
        stateMachineName={stateMachineName}
        style={animationStyle}
        fit={Fit.Contain}
        autoplay
      />
    </View>
  );
};

export default PetAnimation;
