import React, { useCallback, useMemo, useState, useRef, useEffect } from "react";
import {
  Text,
  View,
  ImageBackground,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from "react-native";
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

type TabType = "pets" | "accessories";

const TAB_WIDTH = 190;

const Profile = () => {
  const { userProfile, showBanner, updateUserProfile } = useGlobalContext();
  const [activeTab, setActiveTab] = useState<TabType>("pets");
  const slideAnim = useRef(new Animated.Value(0)).current;

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
      setFocusedCollar(null);
      setFocusedGadget("gadget_laptop");
    } else if (focusedPet === userProfile?.selectedPet) {
      // User switched back to their current pet - restore saved accessories
      setFocusedHat(userProfile?.selectedHat ?? null);
      setFocusedCollar(userProfile?.selectedCollar ?? null);
      setFocusedGadget(userProfile?.selectedGadget ?? "gadget_laptop");
    }
  }, [focusedPet]);

  // Sync focused accessories when userProfile loads or changes
  useEffect(() => {
    if (userProfile && (!focusedPet || focusedPet === userProfile.selectedPet)) {
      setFocusedHat(userProfile.selectedHat ?? null);
      setFocusedCollar(userProfile.selectedCollar ?? null);
      setFocusedGadget(userProfile.selectedGadget ?? "gadget_laptop");
    }
  }, [userProfile?.selectedHat, userProfile?.selectedCollar, userProfile?.selectedGadget]);

  const hasUnsavedChange = useMemo(() => {
    const petChanged = !!focusedPet && focusedPet !== userProfile?.selectedPet;
    const hatChanged = focusedHat !== (userProfile?.selectedHat ?? null);
    const collarChanged =
      focusedCollar !== (userProfile?.selectedCollar ?? null);
    const gadgetChanged =
      focusedGadget !== (userProfile?.selectedGadget ?? "gadget_laptop");
    return petChanged || hatChanged || collarChanged || gadgetChanged;
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

  const handleSaveSelection = useCallback(async () => {
    if (isSaving || isSavingAccessories) return;

    const petChanged = !!focusedPet && focusedPet !== userProfile?.selectedPet;
    const hatChanged = focusedHat !== (userProfile?.selectedHat ?? null);
    const collarChanged =
      focusedCollar !== (userProfile?.selectedCollar ?? null);
    const gadgetChanged =
      focusedGadget !== (userProfile?.selectedGadget ?? "gadget_laptop");

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

    // Save accessories if any changed (including when pet changed)
    const hasAccessoryChanges = hatChanged || collarChanged || gadgetChanged;
    const accessoriesToSave = petChanged 
      ? { selectedHat: focusedHat, selectedCollar: focusedCollar, selectedGadget: focusedGadget }
      : null;
    
    if (hasAccessoryChanges || (petChanged && (focusedHat || focusedCollar || focusedGadget !== "gadget_laptop"))) {
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
      // Update local profile state
      updateUserProfile({
        ...(petChanged && focusedPet ? { selectedPet: focusedPet } : {}),
        ...(hatChanged || petChanged ? { selectedHat: focusedHat } : {}),
        ...(collarChanged || petChanged ? { selectedCollar: focusedCollar } : {}),
        ...(gadgetChanged || petChanged ? { selectedGadget: focusedGadget } : {}),
      });
      showBanner("Changes saved", "success");
    }
  }, [
    focusedPet,
    focusedHat,
    focusedCollar,
    focusedGadget,
    isSaving,
    isSavingAccessories,
    saveSelectedPet,
    showBanner,
    updateUserProfile,
    userProfile,
  ]);

  const petAnimationConfig = getPetAnimationConfig(
    focusedPet || userProfile?.selectedPet
  );
  const showPetAnimation = !!petAnimationConfig;

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
    <View className="flex-1" style={{ backgroundColor: CoralPalette.surface }}>
      <ImageBackground
        source={images.roomBackGround}
        style={{ flex: 1 }}
        resizeMode="cover"
        imageStyle={{ transform: [{ translateY: -150 }] }}
      >
        <View className="mt-16 mr-2 flex-row items-end justify-end">
          {hasUnsavedChange && (
            <TouchableOpacity
              onPress={handleSaveSelection}
              activeOpacity={0.85}
              className="p-2 rounded-full"
              style={{
                backgroundColor:
                  isSaving || isSavingAccessories
                    ? CoralPalette.primaryLight
                    : CoralPalette.primary,
                opacity: isSaving || isSavingAccessories ? 0.7 : 1,
                position: "absolute",
              }}
            >
              <Check size={35} color={CoralPalette.white} />
            </TouchableOpacity>
          )}
        </View>
        <View className="flex-1">
          <View className="flex-1 items-center justify-center px-6 pt-10">
            {showPetAnimation && petAnimationConfig ? (
              <PetAnimation
                source={petAnimationConfig.source}
                stateMachineName={petAnimationConfig.stateMachineName}
                focusInputName={petAnimationConfig.focusInputName}
                isFocus={false}
                selectedHat={focusedHat}
                selectedCollar={focusedCollar}
                containerStyle={{ position: "absolute", top: -70 }}
                animationStyle={{ width: "60%", height: "60%" }}
              />
            ) : (
              <View
                className="mt-4 px-4 py-2 rounded-full"
                style={{
                  backgroundColor: CoralPalette.surfaceAlt,
                  borderColor: CoralPalette.border,
                  borderWidth: 1,
                }}
              >
                <Text
                  className="text-sm font-semibold"
                  style={[{ color: CoralPalette.mutedDark }, FONT]}
                >
                  Active pet companion
                </Text>
              </View>
            )}
          </View>

          <View
            className="flex-1 rounded-t-3xl shadow-lg pt-6"
            style={{
              position: "absolute",
              top: 470,
              left: 0,
              right: 0,
              bottom: -100,
              backgroundColor: CoralPalette.surface,
            }}
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
                  ownedCollars={userProfile?.ownedCollars || []}
                  ownedGadgets={userProfile?.ownedGadgets || []}
                  focusedHat={focusedHat}
                  focusedCollar={focusedCollar}
                  focusedGadget={focusedGadget}
                  setFocusedHat={setFocusedHat}
                  setFocusedCollar={setFocusedCollar}
                  setFocusedGadget={setFocusedGadget}
                />
              )}
            </View>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
};

export default Profile;
