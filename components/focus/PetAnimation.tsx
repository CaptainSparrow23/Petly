import React, { useEffect, useRef } from "react";
import { View, ViewStyle } from "react-native";
import Rive, { Fit } from "rive-react-native";

// Mapping of accessory IDs to Rive input numbers
const HAT_INPUT_MAP: Record<string, number> = {
  hat_minty_beanie: 1,
  hat_honey_beanie: 2,
  hat_lilac_beanie: 3,
  hat_vanilla_beanie: 4,
};

const COLLAR_INPUT_MAP: Record<string, number> = {
  collar_icy_scarf: 1,
  collar_sunset_scarf: 2,
  collar_gooseberry_scarf: 3,
  collar_snow_scarf: 4,
};

type Props = {
  source?: number;
  containerStyle?: ViewStyle;
  animationStyle?: ViewStyle;
  stateMachineName?: string;
  focusInputName?: string;
  isFocus?: boolean;
  selectedHat?: string | null;
  selectedCollar?: string | null;
};

const PetAnimation: React.FC<Props> = ({
  source,
  containerStyle,
  animationStyle,
  stateMachineName,
  focusInputName,
  isFocus = false,
  selectedHat = null,
  selectedCollar = null,
}) => {
  if (!source) return null;

  const riveRef = useRef<any>(null);

  // Set inputs with a small delay to ensure Rive is ready
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!riveRef.current || !stateMachineName) return;
      try {
        console.log(`🎬 Rive ref exists: ${!!riveRef.current}`);
        console.log(`🎬 State machine: ${stateMachineName}`);
        
        if (focusInputName) {
          riveRef.current.setInputState(stateMachineName, focusInputName, isFocus);
        }
        const hatValue = selectedHat ? (HAT_INPUT_MAP[selectedHat] ?? 0) : 0;
        console.log(`🎩 Setting hat: "${selectedHat}" -> ${hatValue}`);
        riveRef.current.setInputState(stateMachineName, "hat", hatValue);
        
        const collarValue = selectedCollar ? (COLLAR_INPUT_MAP[selectedCollar] ?? 0) : 0;
        console.log(`🧣 Setting collar: "${selectedCollar}" -> ${collarValue}`);
        const collarResult = riveRef.current.setInputState(stateMachineName, "collar", collarValue);
        console.log(`🧣 Collar setInputState result:`, collarResult);
      } catch (e) {
        console.error("❌ Error setting Rive inputs:", e);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [stateMachineName, focusInputName, isFocus, selectedHat, selectedCollar]);

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
