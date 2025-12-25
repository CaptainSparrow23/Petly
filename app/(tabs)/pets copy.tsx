import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Animated, FlatList, Image, Modal, ScrollView, Text, TouchableOpacity, View, ViewStyle } from "react-native";
import { useGlobalContext } from "@/providers/GlobalProvider";
import { usePets } from "@/hooks/usePets";
import { CoralPalette } from "@/constants/colors";
import { petAnimations } from "@/constants/animations";
import PetAnimation from "@/components/focus/PetAnimation";
import Divider from "@/components/common/Divider";
import { getPetMood, getPetMoodLabel } from "@/utils/petMood";
import images from "@/constants/images";
import Constants from "expo-constants";
import { router, useNavigation } from "expo-router";
import { Check, ChevronRight, CircleArrowRight, CircleQuestionMark, Info, X } from "lucide-react-native";
import CoinBadge from "@/components/other/CoinBadge";
import KeyBadge from "@/components/other/KeyBadge";
import { CompanionsPageSkeleton } from "@/components/other/Skeleton";

const API_BASE_URL = Constants.expoConfig?.extra?.backendUrl as string;

const FONT = { fontFamily: "Nunito" };

const DEFAULT_RIVE_STYLE = {
  containerStyle: { width: "100%", height: "100%" } as ViewStyle,
  animationStyle: { width: "95%", height: "95%" } as ViewStyle,
};

const PET_RIVE_STYLES: Record<string, { containerStyle: ViewStyle; animationStyle: ViewStyle }> = {
  pet_smurf: {
    containerStyle: { width: "160%", height: "160%" },
    animationStyle: { width: "100%", height: "100%", transform: [{ translateY: 50 }] },
  },
  pet_chedrick: {
    containerStyle: { width: "180%", height: "180%" },
    animationStyle: { width: "100%", height: "100%", transform: [{ translateY: 40 }] },
  },
  pet_pebbles: {
    containerStyle: { width: "180%", height: "180%" },
    animationStyle: { width: "100%", height: "100%", transform: [{ translateY: 45 }] },
  },
  pet_gooner: {
    containerStyle: { width: "160%", height: "160%" },
    animationStyle: { width: "100%", height: "100%", transform: [{ translateY: 40 }] },
  },
  pet_kitty: {
    containerStyle: { width: "180%", height: "180%" },
    animationStyle: { width: "100%", height: "100%", transform: [{ translateY: 45 }] },
  },
};

const PET_STAMPS: Record<string, string> = {
  pet_smurf: "stamp_london",
  pet_chedrick: "stamp_germany",
  pet_pebbles: "stamp_france",
  pet_gooner: "stamp_hongkong",
  pet_kitty: "stamp_japan",
};

const formatDuration = (totalSeconds?: number) => {
  if (!totalSeconds || totalSeconds <= 0) return "0m";
  const totalMinutes = Math.floor(totalSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
};

type StoreCatalogEntry = {
  id: string;
  category?: string;
  name?: string;
  gender?: string;
};

const getPronouns = (gender?: string) => {
  const value = gender?.toLowerCase();
  if (value === "male") return "He/Him";
  if (value === "female") return "She/Her";
  return "";
};

const getMoodProgress = (updatedAt?: string | null) => {
  const mood = getPetMood(updatedAt);
  return { mood, progress: mood / 3 };
};

const AccessoryTile = ({
  item,
  isSelected,
  onPress,
}: {
  item: string | null;
  isSelected: boolean;
  onPress: () => void;
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        width: 92,
        height: 96,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: CoralPalette.beigePaper,
        backgroundColor: isSelected ? CoralPalette.white : CoralPalette.beigePaper,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 10,
      }}
    >
      {item ? (
        <Image
          source={images[item as keyof typeof images] ?? images.lighting}
          style={{ width: 50, height: 50 }}
          resizeMode="contain"
        />
      ) : (
        <Image source={images.nothing} style={{ width: 44, height: 44 }} resizeMode="contain" />
      )}
 
    </TouchableOpacity>
  );
};

const PetTile = ({
  image,
  selected,
  onPress,
  progress,
  progressColor,
}: {
  image: any;
  selected: boolean;
  onPress: () => void;
  progress: number;
  progressColor: string;
}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.85}
    style={{
      width: 110,
      height: 110,
      borderRadius: 10,
      borderWidth: 3,
      borderColor: CoralPalette.beigePaper,
      padding: 12,
      marginRight: 12,
      backgroundColor: selected ? CoralPalette.white : CoralPalette.beigePaper,
      alignItems: "center",
    }}
  >
    <Image source={image} style={{ width: 60, height: 60 }} resizeMode="contain" />
    <View
      style={{
        marginTop: 10,
        width: "100%",
        height: 8,
        borderRadius: 6,
        backgroundColor: CoralPalette.beigeSoft,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          width: `${Math.round(progress * 100)}%`,
          height: "100%",
          backgroundColor: progressColor,
          borderRadius: 6,
        }}
      />
    </View>
  </TouchableOpacity>
);

const PetsCopy = () => {
  const { userProfile, showBanner, updateUserProfile } = useGlobalContext();
  const navigation = useNavigation();
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [focusedHat, setFocusedHat] = useState<string | null>(userProfile?.selectedHat ?? null);
  const [focusedCollar, setFocusedCollar] = useState<string | null>(userProfile?.selectedCollar ?? null);
  const [focusedGadget, setFocusedGadget] = useState<string | null>(userProfile?.selectedGadget ?? "gadget_laptop");
  const [isSavingAccessories, setIsSavingAccessories] = useState(false);
  const [storeCatalog, setStoreCatalog] = useState<StoreCatalogEntry[]>([]);
  const [activeSection, setActiveSection] = useState<"about" | "accessories">("about");
  const [panelWidth, setPanelWidth] = useState(0);
  const [aboutHeight, setAboutHeight] = useState(0);
  const [accessoriesHeight, setAccessoriesHeight] = useState(0);
  const [hasMeasuredPanels, setHasMeasuredPanels] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const heightAnim = useRef(new Animated.Value(0)).current;

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

  useEffect(() => {
    if (!userProfile) return;
    setFocusedHat(userProfile.selectedHat ?? null);
    setFocusedCollar(userProfile.selectedCollar ?? null);
    setFocusedGadget(userProfile.selectedGadget ?? "gadget_laptop");
  }, [userProfile?.selectedHat, userProfile?.selectedCollar, userProfile?.selectedGadget, userProfile]);

  useEffect(() => {
    const controller = new AbortController();
    const loadCatalog = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/store/catalog`, { signal: controller.signal });
        if (!response.ok) return;
        const payload = await response.json();
        if (payload?.success && Array.isArray(payload?.data)) {
          setStoreCatalog(payload.data as StoreCatalogEntry[]);
        }
      } catch {
        // Ignore catalog fetch errors for now.
      }
    };

    void loadCatalog();
    return () => controller.abort();
  }, []);

  const changeFlags = useMemo(() => {
    const petChanged = !!focusedPet && focusedPet !== userProfile?.selectedPet;
    const hatChanged = focusedHat !== (userProfile?.selectedHat ?? null);
    const collarChanged = focusedCollar !== (userProfile?.selectedCollar ?? null);
    const gadgetChanged = focusedGadget !== (userProfile?.selectedGadget ?? "gadget_laptop");
    const accessoryChanged = hatChanged || collarChanged || gadgetChanged;
    return { petChanged, accessoryChanged };
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

  const hasUnsavedChange = changeFlags.petChanged || changeFlags.accessoryChanged;

  const handleSaveSelection = useCallback(async () => {
    if (isSaving || isSavingAccessories || !hasUnsavedChange || !userProfile?.userId) return;

    const promises: Promise<void>[] = [];
    let hasError = false;

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

    if (changeFlags.accessoryChanged || changeFlags.petChanged) {
      setIsSavingAccessories(true);
      promises.push(
        (async () => {
          try {
            const res = await fetch(
              `${API_BASE_URL}/api/pets/update_accessories/${userProfile.userId}`,
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
      showBanner("Could not save changes. Please try again.", "error");
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
    hasUnsavedChange,
    isSaving,
    isSavingAccessories,
    saveSelectedPet,
    showBanner,
    updateUserProfile,
    userProfile?.userId,
  ]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => {
        if (hasUnsavedChange) {
          return (
            <TouchableOpacity
              onPress={() => void handleSaveSelection()}
              activeOpacity={0.8}
              disabled={isSaving || isSavingAccessories}
              style={{ paddingHorizontal: 12, paddingVertical: 10, marginRight: 10 }}
            >
              <Check size={26} color={CoralPalette.greenLight} strokeWidth={3} />
            </TouchableOpacity>
          );
        }

        return (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          
          </View>
        );
      },
    });
  }, [handleSaveSelection, hasUnsavedChange, isSaving, isSavingAccessories, navigation]);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: activeSection === "about" ? 0 : 1,
      duration: 300,
     
      useNativeDriver: true,
    }).start();
  }, [activeSection, slideAnim]);

  useEffect(() => {
    if (hasMeasuredPanels) return;
    if (aboutHeight > 0 && accessoriesHeight > 0) {
      heightAnim.setValue(activeSection === "about" ? aboutHeight : accessoriesHeight);
      setHasMeasuredPanels(true);
    }
  }, [aboutHeight, accessoriesHeight, activeSection, hasMeasuredPanels, heightAnim]);

  useEffect(() => {
    if (!hasMeasuredPanels) return;
    const targetHeight = activeSection === "about" ? aboutHeight : accessoriesHeight;
    if (!targetHeight) return;
    Animated.timing(heightAnim, {
      toValue: targetHeight,
      duration: 300,
      delay: 300,
      useNativeDriver: false,
    }).start();
  }, [activeSection, aboutHeight, accessoriesHeight, hasMeasuredPanels, heightAnim]);

  const selectedPetId = focusedPet || userProfile?.selectedPet || "";
  const selectedPet = pets.find((pet) => pet.id === selectedPetId) ?? pets[0];
  const petFriendship = userProfile?.petFriendships?.[selectedPetId];
  const mood = getPetMood(petFriendship?.updatedAt ?? null);
  const moodLabel = getPetMoodLabel(mood);
  const moodColor =
    mood === 3 ? CoralPalette.green : mood === 2 ? CoralPalette.yellow : "#FF3B30";
  const togetherSinceRaw: string | null | undefined =
    petFriendship?.createdAt ?? petFriendship?.updatedAt ?? null;
  const togetherSince = togetherSinceRaw ? String(togetherSinceRaw).slice(0, 10) : "—";
  const catalogPet = storeCatalog.find((item) => item.id === selectedPetId && item.category === "Pet");
  const pronouns = getPronouns(catalogPet?.gender);
  const genderKey = catalogPet?.gender?.toLowerCase();
  const genderIcon =
    genderKey === "male" ? images.male : genderKey === "female" ? images.female : null;
  const totalPets = storeCatalog.filter((item) => item.category === "Pet").length || pets.length;
  const ownedPetsCount = userProfile?.ownedPets?.length ?? 0;

  const stampLayers = useMemo(() => {
    const entries = Object.entries(PET_STAMPS);
    if (!entries.length) return [];
    return entries
      .map(([petId, stampKey]) => ({
        petId,
        stampKey,
        source: images[stampKey as keyof typeof images] ?? null,
      }))
      .filter((layer) => !!layer.source);
  }, []);

  const hatOptions = useMemo(
    () => [null, ...(userProfile?.ownedHats || [])],
    [userProfile?.ownedHats]
  );
  const collarOptions = useMemo(
    () => [null, ...(userProfile?.ownedCollars || [])],
    [userProfile?.ownedCollars]
  );

  if (petsLoading) {
    return <CompanionsPageSkeleton />;
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: CoralPalette.beigeLight }}>
        <Text style={[{ fontSize: 16, fontWeight: "800", color: CoralPalette.dark }, FONT]}>
          Unable to load pets
        </Text>
        <Text style={[{ marginTop: 8, color: CoralPalette.mutedDark, textAlign: "center" }, FONT]}>
          {error}
        </Text>
      </View>
    );
  }

	  return (
	    <View style={{ flex: 1, backgroundColor: CoralPalette.beigeSoft }}>
	      <Modal
	        visible={infoModalVisible}
	        transparent
	        animationType="fade"
	        onRequestClose={() => setInfoModalVisible(false)}
	      >
	        <TouchableOpacity
	          activeOpacity={1}
	          onPress={() => setInfoModalVisible(false)}
	          style={{
	            flex: 1,
	            backgroundColor: "rgba(0,0,0,0.45)",
	            alignItems: "center",
	            justifyContent: "center",
	            padding: 18,
	          }}
	        >
	          <TouchableOpacity
	            activeOpacity={1}
	            onPress={(e) => e.stopPropagation()}
	            style={{
	              width: "100%",
	              maxWidth: 250,
	              backgroundColor: CoralPalette.white,
	              borderRadius: 14,
	              padding: 15,
	     
	              elevation: 10,
	            }}
	          >
	           

	            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
	          
	                <Info size={20} color={CoralPalette.mutedDark} />
	         
	              <Text style={[FONT, { fontSize: 16, fontWeight: "800", color: CoralPalette.dark }]}>
	                Companions
	              </Text>
                 <TouchableOpacity
	              onPress={() => setInfoModalVisible(false)}
	   

	            >
	              <X size={20} color={CoralPalette.mutedDark} />
	            </TouchableOpacity>
	            </View>
              <View style={{ marginTop: 12, marginLeft: 8 }}>
              <Text style={[FONT, { marginBottom: 8,fontWeight: "700", color: CoralPalette.beigeDarker,  }]}>
                Mood: 

	            <Text style={[FONT, { marginLeft: 10, fontWeight: "500", color: CoralPalette.mutedDark }]}>
	              {' '}Regular hangouts make your companions feel loved!
	            </Text>
              </Text>
              <Text style={[FONT, { marginBottom: 8, fontWeight: "700", color: CoralPalette.beigeDarker,  }]}>
                Together Since: 
              <Text style={[FONT, { marginLeft: 10, fontWeight: "500", color: CoralPalette.mutedDark }]}>
               {' '}The date you two first met!
              </Text>
              </Text>
              <Text style={[FONT, { marginBottom: 8, fontWeight: "700", color: CoralPalette.beigeDarker,  }]}>
                Friendship Level: 
              <Text style={[FONT, { marginLeft: 10, fontWeight: "500", color: CoralPalette.mutedDark }]}>
               {' '}Reach level 10 you might recieve something special from your companion!
              </Text>
              </Text>
              </View>
	          </TouchableOpacity>
	        </TouchableOpacity>
	      </Modal>

	      <ScrollView style={{ flex: 1 }}>
	        <View style={{ padding: 16, marginTop: 0 }}>
	        <View
	          style={{
	            backgroundColor: CoralPalette.white,
	            borderRadius: 10,
	            padding: 18,
	            shadowColor: "#000",
	            shadowOpacity: 0.08,
	            shadowOffset: { width: 0, height: 4 },
	            shadowRadius: 8,
	            elevation: 4,
	          }}
	        >
		          <TouchableOpacity
		            onPress={() => setInfoModalVisible(true)}
		            activeOpacity={0.85}
		            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
		            style={{
	              position: "absolute",
	              top: 2,
	              right: 2,
	              width: 50,
	              height: 50,
	              borderRadius: 20,
	              alignItems: "center",
	              justifyContent: "center",
	              backgroundColor: "transparent",
	              zIndex: 50,
	            }}
		          >
		            <Info size={25} color={CoralPalette.mutedDark} />
		          </TouchableOpacity>
	          <Image
	            source={images.postmark}
	            resizeMode="contain"
	            style={{
	              position: "absolute",
              top: 55,
              right: 25,
              width: 130,
              height: 130,
              opacity: 0.15,
            }}
           
          />
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: 20,
              right: 20,
              width: 110,
              height: 110,
            }}
          >
            {stampLayers.map((layer) => (
              <Image
                key={layer.petId}
                source={layer.source}
                resizeMode="contain"
                style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  width: 110,
                  height: 110,
                  opacity: layer.petId === selectedPetId ? 0.07 : 0,
                }}
              />
            ))}
            {!PET_STAMPS[selectedPetId] ? (
              <Image
                source={images.stamp_london}
                resizeMode="contain"
                style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  width: 110,
                  height: 110,
                  opacity: selectedPetId ? 0.07 : 0,
                }}
              />
            ) : null}
          </View>
          <View
            // style={{
            //   position: "absolute",
            //   top: 0,
            //   left: 0,
            //   right: 0,
            //   alignItems: "center",
            // }}
          >
            {/* <View
              style={{
                width: 60,
                height: 25,
                borderRadius: 8,
                backgroundColor: CoralPalette.clipboardWoodWarm,
                shadowColor: "#000",
                shadowOpacity: 0.1,
                shadowOffset: { width: 0, height: 2 },
                shadowRadius: 4,
                elevation: 3,
              }}
            /> */}
          </View>
          <View style={{ flexDirection: "row", marginTop: 0 }}>
            <View
              style={{
                width: 160,
                height: 180,
                borderRadius: 10,
                backgroundColor: CoralPalette.beigePaper,
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              {(() => {
                const petsToRender = new Set(userProfile?.ownedPets || []);
                if (selectedPetId) petsToRender.add(selectedPetId);
                if (!petsToRender.size) {
                  return (
                    <Text style={[{ color: CoralPalette.mutedDark, fontSize: 12 }, FONT]}>
                      No pet
                    </Text>
                  );
                }

                return Array.from(petsToRender).map((petId) => {
                  const config = petAnimations[petId];
                  if (!config) return null;
                  const isActive = petId === selectedPetId;
                  const styleOverride = PET_RIVE_STYLES[petId] ?? DEFAULT_RIVE_STYLE;

                  return (
                    <View
                      key={petId}
                      style={{
                        position: "absolute",
                        width: "100%",
                        height: "100%",
                        alignItems: "center",
                        justifyContent: "center",
                        opacity: isActive ? 1 : 0,
                      }}
                      pointerEvents="none"
                    >
                      <PetAnimation
                        source={config.source}
                        stateMachineName={config.stateMachineName}
                        focusInputName={config.focusInputName}
                        focusValue={0}
                        selectedHat={focusedHat}
                        selectedCollar={focusedCollar}
                        containerStyle={styleOverride.containerStyle}
                        animationStyle={styleOverride.animationStyle}
                      />
                    </View>
                  );
                });
              })()}
            </View>

            <View style={{ flex: 1, flexDirection: "column", marginLeft: 20, alignItems: "flex-start", justifyContent: "center" }}>
              <Text
                style={[
                  { fontSize: 20, fontWeight: "800", color: CoralPalette.dark },
                  FONT,
                ]}
              >
                {selectedPet?.name ?? "Your Pet"}
              </Text>
              {pronouns ? (
                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                  {genderIcon ? (
                    <Image source={genderIcon} style={{ width: 14, height: 14, marginRight: 6 }} resizeMode="contain" />
                  ) : null}
                  <Text style={[{ color: CoralPalette.beigeDarker }, FONT]}>{pronouns}</Text>
                </View>
              ) : null}
              <View style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}>
              <Divider opacity={0.4} />
              </View>
            </View>
          </View>

          <View style={{ marginTop: 10 }}>
            <Animated.View
              onLayout={(event) => {
                const { width } = event.nativeEvent.layout;
                if (width && width !== panelWidth) setPanelWidth(width);
              }}
              style={[{ overflow: "hidden" }, hasMeasuredPanels ? { height: heightAnim } : null]}
            >
              <Animated.View
                style={{
                  flexDirection: "row",
                  width: panelWidth ? panelWidth * 2 : "200%",
                  transform: [
                    {
                      translateX: panelWidth
                        ? slideAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, -panelWidth],
                          })
                        : 0,
                    },
                  ],
                }}
              >
                <View style={{ width: panelWidth ? panelWidth : "50%" }}>
                  <View
                    style={{
                      padding: 12,
                      borderRadius: 16,
                      backgroundColor: CoralPalette.white,
                    }}
                    onLayout={(event) => {
                      const { height } = event.nativeEvent.layout;
                      if (height && height !== aboutHeight) setAboutHeight(height);
                    }}
                  >
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={[{ color: CoralPalette.beigeDarker, fontWeight: "600", fontSize: 15, marginBottom: 6 }, FONT]}>
                        Mood
                      </Text>
                      <Text style={[{ color: moodColor, fontWeight: "700", marginRight: 10 }, FONT]}>
                        {moodLabel}
                      </Text>
                    </View>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                      <Text style={[{ color: CoralPalette.beigeDarker, fontWeight: "600", fontSize: 15 }, FONT]}>
                        Friendship level
                      </Text>
                      <Text style={[{ color: CoralPalette.dark, fontWeight: "700", marginRight: 10 }, FONT]}>
                        {petFriendship?.level ?? 1}
                      </Text>
                    </View>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                      <Text style={[{ color: CoralPalette.beigeDarker, fontWeight: "600", fontSize: 15 }, FONT]}>
                        Total time together
                      </Text>
                      <Text style={[{ color: CoralPalette.dark, fontWeight: "700", marginRight: 10 }, FONT]}>
                        {formatDuration(petFriendship?.totalFocusSeconds)}
                      </Text>
                    </View>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                      <Text style={[{ color: CoralPalette.beigeDarker, fontWeight: "600", fontSize: 15  }, FONT]}>
                        Together since
                      </Text>
                      <Text style={[{ color: CoralPalette.dark, fontWeight: "700", marginRight: 10 }, FONT]}>
                        {togetherSince}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={{ width: panelWidth ? panelWidth : "50%" }}>
                  <View
                    style={{ paddingTop: 10, borderRadius: 16, backgroundColor: CoralPalette.white }}
                    onLayout={(event) => {
                      const { height } = event.nativeEvent.layout;
                      if (height && height !== accessoriesHeight) setAccessoriesHeight(height);
                    }}
                  >
                    <Text style={[{ marginLeft: 15, fontSize: 16, fontWeight: "700", color: CoralPalette.beigeDarker }, FONT]}>
                      Hats
                    </Text>
                    <FlatList
                      data={hatOptions}
                      horizontal
                      keyExtractor={(item, index) => `${item ?? "none"}-${index}`}
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ paddingVertical: 12 }}
                      renderItem={({ item }) => (
                        <AccessoryTile
                          item={item}
                          isSelected={item === focusedHat}
                          onPress={() => setFocusedHat(item)}
                        />
                      )}
                    />
                    <Text style={[{ marginLeft: 15, fontSize: 16, fontWeight: "700", color: CoralPalette.beigeDarker }, FONT]}>
                      Collars
                    </Text>
                    <FlatList
                      data={collarOptions}
                      horizontal
                      keyExtractor={(item, index) => `${item ?? "none"}-${index}`}
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ paddingVertical: 12 }}
                      renderItem={({ item }) => (
                        <AccessoryTile
                          item={item}
                          isSelected={item === focusedCollar}
                          onPress={() => setFocusedCollar(item)}
                        />
                      )}
                    />
                  </View>
                </View>
              </Animated.View>
            </Animated.View>

            <View
              style={{
                marginTop: 16,
                marginHorizontal: -18,
                marginBottom: -18,
                paddingHorizontal: 5,
                paddingVertical: 5,
                backgroundColor: CoralPalette.beigePaper,

                borderBottomLeftRadius: 10,
                borderBottomRightRadius: 10,
                flexDirection: "row",
              }}
            >
              <TouchableOpacity
                onPress={() => setActiveSection("about")}
                activeOpacity={0.8}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 5,
                  backgroundColor: activeSection === "about" ? CoralPalette.beigeLight : "transparent",
                  alignItems: "center",
                }}
              >
                <Text
                  style={[
                    {
                      fontSize: 13,
                      fontWeight: "700",
                      color: activeSection === "about" ? CoralPalette.dark : CoralPalette.beigeDarker,
                    },
                    FONT,
                  ]}
                >
                  ABOUT
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setActiveSection("accessories")}
                activeOpacity={0.8}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 5,
                  backgroundColor: activeSection === "accessories" ? CoralPalette.beigeLight : "transparent",
                  alignItems: "center",
                }}
              >
                <Text
                  style={[
                    {
                      fontSize: 13,
                      fontWeight: "700",
                      color: activeSection === "accessories" ? CoralPalette.dark : CoralPalette.beigeDarker,
                    },
                    FONT,
                  ]}
                >
                  ACCESSORIES
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={{ marginTop: 40 }}>
          <View
            style={{
              backgroundColor: CoralPalette.white,
              borderRadius: 10,
              padding: 18,
              shadowColor: "#000",
              shadowOpacity: 0.08,
              shadowOffset: { width: 0, height: 4 },
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <View
              style={{
                position: "absolute",
                top: -12,
                left: 0,
                right: 0,
                alignItems: "center",
                pointerEvents: "none",
              }}
            >
              <View style={{ flexDirection: "row" }}>
                {Array.from({ length: 5 }).map((_, index) => (
                  <View
                    key={`notch-${index}`}
                    style={{
                      width: 13,
                      height: 24,
                      borderRadius: 6,
                      backgroundColor: CoralPalette.clipboardWoodWarm,
                      marginHorizontal: 28,
                    }}
                  />
                ))}
              </View>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={[{ marginLeft: 8, marginTop: 10, fontSize: 18, fontWeight: "800", color: CoralPalette.beigeDarker }, FONT]}>
              My Companions
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/petStore")}
              activeOpacity={0.8}
              style={{  marginTop: 5 }}
            >
              <ChevronRight size={20} color={CoralPalette.beigeDarker} />
            </TouchableOpacity>
            </View>
            <FlatList
              data={pets}
              horizontal
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: 12 }}
              renderItem={({ item }) => (
                (() => {
                  const friendship = userProfile?.petFriendships?.[item.id];
                  const { mood, progress } = getMoodProgress(friendship?.updatedAt ?? null);
                  const progressColor =
                    mood === 3
                      ? CoralPalette.green
                      : mood === 2
                      ? CoralPalette.yellow
                      : "#FF3B30";

                  return (
                    <PetTile
                      image={images[item.id as keyof typeof images] ?? item.image ?? images.lighting}
                      selected={item.id === selectedPetId}
                      onPress={() => setFocusedPet(item.id)}
                      progress={progress}
                      progressColor={progressColor}
                    />
                  );
                })()
              )}
            />
          </View>
          <View
            style={{flexDirection: "row",
              backgroundColor: CoralPalette.clipboardWoodWarm,
              borderBottomLeftRadius: 10,
              borderBottomRightRadius: 10,
              paddingVertical: 5,
              alignItems: "center",
              marginTop: -10,
              zIndex: -1,
              justifyContent: "center"
            }}
          >
            <View style={{marginLeft: 20, marginTop: 10, alignItems: "center", justifyContent: "center", flexDirection: "row" }}>
            <Text style={[{  color: CoralPalette.beigeSoft, fontSize: 17, fontWeight: "800" }, FONT]}>
              {ownedPetsCount} / {totalPets}
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/petStore")}
              activeOpacity={0.8}
              style={{ marginLeft: 0, marginRight: 0}}
              
            >
              <View style={{ marginLeft: 6, alignItems: "center", justifyContent: "center" }}>
              <CircleArrowRight size={18} color={CoralPalette.clipboardWoodWarm} fill={CoralPalette.beigeSoft} />
            </View>
            </TouchableOpacity>
            </View>
          </View>
        </View>
	        </View>
	      </ScrollView>
	    </View>
	  );
};

export default PetsCopy;
