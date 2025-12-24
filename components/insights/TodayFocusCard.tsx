import React, { useMemo, useRef, useEffect, useState, useCallback } from "react";
import { View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import { useGlobalContext } from "@/providers/GlobalProvider";
import { CoralPalette } from "@/constants/colors";
import Rive, { Fit, RiveRef } from "rive-react-native";
import { petAnimations } from "@/constants/animations";

const FONT = { fontFamily: "Nunito" };

type PetAnimationStyle = {
  width: number;
  height: number;
  translateX: number;
  translateY: number;
};

const PET_ANIMATION_STYLE: Record<string, PetAnimationStyle> = {
  default: {
    width: 500,
    height: 220,
    translateX: 0,
    translateY: 5,
  },
  pet_smurf: {
    width: 300,
    height: 270,
    translateX: 0,
    translateY: 20,
  },
  pet_chedrick: {
    width: 300,
    height: 300,
    translateX: 0,
    translateY: 0,
  },
  pet_pebbles: {
    width: 300,
    height: 300,
    translateX: -20,
    translateY: 0,
  },
  pet_gooner: {
    width: 300,
    height: 270,
    translateX: 0,
    translateY: 10,
  },
  pet_kitty: {
    width: 325,
    height: 270,
    translateX: 0,
    translateY: 0,
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

// Format time as short string: "x h x m" (only show units if != 0)
const formatFullTimeString = (totalSeconds: number) => {
  const secs = Math.max(0, Math.floor(totalSeconds));
  
  const hours = Math.floor(secs / 3600);
  const mins = Math.floor((secs % 3600) / 60);
  
  // If no time at all, show "No time"
  if (hours === 0 && mins === 0) {
    return "No time";
  }
  
  const parts: string[] = [];
  
  if (hours > 0) {
    parts.push(`${hours}h`);
  }
  if (mins > 0) {
    parts.push(`${mins}m`);
  }
  
  return parts.join(' ');
};

export default function TodayFocusCard() {
  const { userProfile } = useGlobalContext();
  const riveRef = useRef<RiveRef | null>(null);
  const isMountedRef = useRef(true);
  const [riveReady, setRiveReady] = useState(false);
  const [riveKey, setRiveKey] = useState(0);
  const selectedPet = userProfile?.selectedPet ?? null;

  // Track mounted state to prevent Rive errors on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      riveRef.current = null;
      setRiveReady(false);
    };
  }, []);

  // Force Rive remount when screen gains focus (handles tab switching)
  useFocusEffect(
    useCallback(() => {
      // Reset Rive state and increment key to force fresh mount
      setRiveReady(false);
      riveRef.current = null;
      setRiveKey((k) => k + 1);
    }, [])
  );

  // Reset riveReady when pet changes (new Rive instance will be created)
  useEffect(() => {
    setRiveReady(false);
  }, [selectedPet]);

  // Support both correct and misspelled field names; accept number (secs) or a "Xm Ys" string.
  const raw = userProfile?.timeActiveToday ?? 0;

  const totalSeconds = useMemo(() => {
    if (typeof raw === 'number') return Math.max(0, Math.floor(raw));       // assume seconds
    if (typeof raw === 'string') return parseTimeStringToSeconds(raw);       // parse "mins / secs"
    return 0;
  }, [raw]);

  const durationLabel = useMemo(
    () => formatFullTimeString(totalSeconds),
    [totalSeconds]
  );
  
  const statusMessage = useMemo(() => {
    if (totalSeconds < 1800) return "Let's get focused! 💪";
    if (totalSeconds < 3600) return "Good progress! Keep going 🚀";
    if (totalSeconds < 7200) return "You're on fire today! 🔥";
    if (totalSeconds < 10800) return "Amazing dedication! ⭐";
    if (totalSeconds < 14400) return "Productivity champion! 🏆";
    return "Incredible work! Take a break 🌟";
  }, [totalSeconds]);

  const moodValue = useMemo(() => {
    if (totalSeconds < 1800) return 1;
    if (totalSeconds < 3600) return 2;
    return 3;
  }, [totalSeconds]);

  const animationConfig = useMemo(() => {
    if (!selectedPet) return undefined;
    const config = petAnimations[selectedPet];
    if (!config) return undefined;
    return {
      source: config.altSource ?? config.source,
      stateMachineName: config.stateMachineName ?? "State Machine 1",
      moodInputName: "mood",
    };
  }, [selectedPet]);

  const animationStyle = useMemo(() => {
    if (!selectedPet) return PET_ANIMATION_STYLE.default;
    return PET_ANIMATION_STYLE[selectedPet] ?? PET_ANIMATION_STYLE.default;
  }, [selectedPet]);

  // Apply mood when Rive is ready or when moodValue changes
  const applyMood = useCallback(() => {
    if (!isMountedRef.current || !riveRef.current || !animationConfig) return;
    
    try {
      riveRef.current.setInputState(
        animationConfig.stateMachineName,
        animationConfig.moodInputName,
        moodValue
      );
    } catch {
      // ignore if state machine/input not available yet
    }
  }, [animationConfig, moodValue]);

  // Called when Rive animation starts playing (ready to accept input)
  const handleRivePlay = useCallback(() => {
    if (!isMountedRef.current) return;
    setRiveReady(true);
    // Small delay to ensure state machine is fully initialized
    setTimeout(() => {
      if (isMountedRef.current) applyMood();
    }, 50);
  }, [applyMood]);

  // Apply mood whenever it changes (after Rive is ready)
  useEffect(() => {
    if (riveReady) {
      applyMood();
    }
  }, [riveReady, applyMood]);

  return (
    <View
      style={{
        borderRadius: 16,
        overflow: "hidden",
        shadowColor: CoralPalette.primary,
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 6 },
        shadowRadius: 12,
        elevation: 12,
      }}
    >
      <LinearGradient
        colors={[CoralPalette.primary, CoralPalette.primaryMuted]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          height: 150,
          padding: 20,
          position: "relative",
        }}
      >
        {/* Decorative circles */}
        <View
          style={{
            position: "absolute",
            top: -30,
            right: -30,
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: "rgba(255,255,255,0.1)",
          }}
        />
        <View
          style={{
            position: "absolute",
            bottom: -40,
            left: -20,
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: "rgba(255,255,255,0.08)",
          }}
        />

        {/* Content */}
        <View style={{ zIndex: 1 }}>
          <Text style={[{ color: "rgba(255,255,255,0.9)", fontSize: 14, fontWeight: "600", letterSpacing: 0.5 }, FONT]}>
            TODAY'S FOCUS
          </Text>
          <Text style={[{ fontSize: 36, fontWeight: "800", color: "#fff", marginTop: 4 }, FONT]}>
            {durationLabel}
          </Text>
          <View
            style={{
              backgroundColor: "rgba(255,255,255,0.2)",
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 20,
              alignSelf: "flex-start",
              marginTop: 8,
            }}
          >
            <Text style={[{ fontSize: 12, color: "#fff", fontWeight: "600" }, FONT]}>
              {statusMessage}
            </Text>
          </View>
        </View>

        {/* Pet Animation */}
        {animationConfig ? (
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              right: -10,
              top: 80,
              bottom: 0,
              width: 180,
              opacity: 0.95,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Rive
              key={`rive-${selectedPet}-${riveKey}`}
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
              onPlay={handleRivePlay}
            />
          </View>
        ) : null}
      </LinearGradient>
    </View>
  );
}
