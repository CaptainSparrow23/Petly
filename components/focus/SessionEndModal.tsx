import MaterialCommunityIcons from "@expo/vector-icons/build/MaterialCommunityIcons";
import React, { useEffect, useRef, useState } from "react";
import { Modal, View, Text, TouchableOpacity, Animated, useWindowDimensions } from "react-native";
import { Easing, runOnJS, useDerivedValue, useSharedValue, withTiming } from "react-native-reanimated";
import { SessionActivity } from "@/hooks/useFocus";
import { CoralPalette } from "@/constants/colors";

type Props = {
  visible: boolean;
  coinsAwarded: number;
  durationMinutes: number;
  activity: SessionActivity;
  onClose: () => void;
};

export default function SessionEndModal({
  visible,
  coinsAwarded,
  durationMinutes,
  activity,
  onClose,
}: Props) {
  const { height } = useWindowDimensions();
  const [mounted, setMounted] = useState(visible);
  const anim = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const visibleRef = useRef(visible);
  const coinsAnim = useSharedValue(0);
  const [displayCoins, setDisplayCoins] = useState(0);

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
        duration: 300,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished && !visibleRef.current) setMounted(false);
      });
    }
  }, [visible, anim]);

  useEffect(() => {
    if (visible && coinsAwarded > 0) {
      coinsAnim.value = 0;
      coinsAnim.value = withTiming(coinsAwarded, {
        duration: 500,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      coinsAnim.value = 0;
      setDisplayCoins(0);
    }
  }, [visible, coinsAwarded, coinsAnim]);

  useDerivedValue(() => {
    runOnJS(setDisplayCoins)(coinsAnim.value);
  }, [coinsAnim]);

  const backdropOpacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [height, 0],
  });

  if (!mounted) return null;

  const rewardText =
    coinsAwarded > 0
      ? `+${Math.round(displayCoins)} coins`
      : "No rewards earned.";

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View
        className="flex-1"
        style={{ backgroundColor: "rgba(0,0,0,0.5)", opacity: backdropOpacity }}
      >
        <View className="flex-1 items-center justify-center px-2 pb-4">
          <Animated.View
            className="flex-col items-center rounded-2xl w-2/3 h-3/10 p-5"
            style={{
              backgroundColor: CoralPalette.surfaceAlt,
              borderColor: CoralPalette.border,
              borderWidth: 1,
              transform: [{ translateY }],
            }}
          >
            <Text className="text-xl font-semibold mb-2" style={{ color: CoralPalette.dark }}>
              Session Complete!
            </Text>
            <View className="items-center">
              {coinsAwarded > 0 ? (
                <View className="flex-row w-60 h-24 items-center justify-center">
                  <View
                    className="mr-3 h-12 w-12 items-center justify-center rounded-full"
                    style={{ backgroundColor: CoralPalette.coinBg }}
                  >
                    <MaterialCommunityIcons name="heart" size={18} color={CoralPalette.coinIcon} />
                  </View>
                  <View className="py-2">
                    <Text className="text-xl" style={{ color: CoralPalette.dark }}>
                      {rewardText}
                    </Text>
                  </View>
                </View>
              ) : (
                <View className="px-4 py-4 -mt-3 items-center">
                  <Text style={{ color: CoralPalette.mutedDark }}>{rewardText}</Text>
                </View>
              )}
              <TouchableOpacity
                onPress={onClose}
                className="py-4 w-60 items-center justify-center rounded-full mt-2"
                style={{ backgroundColor: CoralPalette.primary }}
              >
                <Text className="text-white text-base font-semibold">Return</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Animated.View>
    </Modal>
  );
}
