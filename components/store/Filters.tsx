import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Bird, Cat, Dog, PawPrint, Rabbit } from "lucide-react-native";
import type { PetSpecies } from "@/components/store/Tiles";
import { CoralPalette } from "@/constants/colors";

export type SpeciesValue = PetSpecies | "all";

const CHIP_ACTIVE_BG = CoralPalette.surface;
const CHIP_ACTIVE_BORDER = CoralPalette.primaryLight;
const CHIP_ACTIVE_TEXT = CoralPalette.primaryMuted;
const CHIP_INACTIVE_BG = "rgba(255,255,255,0.55)";
const CHIP_INACTIVE_BORDER = "rgba(244,127,107,0.35)";
const CHIP_INACTIVE_TEXT = "rgba(25,29,49,0.65)";

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
      }}
      className="flex-row items-center mr-3 px-3.5 py-2 rounded-full"
    >
      <Icon size={16} color={textColor} />
      <Text className="ml-2 text-sm font-medium" style={{ color: textColor }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const speciesOptions: Array<{
  value: SpeciesValue;
  label: string;
  icon: FilterChipProps["Icon"];
}> = [
  { value: "all", label: "All Pets", icon: PawPrint },
  { value: "cat", label: "Cats", icon: Cat },
  { value: "dog", label: "Dogs", icon: Dog },
  { value: "bird", label: "Birds", icon: Bird },
  { value: "rabbit", label: "Rabbits", icon: Rabbit },
];

interface FiltersProps {
  selectedSpecies?: SpeciesValue;
  onSpeciesChange?: (value: SpeciesValue) => void;
}

const Filters = ({
  selectedSpecies = "all",
  onSpeciesChange,
}: FiltersProps) => {
  return (
    <View className="w-full">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        
        contentContainerStyle={{ paddingRight: 16, paddingLeft: 20 }}
      >
        {speciesOptions.map(({ value, label, icon: Icon }) => (
          <FilterChip
            key={value}
            label={label}
            Icon={Icon}
            active={selectedSpecies === value}
            onPress={() => onSpeciesChange?.(value)}
          />
        ))}
      </ScrollView>

    </View>
  );
};

export default Filters;
