import React, { useEffect, useRef, useState } from "react";
import { Modal, View, Text, TouchableOpacity, Animated, useWindowDimensions } from "react-native";
import { CoralPalette } from "@/constants/colors";
import * as Haptics from 'expo-haptics';
import { useGlobalContext } from '@/lib/GlobalProvider';

type Props = {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ConfirmStopModal({ visible, onCancel, onConfirm }: Props) {
  const { appSettings } = useGlobalContext();
  const { height } = useWindowDimensions();
  const [mounted, setMounted] = useState(visible);
  const anim = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const visibleRef = useRef(visible);
  const cancelButtonScale = useRef(new Animated.Value(1)).current;
  const confirmButtonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    visibleRef.current = visible;
    anim.stopAnimation();

    if (visible) {
      setMounted(true);
      Animated.timing(anim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(anim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished && !visibleRef.current) setMounted(false);
      });
    }
  }, [visible, anim]);

  const backdropOpacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [height, 0],
  });

  // Button press animation handlers
  const handleCancelPressIn = () => {
    if (appSettings.vibrations) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    Animated.spring(cancelButtonScale, {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handleCancelPressOut = () => {
    Animated.spring(cancelButtonScale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handleConfirmPressIn = () => {
    if (appSettings.vibrations) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    Animated.spring(confirmButtonScale, {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handleConfirmPressOut = () => {
    Animated.spring(confirmButtonScale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  if (!mounted) return null;

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onCancel}>
      <Animated.View
        className="flex-1"
        style={{ backgroundColor: "rgba(0,0,0,0.5)", opacity: backdropOpacity }}
      >
        <View className="flex-1 items-center justify-center px-2 pb-4">
          <Animated.View
            className="flex-col items-center rounded-2xl p-5 w-[65%] max-w-md"
            style={{
              backgroundColor: CoralPalette.greyLighter,
              transform: [{ translateY }],
            }}
          >
            <Text className="text-xl font-semibold mb-2" style={{ color: CoralPalette.dark, fontFamily: "Nunito" }}>
              End session?
            </Text>
            <Text className="mb-3 py-2 text-center" style={{ color: CoralPalette.mutedDark, fontFamily: "Nunito" }}>
              This will reset the timer
            </Text>
            <View className="flex-row justify-center gap-3">
              <Animated.View
                style={{
                  transform: [{ scale: cancelButtonScale }],
                  flex: 1,
                }}
              >
                <TouchableOpacity
                  onPress={onCancel}
                  onPressIn={handleCancelPressIn}
                  onPressOut={handleCancelPressOut}
                  className="py-3 rounded-2xl"
                  style={{ 
                    backgroundColor: CoralPalette.white,
            
                  }}
                  activeOpacity={1}
                >
                  <Text className="text-base text-center font-semibold" style={{ color: CoralPalette.dark, fontFamily: "Nunito" }}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              </Animated.View>
              <Animated.View
                style={{
                  transform: [{ scale: confirmButtonScale }],
                  flex: 1,
                }}
              >
                <TouchableOpacity
                  onPress={onConfirm}
                  onPressIn={handleConfirmPressIn}
                  onPressOut={handleConfirmPressOut}
                  className="py-3 rounded-2xl"
                  style={{ backgroundColor: CoralPalette.primary }}
                  activeOpacity={1}
                >
                  <Text className="text-white text-base font-semibold text-center" style={{ fontFamily: "Nunito" }}>End</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </Animated.View>
        </View>
      </Animated.View>
    </Modal>
  );
}
