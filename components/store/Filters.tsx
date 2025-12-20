import React, { useCallback, useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import type { StoreCategory } from "@/components/store/Tiles";
import { CoralPalette } from "@/constants/colors";

const FONT = { fontFamily: "Nunito" };
const DEFAULT_PILL_WIDTH = 120;
const CONTAINER_PADDING = 4;
const BORDER_RADIUS = 5;

const categoryOptions = [
  { value: "all", label: "All" },
  { value: "Hat", label: "Hats" },
  { value: "Collar", label: "Collars" },
] as const satisfies readonly { value: StoreCategory | "all"; label: string }[];

export type CategoryValue = (typeof categoryOptions)[number]["value"];

interface FiltersProps {
  selectedCategory?: CategoryValue;
  onCategoryChange?: (value: CategoryValue) => void;
}

const Filters = ({ selectedCategory = "all", onCategoryChange }: FiltersProps) => {
  const { width: screenWidth } = useWindowDimensions();

  const containerWidth = useMemo(() => {
    // Account for parent container padding (12 * 2 = 24)
    const availableWidth = Math.max(0, screenWidth - 40);
    return availableWidth;
  }, [screenWidth]);

  const pillWidth = useMemo(() => {
    const inner = containerWidth - CONTAINER_PADDING * 2;
    if (inner <= 0) {
      return DEFAULT_PILL_WIDTH;
    }
    return inner / categoryOptions.length;
  }, [containerWidth]);

  const currentIndex = useMemo(() => {
    const index = categoryOptions.findIndex((opt) => opt.value === selectedCategory);
    return index === -1 ? 0 : index;
  }, [selectedCategory]);

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
    (value: CategoryValue) => {
      onCategoryChange?.(value);
    },
    [onCategoryChange]
  );

  return (
    <View style={styles.root}>
      <View style={[styles.container, { width: containerWidth}]}>
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
        {categoryOptions.map(({ value, label }) => (
          <TouchableOpacity
            key={value}
            onPress={() => handlePress(value)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityState={{ selected: selectedCategory === value }}
            style={[styles.pill, { width: pillWidth }]}
          >
            <Text
              style={[
                styles.pillText,
                selectedCategory === value ? styles.pillTextSelected : styles.pillTextUnselected,
                FONT,
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
  },
  container: {
    flexDirection: "row",
    padding: CONTAINER_PADDING,
    backgroundColor: CoralPalette.white,
    borderRadius: BORDER_RADIUS,
    borderWidth: 1,
    borderColor: CoralPalette.lightGrey,
    overflow: "hidden",
  },
  slider: {
    position: "absolute",
    top: CONTAINER_PADDING,
    bottom: CONTAINER_PADDING,
    left: CONTAINER_PADDING,
    backgroundColor: CoralPalette.primaryMuted,
    borderRadius: BORDER_RADIUS,
  },
  pill: {
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: BORDER_RADIUS,
  },
  pillText: {
    fontSize: 14,
    fontWeight: "700",
  },
  pillTextSelected: {
    color: CoralPalette.white,
  },
  pillTextUnselected: {
    color: CoralPalette.mutedDark,
  },
});

export default React.memo(Filters);
