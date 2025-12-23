import React, { useCallback, useEffect, useRef, useMemo } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { CoralPalette } from "@/constants/colors";

const FONT = { fontFamily: "Nunito" };
const CONTAINER_PADDING = 3;
const BORDER_RADIUS = 5;

const tabOptions = [
  { value: "featured", label: "Featured" },
  { value: "catalog", label: "Catalog" },
] as const;

export type StoreTabValue = (typeof tabOptions)[number]["value"];

interface StorePillProps {
  selectedTab: StoreTabValue;
  onTabChange: (value: StoreTabValue) => void;
  width?: number;
}

const StorePill = ({ selectedTab, onTabChange, width = 200 }: StorePillProps) => {
  const pillWidth = useMemo(() => {
    const inner = width - CONTAINER_PADDING * 2;
    return inner / tabOptions.length;
  }, [width]);

  const currentIndex = useMemo(() => {
    const index = tabOptions.findIndex((opt) => opt.value === selectedTab);
    return index === -1 ? 0 : index;
  }, [selectedTab]);

  const pillPosition = currentIndex * pillWidth;
  const sliderTranslateX = useRef(new Animated.Value(pillPosition)).current;
  const didInitSlider = useRef(false);

  useEffect(() => {
    if (!didInitSlider.current) {
      didInitSlider.current = true;
      sliderTranslateX.setValue(pillPosition);
      return;
    }

    Animated.timing(sliderTranslateX, {
      toValue: pillPosition,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [pillPosition, sliderTranslateX]);

  const handlePress = useCallback(
    (value: StoreTabValue) => {
      onTabChange(value);
    },
    [onTabChange]
  );

  return (
    <View style={[styles.container, { width }]}>
      {/* Sliding background */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.slider,
          {
            width: pillWidth,
            transform: [{ translateX: sliderTranslateX }],
          },
        ]}
      />
      {tabOptions.map(({ value, label }) => (
        <TouchableOpacity
          key={value}
          onPress={() => handlePress(value)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityState={{ selected: selectedTab === value }}
          style={[styles.pill, { width: pillWidth }]}
        >
          <Text
            style={[
              styles.pillText,
              selectedTab === value ? styles.pillTextSelected : styles.pillTextUnselected,
              FONT,
            ]}
          >
            {label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    padding: CONTAINER_PADDING,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    borderRadius: BORDER_RADIUS,
    overflow: "hidden",
  },
  slider: {
    position: "absolute",
    top: CONTAINER_PADDING,
    bottom: CONTAINER_PADDING,
    left: CONTAINER_PADDING,
    backgroundColor: CoralPalette.white,
    borderRadius: BORDER_RADIUS - CONTAINER_PADDING,
  },
  pill: {
    paddingVertical: 3,
    alignItems: "center",
    borderRadius: BORDER_RADIUS - CONTAINER_PADDING,
  },
  pillText: {
    fontSize: 13,
    fontWeight: "700",
  },
  pillTextSelected: {
    color: CoralPalette.primaryMuted,
  },
  pillTextUnselected: {
    color: CoralPalette.white,
  },
});

export default React.memo(StorePill);
