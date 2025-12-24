import React, { useState, useMemo, useEffect } from "react";
import { View, Text, TouchableOpacity, TextInput } from "react-native";
import { CoralPalette } from "@/constants/colors";
import * as Haptics from 'expo-haptics';
import { useGlobalContext } from '@/providers/GlobalProvider';
import BaseModal from "@/components/common/BaseModal";

type Props = {
  visible: boolean;
  onClose: () => void;
  onCreate: (tagName: string, color: string) => void;
};

// Color options from CoralPalette (excluding greys, white, black)
const COLOR_OPTIONS = [
  CoralPalette.primary,
  CoralPalette.primaryMuted,
  CoralPalette.primaryLight,
  CoralPalette.greenDark,
  CoralPalette.green,
  CoralPalette.greenLight,
  CoralPalette.blueDark,
  CoralPalette.blue,
  CoralPalette.blueLight,
  CoralPalette.yellowDark,
  CoralPalette.yellow,
  CoralPalette.yellowLight,
];

const MAX_TAGS = 6;

export default function CreateTagModal({ visible, onClose, onCreate }: Props) {
  const { appSettings, showBanner, userProfile } = useGlobalContext();
  const [tagName, setTagName] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0]);

  // Reset state when modal closes
  useEffect(() => {
    if (!visible) {
      setTagName("");
      setSelectedColor(COLOR_OPTIONS[0]);
    }
  }, [visible]);

  // Get current tag count
  const currentTagCount = useMemo(() => {
    if (userProfile?.tagList && Array.isArray(userProfile.tagList)) {
      return userProfile.tagList.length;
    }
    return 0;
  }, [userProfile?.tagList]);

  const handleCreate = () => {
    const trimmed = tagName.trim();
    if (!trimmed) return;

    // Check if user has reached max tags
    if (currentTagCount >= MAX_TAGS) {
      showBanner(`You've reached the maximum number of tags (${MAX_TAGS}). Please remove a tag before creating a new one.`, "error");
      return;
    }

    // Validate: only letters and spaces allowed
    if (!/^[a-zA-Z\s]+$/.test(trimmed)) {
      showBanner("Tag name can only consist of letters", "error");
      return;
    }

    // Capitalize first letter
    const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();

    if (appSettings.vibrations) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }

    onCreate(capitalized, selectedColor);
    onClose();
  };

  return (
    <BaseModal
      visible={visible}
      onClose={onClose}
      animationType="scale"
      contentStyle={{
        borderRadius: 24,
        padding: 24,
        width: '100%',
        maxWidth: 340,
      }}
    >
      <Text
        style={{
          fontSize: 18,
          fontWeight: '700',
          marginBottom: 16,
          textAlign: 'center',
          color: CoralPalette.dark,
          fontFamily: 'Nunito',
        }}
      >
        Create Tag
      </Text>

      {/* Input Field */}
      <TextInput
        style={{
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 12,
          marginBottom: 16,
          backgroundColor: CoralPalette.white,
          borderColor: CoralPalette.greyLight,
          borderWidth: 1,
          fontFamily: 'Nunito',
          fontSize: 16,
          color: CoralPalette.dark,
        }}
        placeholder="Name"
        placeholderTextColor={CoralPalette.mutedDark}
        value={tagName}
        onChangeText={setTagName}
        maxLength={9}
        autoFocus
      />

      {/* Color Palette */}
      <View style={{ marginBottom: 24 }}>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 12,
            justifyContent: 'center',
          }}
        >
          {COLOR_OPTIONS.map((color, index) => {
            const isSelected = color === selectedColor;
            return (
              <TouchableOpacity
                key={index}
                onPress={() => setSelectedColor(color)}
                style={{
                  width: 35,
                  height: 35,
                  borderRadius: 50,
                  backgroundColor: color,
                  borderWidth: 3,
                  borderColor: isSelected ? CoralPalette.white : CoralPalette.greyLight,
                }}
              />
            );
          })}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <TouchableOpacity
          style={{
            flex: 1,
            borderRadius: 16,
            paddingVertical: 12,
            alignItems: 'center',
            backgroundColor: CoralPalette.greyLight,
          }}
          onPress={onClose}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: CoralPalette.dark,
              fontFamily: 'Nunito',
            }}
          >
            Cancel
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            flex: 1,
            borderRadius: 16,
            paddingVertical: 12,
            alignItems: 'center',
            backgroundColor: tagName.trim() ? CoralPalette.primaryMuted : CoralPalette.greyLight,
          }}
          onPress={handleCreate}
          disabled={!tagName.trim()}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: tagName.trim() ? CoralPalette.white : CoralPalette.dark,
              fontFamily: 'Nunito',
              opacity: tagName.trim() ? 1 : 0.5,
            }}
          >
            Create
          </Text>
        </TouchableOpacity>
      </View>
    </BaseModal>
  );
}
