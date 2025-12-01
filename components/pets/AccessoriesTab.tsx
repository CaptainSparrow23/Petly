import React from "react";
import { Text, View, FlatList, Image, TouchableOpacity } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { X } from "lucide-react-native";
import images from "@/constants/images";
import { CoralPalette } from "@/constants/colors";

const FONT = { fontFamily: "Nunito" };

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
}

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
}: AccessoriesTabProps) => {
  return (
    <ScrollView
      className="flex-1 ml-10"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingTop: 8, paddingBottom: 150 }}
    >
      {/* Hats */}
      <Text
        className="text-base font-extrabold mb-3"
        style={[{ color: CoralPalette.dark }, FONT]}
      >
        Hats
      </Text>
      <View style={{ minHeight: 80 }}>
        <FlatList
          data={ownedHats}
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

      {/* Collars */}
      <Text
        className="text-base font-extrabold mb-3 mt-6"
        style={[{ color: CoralPalette.dark }, FONT]}
      >
        Collars
      </Text>
      <View style={{ minHeight: 80 }}>
        <FlatList
          data={ownedCollars}
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
        className="text-base font-bold mb-3 mt-6"
        style={[{ color: CoralPalette.dark }, FONT]}
      >
        Gadgets
      </Text>
      <View style={{ minHeight: 80 }}>
        <FlatList
          data={ownedGadgets}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 12 }}
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
