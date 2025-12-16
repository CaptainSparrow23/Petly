import React, { useRef } from "react";
import { Text, View, FlatList, Image, TouchableOpacity, Animated } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { X } from "lucide-react-native";
import images from "@/constants/images";
import { CoralPalette } from "@/constants/colors";

const FONT = { fontFamily: "Nunito" };

export type AccessoryCategory = "hat" | "face" | "collar";

interface AccessoriesTabProps {
  ownedHats: string[];
  ownedFaces: string[];
  ownedCollars: string[];
  ownedGadgets: string[];
  focusedHat: string | null;
  focusedFace: string | null;
  focusedCollar: string | null;
  focusedGadget: string | null;
  setFocusedHat: (hat: string | null) => void;
  setFocusedFace: (face: string | null) => void;
  setFocusedCollar: (collar: string | null) => void;
  setFocusedGadget: (gadget: string | null) => void;
  activeCategory: AccessoryCategory;
  setActiveCategory: (category: AccessoryCategory) => void;
}

const AccessoriesTab = ({
  ownedHats,
  ownedFaces,
  ownedCollars,
  ownedGadgets,
  focusedHat,
  focusedFace,
  focusedCollar,
  focusedGadget,
  setFocusedHat,
  setFocusedFace,
  setFocusedCollar,
  setFocusedGadget,
  activeCategory,
  setActiveCategory,
}: AccessoriesTabProps) => {
  // Sort arrays alphabetically
  const sortedHats = [...ownedHats].sort((a, b) => a.localeCompare(b));
  const sortedFaces = [...ownedFaces].sort((a, b) => a.localeCompare(b));
  const sortedCollars = [...ownedCollars].sort((a, b) => a.localeCompare(b));
  const sortedGadgets = [...ownedGadgets].sort((a, b) => a.localeCompare(b));

  const pillAnim = useRef(new Animated.Value(0)).current;
  const CATEGORY_WIDTH = 100;

  const handleCategoryChange = (category: AccessoryCategory) => {
    setActiveCategory(category);
    const index = category === "hat" ? 0 : category === "face" ? 1 : 2;
    Animated.spring(pillAnim, {
      toValue: index * CATEGORY_WIDTH,
      useNativeDriver: true,
      tension: 60,
      friction: 10,
    }).start();
  };

  // Initialize animation position
  React.useEffect(() => {
    const index = activeCategory === "hat" ? 0 : activeCategory === "face" ? 1 : 2;
    pillAnim.setValue(index * CATEGORY_WIDTH);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory]);

  const renderAccessoryList = (
    items: string[],
    focused: string | null,
    setFocused: (item: string | null) => void,
    title: string
  ) => {
    return (
      <>
        <Text
          className="text-base font-extrabold mb-3"
          style={[
            { fontSize: 16, color: CoralPalette.dark, marginLeft: 40 },
            FONT,
          ]}
        >
          {title}
        </Text>
        <View style={{ minHeight: 80 }}>
          <FlatList
            data={items}
            keyExtractor={(item) => item}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12, paddingLeft: 30 }}
            ListHeaderComponent={
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setFocused(null)}
                style={[
                  {
                    width: 90,
                    height: 90,
                    borderRadius: 16,
                    borderWidth: 2,
                    borderColor:
                      focused === null
                        ? CoralPalette.primary
                        : CoralPalette.border,
                    backgroundColor:
                      focused === null
                        ? `${CoralPalette.primary}25`
                        : CoralPalette.surfaceAlt,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                  },
                ]}
              >
                <X
                  size={50}
                  color={
                    focused === null
                      ? CoralPalette.primary
                      : CoralPalette.mutedDark
                  }
                />
              </TouchableOpacity>
            }
            renderItem={({ item }) => {
              const isFocused = item === focused;
              return (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setFocused(item)}
                  style={[
                    {
                      height: 90,
                      width: 90,
                      borderRadius: 16,
                      borderWidth: 2,
                      borderColor: isFocused
                        ? CoralPalette.primary
                        : "transparent",
                      backgroundColor: isFocused
                        ? `${CoralPalette.primary}25`
                        : "transparent",
                      alignItems: "center",
                      justifyContent: "center",
                    },
                  ]}
                >
                  <Image
                    source={
                      images[item as keyof typeof images] ?? images.lighting
                    }
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 14,
                    }}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </>
    );
  };

  return (
    <View className="flex-1">
      {/* Pill Selector */}
      <View className="px-4 mb-4 flex-row items-center justify-center mt-2">
        <View
          className="flex-row rounded-full p-1"
          style={{ backgroundColor: CoralPalette.surfaceAlt }}
        >
          {/* Animated sliding background */}
          <Animated.View
            style={{
              position: "absolute",
              width: CATEGORY_WIDTH,
              height: "100%",
              backgroundColor: CoralPalette.primary,
              borderRadius: 9999,
              top: 4,
              left: 4,
              transform: [{ translateX: pillAnim }],
            }}
          />
          <TouchableOpacity
            onPress={() => handleCategoryChange("hat")}
            activeOpacity={0.8}
            className="py-2 rounded-full items-center"
            style={{ width: CATEGORY_WIDTH }}
          >
            <Text
              className="text-sm font-bold"
              style={[
                {
                  color:
                    activeCategory === "hat"
                      ? CoralPalette.white
                      : CoralPalette.mutedDark,
                },
                FONT,
              ]}
            >
              Hat
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleCategoryChange("face")}
            activeOpacity={0.8}
            className="py-2 rounded-full items-center"
            style={{ width: CATEGORY_WIDTH }}
          >
            <Text
              className="text-sm font-bold"
              style={[
                {
                  color:
                    activeCategory === "face"
                      ? CoralPalette.white
                      : CoralPalette.mutedDark,
                },
                FONT,
              ]}
            >
              Face
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleCategoryChange("collar")}
            activeOpacity={0.8}
            className="py-2 rounded-full items-center"
            style={{ width: CATEGORY_WIDTH }}
          >
            <Text
              className="text-sm font-bold"
              style={[
                {
                  color:
                    activeCategory === "collar"
                      ? CoralPalette.white
                      : CoralPalette.mutedDark,
                },
                FONT,
              ]}
            >
              Collar
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 150 }}
      >
        {/* Show only the active category */}
        {activeCategory === "hat" &&
          renderAccessoryList(
            sortedHats,
            focusedHat,
            setFocusedHat,
            "Hats"
          )}
        {activeCategory === "face" &&
          renderAccessoryList(
            sortedFaces,
            focusedFace,
            setFocusedFace,
            "Face"
          )}
        {activeCategory === "collar" &&
          renderAccessoryList(
            sortedCollars,
            focusedCollar,
            setFocusedCollar,
            "Collars"
          )}

      </ScrollView>
    </View>
  );
};

export default AccessoriesTab;
