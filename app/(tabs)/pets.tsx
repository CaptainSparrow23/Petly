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
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import images from "@/constants/images";
import { useGlobalContext } from "@/lib/GlobalProvider";
import { Check } from "lucide-react-native";
import { usePets } from "@/hooks/usePets";
import PetAnimation from "@/components/focus/PetAnimation";
import { getPetAnimationConfig } from "@/constants/animations";
import { CoralPalette } from "@/constants/colors";
import Constants from "expo-constants";
import PetsTab from "@/components/pets/PetsTab";
import AccessoriesTab from "@/components/pets/AccessoriesTab";

const API_BASE_URL = Constants.expoConfig?.extra?.backendUrl as string;

const FONT = { fontFamily: "Nunito" };

type AccessoryCategory = "hat" | "face" | "collar";

  const Profile = () => {
    const { userProfile, showBanner, updateUserProfile } = useGlobalContext();
    const [activeAccessoryCategory, setActiveAccessoryCategory] = useState<AccessoryCategory>("hat");
    const modeAnim = useRef(new Animated.Value(0)).current; // 0 = pets view, 1 = edit
    const friendAnim = useRef(new Animated.Value(0)).current; // 0 = visible, 1 = hidden (for focus pop)
  const [editing, setEditing] = useState(false);

  // Focused accessory states (local selection before saving)
  const [focusedHat, setFocusedHat] = useState<string | null>(
    userProfile?.selectedHat ?? null
  );
  const [focusedFace, setFocusedFace] = useState<string | null>(
    userProfile?.selectedFace ?? null
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

  // Reset accessories when focusedPet changes (user selects different pet)
  useEffect(() => {
    if (focusedPet && focusedPet !== userProfile?.selectedPet) {
      // User is previewing a different pet - reset accessories to defaults
      setFocusedHat(null);
      setFocusedFace(null);
      setFocusedCollar(null);
      setFocusedGadget("gadget_laptop");
    } else if (focusedPet === userProfile?.selectedPet) {
      // User switched back to their current pet - restore saved accessories
      setFocusedHat(userProfile?.selectedHat ?? null);
      setFocusedFace(userProfile?.selectedFace ?? null);
      setFocusedCollar(userProfile?.selectedCollar ?? null);
      setFocusedGadget(userProfile?.selectedGadget ?? "gadget_laptop");
    }
  }, [focusedPet]);

  // Sync focused accessories when userProfile loads or changes
  useEffect(() => {
    if (
      userProfile &&
      (!focusedPet || focusedPet === userProfile.selectedPet)
    ) {
      setFocusedHat(userProfile.selectedHat ?? null);
      setFocusedFace(userProfile.selectedFace ?? null);
      setFocusedCollar(userProfile.selectedCollar ?? null);
      setFocusedGadget(userProfile.selectedGadget ?? "gadget_laptop");
    }
  }, [
    userProfile?.selectedHat,
    userProfile?.selectedFace,
    userProfile?.selectedCollar,
    userProfile?.selectedGadget,
  ]);

  const changeFlags = useMemo(() => {
    const petChanged = !!focusedPet && focusedPet !== userProfile?.selectedPet;
    const hatChanged = focusedHat !== (userProfile?.selectedHat ?? null);
    const faceChanged = focusedFace !== (userProfile?.selectedFace ?? null);
    const collarChanged =
      focusedCollar !== (userProfile?.selectedCollar ?? null);
    const gadgetChanged =
      focusedGadget !== (userProfile?.selectedGadget ?? "gadget_laptop");
    const accessoryChanged =
      hatChanged || faceChanged || collarChanged || gadgetChanged;
    return {
      petChanged,
      hatChanged,
      faceChanged,
      collarChanged,
      gadgetChanged,
      accessoryChanged,
    };
  }, [
    focusedPet,
    focusedHat,
    focusedFace,
    focusedCollar,
    focusedGadget,
    userProfile?.selectedPet,
    userProfile?.selectedHat,
    userProfile?.selectedFace,
    userProfile?.selectedCollar,
    userProfile?.selectedGadget,
  ]);

  const hasUnsavedChange = useMemo(
    () =>
      changeFlags.petChanged ||
      changeFlags.hatChanged ||
      changeFlags.faceChanged ||
      changeFlags.collarChanged ||
      changeFlags.gadgetChanged,
    [changeFlags]
  );

  const handleSaveSelection = useCallback(async () => {
    if (isSaving || isSavingAccessories || !hasUnsavedChange) return;

    const { petChanged, accessoryChanged } = changeFlags;

    const promises: Promise<void>[] = [];
    let hasError = false;

    // Save pet if changed
    if (petChanged && focusedPet) {
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
    const shouldSaveAccessories = accessoryChanged || petChanged;

    if (shouldSaveAccessories) {
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
                  selectedFace: focusedFace,
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
        ...(petChanged && focusedPet ? { selectedPet: focusedPet } : {}),
        selectedHat: focusedHat,
        selectedFace: focusedFace,
        selectedCollar: focusedCollar,
        selectedGadget: focusedGadget,
      });
      showBanner("Changes saved", "success");
    }
  }, [
    changeFlags,
    focusedCollar,
    focusedFace,
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

  const petAnimationConfig = getPetAnimationConfig(
    focusedPet || userProfile?.selectedPet
  );
  const showPetAnimation = !!petAnimationConfig;

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

  const startEditing = () => {
    setEditing(true);
    animateMode(1);
  };


  const cancelEditing = () => {
    // revert to saved selections
    setFocusedPet(userProfile?.selectedPet ?? null);
    setFocusedHat(userProfile?.selectedHat ?? null);
    setFocusedFace(userProfile?.selectedFace ?? null);
    setFocusedCollar(userProfile?.selectedCollar ?? null);
    setFocusedGadget(userProfile?.selectedGadget ?? "gadget_laptop");
    setEditing(false);
    animateMode(0);
  };

  // Ensure the pets view pops into view whenever the tab is focused.
  useFocusEffect(
    useCallback(() => {
      if (petsLoading || error) return;

      // Exit edit instantly (no downward animation)
      setEditing(false);
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

  const currentPetId = focusedPet || userProfile?.selectedPet || "";
  const friendshipMeta = currentPetId
    ? userProfile?.petFriendships?.[currentPetId]
    : undefined;
  const friendXpInto = friendshipMeta?.xpIntoLevel ?? 0;
  const friendXpToNext = friendshipMeta?.xpToNextLevel ?? 50;
  const friendXpTotal = friendXpInto + friendXpToNext;
  const friendPercent =
    friendXpTotal === 0
      ? 0
      : Math.min(100, Math.round((friendXpInto / friendXpTotal) * 100));

  return (
    <View className="flex-1" style={{ backgroundColor: CoralPalette.surface }}>
      <ImageBackground
        source={images.roomBackGround}
        style={{ flex: 1 }}
        resizeMode="cover"
        imageStyle={{ transform: [{ translateY: 0 }] }}
      >
        {editing && (
          <TouchableOpacity
            onPress={cancelEditing}
            activeOpacity={0.85}
            className="rounded-full"
            style={{
              position: "absolute",
              top: 14,
              left: 16,
              zIndex: 20,
              backgroundColor: CoralPalette.surfaceAlt,
              borderColor: CoralPalette.border,
              borderWidth: 1,
              width: 44,
              height: 44,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000",
              shadowOpacity: 0.1,
              shadowOffset: { width: 0, height: 2 },
              shadowRadius: 6,
              elevation: 4,
            }}
          >
            <Text
              style={[
                { color: CoralPalette.dark, fontSize: 16, fontWeight: "700" },
                FONT,
              ]}
            >
              ✕
            </Text>
          </TouchableOpacity>
        )}
        {!editing && (
          <TouchableOpacity
            onPress={startEditing}
            activeOpacity={0.85}
            className="rounded-full"
            style={{
              position: "absolute",
              top: 14,
              right: 16,
              zIndex: 20,
              backgroundColor: CoralPalette.primary,
              width: 44,
              height: 44,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000",
              shadowOpacity: 0.1,
              shadowOffset: { width: 0, height: 2 },
              shadowRadius: 6,
              elevation: 4,
            }}
          >
            <Image
              source={images.clothes_hanger}
              style={{
                paddingBottom: 3,
                width: 23,
                height: 20,
                resizeMode: "cover",
                tintColor: CoralPalette.white,
              }}
            />
          </TouchableOpacity>
        )}
        {editing && hasUnsavedChange && (
          <TouchableOpacity
            onPress={confirmEditing}
            activeOpacity={0.85}
            className="rounded-full"
            style={{
              position: "absolute",
              top: 14,
              right: 16,
              zIndex: 20,
              backgroundColor:
                isSaving || isSavingAccessories
                  ? CoralPalette.primaryLight
                  : CoralPalette.primary,
              opacity: isSaving || isSavingAccessories ? 0.7 : 1,
              width: 44,
              height: 44,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Check size={20} color={CoralPalette.white} />
          </TouchableOpacity>
        )}

        <View className="flex-1">
          {showPetAnimation && petAnimationConfig ? (
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                top: -160,
                left: 0,
                right: 0,
                bottom: 0,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <PetAnimation
                source={petAnimationConfig.source}
                stateMachineName={petAnimationConfig.stateMachineName}
                focusInputName={petAnimationConfig.focusInputName}
                selectedHat={focusedHat}
                selectedFace={focusedFace}
                selectedCollar={focusedCollar}
                containerStyle={{ width: "100%", height: "100%" }}
                animationStyle={{ width: "65%", height: "65%" }}
              />
            </View>
          ) : null}

        {/* Pets Tab - replaces overview */}
        <Animated.View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            paddingBottom: 70,
            backgroundColor: CoralPalette.surface,
            transform: [{ translateY: petsTranslateY }],
            opacity: petsOpacity,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
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
            className="rounded-t-3xl shadow-lg pt-6"
            style={{
              position: "absolute",
              top: "56%",
              left: 0,
              right: 0,
              bottom: -100,
              backgroundColor: CoralPalette.surface,
              transform: [{ translateY: sheetTranslateY }],
              opacity: sheetOpacity,
            }}
            pointerEvents={editing ? "auto" : "none"}
          >
            <AccessoriesTab
              ownedHats={userProfile?.ownedHats || []}
              ownedFaces={userProfile?.ownedFaces || []}
              ownedCollars={userProfile?.ownedCollars || []}
              ownedGadgets={userProfile?.ownedGadgets || []}
              focusedHat={focusedHat}
              focusedFace={focusedFace}
              focusedCollar={focusedCollar}
              focusedGadget={focusedGadget}
              setFocusedHat={setFocusedHat}
              setFocusedFace={setFocusedFace}
              setFocusedCollar={setFocusedCollar}
              setFocusedGadget={setFocusedGadget}
              activeCategory={activeAccessoryCategory}
              setActiveCategory={setActiveAccessoryCategory}
            />
          </Animated.View>
        </View>
      </ImageBackground>
    </View>
  );
};

export default Profile;
