import React, { useState, useRef } from "react";
import { Modal, View, Text, TouchableOpacity, TextInput, Animated, useWindowDimensions } from "react-native";
import { CoralPalette } from "@/constants/colors";
import * as Haptics from 'expo-haptics';
import { useGlobalContext } from '@/lib/GlobalProvider';

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

export default function CreateTagModal({ visible, onClose, onCreate }: Props) {
  const { appSettings, showBanner } = useGlobalContext();
  const { height } = useWindowDimensions();
  const [mounted, setMounted] = useState(visible);
  const [tagName, setTagName] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0]);
  const anim = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const visibleRef = useRef(visible);

  React.useEffect(() => {
    visibleRef.current = visible;
    anim.stopAnimation();

    if (visible) {
      setMounted(true);
      Animated.spring(anim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(anim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished && !visibleRef.current) {
          setMounted(false);
          setTagName("");
          setSelectedColor(COLOR_OPTIONS[0]);
        }
      });
    }
  }, [visible, anim]);

  const backdropOpacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0], // Slight shift up (20px) when appearing
  });

  const scale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1], // Slight scale for smooth appearance
  });

  const handleCreate = () => {
    const trimmed = tagName.trim();
    if (!trimmed) return;
    
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

  if (!mounted) return null;

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View
        className="flex-1"
        style={{ backgroundColor: "rgba(0,0,0,0.5)", opacity: backdropOpacity }}
      >
        <TouchableOpacity
          className="flex-1"
          activeOpacity={1}
          onPress={onClose}
        >
          <View className="flex-1 items-center justify-center px-4">
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <Animated.View
                className="rounded-3xl p-6 w-full max-w-sm"
                style={{
                  backgroundColor: CoralPalette.greyLighter,
                  transform: [{ translateY }, { scale }],
                }}
              >
                <Text
                  className="text-lg font-bold mb-4 text-center"
                  style={{ color: CoralPalette.dark, fontFamily: "Nunito" }}
                >
                  Create Tag
                </Text>

                {/* Input Field */}
                <TextInput
                  className="rounded-xl px-4 py-3 mb-4 border"
                  style={{
                    backgroundColor: CoralPalette.white,
                    borderColor: CoralPalette.greyLight,
                    borderWidth: 1,
                    fontFamily: "Nunito",
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
                <View className="mb-6">
                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      gap: 12,
                      justifyContent: "center",
                    }}
                  >
                    {COLOR_OPTIONS.map((color, index) => {
                      const isSelected = color === selectedColor;
                      return (
                        <TouchableOpacity
                          key={index}
                          onPress={() => {
                            setSelectedColor(color);
                           
                          }}
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
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    className="flex-1 rounded-2xl py-3 items-center"
                    style={{ backgroundColor: CoralPalette.greyLight }}
                    onPress={onClose}
                  >
                    <Text
                      className="text-base font-semibold"
                      style={{ color: CoralPalette.dark, fontFamily: "Nunito" }}
                    >
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-1 rounded-2xl py-3 items-center"
                    style={{
                      backgroundColor: tagName.trim() ? CoralPalette.primaryMuted : CoralPalette.greyLight,
                    }}
                    onPress={handleCreate}
                    disabled={!tagName.trim()}
                  >
                    <Text
                      className="text-base font-semibold"
                      style={{
                        color: tagName.trim() ? CoralPalette.white : CoralPalette.dark,
                        fontFamily: "Nunito",
                        opacity: tagName.trim() ? 1 : 0.5,
                      }}
                    >
                      Create
                    </Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}
