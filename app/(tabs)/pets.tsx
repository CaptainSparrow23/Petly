import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  ImageBackground,
  ImageSourcePropType,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { DrawerActions } from "@react-navigation/native";
import { DrawerToggleButton } from "@react-navigation/drawer";
import { useNavigation } from "expo-router";
import Constants from "expo-constants";
import LottieView from "lottie-react-native";
import { Star } from "lucide-react-native";

import room_background from "@/assets/images/room_background.png";
import { Animations } from "@/constants/animations";
import icons from "@/constants/icons";
import images from "@/constants/images";
import { useStoreCatalog } from "@/hooks/useStore";
import { useGlobalContext } from "@/lib/global-provider";
import type { PetTileItem } from "@/components/store/Tiles";
import { rarityStarCount } from "@/components/store/Tiles";

const API_BASE_URL = Constants.expoConfig?.extra?.backendUrl as
  | string
  | undefined;

type OwnedPetCard = {
  id: string;
  name?: string;
  type?: string;
  image?: ImageSourcePropType;
  rating?: number;
};

const resolvePetImage = (item: PetTileItem): ImageSourcePropType => {
  if (item.imageUrl) {
    return { uri: item.imageUrl };
  }

  const fromKey = item.imageKey
    ? (icons[item.imageKey as keyof typeof icons] as
        | ImageSourcePropType
        | undefined)
    : undefined;
  if (fromKey) {
    return fromKey;
  }

  const fromSpecies = (icons[item.species as keyof typeof icons] ??
    images[item.species as keyof typeof images]) as
    | ImageSourcePropType
    | undefined;
  return fromSpecies ?? images.lighting;
};

const animationStyleOverrides: Record<string, { width: number; aspectRatio: number }> =
  {
    Lancelot: { width: 140, aspectRatio: 1 },
  };

const resolveIdleAnimation = (petName?: string | null) => {
  if (!petName) {
    return null;
  }

  const key = `${petName.toLowerCase()}Idle` as keyof typeof Animations;
  return Animations[key] ?? null;
};

type GlobalContextForPets = ReturnType<typeof useGlobalContext> & {
  updateUserProfile?: (patch: Partial<{ selectedPet: string | null }>) => void;
  ownedPets?: string[];
};

const Profile = () => {
  const {
    userProfile,
    showBanner,
    updateUserProfile,
    ownedPets: ownedPetsFromContext,
  } = useGlobalContext() as GlobalContextForPets;
  const navigation = useNavigation();
  const [focusedPet, setFocusedPet] = useState<string | null>(
    userProfile?.selectedPet ?? null,
  );
  const [isSavingPet, setIsSavingPet] = useState(false);
  const userId = userProfile?.userId;

  const { catalog, loading: catalogLoading, error: catalogError } =
    useStoreCatalog();

  const defaultAnimationStyle = useMemo(
    () => ({ width: 280, aspectRatio: 1 }),
    [],
  );

  useEffect(() => {
    if (catalogError) {
      console.warn("Failed to load store catalog:", catalogError);
    }
  }, [catalogError]);

  const ownedPetIds = useMemo(() => {
    if (Array.isArray(ownedPetsFromContext) && ownedPetsFromContext.length) {
      return ownedPetsFromContext;
    }

    if (Array.isArray(userProfile?.ownedPets) && userProfile.ownedPets.length) {
      return userProfile.ownedPets;
    }

    return [];
  }, [ownedPetsFromContext, userProfile?.ownedPets]);

  const ownedPetCards = useMemo<OwnedPetCard[]>(() => {
    if (catalog.length) {
      const ownedSet = ownedPetIds.length ? new Set(ownedPetIds) : null;
      return catalog
        .filter((pet) => !ownedSet || ownedSet.has(pet.id))
        .map<OwnedPetCard>((pet) => ({
          id: pet.id,
          name: pet.name,
          type: pet.species,
          image: resolvePetImage(pet),
          rating: rarityStarCount[pet.rarity] ?? 0,
        }));
    }

    return [];
  }, [catalog, ownedPetIds]);

  const petCardsData = ownedPetCards;

  useEffect(() => {
    if (userProfile?.selectedPet && userProfile.selectedPet !== focusedPet) {
      setFocusedPet(userProfile.selectedPet);
    }
  }, [userProfile?.selectedPet, focusedPet]);

  useEffect(() => {
    if (!focusedPet && petCardsData.length && petCardsData[0]?.name) {
      setFocusedPet(petCardsData[0].name ?? "");
    }
  }, [focusedPet, petCardsData]);

  const applyProfileUpdate = useCallback(
    (patch: Partial<{ selectedPet: string | null }>) => {
      if (typeof updateUserProfile === "function") {
        updateUserProfile(patch);
      }
    },
    [updateUserProfile],
  );

  const persistSelectedPet = useCallback(
    async (petName: string) => {
      if (!userId) {
        throw new Error("Missing user id for pet update.");
      }
      if (!API_BASE_URL) {
        throw new Error("Backend URL is not configured.");
      }

      const res = await fetch(
        `${API_BASE_URL}/api/pets/update_pet/${userId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ petName }),
        },
      );

      let json: any = null;
      try {
        json = await res.json();
      } catch {
        // ignore parse errors; rely on status
      }

      if (!res.ok || !json?.success) {
        const msg =
          json?.error ||
          json?.message ||
          `Request failed with status ${res.status}`;
        throw new Error(msg);
      }
    },
    [userId],
  );

  const handleSelectPet = useCallback(
    (petName?: string | null) => {
      if (!petName) {
        return;
      }

      setFocusedPet(petName);
    },
    [],
  );

  const handleMenuPress = useCallback(async () => {
    if (isSavingPet) {
      return;
    }

    const openDrawer = () => navigation.dispatch(DrawerActions.toggleDrawer());
    const changed = !!focusedPet && focusedPet !== userProfile?.selectedPet;

    if (!changed || !focusedPet) {
      openDrawer();
      return;
    }

    const prevPet = userProfile?.selectedPet ?? null;
    applyProfileUpdate({ selectedPet: focusedPet });
    setIsSavingPet(true);

    try {
      await persistSelectedPet(focusedPet);
    } catch (err) {
      applyProfileUpdate({ selectedPet: prevPet });
      showBanner(
        "We could not update your pet right now. Please try again.",
        "error",
      );
    } finally {
      setIsSavingPet(false);
      openDrawer();
    }
  }, [
    applyProfileUpdate,
    focusedPet,
    isSavingPet,
    navigation,
    persistSelectedPet,
    showBanner,
    userProfile?.selectedPet,
  ]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: ({ tintColor }: { tintColor: string }) => (
        <View
          style={{
            marginLeft: 8,
            width: 44,
            height: 44,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <DrawerToggleButton tintColor={tintColor} />
          <Pressable
            onPress={handleMenuPress}
            style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
            hitSlop={10}
            disabled={isSavingPet}
          />
        </View>
      ),
    });
  }, [handleMenuPress, isSavingPet, navigation]);

  const heroAnimation = useMemo(() => {
    if (!focusedPet) {
      return null;
    }

    const source = resolveIdleAnimation(focusedPet);
    if (!source) {
      return null;
    }

    const override =
      animationStyleOverrides[focusedPet] ?? defaultAnimationStyle;
    return {
      source,
      style: override,
    };
  }, [defaultAnimationStyle, focusedPet]);

  const renderOwnedPet = useCallback(
    ({ item, index }: { item: OwnedPetCard; index: number }) => {
      const isFocused = item.name === focusedPet;
      const resolvedImage: ImageSourcePropType | undefined =
        typeof item.image === "string" ? { uri: item.image } : item.image;

      return (
        <View
          style={{
            flexBasis: "48%",
            maxWidth: "48%",
            marginRight: index % 2 === 0 ? 8 : 0,
            marginLeft: index % 2 === 1 ? 8 : 0,
            marginBottom: 16,
          }}
        >
          <TouchableOpacity
            onPress={() => handleSelectPet(item.name)}
            activeOpacity={0.85}
            className={`flex-1 px-4 py-3 rounded-2xl flex-row items-center border ${
              isFocused
                ? "border-blue-500 bg-sky-50"
                : "border-gray-200 bg-white"
            }`}
          >
            {resolvedImage && (
              <Image source={resolvedImage} className="w-16 h-16 rounded-xl mr-4" />
            )}

            <View className="flex-1">
              <Text
                className="text-lg font-bold font-rubik-bold text-black-900"
                numberOfLines={1}
              >
                {item.name}
              </Text>
              {!!item.type && (
                <Text className="text-xs font-rubik text-black-200 capitalize">
                  {item.type}
                </Text>
              )}

              <View className="flex-row items-center mt-1">
                {Array.from({
                  length: Math.max(0, Math.floor(item.rating || 0)),
                }).map((_, starIndex) => (
                  <Star
                    key={`star-${item.id}-${starIndex}`}
                    size={16}
                    color="#FACC15"
                    fill="#FACC15"
                    style={starIndex > 0 ? { marginLeft: 4 } : undefined}
                  />
                ))}
              </View>
            </View>
          </TouchableOpacity>
        </View>
      );
    },
    [focusedPet, handleSelectPet],
  );

  return (
    <View className="flex-1 bg-white">
      <ImageBackground
        source={room_background}
        className="mt-2 w-full border-b border-gray-200"
        style={{ width: "100%", aspectRatio: 1225 / 980 }}
        resizeMode="contain"
      >
        <View className="flex-1 items-center justify-center mt-14">
          {heroAnimation ? (
            <LottieView
              source={heroAnimation.source}
              autoPlay
              loop
              style={{
                width: heroAnimation.style.width,
                aspectRatio: heroAnimation.style.aspectRatio,
              }}
            />
          ) : (
            <Text className="text-lg font-rubik text-white">
              Choose a pet!
            </Text>
          )}
        </View>
      </ImageBackground>

      <FlatList
        data={petCardsData}
        keyExtractor={(item) => item.id}
        extraData={focusedPet}
        numColumns={2}
        renderItem={renderOwnedPet}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 10,
          paddingHorizontal: 20,
          paddingTop: 16,
        }}
        columnWrapperStyle={{ marginBottom: 16, gap: 16 }}
        ListEmptyComponent={
          catalogLoading ? (
            <View className="items-center justify-center py-12">
              <ActivityIndicator size="small" color="#2563eb" />
            </View>
          ) : (
            <View className="items-center justify-center py-12">
              <Text className="text-sm text-black-200">
                You haven't unlocked any pets yet.
              </Text>
            </View>
          )
        }
      />
    </View>
  );
};

export default Profile;
