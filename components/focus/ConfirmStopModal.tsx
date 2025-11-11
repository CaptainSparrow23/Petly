import React from "react";
import { Modal, View, Text, TouchableOpacity } from "react-native";

type Props = {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ConfirmStopModal({ visible, onCancel, onConfirm }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View className="flex-1 items-center justify-center bg-black/50 px-2">
        <View className="flex-col items-center rounded-2xl bg-white p-5">
          <Text className="text-xl font-semibold text-gray-900 mb-2">End session?</Text>
          <Text className="text-gray-600 mb-3">
            This will reset the timer
          </Text>
          <View className="flex-row justify-end gap-3">
            <TouchableOpacity
              onPress={onCancel}
              className="px-9 py-3 w-30 rounded-full border border-gray-200 bg-white"
            >
              <Text className="text-gray-800 text-base">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onConfirm} className="px-4 py-3 w-30 rounded-full bg-red-600">
              <Text className="text-white text-base font-semibold">End session</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
