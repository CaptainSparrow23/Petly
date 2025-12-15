import React, { useMemo, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ImageBackground,
  Image,
  Dimensions,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";
import { router } from "expo-router";
import { useGlobalContext } from "@/lib/GlobalProvider";
import { CoralPalette } from "@/constants/colors";
import images from "@/constants/images";
import { PET_UNLOCK_LEVELS } from "@/utils/petUnlocks";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const FONT = { fontFamily: "Nunito" };

// Define node positions in S-shape following the path (from top to bottom)
// These positions are relative to the visible screen (no scrolling)
const getNodePositions = (screenWidth: number, screenHeight: number): Array<{ x: number; y: number; level: number }> => {
  const mapWidth = screenWidth;
  const mapHeight = screenHeight;
  const headerHeight = 60; // Approximate header height
  const footerHeight = 80; // Space for footer/legend if needed
  const availableHeight = mapHeight - headerHeight - footerHeight;
  const startY = headerHeight + 20; // Start a bit below header
  
  return [
    // Node 1: Top (start)
    { x: mapWidth * 0.35, y: startY + availableHeight * -0.03, level: 1 },
    // Node 2: Slight right curve
    { x: mapWidth * 0.7, y: startY + availableHeight * -0.03, level: 2 },
    // Node 3: Left curve
    { x: mapWidth * 0.82, y: startY + availableHeight * 0.15, level: 3 },
    // Node 4: Rightward segment
    { x: mapWidth * 0.45, y: startY + availableHeight * 0.15, level: 4 },
    // Node 5: Before bridge (left side of river) - middle
    { x: mapWidth * 0.55, y: startY + availableHeight * 0.425, level: 5 },
    // Node 6: After bridge (right side of river)
    { x: mapWidth * 0.86, y: startY + availableHeight * 0.53, level: 6 },
    // Node 7: Leftward curve
    { x: mapWidth * 0.24, y: startY + availableHeight * 0.54, level: 7 },
    // Node 8: Rightward curve
    { x: mapWidth * 0.42, y: startY + availableHeight * 0.66, level: 8 },
    // Node 9: Left curve
    { x: mapWidth * 0.68, y: startY + availableHeight * 0.72, level: 9 },
    // Node 10: Bottom (end)
    { x: mapWidth * 0.24, y: startY + availableHeight * 0.79, level: 10 },
  ];
};

interface RewardNode {
  level: number;
  type: "pet" | "regular";
  petId?: string;
  icon?: any;
}

export default function ProgressMap() {
  const { userProfile } = useGlobalContext();
  const currentLevel = userProfile?.level ?? 1;
  const ownedPets = userProfile?.ownedPets ?? [];
  const nodePositions = getNodePositions(SCREEN_WIDTH, SCREEN_HEIGHT);

  // Create reward nodes
  const rewardNodes = useMemo((): RewardNode[] => {
    const nodes: RewardNode[] = [];
    
    for (let level = 1; level <= 10; level++) {
      // First node gets laptop image
      if (level === 1) {
        nodes.push({
          level,
          type: "regular",
          icon: images.gadget_laptop,
        });
        continue;
      }
      
      // Fifth node gets pot and stove image
      if (level === 5) {
        nodes.push({
          level,
          type: "regular",
          icon: images.gadget_pot_and_stove,
        });
        continue;
      }
      
      const petId = Object.keys(PET_UNLOCK_LEVELS).find(
        (id) => PET_UNLOCK_LEVELS[id] === level
      );
      
      if (petId) {
        const petImage = images[petId as keyof typeof images];
        nodes.push({
          level,
          type: "pet",
          petId,
          icon: petImage,
        });
      } else {
        nodes.push({
          level,
          type: "regular",
        });
      }
    }
    
    return nodes;
  }, []);

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: CoralPalette.surface }}>
      {/* Header */}
      <View
        className="flex-row items-center justify-between px-5 py-3"
        style={{ backgroundColor: CoralPalette.surface }}
      >
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <ChevronLeft size={30} color={CoralPalette.dark} />
        </TouchableOpacity>
        <Text
          className="text-lg font-extrabold"
          style={[{ color: CoralPalette.dark }, FONT]}
        >
          Progress Map
        </Text>
        <View style={{ width: 30 }} />
      </View>

      {/* Map Container */}
      <View style={{ flex: 1 }}>
        <ImageBackground
          source={images.map_background}
          style={{
            width: 410,
            height: 761,
            flex: 1,
            position: "relative",
          }}
          resizeMode="cover"
        >
          {/* Reward Nodes */}
          {rewardNodes.map((node, index) => {
            const position = nodePositions[index];
            const isUnlocked = currentLevel >= node.level;
            const nodeSize = 70; // All nodes same size
            const borderWidth = 5;
            const scaleAnim = useRef(new Animated.Value(1)).current;

            const handlePressIn = () => {
              Animated.spring(scaleAnim, {
                toValue: 0.9,
                useNativeDriver: true,
                tension: 300,
                friction: 10,
              }).start();
            };

            const handlePressOut = () => {
              Animated.spring(scaleAnim, {
                toValue: 1,
                useNativeDriver: true,
                tension: 300,
                friction: 10,
              }).start();
            };

            return (
              <TouchableOpacity
                key={node.level}
                onPress={() => {
                  // Handle node press - you can add navigation or modal here
                  console.log(`Pressed node level ${node.level}`);
                }}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={1}
                style={{
                  position: "absolute",
                  left: position.x - nodeSize / 2,
                  top: position.y - nodeSize / 2,
                  width: nodeSize,
                  height: nodeSize,
                }}
              >
                {/* Node Circle */}
                <Animated.View
                  style={{
                    width: nodeSize,
                    height: nodeSize,
                    borderRadius: nodeSize / 2,
                    backgroundColor: isUnlocked
                      ? CoralPalette.white
                      : CoralPalette.surfaceAlt,
                    borderWidth: borderWidth,
                    borderColor: CoralPalette.green,
                    alignItems: "center",
                    justifyContent: "center",
                    shadowColor: "#000",
                    shadowOffset: { width: 1, height: 4 },
                    shadowOpacity: 0.5,
                    shadowRadius: 0.5,

                    transform: [{ scale: scaleAnim }],
                  }}
                >
                  {node.icon ? (
                    <Image
                      source={node.icon}
                      style={{
                        width: nodeSize * 0.6,
                        height: nodeSize * 0.6,
                        resizeMode: "contain",
                      }}
                    />
                  ) : null}
                </Animated.View>
              </TouchableOpacity>
            );
          })}
        </ImageBackground>
      </View>
    </SafeAreaView>
  );
}
