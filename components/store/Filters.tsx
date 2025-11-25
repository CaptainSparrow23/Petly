import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Cpu, Crown, PawPrint, Tag } from "lucide-react-native";
import type { StoreCategory } from "@/components/store/Tiles";
import { CoralPalette } from "@/constants/colors";

export type CategoryValue = StoreCategory | "all";

const CHIP_ACTIVE_BG = CoralPalette.primary;
const CHIP_ACTIVE_BORDER = CoralPalette.primary;
const CHIP_ACTIVE_TEXT = CoralPalette.white;
const CHIP_INACTIVE_BG = CoralPalette.surfaceAlt;
const CHIP_INACTIVE_BORDER = CoralPalette.border;
const CHIP_INACTIVE_TEXT = CoralPalette.mutedDark;

interface FilterChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
  Icon: React.ComponentType<{ size: number; color: string }>;
}

const FilterChip = ({
  label,
  active,
  onPress,
  Icon,
}: FilterChipProps) => {
  const background = active ? CHIP_ACTIVE_BG : CHIP_INACTIVE_BG;
  const border = active ? CHIP_ACTIVE_BORDER : CHIP_INACTIVE_BORDER;
  const textColor = active ? CHIP_ACTIVE_TEXT : CHIP_INACTIVE_TEXT;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        backgroundColor: background,
        borderColor: border,
        borderWidth: 1,
        shadowColor: "#000",
        shadowOpacity: active ? 0.12 : 0,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 4 },
        elevation: active ? 2 : 0,
      }}
      className="flex-row items-center mr-3 px-4 py-2.5 rounded-full"
    >
      <Icon size={16} color={textColor} />
      <Text className="ml-2 text-sm font-bold" style={{ color: textColor }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const categoryOptions: Array<{
  value: CategoryValue;
  label: string;
  icon: FilterChipProps["Icon"];
}> = [
  { value: "Pet", label: "Pets", icon: PawPrint },
  { value: "Hat", label: "Hats", icon: Crown },
  { value: "Collar", label: "Collars", icon: Tag },
  { value: "Gadget", label: "Gadgets", icon: Cpu },
];

interface FiltersProps {
  selectedCategory?: CategoryValue;
  onCategoryChange?: (value: CategoryValue) => void;
}

const Filters = ({
  selectedCategory = "Pet",
  onCategoryChange,
}: FiltersProps) => {
  return (
    <View className="w-full">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 16, paddingLeft: 0, alignItems: "center" }}
      >
        {categoryOptions.map(({ value, label, icon: Icon }) => (
          <FilterChip
            key={value}
            label={label}
            Icon={Icon}
            active={selectedCategory === value}
            onPress={() => onCategoryChange?.(value)}
          />
        ))}
      </ScrollView>

    </View>
  );
};

export default Filters;
