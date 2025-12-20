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
  ActivityIndicator,
  Animated,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import images from "@/constants/images";
import { useGlobalContext } from "@/lib/GlobalProvider";
import { Check, X, HeartHandshake, Shirt, Image as ImageIcon} from "lucide-react-native";
import { usePets } from "@/hooks/usePets";
import PetAnimation from "@/components/focus/PetAnimation";
import { getPetAnimationConfig } from "@/constants/animations";
import { CoralPalette } from "@/constants/colors";
import Constants from "expo-constants";
import PetsTab from "@/components/pets/PetsTab";
import AccessoriesTab, { AccessoryCategory } from "@/components/pets/AccessoriesTab";
import FriendshipModal from "@/components/pets/FriendshipModal";
import { petAnimations } from "@/constants/animations";

const API_BASE_URL = Constants.expoConfig?.extra?.backendUrl as string;

const FONT = { fontFamily: "Nunito" };

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
  const { userProfile, showBanner, updateUserProfile } = useGlobalContext();
  const [activeAccessoryCategory, setActiveAccessoryCategory] = useState<AccessoryCategory>("hat");
  const modeAnim = useRef(new Animated.Value(0)).current; // 0 = pets view, 1 = edit
  const friendAnim = useRef(new Animated.Value(0)).current; // 0 = visible, 1 = hidden (for focus pop)
  const confirmButtonScale = useRef(new Animated.Value(1)).current; // For bounce animation
  const editButtonScale = useRef(new Animated.Value(1)).current; // For edit button bounce animation
  const friendshipButtonScale = useRef(new Animated.Value(1)).current; // For friendship button animation
  const imageButtonScale = useRef(new Animated.Value(1)).current; // For image button animation
  const [editing, setEditing] = useState(false);
  const [friendshipModalVisible, setFriendshipModalVisible] = useState(false);
  const friendshipModalAnim = useRef(new Animated.Value(0)).current;

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

  const openFriendshipModal = () => {
    setFriendshipModalVisible(true);
    Animated.spring(friendshipModalAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const closeFriendshipModal = () => {
    Animated.timing(friendshipModalAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setFriendshipModalVisible(false);
    });
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
      modeAnim.setValue(0);
      friendshipModalAnim.setValue(0);

      // Play a quick pop for the pets view
      friendAnim.setValue(1);
      Animated.spring(friendAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 70,
        friction: 9,
      }).start();
    }, [modeAnim, friendshipModalAnim, friendAnim, petsLoading, error])
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
    animateConfirmButton();
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

  if (petsLoading) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: CoralPalette.surface }}
      >
        <ActivityIndicator size="large" color={CoralPalette.primary} />
        <Text
          className="mt-3 text-base font-semibold"
          style={[{ color: CoralPalette.dark }, FONT]}
        >
          Loading your pets...
        </Text>
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
        source={images.roomBackGround}
        style={{ flex: 1, height: '90%' }}
        resizeMode="cover"
        imageStyle={{ transform: [{ translateY: -40 }] }}
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
            onPressIn={imageButtonHandlers.onPressIn}
            onPressOut={imageButtonHandlers.onPressOut}
            activeOpacity={1}
            className="flex-row items-center justify-center rounded-full"
            style={TOP_BUTTON_BASE_STYLE}
          >
            <ImageIcon size={30} color={CoralPalette.blue} strokeWidth={3} />
          </TouchableOpacity>
        </Animated.View>

        {/* Top right button - edit mode toggle or cancel */}
        <Animated.View
          style={{
            ...TOP_BUTTON_CONTAINER_STYLE,
            top: 18,
            transform: [{ scale: editButtonScale }],
          }}
        >
          <TouchableOpacity
            onPress={editing ? cancelEditing : startEditing}
            onPressIn={editButtonHandlers.onPressIn}
            onPressOut={editButtonHandlers.onPressOut}
            activeOpacity={1}
            className="rounded-full"
            style={{
              ...TOP_BUTTON_BASE_STYLE,
              alignItems: "center",
              justifyContent: "center",
              borderColor: editing ? CoralPalette.border : "transparent",
              borderWidth: editing ? 1 : 0,
            }}
          >
            {editing ? (
              <X size={30} color={CoralPalette.mutedDark} strokeWidth={3} />
            ) : (
             <Shirt size={30} color={CoralPalette.primaryMuted} strokeWidth={3} />
            )}
          </TouchableOpacity>
        </Animated.View>

        <View className="flex-1">
          {/* Render only owned pet animations, but only show the active one */}
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: -165,
              left: 0,
              right: 0,
              bottom: 0,
              alignItems: "center",
              justifyContent: "center",
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
                    }}
                  >
                    <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 20 }}>
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
            top: '56%',
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
          />
        </Animated.View>

          {/* Accessories Edit Mode */}
          <Animated.View
            className="rounded-t-3xl shadow-lg pt-4"
            style={{
              position: "absolute",
              top: "56%",
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

          {/* Confirm button - bottom right, on top of views */}
          {hasUnsavedChange && (
            <Animated.View
              style={{
                position: "absolute",
                bottom: 30,
                right: 30,
                zIndex: 30,
                transform: [{ scale: confirmButtonScale }],
              }}
            >
              <TouchableOpacity
                onPress={confirmEditing}
                activeOpacity={0.85}
                className="rounded-full"
                style={{
                  backgroundColor: CoralPalette.white,
                  width: 70,
                  height: 70,
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: "#000",
                  shadowOpacity: 0.2,
                  shadowOffset: { width: 0, height: 4 },
                  shadowRadius: 8,
                  elevation: 8,
                }}
              >
                <Check size={40} color={CoralPalette.primaryMuted} strokeWidth={4} />
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
      </ImageBackground>

      {/* Friendship Modal - Centered */}
      <FriendshipModal
        visible={friendshipModalVisible}
        onClose={closeFriendshipModal}
        animValue={friendshipModalAnim}
        userProfile={userProfile}
        pets={pets}
      />
    </View>
  );
};

export default Profile;
