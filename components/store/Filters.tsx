import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Cat, Dog, Rabbit, Bird, PawPrint, Flame } from "lucide-react-native";
import type { PetSpecies } from "@/components/store/Tiles";

export type SpeciesValue = PetSpecies | "all";

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
  activeColor = "#1d4ed8",
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
  accent?: string;
}> = [
  { value: "all", label: "All Pets", icon: PawPrint, accent: "#1d4ed8" },
  { value: "cat", label: "Cats", icon: Cat, accent: "#f97316" },
  { value: "dog", label: "Dogs", icon: Dog, accent: "#2563eb" },
  { value: "fox", label: "Foxes", icon: Flame, accent: "#ea580c" },
  { value: "bunny", label: "Bunnies", icon: Rabbit, accent: "#16a34a" },
  { value: "owl", label: "Owls", icon: Bird, accent: "#6366f1" },
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
        {speciesOptions.map(({ value, label, icon: Icon, accent }) => (
          <FilterChip
            key={value}
            label={label}
            Icon={Icon}
            active={selectedSpecies === value}
            activeColor={accent}
            onPress={() => onSpeciesChange?.(value)}
          />
        ))}
      </ScrollView>

    </View>
  );
};

export default Filters;
