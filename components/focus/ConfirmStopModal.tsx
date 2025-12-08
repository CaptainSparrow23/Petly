import React from "react";
import { Modal, View, Text, TouchableOpacity } from "react-native";
import { CoralPalette } from "@/constants/colors";

type Props = {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ConfirmStopModal({ visible, onCancel, onConfirm }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View className="flex-1 items-center justify-center bg-black/50 px-2">
        <View
          className="flex-col items-center rounded-2xl p-5 w-[70%] max-w-md"
          style={{ backgroundColor: CoralPalette.surfaceAlt, borderColor: CoralPalette.border, borderWidth: 1 }}
        >
          <Text className="text-xl font-semibold mb-2" style={{ color: CoralPalette.dark }}>
            End session?
          </Text>
          <Text className="mb-3 text-center" style={{ color: CoralPalette.mutedDark }}>
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
        </View>
      </View>
    </Modal>
  );
}
