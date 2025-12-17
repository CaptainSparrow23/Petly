import React, { useEffect, useRef, useState } from "react";
import { Modal, View, Text, TouchableOpacity, Animated, useWindowDimensions, Image } from "react-native";
import { Easing, runOnJS, useDerivedValue, useSharedValue, withTiming } from "react-native-reanimated";
import { HeartHandshake } from "lucide-react-native";
import { SessionActivity } from "@/hooks/useFocus";
import { CoralPalette } from "@/constants/colors";
import images from "@/constants/images";
import * as Haptics from 'expo-haptics';
import { useGlobalContext } from '@/lib/GlobalProvider';

type Props = {
  visible: boolean;
  coinsAwarded: number;
  xpAwarded: number;
  friendshipXpAwarded: number;
  durationMinutes: number;
  activity: SessionActivity;
  onClose: () => void;
};

export default function SessionEndModal({
  visible,
  coinsAwarded,
  xpAwarded,
  friendshipXpAwarded,
  durationMinutes,
  activity,
  onClose,
}: Props) {
  const { appSettings } = useGlobalContext();
  const { height } = useWindowDimensions();
  const [mounted, setMounted] = useState(visible);
  const anim = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const visibleRef = useRef(visible);
  const coinsAnim = useSharedValue(0);
  const [displayCoins, setDisplayCoins] = useState(0);
  const returnButtonScale = useRef(new Animated.Value(1)).current;

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
        duration: 200,
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

  // Button press animation handlers
  const handleReturnPressIn = () => {
    if (appSettings.vibrations) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    Animated.spring(returnButtonScale, {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handleReturnPressOut = () => {
    Animated.spring(returnButtonScale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  if (!mounted) return null;

  const rewardText = `x  ${Math.round(displayCoins)}`;
  const xpText = xpAwarded > 0 ? `+  ${Math.round(xpAwarded)}` : "";
  const friendshipXpText = friendshipXpAwarded > 0 ? `+  ${Math.round(friendshipXpAwarded)}` : "";

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View
        className="flex-1"
        style={{ backgroundColor: "rgba(0,0,0,0.5)", opacity: backdropOpacity }}
      >
        <View className="flex-1 items-center justify-center px-2">
          <Animated.View
            className="flex-col items-center rounded-3xl w-2/3 h-3/10 p-5"
            style={{
              backgroundColor: CoralPalette.surfaceAlt,
              transform: [{ translateY }],
            }}
          >
            <Text className="text-xl font-semibold" style={{ color: CoralPalette.dark, fontFamily: "Nunito" }}>
              Session Complete
            </Text>
            
            {coinsAwarded > 0 ? (
              // View with rewards
              <View className="items-center -mt-4 w-full">
                <View className="items-center mr-2">
                  <View className="flex-row w-60 h-24 items-center justify-center">
                    <View className="h-12 w-12 mr-2 items-center justify-center">
                      <Image source={images.token} style={{ width: 26, height: 26 }} resizeMode="contain" />
                    </View>
                    <View className="py-1">
                      <Text className="text-2xl" style={{ color: CoralPalette.dark, fontFamily: "Nunito", fontWeight: "700" }}>
                        {rewardText}
                      </Text>
                    </View>
                  </View>
                  {xpAwarded > 0 && (
                    <View className="flex-row w-60 h-20 items-center justify-center -mt-7 mb-2">
                      <View className="h-12 w-12 mr-2 items-center justify-center">
                        <Image source={images.xp} style={{ width: 26, height: 26 }} resizeMode="contain" />
                      </View>
                      <View className="py-1">
                        <Text className="text-2xl" style={{ color: CoralPalette.dark, fontFamily: "Nunito", fontWeight: "700" }}>
                          {xpText}
                        </Text>
                      </View>
                    </View>
                  )}
                  {friendshipXpAwarded > 0 && (
                    <View className="flex-row w-60 items-center justify-center -mt-4 mb-2">
                      <View className="h-12 w-12 mr-2 items-center justify-center">
                        <HeartHandshake size={29} color={CoralPalette.purple} fill={CoralPalette.purpleLight} strokeWidth={2.5} />
                      </View>
                      <View className="py-1">
                        <Text className="text-2xl" style={{ color: CoralPalette.dark, fontFamily: "Nunito", fontWeight: "700" }}>
                          {friendshipXpText}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
                <Animated.View
                  style={{
                    transform: [{ scale: returnButtonScale }],
                  }}
                >
                  <TouchableOpacity
                    onPress={onClose}
                    onPressIn={handleReturnPressIn}
                    onPressOut={handleReturnPressOut}
                    className="py-4 w-60 items-center justify-center rounded-full mt-4"
                    style={{ backgroundColor: CoralPalette.primary }}
                    activeOpacity={1}
                  >
                    <Text className="text-white text-base font-semibold" style={{ fontFamily: "Nunito" }}>Return</Text>
                  </TouchableOpacity>
                </Animated.View>
              </View>
            ) : (
              // View without rewards
              <View className="items-center w-full">
                <View className="px-4 py-2 items-center">
                  <Text style={{ color: CoralPalette.mutedDark, fontFamily: "Nunito", fontSize: 16 }}>
                    No rewards earned.
                  </Text>
                </View>
                <Animated.View
                  style={{
                    transform: [{ scale: returnButtonScale }],
                  }}
                >
                  <TouchableOpacity
                    onPress={onClose}
                    onPressIn={handleReturnPressIn}
                    onPressOut={handleReturnPressOut}
                    className="py-3 w-60 items-center justify-center rounded-full mt-6"
                    style={{ backgroundColor: CoralPalette.primary }}
                    activeOpacity={1}
                  >
                    <Text className="text-white text-lg font-semibold" style={{ fontFamily: "Nunito" }}>Return</Text>
                  </TouchableOpacity>
                </Animated.View>
              </View>
            )}
          </Animated.View>
        </View>
      </Animated.View>
    </Modal>
  );
}
