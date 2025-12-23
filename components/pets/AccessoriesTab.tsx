import React, { useRef, useMemo } from "react";
import { Text, View, Image, TouchableOpacity, Animated, useWindowDimensions } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { X, Check } from "lucide-react-native";
import images from "@/constants/images";
import { CoralPalette } from "@/constants/colors";

const FONT = { fontFamily: "Nunito" };

const CARD_SHADOW = {
  shadowColor: "#191d31",
  shadowOpacity: 0.12,
  shadowOffset: { width: 0, height: 2 },
  shadowRadius: 4,
  elevation: 4,
};

export type AccessoryCategory = "hat" | "collar";

interface AccessoriesTabProps {
  ownedHats: string[];
  ownedCollars: string[];
  ownedGadgets: string[];
  focusedHat: string | null;
  focusedCollar: string | null;
  focusedGadget: string | null;
  setFocusedHat: (hat: string | null) => void;
  setFocusedCollar: (collar: string | null) => void;
  setFocusedGadget: (gadget: string | null) => void;
  activeCategory: AccessoryCategory;
  setActiveCategory: (category: AccessoryCategory) => void;
}

// Accessory display names for better UX
const ACCESSORY_NAMES: Record<string, string> = {
  hat_chef: "Chef Hat",
  hat_composer: "Composer Hat",
  hat_cowboy: "Cowboy Hat",
  hat_crown: "Royal Crown",
  hat_santa: "Santa Hat",
  collar_bandana: "Bandana",
  collar_bowtie: "Bow Tie",
  collar_chef: "Chef Collar",
  collar_composer: "Composer Scarf",
  collar_scarf: "Cozy Scarf",
};

const getAccessoryName = (id: string): string => {
  return ACCESSORY_NAMES[id] ?? id.replace(/^(hat_|collar_|gadget_)/, "").replace(/_/g, " ");
};

const AccessoriesTab = ({
  ownedHats,
  ownedCollars,
  ownedGadgets,
  focusedHat,
  focusedCollar,
  focusedGadget,
  setFocusedHat,
  setFocusedCollar,
  setFocusedGadget,
  activeCategory,
  setActiveCategory,
}: AccessoriesTabProps) => {
  const { width: screenWidth } = useWindowDimensions();
  
  // Sort arrays alphabetically
  const sortedHats = useMemo(() => [...ownedHats].sort((a, b) => a.localeCompare(b)), [ownedHats]);
  const sortedCollars = useMemo(() => [...ownedCollars].sort((a, b) => a.localeCompare(b)), [ownedCollars]);

  const pillAnim = useRef(new Animated.Value(0)).current;
  const PILL_WIDTH = screenWidth - 48; // Full width minus padding (24 * 2)
  const CATEGORY_WIDTH = (PILL_WIDTH - 10) / 2; // Half width for each tab (minus padding * 2)

  const handleCategoryChange = (category: AccessoryCategory) => {
    setActiveCategory(category);
    const index = category === "hat" ? 0 : 1;
    Animated.spring(pillAnim, {
      toValue: index * CATEGORY_WIDTH,
      useNativeDriver: true,
      tension: 60,
      friction: 10,
    }).start();
  };

  // Animate pill position when activeCategory changes (from parent or local)
  React.useEffect(() => {
    const index = activeCategory === "hat" ? 0 : 1;
    Animated.spring(pillAnim, {
      toValue: index * CATEGORY_WIDTH,
      useNativeDriver: true,
      tension: 60,
      friction: 10,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, CATEGORY_WIDTH]);

  const renderAccessoryItem = (
    item: string | null,
    focused: string | null,
    setFocused: (item: string | null) => void,
    isEquipped: boolean
  ) => {
    const isNull = item === null;
    const isFocused = item === focused;

    return (
      <TouchableOpacity
        key={isNull ? "none" : item}
        activeOpacity={0.85}
        onPress={() => setFocused(item)}
        style={[
          {
            width: 105,
            height: 120,
            borderRadius: 12,
            backgroundColor: isFocused ? CoralPalette.white : CoralPalette.greyVeryLight,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 2,
            borderColor: isFocused ? CoralPalette.primaryMuted : "transparent",
            position: "relative",
          },
          isFocused && CARD_SHADOW,
        ]}
      >
        {/* Equipped badge */}
        {isEquipped && !isNull && (
          <View
            style={{
              position: "absolute",
              top: -6,
              right: -6,
              width: 22,
              height: 22,
              borderRadius: 11,
              backgroundColor: CoralPalette.green,
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
              shadowColor: "#000",
              shadowOpacity: 0.15,
              shadowOffset: { width: 0, height: 1 },
              shadowRadius: 2,
              elevation: 3,
            }}
          >
            <Check size={12} color={CoralPalette.white} strokeWidth={3} />
          </View>
        )}

        {isNull ? (
          <View style={{ alignItems: "center" }}>
            <View
              style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                backgroundColor: isFocused ? CoralPalette.primaryLighter : CoralPalette.lightGrey,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X
                size={28}
                color={isFocused ? CoralPalette.primaryMuted : CoralPalette.mutedDark}
                strokeWidth={2.5}
              />
            </View>
            <Text
              style={[
                {
                  fontSize: 11,
                  fontWeight: "600",
                  color: isFocused ? CoralPalette.purple : CoralPalette.mutedDark,
                  marginTop: 8,
                },
                FONT,
              ]}
            >
              None
            </Text>
          </View>
        ) : (
          <View style={{ alignItems: "center" }}>
            <Image
              source={images[item as keyof typeof images] ?? images.lighting}
              style={{
                width: 58,
                height: 58,
              }}
              resizeMode="contain"
            />
            <Text
              style={[
                {
                  fontSize: 10,
                  fontWeight: "600",
                  color: isFocused ? CoralPalette.dark : CoralPalette.mutedDark,
                  marginTop: 8,
                  textAlign: "center",
                  paddingHorizontal: 4,
                },
                FONT,
              ]}
              numberOfLines={2}
            >
              {getAccessoryName(item)}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderAccessoryGrid = (
    items: string[],
    focused: string | null,
    setFocused: (item: string | null) => void,
    equippedItem: string | null,
    categoryLabel: string
  ) => {
    // Create array with null (None option) as first item
    const allItems: (string | null)[] = [null, ...items];

    // Calculate rows (3 items per row)
    const rows: (string | null)[][] = [];
    for (let i = 0; i < allItems.length; i += 3) {
      rows.push(allItems.slice(i, i + 3));
    }

    return (
      <View style={{ paddingHorizontal: 10 }}>
        {/* Grid */}
        {rows.map((row, rowIndex) => (
          <View
            key={rowIndex}
            style={{
              flexDirection: "row",
              justifyContent: "center",
              gap: 10,
              marginBottom: 10,
            }}
          >
            {row.map((item) =>
              renderAccessoryItem(item, focused, setFocused, item === equippedItem)
            )}
          </View>
        ))}

        {/* Empty state if no accessories */}
        {items.length === 0 && (
          <View
            style={[
              {
                backgroundColor: CoralPalette.white,
                borderRadius: 12,
                padding: 24,
                alignItems: "center",
                marginTop: 8,
              },
              CARD_SHADOW,
            ]}
          >
            <Text style={[{ fontSize: 13, color: CoralPalette.mutedDark, textAlign: "center" }, FONT]}>
              No {categoryLabel.toLowerCase()} yet. Visit the store to get some!
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Pill Selector */}
      <View style={{ paddingHorizontal: 24, marginBottom: 12, alignItems: "center" }}>
        <View
          style={{
            flexDirection: "row",
            padding: 5,
            backgroundColor: CoralPalette.white,
            borderRadius: 5,
            width: PILL_WIDTH,
          }}
        >
          {/* Animated sliding background */}
          <Animated.View
            style={{
              position: "absolute",
              width: CATEGORY_WIDTH,
              height: "100%",
              backgroundColor: CoralPalette.primaryMuted,
              borderRadius: 5,
              top: 5,
              left: 5,
              transform: [{ translateX: pillAnim }],
            }}
          />
          <TouchableOpacity
            onPress={() => handleCategoryChange("hat")}
            activeOpacity={0.8}
            style={{
              width: CATEGORY_WIDTH,
              paddingVertical: 3,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 5,
              zIndex: 10,
            }}
          >
            <Text
              style={[
                {
                  fontWeight: "600",
                  color: activeCategory === "hat" ? CoralPalette.white : CoralPalette.mutedDark,
                },
                FONT,
              ]}
            >
              Hats ({sortedHats.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleCategoryChange("collar")}
            activeOpacity={0.8}
            style={{
              width: CATEGORY_WIDTH,
              paddingVertical: 3,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 5,
              zIndex: 10,
            }}
          >
            <Text
              style={[
                {
                  fontWeight: "600",
                  color: activeCategory === "collar" ? CoralPalette.white : CoralPalette.mutedDark,
                },
                FONT,
              ]}
            >
              Collars ({sortedCollars.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 180 }}
      >
        {/* Show only the active category */}
        {activeCategory === "hat" &&
          renderAccessoryGrid(
            sortedHats,
            focusedHat,
            setFocusedHat,
            focusedHat,
            "Hats"
          )}
        {activeCategory === "collar" &&
          renderAccessoryGrid(
            sortedCollars,
            focusedCollar,
            setFocusedCollar,
            focusedCollar,
            "Collars"
          )}
      </ScrollView>
    </View>
  );
};

export default AccessoriesTab;
