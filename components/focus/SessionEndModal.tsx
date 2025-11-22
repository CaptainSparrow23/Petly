import MaterialCommunityIcons from "@expo/vector-icons/build/MaterialCommunityIcons";
import React from "react";
import { Modal, View, Text, TouchableOpacity } from "react-native";
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
  const durationLabel =
    durationMinutes <= 0
      ? "less than 1 minute"
      : durationMinutes === 1
        ? "1 minute"
        : `${durationMinutes} minutes`;
  const rewardText =
    coinsAwarded > 0
      ? `+${coinsAwarded} coins`
      : "No rewards earned.";

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-black/50 px-2">
        <View
          className="flex-col items-center rounded-2xl w-2/3 h-3/10 p-5"
          style={{ backgroundColor: CoralPalette.surfaceAlt, borderColor: CoralPalette.border, borderWidth: 1 }}
        >
          <Text className="text-2xl font-semibold mb-2" style={{ color: CoralPalette.dark }}>
            Session Complete!
          </Text>
          <View className="items-center">
            {coinsAwarded > 0 ? (
              <View className="flex-row w-60 h-24 items-center justify-center">
                <View
                  className="mr-3 h-12 w-12 items-center justify-center rounded-full"
                  style={{ backgroundColor: CoralPalette.primary }}
                >
                  <MaterialCommunityIcons name="currency-usd" size={22} color={CoralPalette.white} />
                </View>
                <View className="py-2">
                  <Text className="text-xl font-semibold" style={{ color: CoralPalette.dark }}>
                    {rewardText}
                  </Text>
                </View>
              </View>
            ) : (
              <View className="px-4 py-2 -mt-3 items-center">
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
        </View>
      </View>
    </Modal>
  );
}
