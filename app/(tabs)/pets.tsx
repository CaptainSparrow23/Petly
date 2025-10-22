import React, { useCallback, useEffect, useMemo } from 'react';
import { ActivityIndicator, Text, View, ImageBackground, FlatList, ImageSourcePropType } from 'react-native';
import room_backgound from '@/assets/images/room_background.png';
import { Card } from '@/components/mypets/PetCard';
import { Animations } from '@/constants/animations';
import { useGlobalContext } from '@/lib/global-provider';
import LottieView from 'lottie-react-native';
import type { PetTileItem } from '@/components/store/Tiles';
import icons from '@/constants/icons';
import images from '@/constants/images';
import { useStoreCatalog } from '@/hooks/storeCatalog';
import { rarityStarCount } from '@/components/store/Tiles';

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
    ? (icons[item.imageKey as keyof typeof icons] as ImageSourcePropType | undefined)
    : undefined;
  if (fromKey) {
    return fromKey;
  }

  const fromSpecies = (icons[item.species as keyof typeof icons] ??
    images[item.species as keyof typeof images]) as ImageSourcePropType | undefined;
  return fromSpecies ?? images.lighting;
};

const animationStyleOverrides: Record<string, { width: number; aspectRatio: number }> = {
  Lancelot: { width: 140, aspectRatio: 1 },
};

const resolveIdleAnimation = (petName?: string | null) => {
  if (!petName) {
    return null;
  }
  const key = `${petName.toLowerCase()}Idle` as keyof typeof Animations;
  return Animations[key] ?? null;
};

const Profile = () => {
  const { catalog, loading: catalogLoading, error: catalogError } = useStoreCatalog();
  const defaultAnimationStyle = useMemo(
    () => ({ width: 280, aspectRatio: 1 }),
    []
  );

  const { selectedPetName, setSelectedPetName, ownedPets } = useGlobalContext();

  useEffect(() => {
    if (catalogError) {
      console.warn('Failed to load store catalog:', catalogError);
    }
  }, [catalogError]);

  const ownedPetCards = useMemo(() => {
    if (!catalog.length) {
      return [];
    }

    return catalog
      .filter((pet) => ownedPets.includes(pet.id))
      .map<OwnedPetCard>((pet) => ({
        id: pet.id,
        name: pet.name,
        type: pet.species,
        image: resolvePetImage(pet),
        rating: rarityStarCount[pet.rarity] ?? 0,
      }));
  }, [catalog, ownedPets]);

  useEffect(() => {
    const initializePet = async () => {
      if (!selectedPetName && ownedPetCards[0]?.name) {
        await setSelectedPetName(ownedPetCards[0].name);
      }
    };
    initializePet();
  }, [selectedPetName, setSelectedPetName, ownedPetCards]);

  const selectedAnimation = useMemo(
    () => resolveIdleAnimation(selectedPetName),
    [selectedPetName]
  );
  const selectedStyle = useMemo(() => {
    if (selectedPetName && animationStyleOverrides[selectedPetName]) {
      return animationStyleOverrides[selectedPetName];
    }
    return defaultAnimationStyle;
  }, [selectedPetName, defaultAnimationStyle]);

  const handleSelectPet = useCallback(async (name?: string) => {
    if (!name) {
      return;
    }
    await setSelectedPetName(name);
  }, [setSelectedPetName]);

  return (
    <View className="flex-1 bg-white">
      <ImageBackground
        source={room_backgound}
        className="mt-2 w-full border-b border-gray-200"
        style={{ width: '100%', aspectRatio: 1225 / 980 }}
        resizeMode="contain"
      >
        <View className="flex-1 items-center top-14 justify-center">
          {selectedAnimation ? (
            <LottieView
              key={selectedPetName ?? 'none'}
              source={selectedAnimation}
              autoPlay
              loop
              style={selectedStyle}
            />
          ) : (
            <Text className="text-lg font-rubik text-white">
              {selectedPetName
                ? `Animations coming soon for ${selectedPetName}`
                : 'Choose a pet!'}
            </Text>
          )}
        </View>
      </ImageBackground>

      <FlatList
        data={ownedPetCards}
        extraData={selectedPetName}
        renderItem={({ item, index }) => (
          <View
            style={{
              flexBasis: '48%',
              maxWidth: '48%',
              marginRight: index % 2 === 0 ? 8 : 0,
              marginLeft: index % 2 === 1 ? 8 : 0,
            }}
          >
            <Card
              item={item}
              onPress={() => handleSelectPet(item.name)}
              isSelected={item.name === selectedPetName}
            />
          </View>
        )}
        keyExtractor={(item) => item.id}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 10,
          paddingHorizontal: 20,
          paddingTop: 16,
        }}
        columnWrapperStyle={{ marginBottom: 16 }}
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
