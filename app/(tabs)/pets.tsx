import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import {
  Text,
  View,
  ImageBackground,
  FlatList,
  Image,
  TouchableOpacity,
  ImageSourcePropType,
  Pressable,
} from 'react-native';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation } from 'expo-router';
import Constants from 'expo-constants';
import room_backgound from '@/assets/images/room_background.png';
import { petData } from '@/constants/petdata';
import { Animations } from '@/constants/animations';
import { useGlobalContext } from '@/lib/global-provider';
import LottieView from 'lottie-react-native';
import { Star } from 'lucide-react-native';
import { DrawerToggleButton } from '@react-navigation/drawer';

const API_BASE_URL = Constants.expoConfig?.extra?.backendUrl as string | undefined;

const Profile = () => {
  const { userProfile, showBanner, updateUserProfile } = useGlobalContext();
  const navigation = useNavigation();
  const [focusedPet, setFocusedPet] = useState<string | null>(userProfile?.selectedPet ?? null);
  const [isSavingPet, setIsSavingPet] = useState(false);
  const userId = userProfile?.userId;

  // Keep local selection in sync if the profile changes elsewhere
  useEffect(() => {
    if (userProfile?.selectedPet && userProfile.selectedPet !== focusedPet) {
      setFocusedPet(userProfile.selectedPet);
    }
  }, [userProfile?.selectedPet]);

  const persistSelectedPet = useCallback(
    async (petName: string) => {
      if (!userId) throw new Error('Missing user id for pet update.');
      if (!API_BASE_URL) throw new Error('Backend URL is not configured.');

      const res = await fetch(`${API_BASE_URL}/api/pets/update_pet/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ petName }),
      });

      let json: any = null;
      try {
        json = await res.json();
      } catch {
        // ignore parse errors; rely on status
      }
      if (!res.ok || !json?.success) {
        const msg = json?.error || json?.message || `Request failed with status ${res.status}`;
        throw new Error(msg);
      }
    },
    [userId]
  );

  const handleMenuPress = useCallback(async () => {
    if (isSavingPet) return;

    const openDrawer = () => navigation.dispatch(DrawerActions.toggleDrawer());
    const changed = !!focusedPet && focusedPet !== userProfile?.selectedPet;

    if (!changed || !focusedPet) {
      openDrawer();
      return;
    }

    // optimistic update
    const prevPet = userProfile?.selectedPet ?? null;
    updateUserProfile({ selectedPet: focusedPet });
    setIsSavingPet(true);

    try {
      await persistSelectedPet(focusedPet);
    } catch (err) {
      // rollback if failed
      updateUserProfile({ selectedPet: prevPet });
      showBanner('We could not update your pet right now. Please try again.', 'error');
    } finally {
      setIsSavingPet(false);
      openDrawer();
    }
  }, [focusedPet, isSavingPet, navigation, persistSelectedPet, showBanner, updateUserProfile, userProfile?.selectedPet]);

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
            disabled={isSavingPet}
          />
        </View>
      ),
    });
  }, [handleMenuPress, isSavingPet, navigation]);

  const animation = (() => {
    if (focusedPet === 'Skye') return { source: Animations.skyeIdle, width: 280 };
    if (focusedPet === 'Lancelot') return { source: Animations.lancelotIdle, width: 140 };
    return null;
  })();

  return (
    <View className="flex-1 bg-white">
      <ImageBackground
        source={room_backgound}
        className="mt-2 w-full border-b border-gray-200"
        style={{ width: '100%', aspectRatio: 1225 / 980 }}
        resizeMode="contain"
      >
        <View className="flex-1 items-center justify-center mt-14">
          {animation ? (
            <LottieView
              source={animation.source}
              autoPlay
              loop
              style={{ width: animation.width, aspectRatio: 1 }}
            />
          ) : (
            <Text className="text-lg font-rubik text-white">Choose a pet!</Text>
          )}
        </View>
      </ImageBackground>

      <FlatList
        data={petData}
        keyExtractor={(item) => item.name}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 10, paddingHorizontal: 20, paddingTop: 16 }}
        columnWrapperStyle={{ marginBottom: 16, gap: 16 }}
        renderItem={({ item }) => {
          const isFocused = item.name === focusedPet;
          const resolvedImage: ImageSourcePropType | undefined =
            typeof item.image === 'string' ? { uri: item.image } : item.image;

          return (
            <View className="flex-1">
              <TouchableOpacity
                onPress={() => setFocusedPet(item.name)}
                activeOpacity={0.85}
                className={`flex-1 px-4 py-3 rounded-2xl flex-row items-center border ${
                  isFocused ? 'border-blue-500 bg-sky-50' : 'border-gray-200 bg-white'
                }`}
              >
                {resolvedImage && (
                  <Image source={resolvedImage} className="w-16 h-16 rounded-xl mr-4" />
                )}

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
  );
};

export default Profile;
