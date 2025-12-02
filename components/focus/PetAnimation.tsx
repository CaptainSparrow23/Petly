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
  const riveRef = useRef<any>(null);
  const isReady = useRef(false);
  const lastSource = useRef(source);

  // Reset isReady when source changes (new pet animation)
  if (source !== lastSource.current) {
    isReady.current = false;
    lastSource.current = source;
  }

  // Keep latest props in refs so we always apply current values
  const propsRef = useRef({ stateMachineName, focusInputName, isFocus, selectedHat, selectedCollar });
  propsRef.current = { stateMachineName, focusInputName, isFocus, selectedHat, selectedCollar };

  const applyInputs = () => {
    const { stateMachineName, focusInputName, isFocus, selectedHat, selectedCollar } = propsRef.current;
    if (!riveRef.current || !stateMachineName) return;

    try {
      if (focusInputName) {
        riveRef.current.setInputState(stateMachineName, focusInputName, isFocus);
      }
      const hatValue = selectedHat ? HAT_INPUT_MAP[selectedHat] ?? 0 : 0;
      riveRef.current.setInputState(stateMachineName, "hat", hatValue);

      const collarValue = selectedCollar ? COLLAR_INPUT_MAP[selectedCollar] ?? 0 : 0;
      riveRef.current.setInputState(stateMachineName, "collar", collarValue);
    } catch {
      // ignore
    }
  };

  // Apply inputs when props change (only after Rive is ready)
  useEffect(() => {
    if (isReady.current) {
      applyInputs();
    }
  }, [stateMachineName, focusInputName, isFocus, selectedHat, selectedCollar]);

  const handlePlay = () => {
    if (isReady.current) return;
    
    // Delay to ensure state machine is ready
    setTimeout(() => {
      isReady.current = true;
      applyInputs();
    }, 100);
  };

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
        ref={riveRef}
        source={source}
        stateMachineName={stateMachineName}
        onPlay={handlePlay}
        style={animationStyle}
        fit={Fit.Contain}
        autoplay
      />
    </View>
  );
};

export default PetAnimation;
