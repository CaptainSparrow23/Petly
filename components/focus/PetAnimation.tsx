import React, { useEffect, useRef } from "react";
import { View, ViewStyle } from "react-native";
import Rive, { Fit } from "rive-react-native";

// Mapping of accessory IDs to Rive input numbers
const HAT_INPUT_MAP: Record<string, number> = {
  hat_beanie_minty: 1,
  hat_beanie_sunset: 2,
  hat_beanie_lilac: 3,
  hat_beanie_snow: 4,
  hat_bucket_hat: 5,
  hat_bucket_hat_blue: 6,
  hat_bucket_hat_green: 7,
  hat_top_hat_red: 8,
  hat_top_hat_silk: 9,
  hat_toque_blanche: 10,
  hat_flower_crown_spring: 11,
  hat_flower_crown_winter: 12,
  hat_wig_composer: 13,
};

const COLLAR_INPUT_MAP: Record<string, number> = {
  collar_scarf_minty: 1,
  collar_scarf_sunset: 2,
  collar_scarf_lilac: 3,
  collar_scarf_snow: 4,
  collar_standard_champion: 5,
  collar_standard_leather: 6,
  collar_standard_ocean: 7,
  collar_bow_tie_red: 8,
  collar_bow_tie_silk: 9,
  collar_chefs_coat: 10,
  collar_wings_fairy: 11,
  collar_bandana_navy: 12,
  collar_bandana_red: 13,
  collar_standard_dream: 14,
  collar_bandana_desert: 15,
  collar_bandana_forest: 16,
  collar_attire_composer: 17,
};

type Props = {
  source?: number;
  containerStyle?: ViewStyle;
  animationStyle?: ViewStyle;
  stateMachineName?: string;
  focusInputName?: string;
  focusValue?: number;
  selectedHat?: string | null;
  selectedCollar?: string | null;
};

const PetAnimation: React.FC<Props> = ({
  source,
  containerStyle,
  animationStyle,
  stateMachineName,
  focusInputName,
  focusValue = 0,
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
  const propsRef = useRef({ stateMachineName, focusInputName, focusValue, selectedHat, selectedCollar });
  propsRef.current = { stateMachineName, focusInputName, focusValue, selectedHat, selectedCollar };

  const applyInputs = () => {
    const { stateMachineName, focusInputName, focusValue, selectedHat, selectedCollar } = propsRef.current;
    if (!riveRef.current || !stateMachineName) return;

    try {
      // Set focus input - supports both boolean (legacy) and number (new) types
      if (focusInputName) {
        try {
          // Try setting as number first (new format: 0=idle, 1=laptop, 2=pot_and_stove)
          riveRef.current.setInputState(stateMachineName, focusInputName, focusValue);
        } catch {
          // Fall back to boolean for legacy .riv files
          console.log("⚠️ Focus input may still be boolean type in .riv file");
          riveRef.current.setInputState(stateMachineName, focusInputName, focusValue > 0);
        }
      }
      const hatValue = selectedHat ? HAT_INPUT_MAP[selectedHat] ?? 0 : 0;
      console.log(`🎩 Hat: ${selectedHat} -> Rive input: ${hatValue}`);
      riveRef.current.setInputState(stateMachineName, "hat", hatValue);

      const collarValue = selectedCollar ? COLLAR_INPUT_MAP[selectedCollar] ?? 0 : 0;
      riveRef.current.setInputState(stateMachineName, "collar", collarValue);
    } catch (e) {
      console.error("❌ Error applying Rive inputs:", e);
    }
  };

  // Apply inputs when props change (only after Rive is ready)
  useEffect(() => {
    if (isReady.current) {
      applyInputs();
    }
  }, [stateMachineName, focusInputName, focusValue, selectedHat, selectedCollar]);

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
