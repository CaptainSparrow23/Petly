import React, { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Animated, Modal, Image } from "react-native";
import { Clock, HeartHandshake, Calendar, X } from "lucide-react-native";
import { CoralPalette } from "@/constants/colors";
import { getPetMood, getPetImageByMood, PetMood } from "@/utils/petMood";

const FONT = { fontFamily: "Nunito" };

// Clipboard clip colors
const CLIP_COLOR = "#A67C52";
const CLIP_DARK = "#8B6543";

interface FriendshipModalProps {
  visible: boolean;
  onClose: () => void;
  userProfile: any;
  pets: any[];
}

const MoodBar = ({ mood }: { mood: PetMood }) => {
  const getMoodConfig = () => {
    switch (mood) {
      case 1:
        return { fill: 1 / 3, color: "#E57373", label: "Lonely" };
      case 2:
        return { fill: 2 / 3, color: "#FFD54F", label: "Neutral" };
      case 3:
        return { fill: 1, color: "#81C784", label: "Happy" };
    }
  };

  const config = getMoodConfig();

  return (
    <View style={{ alignItems: "center" }}>
      <Text style={[FONT, { fontSize: 14, color: config.color, fontWeight: "700", marginBottom: 8 }]}>
        {config.label}
      </Text>
      <View style={{ width: 180, height: 8, backgroundColor: CoralPalette.greyLight, borderRadius: 4, overflow: "hidden" }}>
        <View style={{ height: "100%", borderRadius: 4, width: `${config.fill * 100}%`, backgroundColor: config.color }} />
      </View>
    </View>
  );
};

const StatRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: CoralPalette.greyLight }}>
    <View style={{ width: 32 }}>{icon}</View>
    <Text style={[FONT, { flex: 1, fontSize: 14, color: CoralPalette.mutedDark, fontWeight: "500" }]}>{label} </Text>
    <Text style={[FONT, { fontSize: 14, color: CoralPalette.dark, fontWeight: "700" }]}>{ ` ${value}`}</Text>
  </View>
);

const FriendshipModal = ({ visible, onClose, userProfile, pets }: FriendshipModalProps) => {
  const selectedPetId = userProfile?.selectedPet;
  const selectedPet = pets.find((p: any) => p.id === selectedPetId);
  const petFriendships = userProfile?.petFriendships ?? {};
  const friendshipData = petFriendships[selectedPetId];

  const mood = getPetMood(friendshipData?.updatedAt);
  const petImage = selectedPetId ? getPetImageByMood(selectedPetId, mood) : null;
  const level = friendshipData?.level ?? 1;
  const totalFocusSeconds = friendshipData?.totalFocusSeconds ?? 0;
  const totalMinutes = Math.floor(totalFocusSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  const timeDisplay = totalHours > 0 ? `${totalHours} h ${remainingMinutes} m` : `${remainingMinutes} m`;

  const [mounted, setMounted] = React.useState(visible);
  const visibleRef = useRef(visible);

  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const modalScale = useRef(new Animated.Value(0.95)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    visibleRef.current = visible;
    
    if (visible) {
      setMounted(true);
      Animated.parallel([
        Animated.timing(backdropOpacity, { toValue: 0.5, duration: 200, useNativeDriver: true }),
        Animated.spring(modalScale, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
        Animated.timing(modalOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(modalScale, { toValue: 0.95, duration: 150, useNativeDriver: true }),
        Animated.timing(modalOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
      ]).start(({ finished }) => {
        if (finished && !visibleRef.current) {
          setMounted(false);
        }
      });
    }
  }, [visible]);

  if (!mounted) return null;

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose}>
      {/* Backdrop */}
      <Animated.View 
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#000", opacity: backdropOpacity }} 
      />

      {/* Touchable backdrop */}
      <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 16 }}>
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <Animated.View
              style={{ width: "90%", maxWidth: 360, opacity: modalOpacity, transform: [{ scale: modalScale }] }}
            >
              {selectedPet ? (
                <View style={{ alignItems: "center" }}>
                  {/* Clipboard clip */}
                  <View style={{ width: 60, height: 24, backgroundColor: CLIP_COLOR, borderTopLeftRadius: 8, borderTopRightRadius: 8, zIndex: 10, alignItems: "center", justifyContent: "flex-end", paddingBottom: 4 }}>
                    <View style={{ width: 40, height: 8, backgroundColor: CLIP_DARK, borderRadius: 4 }} />
                  </View>

                  {/* Main clipboard body */}
                  <View style={{ width: "100%", backgroundColor: CoralPalette.clipboardPaper, borderRadius: 16, marginTop: -8, paddingTop: 16, paddingHorizontal: 20, paddingBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 8 }}>
                    {/* Close button */}
                    <TouchableOpacity
                      onPress={onClose}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      style={{ position: "absolute", top: 12, right: 12, zIndex: 10 }}
                    >
                      <X size={22} color={CoralPalette.mutedDark} />
                    </TouchableOpacity>

                    {/* Pet name */}
                    <Text style={[FONT, { fontSize: 20, fontWeight: "800", color: CoralPalette.dark, textAlign: "center", marginBottom: 12 }]}>
                      {selectedPet.name}
                    </Text>

                    {/* Pet image */}
                    <View style={{ width: 260, height: 180, backgroundColor: CoralPalette.clipboardPaper, borderRadius: 8, overflow: "hidden", marginBottom: 14, alignSelf: "center", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: CoralPalette.clipboardBorder}}>
                      {petImage && (
                        <Image
                          source={petImage}
                          style={{ width: 150, height: 150 }}
                          resizeMode="contain"
                        />
                      )}
                    </View>

                    {/* Mood bar */}
                    <MoodBar mood={mood} />

                    {/* Stats */}
                    <View style={{ marginTop: 16 }}>
                      <StatRow
                        icon={<HeartHandshake size={18} color={CoralPalette.purple} fill={CoralPalette.purpleLight} />}
                        label="Friendship level"
                        value={`Lv. ${level}`}
                      />
                      <StatRow
                        icon={<Clock size={18} color={CoralPalette.blue} />}
                        label="Time together"
                        value={timeDisplay}
                      />
                      <StatRow
                        icon={<Calendar size={18} color={CoralPalette.green} />}
                        label="Together since"
                        value="—"
                      />
                    </View>
                  </View>
                </View>
              ) : (
                <View style={{ alignItems: "center", paddingVertical: 32, backgroundColor: CoralPalette.white, borderRadius: 16 }}>
                  <Text style={[FONT, { color: CoralPalette.mutedDark }]}>No pet selected</Text>
                </View>
              )}
            </Animated.View>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

export default FriendshipModal;
