import React, { useCallback, useLayoutEffect } from 'react';
import {
  Text,
  View,
  ImageBackground,
  FlatList,
  Image,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation } from 'expo-router';
import images from '@/constants/images';
import { useGlobalContext } from '@/lib/GlobalProvider';
import LottieView from 'lottie-react-native';
import { Star } from 'lucide-react-native';
import { DrawerToggleButton } from '@react-navigation/drawer';
import { usePets } from '@/hooks/usePets';
import Rive, { Fit } from 'rive-react-native';
import { getPetAnimation } from '@/constants/animations';

const Profile = () => {
  const { userProfile, showBanner, updateUserProfile } = useGlobalContext();
  const navigation = useNavigation();
  
  const { 
    pets, 
    loading: petsLoading, 
    focusedPet, 
    setFocusedPet, 
    isSaving, 
    saveSelectedPet 
  } = usePets({
    ownedPets: userProfile?.ownedPets,
    selectedPet: userProfile?.selectedPet,
    userId: userProfile?.userId,
  });

  const handleMenuPress = useCallback(async () => {
    if (isSaving) return;

    const openDrawer = () => navigation.dispatch(DrawerActions.toggleDrawer());
    
    // Save pet selection before opening drawer
    await saveSelectedPet(
      () => {
        // Success - update global profile and open drawer
        if (focusedPet) {
          updateUserProfile({ selectedPet: focusedPet });
        }
        openDrawer();
      },
      (error) => {
        // Error - show banner and still open drawer
        showBanner('We could not update your pet right now. Please try again.', 'error');
        openDrawer();
      }
    );
  }, [isSaving, navigation, saveSelectedPet, focusedPet, updateUserProfile, showBanner]);

  // Put an invisible overlay over the default hamburger to intercept presses ie so we can click the menu button from this file
  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: ({ tintColor }: { tintColor: string }) => (
        <View
          style={{
            marginLeft: 8,
            width: 44,
            height: 44,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <DrawerToggleButton tintColor={tintColor} />
          <Pressable
            onPress={handleMenuPress}
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
            hitSlop={10}
            disabled={isSaving}
          />
        </View>
      ),
    });
  }, [handleMenuPress, isSaving, navigation]);

  const showSkyeAnimation = userProfile?.selectedPet === 'pet_skye';
  const skyeIdleAnimation = showSkyeAnimation ? getPetAnimation('pet_skye', 'idle') : undefined;

  return (
    <View className="flex-1 mt-6 bg-gray-500">
      <ImageBackground source={images.roomBackGround} style={{ flex: 3 }} resizeMode="cover">
        <View className="flex-1 items-center justify-center mt-40 mr-2">
          {showSkyeAnimation && skyeIdleAnimation ? (
            <Rive source={skyeIdleAnimation} style={{ width: '120%', height: '120%' }} fit={Fit.Contain} autoplay />
          ) : (
            <Image source={images.skyeHead} className="w-48 h-48" resizeMode="contain" />
          )}
        </View>
        
      </ImageBackground>
      <View className="flex-1 rounded-t-3xl bg-white shadow-lg pt-5">

          <FlatList
            data={pets}
            keyExtractor={(item) => item.id}
            numColumns={2}
            showsVerticalScrollIndicator={false}
            scrollEnabled={false}
            contentContainerStyle={{ paddingBottom: 10, paddingHorizontal: 20, paddingTop: 16 }}
            columnWrapperStyle={{ marginBottom: 16, gap: 16 }}
            renderItem={({ item }) => {
              const isFocused = item.id === focusedPet;
              const resolvedImage = images.skyeHead;

              return (
                <View style={{ flex: 1, maxWidth: '50%' }}>
                  <TouchableOpacity
                    onPress={() => setFocusedPet(item.id)}
                    activeOpacity={0.85}
                    className={`px-4 py-3 rounded-2xl flex-row items-center border ${
                      isFocused ? 'border-blue-500 bg-sky-50' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <Image source={resolvedImage} className="w-16 h-16 rounded-xl mr-4" />

                    <View className="flex-1">
                      <Text className="text-lg font-bold font-rubik-bold text-black-900" numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text className="text-xs font-rubik text-black-200 capitalize">{item.type}</Text>

                      <View className="flex-row items-center mt-1">
                        {Array.from({ length: Math.max(0, Math.floor(item.rating || 0)) }).map((_, index) => (
                          <Star
                            key={`star-${index}`}
                            size={16}
                            color="#FACC15"
                            fill="#FACC15"
                            style={index > 0 ? { marginLeft: 4 } : undefined}
                          />
                        ))}
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
              );
            }}
          />
        </View>
    </View>
  );
};

export default Profile;
