import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Bird, Cat, Dog, PawPrint, Rabbit } from "lucide-react-native";
import type { PetSpecies } from "@/components/store/Tiles";

export type SpeciesValue = PetSpecies | "all";

const ACCENT_COLOR = "#000000";

interface FilterChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
  Icon: React.ComponentType<{ size: number; color: string }>;
  activeColor?: string;
}

const FilterChip = ({
  label,
  active,
  onPress,
  Icon,
  activeColor = ACCENT_COLOR,
}: FilterChipProps) => {
  const background = active ? `${activeColor}20` : "rgba(148, 163, 184, 0.12)";
  const border = active ? activeColor : "rgba(148, 163, 184, 0.4)";
  const textColor = active ? activeColor : "#1f2937";

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
      <Text className="ml-2 text-sm font-rubik-medium" style={{ color: textColor }}>
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
