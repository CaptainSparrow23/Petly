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
import { Check, HeartHandshake, Clock, CalendarFold} from "lucide-react-native";
import { usePets } from "@/hooks/usePets";
import PetAnimation from "@/components/focus/PetAnimation";
import { getPetAnimationConfig } from "@/constants/animations";
import { CoralPalette } from "@/constants/colors";
import Constants from "expo-constants";
import PetsTab from "@/components/pets/PetsTab";
import AccessoriesTab from "@/components/pets/AccessoriesTab";

const API_BASE_URL = Constants.expoConfig?.extra?.backendUrl as string;

const FONT = { fontFamily: "Nunito" };

type TabType = "pets" | "accessories";

  const TAB_WIDTH = 190;

  const Profile = () => {
    const { userProfile, showBanner, updateUserProfile } = useGlobalContext();
    const [activeTab, setActiveTab] = useState<TabType>("pets");
    const slideAnim = useRef(new Animated.Value(0)).current;
    const modeAnim = useRef(new Animated.Value(0)).current; // 0 = overview, 1 = edit
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

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    Animated.spring(slideAnim, {
      toValue: tab === "pets" ? 0 : TAB_WIDTH,
      useNativeDriver: true,
      tension: 60,
      friction: 10,
    }).start();
  };

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

  const resetToPetsTab = useCallback(() => {
    setActiveTab("pets");
    slideAnim.setValue(0);
  }, [slideAnim]);

  const cancelEditing = () => {
    // revert to saved selections
    setFocusedPet(userProfile?.selectedPet ?? null);
    setFocusedHat(userProfile?.selectedHat ?? null);
    setFocusedFace(userProfile?.selectedFace ?? null);
    setFocusedCollar(userProfile?.selectedCollar ?? null);
    setFocusedGadget(userProfile?.selectedGadget ?? "gadget_laptop");
    resetToPetsTab();
    setEditing(false);
    animateMode(0);
  };

  // Ensure the overview sheet pops into view whenever the tab is focused.
  useFocusEffect(
    useCallback(() => {
      if (petsLoading || error) return;

      // Exit edit instantly (no downward animation)
      setEditing(false);
      modeAnim.setValue(0);
      resetToPetsTab();

      // Play a quick pop for the overview sheet only
      friendAnim.setValue(1);
      Animated.spring(friendAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 70,
        friction: 9,
      }).start();
    }, [modeAnim, friendAnim, resetToPetsTab, petsLoading, error])
  );

  const confirmEditing = async () => {
    await handleSaveSelection();
    resetToPetsTab();
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

  const overviewModeTranslateY = modeAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 280, 280],
  });

  const overviewModeOpacity = modeAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0, 0],
  });

  const overviewTranslateY = Animated.add(friendTranslateY, overviewModeTranslateY);
  const overviewOpacity = Animated.multiply(friendOpacity, overviewModeOpacity);

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

        <Animated.View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            paddingBottom: 70,
            backgroundColor: CoralPalette.surfaceAlt,
            transform: [{ translateY: overviewTranslateY }],
            opacity: overviewOpacity,
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
          <View style={{ padding: 20 }}>
            <View className="flex-row items-center" style={{ marginTop: 4 }}>
              <View className="ml-4 flex-1">
                <Text
                  style={[
                    { fontSize: 30, fontWeight: "800", color: CoralPalette.purpleDark },
                    FONT,
                  ]}
                >
                  {pets.find((p) => p.id === currentPetId)?.name ?? ""}
                </Text>
                <Text style={[{ fontSize: 14, color: CoralPalette.mutedDark }, FONT]}>
                  Friendship Level
                </Text>
              </View>
              <View className="flex-row items-center" style={{ gap: 8 }}>
                <HeartHandshake size={40} color={CoralPalette.purple} fill={CoralPalette.purpleLight} strokeWidth={2.5} />
                <Text style={[{ fontSize: 40, fontWeight: "900", color: CoralPalette.purple }, FONT]}>
                  {friendshipMeta?.level ?? 1}
                </Text>
              </View>
            </View>
            <View style={{ marginTop: 12, paddingHorizontal: 6 }}>
              <View
                style={{
                  height: 6,
                  borderRadius: 999,
                  backgroundColor: CoralPalette.purpleLighter,
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    width: `${friendPercent}%`,
                    height: "100%",
                    borderRadius: 999,
                    backgroundColor: CoralPalette.purple,
                  }}
                />
              </View>
              <View className="flex-row justify-between">
                <Text
                style={[
                  { textAlign: "left", marginTop: 8, marginLeft: 8, fontSize: 13, color: CoralPalette.mutedDark },
                  FONT,
                ]}>
                  Level up unlock app customizations 
                  </Text>

              <Text
                style={[
                  { textAlign: "right", marginTop: 8, marginRight: 6,fontSize: 13, color: CoralPalette.mutedDark },
                  FONT,
                ]}
              >
                {friendXpToNext === 0 ? "Max level reached" : `${friendPercent}%`}
              </Text>
              </View>

        
            </View>
            <View className="mt-10 flex-row items-center justify-evenly px-6">
             <View className="flex-col items-center justify-between">
              <Clock size={40} color={CoralPalette.purple} />
              {(() => {
                const totalSeconds = friendshipMeta?.totalFocusSeconds ?? 0;
                const hours = Math.floor(totalSeconds / 3600);
                const minutes = Math.floor((totalSeconds % 3600) / 60);

                const formatUnit = (val: number, singular: string, plural: string) =>
                  `${val} ${val === 1 ? singular : plural}`;

                let timeText = "";
                if (totalSeconds === 0) {
                  timeText = "0 mins";
                } else if (hours > 0) {
                  const parts = [
                    formatUnit(hours, "hr", "hrs"),
                    ...(minutes > 0 ? [formatUnit(minutes, "m", "ms")] : []),
                  ];
                  timeText = parts.join(" ");
                } else if (minutes > 0) {
                  timeText = formatUnit(minutes, "m", "ms");
                } else {
                  timeText = "No time yet";
                }
                
                return (
                  <Text style={[{ marginTop: 10, fontSize: 20, fontWeight: "800", color: CoralPalette.mutedDark }, FONT]}>
                    {timeText}
                  </Text>
                );
              })()}
            </View>
             <View className="flex-col items-center justify-between">
              <CalendarFold size={40} color={CoralPalette.purple} />
              <Text style={[{ marginTop: 10, fontSize: 18, fontWeight: "800", color: CoralPalette.mutedDark }, FONT]}>
                2nd Jan 2026
              
              </Text>
            </View>
            </View>
          </View>
  
        </Animated.View>



          {/* Wardrobe area */}
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
            <View className="px-2 mb-3 flex-row items-center justify-center">
              <View
                className="flex-row rounded-full p-1"
                style={{ backgroundColor: CoralPalette.surfaceAlt }}
              >
                {/* Animated sliding background */}
                <Animated.View
                  style={{
                    position: "absolute",
                    width: TAB_WIDTH,
                    height: "100%",
                    backgroundColor: CoralPalette.primary,
                    borderRadius: 9999,
                    top: 4,
                    left: 4,
                    transform: [{ translateX: slideAnim }],
                  }}
                />
                <TouchableOpacity
                  onPress={() => handleTabChange("pets")}
                  activeOpacity={0.8}
                  className="py-2 rounded-full items-center"
                  style={{ width: TAB_WIDTH }}
                >
                  <Text
                    className="text-sm font-bold"
                    style={[
                      {
                        color:
                          activeTab === "pets"
                            ? CoralPalette.white
                            : CoralPalette.mutedDark,
                      },
                      FONT,
                    ]}
                  >
                    Pets
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleTabChange("accessories")}
                  activeOpacity={0.8}
                  className="py-2 rounded-full items-center"
                  style={{ width: TAB_WIDTH }}
                >
                  <Text
                    className="text-sm font-bold"
                    style={[
                      {
                        color:
                          activeTab === "accessories"
                            ? CoralPalette.white
                            : CoralPalette.mutedDark,
                      },
                      FONT,
                    ]}
                  >
                    Accessories
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            <View
              style={{
                position: "absolute",
                top: 70,
                left: 0,
                right: 0,
                bottom: 0,
              }}
            >
              {activeTab === "pets" ? (
                <PetsTab
                  pets={pets}
                  focusedPet={focusedPet}
                  setFocusedPet={setFocusedPet}
                />
              ) : (
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
                />
              )}
            </View>
          </Animated.View>
        </View>
      </ImageBackground>
    </View>
  );
};

export default Profile;
