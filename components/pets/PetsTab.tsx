import React, { useMemo } from "react";
import { Text, View, FlatList, Image, TouchableOpacity } from "react-native";
import { Check, Sparkles } from "lucide-react-native";
import { CoralPalette } from "@/constants/colors";
import { PetItem } from "@/hooks/usePets";
import { getPetMood, getPetImageByMood } from "@/utils/petMood";

const FONT = { fontFamily: "Nunito" };

const CARD_SHADOW = {
  shadowColor: "#191d31",
  shadowOpacity: 0.15,
  shadowOffset: { width: 0, height: 3 },
  shadowRadius: 4,
  elevation: 6,
};



// Mood-based text - EDIT THESE to customize what each pet says at different moods
type PetMood = 1 | 2 | 3;
const PET_MOOD_TEXT: Record<string, Record<PetMood, { text: string; emoji: string }>> = {
  pet_smurf: {
    1: { text: "Feels left out", emoji: "🥺" },
    2: { text: "Relaxed and content", emoji: "🔍" },
    3: { text: "Feeling satisfied!", emoji: "😸" },
  },
  pet_chedrick: {
    1: { text: "Feeling lonely", emoji: "😿" },
    2: { text: "Looking for food", emoji: "🧀" },
    3: { text: "Belly full of joy", emoji: "🧡" },
  },
  pet_pebbles: {
    1: { text: "Needs cuddles", emoji: "🥺" },
    2: { text: "Patiently waiting for you", emoji: "😴" },
    3: { text: "Overwhelmed with care", emoji: "😻" },
  },
  pet_gooner: {
    1: { text: "Feeling bored", emoji: "😔" },
    2: { text: "Ready to hangout", emoji: "⚡" },
    3: { text: "Full of energy!", emoji: "🔥" },
  },
  pet_kitty: {
    1: { text: "Looking for attention", emoji: "💙" },
    2: { text: "Dreaming of treats", emoji: "✨" },
    3: { text: "Feeling loved", emoji: "💖" },
  },
};

const DEFAULT_MOOD_TEXT: Record<PetMood, { text: string; emoji: string }> = {
  1: { text: "Misses you", emoji: "😢" },
  2: { text: "Ready to focus", emoji: "🌟" },
  3: { text: "So happy!", emoji: "😊" },
};

interface PetsTabProps {
  pets: PetItem[];
  focusedPet: string | null;
  setFocusedPet: (petId: string) => void;
  selectedPet?: string | null;
  petFriendships?: Record<string, any>;
}

interface PetCardProps {
  item: PetItem;
  isFocused: boolean;
  isCurrentlySelected: boolean;
  onPress: () => void;
  updatedAt?: string | null;
}

const PetCard = ({ item, isFocused, isCurrentlySelected, onPress, updatedAt }: PetCardProps) => {
  const mood = getPetMood(updatedAt);
  const petImage = getPetImageByMood(item.id, mood);
  
  // Get mood-based text for this pet
  const moodText = PET_MOOD_TEXT[item.id]?.[mood] ?? DEFAULT_MOOD_TEXT[mood];
  
  // Debug logging - remove after testing
  console.log(`🐾 Pet ${item.id}: updatedAt=${updatedAt}, mood=${mood}`);

  return (
    <View style={{ width: "48%", paddingTop: 8 }}>
      {/* Clipboard clip/notch at top center */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: [{ translateX: -20 }],
          zIndex: 15,
          alignItems: "center",
        }}
      >
        {/* Clip base */}
        <View
          style={{
            width: 40,
            height: 16,
            backgroundColor: CoralPalette.clipboardBrown,
            borderTopLeftRadius: 4,
            borderTopRightRadius: 4,
            borderBottomLeftRadius: 2,
            borderBottomRightRadius: 2,
          }}
        />
        {/* Clip inner notch */}
        <View
          style={{
            position: "absolute",
            top: 4,
            width: 28,
            height: 8,
            backgroundColor: CoralPalette.clipboardBrownDark,
            borderRadius: 2,
          }}
        />
      </View>

      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.9}
        style={[
          {
            padding: 14,
            paddingTop: 18,
            borderRadius: 6,
            backgroundColor: CoralPalette.clipboardPaper,
            borderWidth: 2,
            borderColor: isFocused ? CoralPalette.primaryMuted : CoralPalette.clipboardBorder,
          },
          CARD_SHADOW,
        ]}
      >
        {/* Selected checkmark badge */}
        {isCurrentlySelected && (
          <View
            style={{
              position: "absolute",
              top: -8,
              right: -8,
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: CoralPalette.green,
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
              shadowColor: "#000",
              shadowOpacity: 0.2,
              shadowOffset: { width: 0, height: 2 },
              shadowRadius: 3,
              elevation: 4,
            }}
          >
            <Check size={16} color={CoralPalette.white} strokeWidth={3} />
          </View>
        )}

        {/* Subtle paper lines */}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            overflow: "hidden",
            borderRadius: 4,
          }}
        >
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <View
              key={i}
              style={{
                position: "absolute",
                top: 30 + i * 28,
                left: 10,
                right: 10,
                height: 1,
                backgroundColor: CoralPalette.clipboardLine,
              }}
            />
          ))}
        </View>

        {/* Pet Image */}
        <View style={{ alignItems: "center", marginBottom: 7 }}>
          <Image
            source={petImage}
            style={{ width: 85, height: 85 }}
            resizeMode="contain"
          />
        </View>

        {/* Pet Name */}
        <Text
          style={[
            { fontSize: 16, fontWeight: "800", color: CoralPalette.dark, textAlign: "center" },
            FONT,
          ]}
          numberOfLines={1}
        >
          {item.name}
        </Text>

        {/* Personality trait */}
        {/* Mood-based text - edit PET_MOOD_TEXT above to customize */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 4 }}>
          <Text style={{ fontSize: 11, color: CoralPalette.mutedDark, fontFamily: "Nunito" }}>
            {moodText.text} {moodText.emoji}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const PetsTab = ({ pets, focusedPet, setFocusedPet, selectedPet, petFriendships }: PetsTabProps) => {
  const ListHeader = useMemo(
    () => (
      <View style={{ paddingHorizontal: 4 }}>
        {/* Section Header with Count */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingVertical: 8,
            marginBottom: 8,
            marginTop: -10
          }}
        >
          <Text style={[{ fontSize: 16, fontWeight: "700", color: CoralPalette.dark }, FONT]}>
            Your Companions
          </Text>
          <View
            style={{
              backgroundColor: CoralPalette.primaryMuted,
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 12,
            }}
          >
            <Text style={[{ fontSize: 11, fontWeight: "700", color: CoralPalette.white }, FONT]}>
              {pets.length} owned
            </Text>
          </View>
        </View>
      </View>
    ),
    [pets.length]
  );

  return (
    <FlatList
      data={pets}
      keyExtractor={(item) => item.id}
      numColumns={2}
      showsVerticalScrollIndicator={false}
      scrollEnabled={true}
      contentContainerStyle={{
        paddingHorizontal: 18,
        paddingTop: 12,
        paddingBottom: 100,
        flexGrow: 1,
      }}
      columnWrapperStyle={{ justifyContent: "space-between", marginBottom: 14 }}
      ListHeaderComponent={ListHeader}
      ListEmptyComponent={
        <View
          style={[
            {
              alignItems: "center",
              paddingVertical: 32,
              paddingHorizontal: 24,
              backgroundColor: CoralPalette.white,
              borderRadius: 12,
              marginTop: 8,
            },
            CARD_SHADOW,
          ]}
        >
          <Sparkles size={40} color={CoralPalette.primary} />
          <Text
            style={[{ fontSize: 16, fontWeight: "700", color: CoralPalette.dark, marginTop: 12 }, FONT]}
          >
            No companions yet
          </Text>
          <Text
            style={[
              { fontSize: 13, color: CoralPalette.mutedDark, textAlign: "center", marginTop: 6, lineHeight: 20 },
              FONT,
            ]}
          >
            Keep focusing to earn coins and adopt your first companion from the store!
          </Text>
        </View>
      }
      renderItem={({ item }) => {
        const isFocused = item.id === focusedPet;
        const isCurrentlySelected = item.id === selectedPet;
        const friendship = petFriendships?.[item.id];

        return (
          <PetCard
            item={item}
            isFocused={isFocused}
            isCurrentlySelected={isCurrentlySelected}
            onPress={() => setFocusedPet(item.id)}
            updatedAt={friendship?.updatedAt}
          />
        );
      }}
    />
  );
};

export default PetsTab;
