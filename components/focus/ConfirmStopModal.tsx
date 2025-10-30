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
      <View className="flex-1 items-center justify-center bg-black/50 px-6">
        <View className="w-full max-w-md flex-col items-center rounded-2xl bg-white p-6">
          <Text className="text-xl font-semibold text-gray-900 mb-2">End session?</Text>
          <Text className="text-base text-gray-600 mb-6">
            Your current session will stop and the timer will reset.
          </Text>
          <View className="flex-row justify-end gap-3">
            <TouchableOpacity
              onPress={onCancel}
              className="px-5 py-3 rounded-full border border-gray-200 bg-white"
            >
              <Text className="text-gray-800 text-base">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onConfirm} className="px-5 py-3 rounded-full bg-red-600">
              <Text className="text-white text-base font-semibold">End session</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
