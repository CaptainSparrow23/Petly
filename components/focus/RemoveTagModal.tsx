import React, { useRef } from "react";
import { View, Text, TouchableOpacity, Animated } from "react-native";
import { CoralPalette } from "@/constants/colors";
import * as Haptics from 'expo-haptics';
import { useGlobalContext } from '@/lib/GlobalProvider';
import BaseModal from "@/components/common/BaseModal";

type Props = {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  tagName: string;
};

export default function RemoveTagModal({ visible, onClose, onConfirm, tagName }: Props) {
  const { appSettings } = useGlobalContext();
  const noButtonScale = useRef(new Animated.Value(1)).current;
  const yesButtonScale = useRef(new Animated.Value(1)).current;

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

  return (
    <BaseModal
      visible={visible}
      onClose={onClose}
      animationType="scale"
      contentStyle={{
        width: '66%',
        maxWidth: 280,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 24,
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
        Delete Tag
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
        Remove the tag "{tagName}" ?
      </Text>
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12, width: '100%' }}>
        <Animated.View style={{ transform: [{ scale: noButtonScale }], flex: 1 }}>
          <TouchableOpacity
            onPress={onClose}
            onPressIn={handleNoPressIn}
            onPressOut={handleNoPressOut}
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
              No
            </Text>
          </TouchableOpacity>
        </Animated.View>
        <Animated.View style={{ transform: [{ scale: yesButtonScale }], flex: 1 }}>
          <TouchableOpacity
            onPress={onConfirm}
            onPressIn={handleYesPressIn}
            onPressOut={handleYesPressOut}
            style={{
              paddingVertical: 12,
              borderRadius: 16,
              backgroundColor: CoralPalette.primaryMuted,
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
              Yes
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </BaseModal>
  );
}
