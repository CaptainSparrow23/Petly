import React, { useEffect, useRef, useState } from "react";
import { Modal, View, Text, TouchableOpacity, Animated, useWindowDimensions } from "react-native";
import { CoralPalette } from "@/constants/colors";

type Props = {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ConfirmStopModal({ visible, onCancel, onConfirm }: Props) {
  const { height } = useWindowDimensions();
  const [mounted, setMounted] = useState(visible);
  const anim = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const visibleRef = useRef(visible);

  useEffect(() => {
    visibleRef.current = visible;
    anim.stopAnimation();

    if (visible) {
      setMounted(true);
      Animated.timing(anim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(anim, {
        toValue: 0,
        duration: 260,
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

  if (!mounted) return null;

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onCancel}>
      <Animated.View
        className="flex-1"
        style={{ backgroundColor: "rgba(0,0,0,0.5)", opacity: backdropOpacity }}
      >
        <View className="flex-1 items-center justify-center px-2 pb-4">
          <Animated.View
            className="flex-col items-center rounded-2xl p-5 w-[70%] max-w-md"
            style={{
              backgroundColor: CoralPalette.surfaceAlt,
              borderColor: CoralPalette.border,
              borderWidth: 1,
              transform: [{ translateY }],
            }}
          >
            <Text className="text-xl font-semibold mb-2" style={{ color: CoralPalette.dark }}>
              End session?
            </Text>
            <Text className="mb-3 py-2 text-center" style={{ color: CoralPalette.mutedDark }}>
              This will reset the timer
            </Text>
            <View className="flex-row justify-center gap-3">
              <TouchableOpacity
                onPress={onCancel}
                className="py-3 rounded-full flex-1"
                style={{ borderColor: CoralPalette.border, borderWidth: 1, backgroundColor: CoralPalette.surface }}
              >
                <Text className="text-base text-center" style={{ color: CoralPalette.mutedDark }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onConfirm}
                className="py-3 rounded-full flex-1"
                style={{ backgroundColor: CoralPalette.primary }}
              >
                <Text className="text-white text-base font-semibold text-center">End session</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Animated.View>
    </Modal>
  );
}
