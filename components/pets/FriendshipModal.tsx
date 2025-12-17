import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Animated,
  TouchableOpacity,
  Modal,
  useWindowDimensions,
} from "react-native";
import { HeartHandshake, X, Gift } from "lucide-react-native";
import { CoralPalette } from "@/constants/colors";

const FONT = { fontFamily: "Nunito" };

interface PetFriendshipData {
  petId: string | number;
  petName: string;
  level: number;
  progress: number;
  xpIntoLevel: number;
  xpToNextLevel: number;
}

interface FriendshipModalProps {
  visible: boolean;
  onClose: () => void;
  animValue: Animated.Value;
  userProfile: any;
  pets: any[];
}

const GiftButton = ({ onPress }: { onPress: () => void }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.9,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      <Animated.View
        style={{
          width: 50,
          height: 50,
          borderRadius: 100,
          backgroundColor: CoralPalette.purple,
          justifyContent: "center",
          alignItems: "center",
          transform: [{ scale: scaleAnim }],
        }}
      >
        <Gift size={27} color={CoralPalette.white} />
      </Animated.View>
    </TouchableOpacity>
  );
};

const FriendshipModal = ({
  visible,
  onClose,
  animValue,
  userProfile,
  pets,
}: FriendshipModalProps) => {
  const { width, height } = useWindowDimensions();
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) {
      setMounted(true);
    } else {
      const timer = setTimeout(() => {
        setMounted(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!mounted) return null;

  const backdropOpacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5],
  });

  const modalTranslateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [600, 0], // Start from bottom, end at center
  });

  const modalOpacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const petFriendships = userProfile?.petFriendships ?? {};
  const ownedPets = userProfile?.ownedPets ?? [];

  const petFriendshipData: PetFriendshipData[] = ownedPets.map((petId: string | number) => {
    const pet = pets.find((p) => p.id === petId);
    const friendshipData = petFriendships[petId];
    const level = friendshipData?.level ?? 1;
    const xpIntoLevel = friendshipData?.xpIntoLevel ?? 0;
    const xpToNextLevel = friendshipData?.xpToNextLevel ?? 50;
    const xpTotal = xpIntoLevel + xpToNextLevel;
    const progress = xpTotal > 0 ? (xpIntoLevel / xpTotal) : 0;

    return {
      petId,
      petName: pet?.name ?? "Unknown",
      level,
      progress,
      xpIntoLevel,
      xpToNextLevel,
    };
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Animated.View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "#000",
            opacity: backdropOpacity,
          }}
        />
        <TouchableOpacity
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
          activeOpacity={1}
          onPress={onClose}
        />

        <Animated.View
          style={{
            width: width * 0.85,
            maxHeight: height * 0.7,
            backgroundColor: CoralPalette.surface,
            borderRadius: 10,
            padding: 20,
            shadowColor: "#000",
            shadowOpacity: 0.3,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 20,
            elevation: 10,
            transform: [{ translateY: modalTranslateY }],
            opacity: modalOpacity,
          }}
          onStartShouldSetResponder={() => true}
        >
          {/* Header */}
          <View className="ml-2 flex-row items-center justify-between mb-4">
            <Text
              
              style={[{ fontSize: 18, fontWeight: "700" }, FONT, { color: CoralPalette.dark }]}
            >
              Companion Friendships
            </Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={CoralPalette.mutedDark} />
            </TouchableOpacity>
          </View>

          {/* Pet Friendship List */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ maxHeight: 400 }}
            contentContainerStyle={{ paddingBottom: 10 }}
          >
            {petFriendshipData.length === 0 ? (
              <View className="items-center py-8" style={{ backgroundColor: CoralPalette.surfaceAlt}}>
                <HeartHandshake size={48} color={CoralPalette.purple} />
                <Text
                  className="text-center mt-4"
                  style={[FONT, { color: CoralPalette.mutedDark }]}
                >
                  No pets yet. Start focusing to unlock pets!
                </Text>
              </View>
            ) : (
              petFriendshipData.map(
                ({ petId, petName, level, progress, xpIntoLevel, xpToNextLevel }: PetFriendshipData) => (
                  <View
                    key={petId}
                    className="rounded-2xl p-4 mb-3"
                    style={{ backgroundColor: CoralPalette.white }}
                    
                  >
                    
                   <View className="flex-row justify-between mb-2">
                    <View className="flex-1 pr-4 mt-1">
                    <View className="ml-1 flex-row items-center justify-between mb-2">
                      <Text
                        className="text-lg font-bold"
                        style={[FONT, { color: CoralPalette.dark }]}
                      >
                        {petName}
                      </Text>
                      <View className="flex-row items-center">
                        <HeartHandshake size={22} color={CoralPalette.purple} fill={CoralPalette.purpleLight} />  
                        <Text
                          className="ml-1 text-xl font-extrabold"
                          style={[FONT, { color: CoralPalette.purple }]}
                        >
                          {level}
                        </Text>
                      </View>
                    </View>

                    {/* Progress Bar */}
                    <View className="flex-row ml-1 items-center gap-3">
                      <View
                        style={{
                          flex: 1,
                          height: 8,
                          backgroundColor: CoralPalette.lightGrey,
                          borderRadius: 4,
                          overflow: "hidden",
                        }}
                      >
                        <Animated.View
                          style={{
                            height: "100%",
                            width: `${progress * 100}%`,
                            backgroundColor: CoralPalette.purple,
                            borderRadius: 4,
                          }}
                        />
                      </View>
                   
                    </View>
                    </View>

               
                    <GiftButton onPress={() => {}} />
                  </View>
                  </View>
                )
              )
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default FriendshipModal;
