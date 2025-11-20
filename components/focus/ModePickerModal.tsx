import React from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { CoralPalette } from "@/constants/colors";

type Activity = "Focus" | "Rest";

interface ModePickerModalProps {
  visible: boolean;
  currentActivity: Activity;
  onSelect: (activity: Activity) => void;
  onClose: () => void; // added
}

export default function ModePickerModal({
  visible,
  currentActivity,
  onSelect,
  onClose,
}: ModePickerModalProps) {
  if (!visible) return null;

  const handleSelect = (activity: Activity) => {
    onSelect(activity);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      {/* Background overlay */}
      <Pressable
        className="flex-1 bg-black/40 justify-center items-center"
        onPress={onClose}
      >
        {/* Stop background press from closing when tapping inside content */}
        <Pressable
          className="w-[60%] rounded-2xl p-5 items-center active:opacity-90"
          style={{ backgroundColor: CoralPalette.surfaceAlt }}
        >
          <Text className="text-lg font-semibold mb-3 text-center" style={{ color: CoralPalette.dark }}>
            Choose mode
          </Text>

          <View className="flex-row justify-center gap-4">
            <Pressable
              onPress={() => handleSelect("Focus")}
              className="flex-1 items-center justify-center py-3 rounded-xl border"
              style={{
                backgroundColor:
                  currentActivity === "Focus" ? CoralPalette.surface : CoralPalette.white,
                borderColor:
                  currentActivity === "Focus" ? CoralPalette.primaryLight : "#e5e7eb",
              }}
            >
              <View
                className="w-3 h-3 rounded-full mb-2"
                style={{ backgroundColor: CoralPalette.primary }}
              />
              <Text className="text-base font-medium" style={{ color: CoralPalette.dark }}>
                Focus
              </Text>
            </Pressable>

            <Pressable
              onPress={() => handleSelect("Rest")}
              className="flex-1 items-center justify-center rounded-xl border py-3"
              style={{
                backgroundColor:
                  currentActivity === "Rest" ? "rgba(154,165,135,0.15)" : CoralPalette.white,
                borderColor:
                  currentActivity === "Rest" ? "rgba(154,165,135,0.45)" : "#e5e7eb",
              }}
            >
              <View
                className="w-3 h-3 rounded-full mb-2"
                style={{ backgroundColor: "#9AA587" }}
              />
              <Text className="text-base font-medium" style={{ color: "#556050" }}>
                Rest
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
