import React, {
  useCallback,
  useMemo,
  useState,
  useRef,
  useEffect,
} from "react";
import {
  Text,
  View,
  ImageBackground,
  TouchableOpacity,
  Animated,
  Image,
  FlatList,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import images from "@/constants/images";
import { ImageSourcePropType, ImageStyle, ViewStyle } from "react-native";
import { useGlobalContext } from "@/providers/GlobalProvider";
import { Check, X, HeartHandshake, Shirt, Image as ImageIcon} from "lucide-react-native";
import { usePets } from "@/hooks/usePets";
import PetAnimation from "@/components/focus/PetAnimation";
import { CoralPalette } from "@/constants/colors";
import Constants from "expo-constants";
import PetsTab from "@/components/pets/PetsTab";
import AccessoriesTab, { AccessoryCategory } from "@/components/pets/AccessoriesTab";
import FriendshipModal from "@/components/pets/FriendshipModal";
import { petAnimations } from "@/constants/animations";
import { PetsTabSkeleton } from "@/components/other/Skeleton";
import BaseModal from "@/components/common/BaseModal";

const API_BASE_URL = Constants.expoConfig?.extra?.backendUrl as string;

const FONT = { fontFamily: "Nunito" };

// Background configuration type
type BackgroundConfig = {
  source: ImageSourcePropType;
  containerStyle: ViewStyle;
  imageStyle: ImageStyle;
  thumbnailStyle?: ImageStyle;
  label: string;
};

// Individual styles for each background
const BACKGROUND_CONFIGS: Record<string, BackgroundConfig> = {
  background_room: {
    source: images.background_room,
    containerStyle: { flex: 1, height: '125%' },
    imageStyle: { transform: [{ translateY: -115 }] },
    thumbnailStyle: { transform: [{ translateY: 20 }] },
    label: 'Room',
  },
  background_beach: {
    source: images.background_beach,
    containerStyle: { flex: 1, height: '130%' },
    imageStyle: { transform: [{ translateY: -180 }] },
    thumbnailStyle: { transform: [{ translateY: 0 }] },
    label: 'Beach',
  },
  background_park: {
    source: images.background_park,
    containerStyle: { flex: 1, height: '100%' },
    imageStyle: { transform: [{ translateY: -140 }] },
    thumbnailStyle: { height: "10%", transform: [{ translateY: 0 }] },
    label: 'Park',
  },
  background_winter: {
    source: images.background_winter,
    containerStyle: { flex: 1, height: '90%' },
    imageStyle: { transform: [{ translateY: 0 }] },
    thumbnailStyle: { transform: [{ translateY: 20 }] },
    label: 'Winter',
  },
  background_kitchen: {
    source: images.background_kitchen,
    containerStyle: { flex: 1, height: '100%' },
    imageStyle: { transform: [{ translateY: -200 }] },
    thumbnailStyle: { transform: [{ translateY: 0 }] },
    label: 'Kitchen',
  },
};

const BACKGROUND_KEYS = Object.keys(BACKGROUND_CONFIGS);

// Shared button styling constants
const TOP_BUTTON_BASE_STYLE = {
  width: 70,
  height: 70,
  backgroundColor: CoralPalette.white,
  borderRadius: 100,
  shadowColor: "#000",
  shadowOpacity: 0.1,
  shadowOffset: { width: 0, height: 2 },
  shadowRadius: 2,
  elevation: 4,
} as const;

const TOP_BUTTON_CONTAINER_STYLE = {
  position: "absolute" as const,
  right: 18,
  zIndex: 20,
} as const;

const Profile = () => {
  const { userProfile, showBanner, updateUserProfile, appSettings, updateAppSettings } = useGlobalContext();
  const [activeAccessoryCategory, setActiveAccessoryCategory] = useState<AccessoryCategory>("hat");
  const modeAnim = useRef(new Animated.Value(0)).current; // 0 = pets view, 1 = edit
  const friendAnim = useRef(new Animated.Value(0)).current; // 0 = visible, 1 = hidden (for focus pop)
  const confirmButtonScale = useRef(new Animated.Value(1)).current; // For bounce animation
  const editButtonScale = useRef(new Animated.Value(1)).current; // For edit button bounce animation
  const friendshipButtonScale = useRef(new Animated.Value(1)).current; // For friendship button animation
  const imageButtonScale = useRef(new Animated.Value(1)).current; // For image button animation
  const [editing, setEditing] = useState(false);
  const [friendshipModalVisible, setFriendshipModalVisible] = useState(false);
  const [backgroundModalVisible, setBackgroundModalVisible] = useState(false);
  const selectedBackgroundKey = appSettings.selectedBackground;

  // Focused accessory states (local selection before saving)
  const [focusedHat, setFocusedHat] = useState<string | null>(
    userProfile?.selectedHat ?? null
  );
  const [focusedCollar, setFocusedCollar] = useState<string | null>(
    userProfile?.selectedCollar ?? null
  );
  const [focusedGadget, setFocusedGadget] = useState<string | null>(
    userProfile?.selectedGadget ?? "gadget_laptop"
  );
  const [isSavingAccessories, setIsSavingAccessories] = useState(false);


  const {
    pets,
    loading: petsLoading,
    focusedPet,
    setFocusedPet,
    isSaving,
    saveSelectedPet,
    error,
  } = usePets({
    ownedPets: userProfile?.ownedPets,
    selectedPet: userProfile?.selectedPet,
    userId: userProfile?.userId,
  });

  // Sync focused accessories when userProfile loads or changes
  useEffect(() => {
    if (
      userProfile &&
      (!focusedPet || focusedPet === userProfile.selectedPet)
    ) {
      setFocusedHat(userProfile.selectedHat ?? null);
      setFocusedCollar(userProfile.selectedCollar ?? null);
      setFocusedGadget(userProfile.selectedGadget ?? "gadget_laptop");
    }
  }, [
    userProfile?.selectedHat,
    userProfile?.selectedCollar,
    userProfile?.selectedGadget,
    userProfile?.selectedPet,
    focusedPet,
    userProfile,
  ]);

  const changeFlags = useMemo(() => {
    const petChanged = !!focusedPet && focusedPet !== userProfile?.selectedPet;
    const hatChanged = focusedHat !== (userProfile?.selectedHat ?? null);
    const collarChanged =
      focusedCollar !== (userProfile?.selectedCollar ?? null);
    const gadgetChanged =
      focusedGadget !== (userProfile?.selectedGadget ?? "gadget_laptop");
    const accessoryChanged =
      hatChanged || collarChanged || gadgetChanged;
    return {
      petChanged,
      hatChanged,
      collarChanged,
      gadgetChanged,
      accessoryChanged,
    };
  }, [
    focusedPet,
    focusedHat,
    focusedCollar,
    focusedGadget,
    userProfile?.selectedPet,
    userProfile?.selectedHat,
    userProfile?.selectedCollar,
    userProfile?.selectedGadget,
  ]);

  const hasUnsavedChange = useMemo(
    () =>
      changeFlags.petChanged ||
      changeFlags.hatChanged ||
      changeFlags.collarChanged ||
      changeFlags.gadgetChanged,
    [changeFlags]
  );

  const handleSaveSelection = useCallback(async () => {
    if (isSaving || isSavingAccessories || !hasUnsavedChange) return;

    const promises: Promise<void>[] = [];
    let hasError = false;

    // Save pet if changed
    if (changeFlags.petChanged && focusedPet) {
      promises.push(
        new Promise<void>((resolve) => {
          saveSelectedPet(
            focusedPet,
            () => resolve(),
            () => {
              hasError = true;
              resolve();
            }
          );
        })
      );
    }

    // Save accessories if any changed OR if pet changed (always save current accessory state with pet change)
    if (changeFlags.accessoryChanged || changeFlags.petChanged) {
      setIsSavingAccessories(true);
      promises.push(
        (async () => {
          try {
            const res = await fetch(
              `${API_BASE_URL}/api/pets/update_accessories/${userProfile?.userId}`,
              {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  selectedHat: focusedHat,
                  selectedCollar: focusedCollar,
                  selectedGadget: focusedGadget,
                }),
              }
            );
            const json = await res.json();
            if (!res.ok || !json?.success) {
              hasError = true;
            }
          } catch {
            hasError = true;
          } finally {
            setIsSavingAccessories(false);
          }
        })()
      );
    }

    await Promise.all(promises);

    if (hasError) {
      showBanner("Could not save all changes. Please try again.", "error");
    } else {
      updateUserProfile({
        ...(changeFlags.petChanged && focusedPet ? { selectedPet: focusedPet } : {}),
        selectedHat: focusedHat,
        selectedCollar: focusedCollar,
        selectedGadget: focusedGadget,
      });
      showBanner("Changes saved", "success");
    }
  }, [
    changeFlags,
    focusedCollar,
    focusedGadget,
    focusedHat,
    focusedPet,
    isSaving,
    isSavingAccessories,
    saveSelectedPet,
    showBanner,
    updateUserProfile,
    userProfile,
    hasUnsavedChange,
  ]);

  const currentPetId = focusedPet || userProfile?.selectedPet || "";

  const animateMode = useCallback(
    (toValue: number, onComplete?: () => void) => {
      Animated.spring(modeAnim, {
        toValue,
        useNativeDriver: true,
        tension: 60,
        friction: 12,
      }).start(onComplete);
    },
    [modeAnim]
  );

  // Reusable button press animation handler
  const createButtonPressHandlers = (animValue: Animated.Value) => ({
    onPressIn: () => {
      Animated.timing(animValue, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }).start();
    },
    onPressOut: () => {
      Animated.timing(animValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }).start();
    },
  });

  const editButtonHandlers = createButtonPressHandlers(editButtonScale);
  const friendshipButtonHandlers = createButtonPressHandlers(friendshipButtonScale);
  const imageButtonHandlers = createButtonPressHandlers(imageButtonScale);

  const openFriendshipModal = () => setFriendshipModalVisible(true);
  const closeFriendshipModal = () => setFriendshipModalVisible(false);

  const openBackgroundModal = () => setBackgroundModalVisible(true);
  const closeBackgroundModal = () => setBackgroundModalVisible(false);

  const selectBackground = (key: string) => {
    updateAppSettings({ selectedBackground: key });
    closeBackgroundModal();
  };


  const startEditing = () => {
    if (friendshipModalVisible) {
      closeFriendshipModal();
    }
    setEditing(true);
    animateMode(1);
  };

  const cancelEditing = () => {
    // Exit accessories/edit mode only - don't reset focused items
    setEditing(false);
    animateMode(0);
  };

  // Ensure the pets view pops into view whenever the tab is focused.
  useFocusEffect(
    useCallback(() => {
      if (petsLoading || error) return;

      // Exit edit instantly (no downward animation)
      setEditing(false);
      setFriendshipModalVisible(false);
      setBackgroundModalVisible(false);
      modeAnim.setValue(0);

      // Play a quick pop for the pets view
      friendAnim.setValue(1);
      Animated.spring(friendAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 70,
        friction: 9,
      }).start();
    }, [modeAnim, friendAnim, petsLoading, error])
  );

  const animateConfirmButton = useCallback(() => {
    // Bounce animation: scale down then back up with spring
    Animated.sequence([
      Animated.timing(confirmButtonScale, {
        toValue: 0.85,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(confirmButtonScale, {
        toValue: 1,
        tension: 300,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  }, [confirmButtonScale]);

  const confirmEditing = async () => {
    await handleSaveSelection();
    setEditing(false);
    animateMode(0);
  };

  const sheetTranslateY = modeAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [400, 400, 0],
  });

  // Friendship panel animation (independent of edit sheet)
  const friendTranslateY = friendAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 400],
  });

  const friendOpacity = friendAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  const petsModeTranslateY = modeAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 280, 280],
  });

  const petsModeOpacity = modeAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0, 0],
  });

  const petsTranslateY = Animated.add(friendTranslateY, petsModeTranslateY);
  const petsOpacity = Animated.multiply(friendOpacity, petsModeOpacity);

  const sheetOpacity = modeAnim.interpolate({
    inputRange: [0, 0.1, 1],
    outputRange: [0, 0, 1],
  });

  // Get the current background configuration
  const currentBackground = BACKGROUND_CONFIGS[selectedBackgroundKey];

  if (petsLoading) {
    return (
      <View className="flex-1" style={{ backgroundColor: CoralPalette.greyVeryLight }}>
        <View style={{ flex: 1, paddingTop: 12 }}>
          <PetsTabSkeleton />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View
        className="flex-1 items-center justify-center px-6"
        style={{ backgroundColor: CoralPalette.surface }}
      >
        <Text
          className="text-lg font-extrabold text-center"
          style={[{ color: CoralPalette.dark }, FONT]}
        >
          We hit a snag
        </Text>
        <Text
          className="mt-2 text-sm text-center"
          style={[{ color: CoralPalette.mutedDark, lineHeight: 20 }, FONT]}
        >
          {error}
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: CoralPalette.white }}>
      <ImageBackground
        source={currentBackground.source}
        style={currentBackground.containerStyle}
        resizeMode="cover"
        imageStyle={currentBackground.imageStyle}
      >
        {/* Top right - Friendship level indicator */}
        {currentPetId && (
          <Animated.View
            style={{
              ...TOP_BUTTON_CONTAINER_STYLE,
              top: 100,
              transform: [{ scale: friendshipButtonScale }],
            }}
          >
            <TouchableOpacity
              onPress={openFriendshipModal}
              onPressIn={friendshipButtonHandlers.onPressIn}
              onPressOut={friendshipButtonHandlers.onPressOut}
              activeOpacity={1}
              className="flex-row items-center justify-center rounded-full"
              style={TOP_BUTTON_BASE_STYLE}
            >
              <HeartHandshake size={30} color={CoralPalette.purple} strokeWidth={3} stroke={CoralPalette.purple} />
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Top right - Image button (below friendship button) */}
        <Animated.View
          style={{
            ...TOP_BUTTON_CONTAINER_STYLE,
            top: 180,
            transform: [{ scale: imageButtonScale }],
          }}
        >
          <TouchableOpacity
            onPress={openBackgroundModal}
            onPressIn={imageButtonHandlers.onPressIn}
            onPressOut={imageButtonHandlers.onPressOut}
            activeOpacity={1}
            className="flex-row items-center justify-center rounded-full"
            style={TOP_BUTTON_BASE_STYLE}
          >
            <ImageIcon size={30} color={CoralPalette.blue} strokeWidth={3} />
          </TouchableOpacity>
        </Animated.View>

        {/* Top right button - unified wardrobe/confirm/cancel button */}
        <Animated.View
          style={{
            ...TOP_BUTTON_CONTAINER_STYLE,
            top: 18,
            transform: [{ scale: editing ? (changeFlags.accessoryChanged ? confirmButtonScale : editButtonScale) : (changeFlags.petChanged ? confirmButtonScale : editButtonScale) }],
          }}
        >
          <TouchableOpacity
            onPress={() => {
              if (editing) {
                // In edit mode: save if changes, otherwise cancel
                if (changeFlags.accessoryChanged) {
                  confirmEditing();
                } else {
                  cancelEditing();
                }
              } else {
                // In pets tab: save pet if changed, otherwise open wardrobe
                if (changeFlags.petChanged) {
                  confirmEditing();
                } else {
                  startEditing();
                }
              }
            }}
            onPressIn={editButtonHandlers.onPressIn}
            onPressOut={editButtonHandlers.onPressOut}
            activeOpacity={1}
            className="rounded-full"
            style={{
              ...TOP_BUTTON_BASE_STYLE,
              alignItems: "center",
              justifyContent: "center",
              borderColor: (editing ? changeFlags.accessoryChanged : changeFlags.petChanged) ? CoralPalette.green : "transparent",
              borderWidth: (editing ? changeFlags.accessoryChanged : changeFlags.petChanged) ? 2 : 0,
            }}
          >
            {editing ? (
              // Edit mode: Check if accessory changed, X if not
              changeFlags.accessoryChanged ? (
                <Check size={30} color={CoralPalette.green} strokeWidth={3} />
              ) : (
                <X size={30} color={CoralPalette.mutedDark} strokeWidth={3} />
              )
            ) : (
              // Pets tab: Check if pet changed, Shirt if not
              changeFlags.petChanged ? (
                <Check size={30} color={CoralPalette.green} strokeWidth={3} />
              ) : (
                <Shirt size={30} color={CoralPalette.primaryMuted} strokeWidth={3} />
              )
            )}
          </TouchableOpacity>
        </Animated.View>

        <View className="flex-1">
          {/* Pet and shadow container */}
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: '15%',
              left: 3,
              right: 0,
              bottom: '40%',
              alignItems: "center",
              justifyContent: "flex-end",
            }}
          >
            {(() => {
              // Ensure selectedPet is always included even if not in ownedPets (edge case)
              const petsToRender = new Set(userProfile?.ownedPets || []);
              if (currentPetId) petsToRender.add(currentPetId);
              
              return Array.from(petsToRender).map((petId) => {
                const config = petAnimations[petId];
                if (!config) return null;
                
                const isActive = petId === currentPetId;
                return (
                  <View
                    key={petId}
                    style={{
                      position: "absolute",
                      width: "100%",
                      height: "100%",
                      opacity: isActive ? 1 : 0,
                      pointerEvents: isActive ? "auto" : "none",
                      alignItems: "center",
                      justifyContent: "flex-end",
                    }}
                  >
                    {/* Shadow - renders behind the pet */}
                    <View
                      style={{
                        position: "relative",
                        top: '90%',
                        width: 120,
                        height: 120,
                        borderRadius: 60,
                        backgroundColor: 'rgba(0,0,0,0.35)',
                        transform: [{ scaleX: 0.9 }, { scaleY: 0.20 }],
                        zIndex: 1,
                      }}
                    />
                    {/* Pet animation - renders above shadow */}
                    <View style={{ width: "100%", height: "100%", zIndex: 2 }}>
                      <PetAnimation
                        source={config.source}
                        stateMachineName={config.stateMachineName}
                        focusInputName={config.focusInputName}
                        focusValue={0}
                        selectedHat={focusedHat}
                        selectedCollar={focusedCollar}
                        containerStyle={{ width: "100%", height: "100%" }}
                        animationStyle={{ width: "65%", height: "65%" }}
                      />
                    </View>
                  </View>
                );
              });
            })()}
          </View>

        {/* Pets Tab - replaces overview */}
        <Animated.View
          style={{
            position: "absolute",
            top: '52%',
            left: 0,
            right: 0,
            bottom: 0,
            paddingBottom: 0,
            paddingTop: 12,
            backgroundColor: CoralPalette.greyVeryLight,
            transform: [{ translateY: petsTranslateY }],
            opacity: petsOpacity,
            borderTopLeftRadius: 10,
            borderTopRightRadius: 10,
            shadowColor: "#000",
            shadowOpacity: 0.1,
            shadowOffset: { width: 0, height: -2 },
            shadowRadius: 6,
            elevation: 4,
          }}
          pointerEvents={editing ? "none" : "auto"}
        >
          <PetsTab
            pets={pets}
            focusedPet={focusedPet}
            setFocusedPet={setFocusedPet}
            selectedPet={userProfile?.selectedPet}
            petFriendships={userProfile?.petFriendships}
          />
        </Animated.View>

          {/* Accessories Edit Mode */}
          <Animated.View
            className="rounded-t-3xl shadow-lg pt-4"
            style={{
              position: "absolute",
              top: "52%",
              left: 0,
              right: 0,
              bottom: -100,
              backgroundColor: CoralPalette.greyLighter,
              transform: [{ translateY: sheetTranslateY }],
              opacity: sheetOpacity,
              borderTopLeftRadius: 10,
              borderTopRightRadius: 10,
            }}
            pointerEvents={editing ? "auto" : "none"}
          >
            <AccessoriesTab
              ownedHats={userProfile?.ownedHats || []}
              ownedCollars={userProfile?.ownedCollars || []}
              ownedGadgets={userProfile?.ownedGadgets || []}
              focusedHat={focusedHat}
              focusedCollar={focusedCollar}
              focusedGadget={focusedGadget}
              setFocusedHat={setFocusedHat}
              setFocusedCollar={setFocusedCollar}
              setFocusedGadget={setFocusedGadget}
              activeCategory={activeAccessoryCategory}
              setActiveCategory={setActiveAccessoryCategory}
            />
          </Animated.View>

        </View>
      </ImageBackground>

      {/* Friendship Modal - Centered */}
      <FriendshipModal
        visible={friendshipModalVisible}
        onClose={closeFriendshipModal}
        userProfile={userProfile}
        pets={pets}
      />

      {/* Background Selection Modal */}
      <BaseModal
        visible={backgroundModalVisible}
        onClose={closeBackgroundModal}
        title="Choose Background"
        animationType="scale"
        contentStyle={{
          width: '85%',
          maxWidth: 340,
          backgroundColor: CoralPalette.white,
          borderRadius: 20,
        }}
      >
        <FlatList
          data={BACKGROUND_KEYS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          contentContainerStyle={{ paddingHorizontal: 4 }}
          renderItem={({ item: key }) => {
            const config = BACKGROUND_CONFIGS[key];
            const isSelected = key === selectedBackgroundKey;
            return (
              <TouchableOpacity
                onPress={() => selectBackground(key)}
                style={{
                  width: 80,
                  alignItems: 'center',
                  marginHorizontal: 6,
                }}
              >
                {/* Square image container */}
                <View
                  style={{
                    width: 70,
                    height: 70,
                    borderRadius: 12,
                    overflow: 'hidden',
                    borderWidth: isSelected ? 3 : 2,
                    borderColor: isSelected ? CoralPalette.primary : CoralPalette.greyLight,
                  }}
                >
                  <Image
                    source={config.source}
                    style={[
                      { width: '100%', height: '100%' },
                      config.thumbnailStyle,
                    ]}
                    resizeMode="cover"
                  />
                  {/* Selected checkmark */}
                  {isSelected && (
                    <View
                      style={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        backgroundColor: CoralPalette.primary,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Check size={12} color="#fff" strokeWidth={3} />
                    </View>
                  )}
                </View>
                {/* Label underneath */}
                <Text 
                  style={[
                    { 
                      marginTop: 6, 
                      fontSize: 12, 
                      fontWeight: isSelected ? '700' : '500',
                      color: isSelected ? CoralPalette.primary : CoralPalette.mutedDark,
                      textAlign: 'center',
                    }, 
                    FONT
                  ]}
                >
                  {config.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </BaseModal>
    </View>
  );
};

export default Profile;
