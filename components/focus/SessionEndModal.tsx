import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, Animated, Image } from "react-native";
import { Easing, runOnJS, useDerivedValue, useSharedValue, withTiming } from "react-native-reanimated";
import { HeartHandshake } from "lucide-react-native";
import { SessionActivity } from "@/hooks/useFocus";
import { CoralPalette } from "@/constants/colors";
import images from "@/constants/images";
import * as Haptics from 'expo-haptics';
import { useGlobalContext } from '@/providers/GlobalProvider';
import BaseModal from "@/components/common/BaseModal";

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
  const coinsAnim = useSharedValue(0);
  const [displayCoins, setDisplayCoins] = useState(0);
  const returnButtonScale = useRef(new Animated.Value(1)).current;

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

  const rewardText = `x  ${Math.round(displayCoins)}`;
  const xpText = xpAwarded > 0 ? `+  ${Math.round(xpAwarded)}` : "";
  const friendshipXpText = friendshipXpAwarded > 0 ? `+  ${Math.round(friendshipXpAwarded)}` : "";

  return (
    <BaseModal
      visible={visible}
      onClose={onClose}
      animationType="scale"
      closeOnBackdropPress={false}
      contentStyle={{
        width: '65%',
        maxWidth: 300,
        alignItems: 'center',
      }}
    >
      <Text
        style={{
          fontSize: 20,
          fontWeight: '600',
          color: CoralPalette.dark,
          fontFamily: 'Nunito',
        }}
      >
        Session Complete
      </Text>

      {coinsAwarded > 0 ? (
        // View with rewards
        <View style={{ alignItems: 'center', marginTop: -16, width: '100%' }}>
          <View style={{ alignItems: 'center', marginRight: 8 }}>
            <View style={{ flexDirection: 'row', width: 240, height: 96, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ height: 48, width: 48, marginRight: 8, alignItems: 'center', justifyContent: 'center' }}>
                <Image source={images.token} style={{ width: 26, height: 26 }} resizeMode="contain" />
              </View>
              <View style={{ paddingVertical: 4 }}>
                <Text style={{ fontSize: 24, color: CoralPalette.dark, fontFamily: 'Nunito', fontWeight: '700' }}>
                  {rewardText}
                </Text>
              </View>
            </View>
            {xpAwarded > 0 && (
              <View style={{ flexDirection: 'row', width: 240, height: 80, alignItems: 'center', justifyContent: 'center', marginTop: -28, marginBottom: 8 }}>
                <View style={{ height: 48, width: 48, marginRight: 8, alignItems: 'center', justifyContent: 'center' }}>
                  <Image source={images.xp} style={{ width: 26, height: 26 }} resizeMode="contain" />
                </View>
                <View style={{ paddingVertical: 4 }}>
                  <Text style={{ fontSize: 24, color: CoralPalette.dark, fontFamily: 'Nunito', fontWeight: '700' }}>
                    {xpText}
                  </Text>
                </View>
              </View>
            )}
            {friendshipXpAwarded > 0 && (
              <View style={{ flexDirection: 'row', width: 240, alignItems: 'center', justifyContent: 'center', marginTop: -16, marginBottom: 8 }}>
                <View style={{ height: 48, width: 48, marginRight: 8, alignItems: 'center', justifyContent: 'center' }}>
                  <HeartHandshake size={29} color={CoralPalette.purple} fill={CoralPalette.purpleLight} strokeWidth={2.5} />
                </View>
                <View style={{ paddingVertical: 4 }}>
                  <Text style={{ fontSize: 24, color: CoralPalette.dark, fontFamily: 'Nunito', fontWeight: '700' }}>
                    {friendshipXpText}
                  </Text>
                </View>
              </View>
            )}
          </View>
          <Animated.View style={{ transform: [{ scale: returnButtonScale }] }}>
            <TouchableOpacity
              onPress={onClose}
              onPressIn={handleReturnPressIn}
              onPressOut={handleReturnPressOut}
              style={{
                paddingVertical: 16,
                width: 240,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 9999,
                marginTop: 16,
                backgroundColor: CoralPalette.primary,
              }}
              activeOpacity={1}
            >
              <Text style={{ color: 'white', fontSize: 16, fontWeight: '600', fontFamily: 'Nunito' }}>Return</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      ) : (
        // View without rewards
        <View style={{ alignItems: 'center', width: '100%' }}>
          <View style={{ paddingHorizontal: 16, paddingVertical: 8, alignItems: 'center' }}>
            <Text style={{ color: CoralPalette.mutedDark, fontFamily: 'Nunito', fontSize: 16 }}>
              No rewards earned.
            </Text>
          </View>
          <Animated.View style={{ transform: [{ scale: returnButtonScale }] }}>
            <TouchableOpacity
              onPress={onClose}
              onPressIn={handleReturnPressIn}
              onPressOut={handleReturnPressOut}
              style={{
                paddingVertical: 12,
                width: 240,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 16,
                marginTop: 24,
                backgroundColor: CoralPalette.primary,
              }}
              activeOpacity={1}
            >
              <Text style={{ color: 'white', fontSize: 18, fontWeight: '600', fontFamily: 'Nunito' }}>Return</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}
    </BaseModal>
  );
}
