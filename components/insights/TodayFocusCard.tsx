import React, { useMemo, useRef, useEffect } from "react";
import { View, Text, InteractionManager } from "react-native";
import { useGlobalContext } from "@/lib/GlobalProvider";
import { CoralPalette } from "@/constants/colors";
import Rive, { Fit, RiveRef } from "rive-react-native";
import smurfInsights from "@/assets/animations/smurf_insights.riv";
import chedrickInsights from "@/assets/animations/chedrick_insights.riv";
import pebblesInsights from "@/assets/animations/pebbles_insights.riv";
import goonerInsights from "@/assets/animations/gooner_insights.riv";

const FONT = { fontFamily: "Nunito" };

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
    height: 240,
    translateX: -89,
    translateY: -17,
  },
  pet_pebbles: {
    width: 280,
    height: 250,
    translateX: -67,
    translateY: -21,
  },
  pet_gooner: {
    width: 325,
    height: 240,
    translateX: -88,
    translateY: -5,
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

const formatSingleUnit = (totalSeconds: number) => {
  const secs = Math.max(0, Math.floor(totalSeconds));

  if (secs >= 3600) {
    const hours = truncateToSingleDecimal(secs / 3600);
    return `${hours.toFixed(1)} hr`;
  }

  if (secs >= 60) {
    return `${Math.floor(secs / 60)} m`;
  }

  return `${secs} s`;
};

export default function TodayFocusCard() {
  const { userProfile } = useGlobalContext();
  const riveRef = useRef<RiveRef | null>(null);
  const selectedPet = userProfile?.selectedPet ?? null;

  // Support both correct and misspelled field names; accept number (secs) or a "Xm Ys" string.
  const raw = userProfile?.timeActiveToday ?? 0;

  const totalSeconds = useMemo(() => {
    if (typeof raw === 'number') return Math.max(0, Math.floor(raw));       // assume seconds
    if (typeof raw === 'string') return parseTimeStringToSeconds(raw);       // parse "mins / secs"
    return 0;
  }, [raw]);

  const durationLabel = useMemo(() => formatSingleUnit(totalSeconds), [totalSeconds]);
  const statusMessage = useMemo(() => {
    if (totalSeconds < 1800) return "Get back to work!";
    if (totalSeconds < 3600) return "Keep working hard!";
    if (totalSeconds < 7200) return "You're doing great!";
    if (totalSeconds < 10800) return "Amazing work today!";
    if (totalSeconds < 14400) return "You workaholic!";
    return "Maybe a break now?";
  }, [totalSeconds]);

  const moodValue = useMemo(() => {
    if (totalSeconds < 1800) return 1;
    if (totalSeconds < 5400) return 2;
    return 3;
  }, [totalSeconds]);




  const insightsAnimations: Record<
    string,
    { source: number; stateMachineName: string; moodInputName: string }
  > = {
    pet_smurf: { source: smurfInsights, stateMachineName: "State Machine 1", moodInputName: "mood" },
    pet_chedrick: { source: chedrickInsights, stateMachineName: "State Machine 1", moodInputName: "mood" },
    pet_pebbles: { source: pebblesInsights, stateMachineName: "State Machine 1", moodInputName: "mood" },
    pet_gooner: { source: goonerInsights, stateMachineName: "State Machine 1", moodInputName: "mood" },
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
            height: 123.5,
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
        className="rounded-3xl p-4"
        style={{ backgroundColor: CoralPalette.surfaceAlt, borderColor: CoralPalette.border, borderWidth: 1 }}
      >
        <View className="items-end">
          <Text style={[{ color: CoralPalette.mutedDark, fontSize: 16 }, FONT]}>Today's Focus</Text>
        </View>

        <Text className="" style={[{ fontSize: 40, fontWeight: "800", color: CoralPalette.dark, textAlign: "right" }, FONT]}>
          {durationLabel}
        </Text>
        <Text className="text-right" style={[{ fontSize: 13, color: CoralPalette.primary, fontWeight: "700" }, FONT]}>
          {statusMessage}
        </Text>
      </View>
    </View>
  );
}
