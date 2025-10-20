import { MenuButton } from '@/components/other/MenuButton';
import React, { useCallback, useEffect, useMemo } from 'react';
import { Text, View, ImageBackground, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import room_backgound from '@/assets/images/room_background.png';
import { Card } from '@/components/other/PetCard';
import { petData } from '@/constants/petdata';
import { Animations } from '@/constants/animations';
import { useGlobalContext } from '@/lib/global-provider';
import LottieView from 'lottie-react-native';


const Profile = () => {
  const defaultAnimationStyle = useMemo(
    () => ({ width: 280, aspectRatio: 1 }),
    []
  );

  const animationConfigByPet = useMemo<
    Record<
      string,
      { source: any; style?: { [key: string]: number | string } }
    >
  >(
    () => ({
      Skye: {
        source: Animations.skyeIdle,
        style: { width: 280, aspectRatio: 1 },
      },
      Lancelot: {
        source: Animations.lancelotIdle,
        style: { width: 140, aspectRatio: 1},
      },
    }),
    []
  );

  const { selectedPetName, setSelectedPetName } = useGlobalContext();

  useEffect(() => {
    const initializePet = async () => {
      if (!selectedPetName && petData[0]?.name) {
        await setSelectedPetName(petData[0].name);
      }
    };
    initializePet();
  }, [selectedPetName, setSelectedPetName]);

  const selectedConfig = selectedPetName
    ? animationConfigByPet[selectedPetName]
    : undefined;
  const selectedAnimation = selectedConfig?.source;
  const selectedStyle = selectedConfig?.style ?? defaultAnimationStyle;

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
        data={petData}
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
        keyExtractor={(item, index) =>
          `pet-${item?.name ?? 'unknown'}-${index}`
        }
        numColumns={2}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 10,
          paddingHorizontal: 20,
          paddingTop: 16,
        }}
        columnWrapperStyle={{ marginBottom: 16 }}
      />

    </View>
  );
};

export default Profile;
