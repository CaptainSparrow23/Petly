import React from "react";
import { Modal, Pressable, Text, View } from "react-native";

type Activity = "Study" | "Rest";

interface ModePickerModalProps {
  visible: boolean;
  currentActivity: Activity;
  onSelect: (activity: Activity) => void;
}

export default function ModePickerModal({
  visible,
  currentActivity,
  onSelect,
}: ModePickerModalProps) {
  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View className="flex-1 bg-black/40 justify-center items-center px-6">
        <View className="w-[80%] rounded-2xl bg-white p-6 items-center">
          {/* Title centered */}
          <Text className="text-lg font-semibold mb-6 text-center">Choose mode</Text>

          {/* Two options side by side */}
          <View className="flex-row w-full justify-center gap-4">
            {/* Study */}
            <Pressable
              onPress={() => onSelect("Study")}
              className={`flex-1 items-center justify-center py-5 rounded-xl border ${
                currentActivity === "Study"
                  ? "bg-blue-50 border-blue-200"
                  : "bg-white border-gray-200"
              }`}
            >
              <View className="w-3 h-3 rounded-full mb-2" style={{ backgroundColor: "#3b82f6" }} />
              <Text className="text-base font-medium">Study</Text>
            </Pressable>

            {/* Rest */}
            <Pressable
              onPress={() => onSelect("Rest")}
              className={`flex-1 items-center justify-center py-5 rounded-xl border ${
                currentActivity === "Rest"
                  ? "bg-violet-50 border-violet-200"
                  : "bg-white border-gray-200"
              }`}
            >
              <View className="w-3 h-3 rounded-full mb-2" style={{ backgroundColor: "#8b5cf6" }} />
              <Text className="text-base font-medium">Rest</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
