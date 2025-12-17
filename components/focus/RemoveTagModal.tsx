import React, { useState, useRef, useEffect } from "react";
import { Modal, View, Text, TouchableOpacity, Animated, useWindowDimensions } from "react-native";
import { CoralPalette } from "@/constants/colors";
import * as Haptics from 'expo-haptics';
import { useGlobalContext } from '@/lib/GlobalProvider';

type Props = {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  tagName: string;
};

export default function RemoveTagModal({ visible, onClose, onConfirm, tagName }: Props) {
  const { appSettings } = useGlobalContext();
  const { height } = useWindowDimensions();
  const [mounted, setMounted] = useState(visible);
  const anim = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const visibleRef = useRef(visible);
  const noButtonScale = useRef(new Animated.Value(1)).current;
  const yesButtonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    visibleRef.current = visible;
    anim.stopAnimation();

    if (visible) {
      setMounted(true);
      Animated.spring(anim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(anim, {
        toValue: 0,
        duration: 150,
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
    outputRange: [0, 0], // No slide from bottom
  });

  const scale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1], // Slight scale for smooth appearance
  });

  const handleNoPressIn = () => {
    if (appSettings.vibrations) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    Animated.spring(noButtonScale, {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handleNoPressOut = () => {
    Animated.spring(noButtonScale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handleYesPressIn = () => {
    if (appSettings.vibrations) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    Animated.spring(yesButtonScale, {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handleYesPressOut = () => {
    Animated.spring(yesButtonScale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  if (!mounted) return null;

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View
        className="flex-1"
        style={{ backgroundColor: "rgba(0,0,0,0.5)", opacity: backdropOpacity }}
      >
        <TouchableOpacity
          className="flex-1"
          activeOpacity={1}
          onPress={onClose}
        >
          <View className="flex-1 items-center justify-center px-4">
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <Animated.View
                className="rounded-3xl items-center justify-center p-4 w-4/6"
                style={{
                  backgroundColor: CoralPalette.greyLighter,
                  transform: [{ translateY }, { scale }],
                }}
              >
                <Text className="text-xl font-semibold mb-2" style={{ color: CoralPalette.dark, fontFamily: "Nunito" }}>
                  Delete Tag 
                </Text>
                <Text className="mb-3 py-2 text-center" style={{ color: CoralPalette.mutedDark, fontFamily: "Nunito" }}>
                  Remove the tag "{tagName}" ?
                </Text>
                <View className="flex-row justify-center gap-3">
                  <Animated.View
                    style={{
                      transform: [{ scale: noButtonScale }],
                      flex: 1,
                    }}
                  >
                    <TouchableOpacity
                      onPress={onClose}
                      onPressIn={handleNoPressIn}
                      onPressOut={handleNoPressOut}
                      className="py-3 rounded-2xl"
                      style={{ 
                        backgroundColor: CoralPalette.white,
                
                      }}
                      activeOpacity={1}
                    >
                      <Text className="text-base text-center font-semibold" style={{ color: CoralPalette.dark, fontFamily: "Nunito" }}>
                        No
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                  <Animated.View
                    style={{
                      transform: [{ scale: yesButtonScale }],
                      flex: 1,
                    }}
                  >
                    <TouchableOpacity
                      onPress={onConfirm}
                      onPressIn={handleYesPressIn}
                      onPressOut={handleYesPressOut}
                      className="py-3 rounded-2xl"
                      style={{ backgroundColor: CoralPalette.primaryMuted }}
                      activeOpacity={1}
                    >
                      <Text className="text-white text-base font-semibold text-center" style={{ fontFamily: "Nunito" }}>Yes</Text>
                    </TouchableOpacity>
                  </Animated.View>
                </View>
              </Animated.View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}
