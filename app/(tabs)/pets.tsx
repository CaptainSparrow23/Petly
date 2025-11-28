import React, { useCallback, useMemo } from 'react';
import {
 Text,
 View,
 ImageBackground,
 FlatList,
 Image,
 TouchableOpacity,
 ActivityIndicator,
} from 'react-native';
import { useNavigation } from 'expo-router';
import images from '@/constants/images';
import { useGlobalContext } from '@/lib/GlobalProvider';
import { Star, Check } from 'lucide-react-native';
import { DrawerToggleButton } from '@react-navigation/drawer';
import { usePets } from '@/hooks/usePets';
import PetAnimation from '@/components/focus/PetAnimation';
import { getPetAnimationConfig } from '@/constants/animations';
import { CoralPalette } from '@/constants/colors';
import type { ImageSourcePropType } from 'react-native';

const FONT = { fontFamily: 'Nunito' };

const Profile = () => {
 const { userProfile, showBanner, updateUserProfile } = useGlobalContext();

 
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

 const resolvePetImage = useCallback(
  (pet: { id?: string; image?: ImageSourcePropType | string }) => {
   // explicit string key
   if (typeof pet.image === 'string') {
    const img = images[pet.image as keyof typeof images] as ImageSourcePropType | undefined;
    if (img) return img;
   } else if (pet.image) {
    // already a source
    return pet.image;
   }

   // try pet id as a key
   if (pet.id) {
    const byId = images[pet.id as keyof typeof images] as ImageSourcePropType | undefined;
    if (byId) return byId;
   }

   return images.lighting;
  },
  []
 );

 const hasUnsavedChange = useMemo(
  () => !!focusedPet && focusedPet !== userProfile?.selectedPet,
  [focusedPet, userProfile?.selectedPet]
 );

  const handleSaveSelection = useCallback(async () => {
  if (!focusedPet || isSaving) return;

  await saveSelectedPet(
   focusedPet,
   () => {
    updateUserProfile({ selectedPet: focusedPet });
    showBanner('Active pet updated', 'success');
   },
   (error) => {
    showBanner(error || 'We could not update your pet right now. Please try again.', 'error');
   }
  );
 }, [focusedPet, isSaving, saveSelectedPet, showBanner, updateUserProfile]);

 const petAnimationConfig = getPetAnimationConfig(focusedPet || userProfile?.selectedPet);
 const showPetAnimation = !!petAnimationConfig;

 if (petsLoading) {
  return (
   <View className="flex-1 items-center justify-center" style={{ backgroundColor: CoralPalette.surface }}>
    <ActivityIndicator size="large" color={CoralPalette.primary} />
    <Text className="mt-3 text-base font-semibold" style={[{ color: CoralPalette.dark }, FONT]}>
     Loading your pets...
    </Text>
   </View>
  );
 }

 if (error) {
  return (
   <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: CoralPalette.surface }}>
    <Text className="text-lg font-extrabold text-center" style={[{ color: CoralPalette.dark }, FONT]}>
     We hit a snag
    </Text>
    <Text className="mt-2 text-sm text-center" style={[{ color: CoralPalette.mutedDark, lineHeight: 20 }, FONT]}>
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
          backgroundColor: isSaving ? CoralPalette.primaryLight : CoralPalette.primary,
          opacity: isSaving ? 0.7 : 1,
          position: 'absolute',
         }}
        >
         <Check size={35} color={CoralPalette.white} />
        </TouchableOpacity>
       )}
      </View>
    <View className="flex-1" >
     <View className="flex-1 items-center justify-center px-6 pt-10">
      {showPetAnimation && petAnimationConfig ? (
       <PetAnimation
        source={petAnimationConfig.source}
        stateMachineName={petAnimationConfig.stateMachineName}
        focusInputName={petAnimationConfig.focusInputName}
        isFocus={false}
        containerStyle={{ position: 'absolute', top: -70 }}
        animationStyle={{ width: '60%', height: '60%' }}
       />
      ) : (
 <View
       className="mt-4 px-4 py-2 rounded-full"
       style={{ backgroundColor: CoralPalette.surfaceAlt, borderColor: CoralPalette.border, borderWidth: 1 }}
      >
       <Text className="text-sm font-semibold" style={[{ color: CoralPalette.mutedDark }, FONT]}>
        Active pet companion
       </Text>
      </View>
      
    )}
  
      
     </View>
       

    <View
     className="flex-1 rounded-t-3xl shadow-lg pt-6"
     style={{ position: 'absolute', top: 470, left: 0, right: 0, bottom: -100, backgroundColor: CoralPalette.surface }}
    >
      <View className="pl-10 mt-2 mb-3 flex-row items-center justify-between">
       <View>
        <Text className="text-xl font-extrabold" style={[{ color: CoralPalette.dark }, FONT]}>
         Your pets
        </Text>
       </View>
       
      </View>
      <View style={{ position: 'absolute', top: 70, left: 0, right: 0, bottom: 0 }}>
      <FlatList
       data={pets}
       keyExtractor={(item) => item.id}
       numColumns={2}
       showsVerticalScrollIndicator={false}
       scrollEnabled={false}
       contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 8 }}
       columnWrapperStyle={{ columnGap: 14, marginBottom: 14}}
       ListEmptyComponent={
        <View className="w-full items-center py-8">
         <Text className="text-base font-bold" style={[{ color: CoralPalette.dark }, FONT]}>
          No pets yet
         </Text>
         <Text className="mt-2 text-sm text-center" style={[{ color: CoralPalette.mutedDark }, FONT]}>
          Visit the store to adopt your first companion.
         </Text>
        </View>
       }
       renderItem={({ item }) => {
       const isFocused = item.id === focusedPet;
        const resolvedImage = resolvePetImage(item);

        return (
         <View className="w-[48%]">
          <TouchableOpacity
           onPress={() => setFocusedPet(item.id)}
           activeOpacity={0.9}
           className="flex-row items-center"
           style={[
            {
             paddingHorizontal: 12,
             paddingVertical: 12,
             borderRadius: 20,
             borderWidth: 1,
             borderColor: CoralPalette.surfaceAlt,
             backgroundColor: CoralPalette.surfaceAlt,
             shadowColor: '#000',
             shadowOpacity: 0.08,
             shadowRadius: 2,
             shadowOffset: { width: 0, height: 2 },
             elevation: 2,
            },
            isFocused && {
             borderColor: CoralPalette.primary,
             backgroundColor: `${CoralPalette.primaryLight}55`,
             shadowOpacity: 0.14,
            },
           ]}
          >
           <Image source={resolvedImage} className="w-14 h-14 rounded-2xl mr-5 ml-2" resizeMode="contain" />

           <View className="flex-1">
            <View className="flex-row items-center justify-between">
             <Text className="text-lg font-extrabold" style={[{ color: CoralPalette.dark }, FONT]} numberOfLines={1}>
              {item.name}
             </Text>

            </View>

           </View>
          </TouchableOpacity>
         </View>
        );
       }}
      />
      </View>
     </View>
    </View>
   </ImageBackground>
  </View>
 );
};

export default Profile;
