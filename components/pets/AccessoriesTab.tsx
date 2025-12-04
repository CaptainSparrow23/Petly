import React from "react";
import { Text, View, FlatList, Image, TouchableOpacity } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { X } from "lucide-react-native";
import images from "@/constants/images";
import { CoralPalette } from "@/constants/colors";

const FONT = { fontFamily: "Nunito" };

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
}: AccessoriesTabProps) => {
  // Sort arrays alphabetically
  const sortedHats = [...ownedHats].sort((a, b) => a.localeCompare(b));
  const sortedFaces = [...ownedFaces].sort((a, b) => a.localeCompare(b));
  const sortedCollars = [...ownedCollars].sort((a, b) => a.localeCompare(b));
  const sortedGadgets = [...ownedGadgets].sort((a, b) => a.localeCompare(b));

  return (
    <ScrollView
      className="flex-1"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingTop: 8, paddingBottom: 150 }}
    >
      {/* Hats */}
      <Text
        className="text-base font-extrabold mb-3"
        style={[
          { fontSize: 16, color: CoralPalette.dark, marginLeft: 40 },
          FONT,
        ]}
      >
        Hats
      </Text>
      <View style={{ minHeight: 80 }}>
        <FlatList
          data={sortedHats}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 12 }}
          ListHeaderComponent={
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setFocusedHat(null)}
              style={[
                {
                  width: 90,
                  height: 90,
                  borderRadius: 16,
                  borderWidth: 2,
                  borderColor:
                    focusedHat === null
                      ? CoralPalette.primary
                      : CoralPalette.border,
                  backgroundColor:
                    focusedHat === null
                      ? `${CoralPalette.primary}25`
                      : CoralPalette.surfaceAlt,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                  marginLeft: 30,
                },
              ]}
            >
              <X
                size={50}
                color={
                  focusedHat === null
                    ? CoralPalette.primary
                    : CoralPalette.mutedDark
                }
              />
            </TouchableOpacity>
          }
          renderItem={({ item }) => {
            const isFocused = item === focusedHat;
            return (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setFocusedHat(item)}
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

      {/* Face */}
      <Text
        className="text-base font-extrabold mb-3 mt-6"
        style={[
          { fontSize: 16, color: CoralPalette.dark, marginLeft: 40 },
          FONT,
        ]}
      >
        Face
      </Text>
      <View style={{ minHeight: 80 }}>
        <FlatList
          data={sortedFaces}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 12 }}
          ListHeaderComponent={
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setFocusedFace(null)}
              style={[
                {
                  width: 90,
                  height: 90,
                  borderRadius: 16,
                  borderWidth: 2,
                  borderColor:
                    focusedFace === null
                      ? CoralPalette.primary
                      : CoralPalette.border,
                  backgroundColor:
                    focusedFace === null
                      ? `${CoralPalette.primary}25`
                      : CoralPalette.surfaceAlt,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                  marginLeft: 30,
                },
              ]}
            >
              <X
                size={50}
                color={
                  focusedFace === null
                    ? CoralPalette.primary
                    : CoralPalette.mutedDark
                }
              />
            </TouchableOpacity>
          }
          renderItem={({ item }) => {
            const isFocused = item === focusedFace;
            return (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setFocusedFace(item)}
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

      {/* Collars */}
      <Text
        className="text-base font-extrabold mb-3 mt-6"
        style={[
          { fontSize: 16, color: CoralPalette.dark, marginLeft: 40 },
          FONT,
        ]}
      >
        Collars
      </Text>
      <View style={{ minHeight: 80 }}>
        <FlatList
          data={sortedCollars}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 12 }}
          ListHeaderComponent={
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setFocusedCollar(null)}
              style={[
                {
                  width: 90,
                  height: 90,
                  borderRadius: 16,
                  borderWidth: 2,
                  borderColor:
                    focusedCollar === null
                      ? CoralPalette.primary
                      : CoralPalette.border,
                  backgroundColor:
                    focusedCollar === null
                      ? `${CoralPalette.primary}25`
                      : CoralPalette.surfaceAlt,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                  marginLeft: 30,
                },
              ]}
            >
              <X
                size={50}
                color={
                  focusedCollar === null
                    ? CoralPalette.primary
                    : CoralPalette.mutedDark
                }
              />
            </TouchableOpacity>
          }
          renderItem={({ item }) => {
            const isFocused = item === focusedCollar;
            return (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setFocusedCollar(item)}
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

      {/* Gadgets */}
      <Text
        className="text-base font-extrabold mb-3 mt-6"
        style={[
          { fontSize: 16, color: CoralPalette.dark, marginLeft: 40 },
          FONT,
        ]}
      >
        Gadgets
      </Text>
      <View style={{ minHeight: 80 }}>
        <FlatList
          data={sortedGadgets}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 12 }}
          ListHeaderComponent={
            <View
              style={{
                marginLeft: 20,
              }}
            ></View>
          }
          ListEmptyComponent={
            <Text
              className="text-sm"
              style={[{ color: CoralPalette.mutedDark }, FONT]}
            >
              No gadgets owned yet
            </Text>
          }
          renderItem={({ item }) => {
            const isFocused = item === focusedGadget;
            return (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setFocusedGadget(isFocused ? null : item)}
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
                    width: 70,
                    height: 70,
                    borderRadius: 14,
                  }}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </ScrollView>
  );
};

export default AccessoriesTab;
