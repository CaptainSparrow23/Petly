import React, { useRef } from "react";
import { View, Text, TouchableOpacity, Animated } from "react-native";
import { CoralPalette } from "@/constants/colors";
import * as Haptics from 'expo-haptics';
import { useGlobalContext } from '@/providers/GlobalProvider';
import BaseModal from "@/components/common/BaseModal";

type Props = {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ConfirmStopModal({ visible, onCancel, onConfirm }: Props) {
  const { appSettings } = useGlobalContext();
  const cancelButtonScale = useRef(new Animated.Value(1)).current;
  const confirmButtonScale = useRef(new Animated.Value(1)).current;

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

  return (
    <BaseModal
      visible={visible}
      onClose={onCancel}
      animationType="slide"
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
          marginBottom: 8,
          color: CoralPalette.dark,
          fontFamily: 'Nunito',
        }}
      >
        End session?
      </Text>
      <Text
        style={{
          marginBottom: 12,
          paddingVertical: 8,
          textAlign: 'center',
          color: CoralPalette.mutedDark,
          fontFamily: 'Nunito',
        }}
      >
        This will reset the timer
      </Text>
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12, width: '100%' }}>
        <Animated.View style={{ transform: [{ scale: cancelButtonScale }], flex: 1 }}>
          <TouchableOpacity
            onPress={onCancel}
            onPressIn={handleCancelPressIn}
            onPressOut={handleCancelPressOut}
            style={{
              paddingVertical: 12,
              borderRadius: 16,
              backgroundColor: CoralPalette.white,
            }}
            activeOpacity={1}
          >
            <Text
              style={{
                fontSize: 16,
                textAlign: 'center',
                fontWeight: '600',
                color: CoralPalette.dark,
                fontFamily: 'Nunito',
              }}
            >
              Cancel
            </Text>
          </TouchableOpacity>
        </Animated.View>
        <Animated.View style={{ transform: [{ scale: confirmButtonScale }], flex: 1 }}>
          <TouchableOpacity
            onPress={onConfirm}
            onPressIn={handleConfirmPressIn}
            onPressOut={handleConfirmPressOut}
            style={{
              paddingVertical: 12,
              borderRadius: 16,
              backgroundColor: CoralPalette.primary,
            }}
            activeOpacity={1}
          >
            <Text
              style={{
                color: 'white',
                fontSize: 16,
                fontWeight: '600',
                textAlign: 'center',
                fontFamily: 'Nunito',
              }}
            >
              End
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </BaseModal>
  );
}
