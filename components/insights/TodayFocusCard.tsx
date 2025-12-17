import React, { useMemo, useRef, useEffect, useState, useCallback } from "react";
import { View, Text, InteractionManager } from "react-native";
import { useFocusEffect } from "expo-router";
import { Easing, runOnJS, useDerivedValue, useSharedValue, withTiming } from "react-native-reanimated";
import { useGlobalContext } from "@/lib/GlobalProvider";
import { CoralPalette } from "@/constants/colors";
import Rive, { Fit, RiveRef } from "rive-react-native";
import smurfAlt from "@/assets/animations/smurfAlt.riv";
import chedrickAlt from "@/assets/animations/chedrickAlt.riv";
import pebblesAlt from "@/assets/animations/pebblesAlt.riv";
import goonerAlt from "@/assets/animations/goonerAlt.riv";
import kittyAlt from "@/assets/animations/kittyAlt.riv";

const FONT = { fontFamily: "Nunito" };
const CARD_SHADOW = {
  shadowColor: "#191d31",
  shadowOpacity: 0.25,
  shadowOffset: { width: 3, height: 5},
  shadowRadius: 2,
  elevation: 10,
};

type PetAnimationStyle = {
  width: number;
  height: number;
  translateX: number;
  translateY: number;
};

const PET_ANIMATION_STYLE: Record<string, PetAnimationStyle> = {
  default: {
    width: 320,
    height: 220,
    translateX: -80,
    translateY: 5,
  },
  pet_smurf: {
    width: 320,
    height: 220,
    translateX: -80,
    translateY: 5,
  },
  pet_chedrick: {
    width: 330,
    height: 230,
    translateX: -94,
    translateY: -20,
  },
  pet_pebbles: {
    width: 280,
    height: 230,
    translateX: -72,
    translateY: -21,
  },
  pet_gooner: {
    width: 325,
    height: 240,
    translateX: -95,
    translateY: -5,
  },
  pet_kitty: {
    width: 325,
    height: 250,
    translateX: -89,
    translateY: -20,
  },
};

const parseTimeStringToSeconds = (timeString?: string | null) => {
  if (!timeString) return 0;
  const minuteMatch = timeString.match(/(\d+)\s*min/);
  const secondMatch = timeString.match(/(\d+)\s*sec/);
  const minutes = minuteMatch ? parseInt(minuteMatch[1], 10) : 0;
  const seconds = secondMatch ? parseInt(secondMatch[1], 10) : 0;
  return minutes * 60 + seconds;
};

const truncateToSingleDecimal = (value: number) => Math.floor(value * 10) / 10;

const formatSingleUnit = (totalSeconds: number, showHours: boolean) => {
  const secs = Math.max(0, Math.floor(totalSeconds));

  // If user prefers hours, always show in hours

  if (showHours && secs <= 60) {
    return "0 hr";
  }

  if (showHours) {
    const hours = truncateToSingleDecimal(secs / 3600);
    return `${hours.toFixed(1)} hr`;
  }

  // Default behavior: auto-scale based on duration
  if (secs >= 3600) {
    const hours = truncateToSingleDecimal(secs / 3600);
    return `${hours.toFixed(1)} hr`;
  }

  if (secs >= 60) {
    return `${Math.floor(secs / 60)} m`;
  }

  if (secs === 0) {
    return "0 m";
  }

  return `${secs} s`;
};

export default function TodayFocusCard() {
  const { userProfile, appSettings } = useGlobalContext();
  const riveRef = useRef<RiveRef | null>(null);
  const selectedPet = userProfile?.selectedPet ?? null;
  const showHours = appSettings.displayFocusInHours;
  const anim = useSharedValue(0);
  const [displaySeconds, setDisplaySeconds] = useState(0);

  // Support both correct and misspelled field names; accept number (secs) or a "Xm Ys" string.
  const raw = userProfile?.timeActiveToday ?? 0;

  const totalSeconds = useMemo(() => {
    if (typeof raw === 'number') return Math.max(0, Math.floor(raw));       // assume seconds
    if (typeof raw === 'string') return parseTimeStringToSeconds(raw);       // parse "mins / secs"
    return 0;
  }, [raw]);

  // Animate from previous value to the latest totalSeconds on mount and every time screen gains focus
  useFocusEffect(
    useCallback(() => {
      anim.value = 0;
      anim.value = withTiming(totalSeconds, {
        duration: 600,
        easing: Easing.out(Easing.cubic),
      });
      return () => {};
    }, [anim, totalSeconds])
  );

  useDerivedValue(() => {
    runOnJS(setDisplaySeconds)(anim.value);
  }, [anim]);

  const durationLabel = useMemo(
    () => formatSingleUnit(displaySeconds, showHours),
    [displaySeconds, showHours]
  );
  const statusMessage = useMemo(() => {
    if (displaySeconds < 1800) return "Get back to work!";
    if (displaySeconds < 3600) return "Keep working hard!";
    if (displaySeconds < 7200) return "You're doing great!";
    if (displaySeconds < 10800) return "Amazing work today!";
    if (displaySeconds < 14400) return "You workaholic!";
    return "Maybe a break now?";
  }, [displaySeconds]);

  const moodValue = useMemo(() => {
    if (totalSeconds < 1800) return 1;
    if (totalSeconds < 3600) return 2;
    return 3;
  }, [totalSeconds]);




  const insightsAnimations: Record<
    string,
    { source: number; stateMachineName: string; moodInputName: string }
  > = {
    pet_smurf: { source: smurfAlt, stateMachineName: "State Machine 1", moodInputName: "mood" },
    pet_chedrick: { source: chedrickAlt, stateMachineName: "State Machine 1", moodInputName: "mood" },
    pet_pebbles: { source: pebblesAlt, stateMachineName: "State Machine 1", moodInputName: "mood" },
    pet_gooner: { source: goonerAlt, stateMachineName: "State Machine 1", moodInputName: "mood" },
    pet_kitty: { source: kittyAlt, stateMachineName: "State Machine 1", moodInputName: "mood" },
    // add additional pets here, keyed by pet id
  };

  const animationConfig = useMemo(
    () => (selectedPet ? insightsAnimations[selectedPet] : undefined),
    [insightsAnimations, selectedPet]
  );

  const animationStyle = useMemo(() => {
    if (!selectedPet) return PET_ANIMATION_STYLE.default;
    return PET_ANIMATION_STYLE[selectedPet] ?? PET_ANIMATION_STYLE.default;
  }, [selectedPet]);

  useEffect(() => {
    if (!riveRef.current || !animationConfig) return;

    const applyMood = () => {
      try {
        riveRef.current?.setInputState(
          animationConfig.stateMachineName,
          animationConfig.moodInputName,
          moodValue
        );
      } catch {
        // ignore if state machine/input not available yet
      }
    };

    applyMood();
    const interactionHandle = InteractionManager.runAfterInteractions(applyMood);
    const timer = setTimeout(applyMood, 120);

    return () => {
      interactionHandle?.cancel?.();
      clearTimeout(timer);
    };
  }, [animationConfig, moodValue]);

  return (
    <View style={{ width: "65%", position: "relative" }}>
      {animationConfig ? (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 150,
            height: 122.5,
            opacity: 0.9,
            overflow: "hidden",
            zIndex: 1,
          }}
        >
          <Rive
            ref={riveRef}
            source={animationConfig.source}
            stateMachineName={animationConfig.stateMachineName}
            fit={Fit.Contain}
            style={{
              width: animationStyle.width,
              height: animationStyle.height,
              transform: [
                { translateX: animationStyle.translateX },
                { translateY: animationStyle.translateY },
              ],
            }}
            autoplay
          />
        </View>
      ) : null}

      <View
        className="p-4"
        style={[
          { borderRadius: 5, backgroundColor: CoralPalette.surfaceAlt, borderColor: CoralPalette.lightGrey, borderWidth: 1, minHeight: 120 },
          CARD_SHADOW,
        ]}
      >
        <View className="items-end">
          <Text style={[{ color: CoralPalette.mutedDark, fontSize: 16 }, FONT]}>Today's Focus</Text>
        </View>

        <Text className="" style={[{ fontSize: 40, fontWeight: "800", color: CoralPalette.dark, textAlign: "right" }, FONT]}>
          {durationLabel}
        </Text>
        <Text className="text-right" style={[{ fontSize: 11, color: CoralPalette.primary, fontWeight: "700" }, FONT]}>
          {statusMessage}
        </Text>
      </View>
    </View>
  );
}
