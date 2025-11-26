import React, { useCallback, useLayoutEffect } from 'react';
import {
 Text,
 View,
 ImageBackground,
 FlatList,
 Image,
 TouchableOpacity,
 Pressable,
 ActivityIndicator,
} from 'react-native';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation } from 'expo-router';
import images from '@/constants/images';
import { useGlobalContext } from '@/lib/GlobalProvider';
import { Star } from 'lucide-react-native';
import { DrawerToggleButton } from '@react-navigation/drawer';
import { usePets } from '@/hooks/usePets';
import PetAnimation from '@/components/focus/PetAnimation';
import { getPetAnimationConfig } from '@/constants/animations';
import { CoralPalette } from '@/constants/colors';

const FONT = { fontFamily: 'Nunito' };

const Profile = () => {
 const { userProfile, showBanner, updateUserProfile } = useGlobalContext();
 const navigation = useNavigation();
 
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

 const petAnimationConfig = getPetAnimationConfig(userProfile?.selectedPet);
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
    imageStyle={{ transform: [{ translateY: -100 }] }}
   >
    <View className="flex-1" style={{ backgroundColor: 'rgba(252, 244, 227, 0.7)' }}>
     <View className="flex-1 items-center justify-center px-6 pt-10">
      {showPetAnimation && petAnimationConfig ? (
       <PetAnimation
        source={petAnimationConfig.source}
        stateMachineName={petAnimationConfig.stateMachineName}
        focusInputName={petAnimationConfig.focusInputName}
        isFocus={false}
        animationStyle={{ width: '160%', height: '160%' }}
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
      className="flex-2 rounded-t-3xl shadow-lg pt-6 pb-10"
      style={{ backgroundColor: CoralPalette.surfaceAlt, borderColor: CoralPalette.border, borderWidth: 1 }}
     >
      <View className="px-6 mb-3">
       <Text className="text-xl font-extrabold" style={[{ color: CoralPalette.dark }, FONT]}>
        Your pets
       </Text>
      </View>

      <FlatList
       data={pets}
       keyExtractor={(item) => item.id}
       numColumns={2}
       showsVerticalScrollIndicator={false}
       scrollEnabled={false}
       contentContainerStyle={{ paddingBottom: 28, paddingHorizontal: 22, paddingTop: 8 }}
       columnWrapperStyle={{ columnGap: 14, marginBottom: 16 }}
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
        const resolvedImage = item.image ?? images.skyeHead;

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
             borderColor: CoralPalette.border,
             backgroundColor: CoralPalette.surface,
             shadowColor: '#000',
             shadowOpacity: 0.08,
             shadowRadius: 8,
             shadowOffset: { width: 0, height: 4 },
             elevation: 2,
            },
            isFocused && {
             borderColor: CoralPalette.primary,
             backgroundColor: `${CoralPalette.primaryLight}55`,
             shadowOpacity: 0.14,
            },
           ]}
          >
           <Image source={resolvedImage} className="w-16 h-16 rounded-2xl mr-3" resizeMode="contain" />

           <View className="flex-1">
            <View className="flex-row items-center justify-between">
             <Text className="text-lg font-extrabold" style={[{ color: CoralPalette.dark }, FONT]} numberOfLines={1}>
              {item.name}
             </Text>

             {isFocused && (
              <View className="ml-2 rounded-full px-2 py-0.5" style={{ backgroundColor: CoralPalette.primary }}>
               <Text className="text-[11px] font-bold" style={[{ color: CoralPalette.white }, FONT]}>
                Active
               </Text>
              </View>
             )}
            </View>

            <Text
             className="text-xs mt-1 uppercase"
             style={[{ color: CoralPalette.mutedDark, letterSpacing: 0.5 }, FONT]}
             numberOfLines={1}
            >
             {item.type}
            </Text>

            <View className="flex-row items-center mt-2">
             {Array.from({ length: Math.max(0, Math.floor(item.rating || 0)) }).map((_, index) => (
              <Star
               key={`star-${index}`}
               size={16}
               color={CoralPalette.primary}
               fill={CoralPalette.primary}
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
   </ImageBackground>
  </View>
 );
};

export default Profile;
