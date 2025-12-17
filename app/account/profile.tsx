import React, { useMemo } from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";
import { 
  ChevronLeft, 
  Settings, 
  Trophy, 
  Package, 
  Heart,
  Flame,
  Zap,
  Award,
  ChevronRight,
  Clock
} from "lucide-react-native";
import { router } from "expo-router";
import { useGlobalContext } from "@/lib/GlobalProvider";
import { ProfilePicture } from "@/components/other/ProfilePicture";
import { CoralPalette } from "@/constants/colors";
import { usePets } from "@/hooks/usePets";
import images from "@/constants/images";
import { useHasUnclaimedRewards } from "@/utils/hasUnclaimedRewards";
import { ProfileSkeleton } from "@/components/other/Skeleton";

const FONT = { fontFamily: "Nunito" };

export default function Profile() {
  const { userProfile, loading } = useGlobalContext();
  const hasUnclaimedRewards = useHasUnclaimedRewards();

  const {
    pets,
    loading: petsLoading,
  } = usePets({
    ownedPets: userProfile?.ownedPets,
    selectedPet: userProfile?.selectedPet,
    userId: userProfile?.userId,
  });

  // Level progression data
  const level = userProfile?.level ?? 1;
  const xpIntoLevel = userProfile?.xpIntoLevel ?? 0;
  const xpToNextLevel = userProfile?.xpToNextLevel ?? 50;
  const xpTotal = xpIntoLevel + xpToNextLevel;

  // Display semantics: when the bar is visually full, we want to show the *next* level
  // starting at 0 / next-level XP instead of "current level with a full bar".
  const MAX_LEVEL = 9;
  const xpNeededForNext = (currentLevel: number) =>
    Math.round(50 * Math.pow(currentLevel, 1.5)); // must stay in sync with backend computeLevelMeta

  let displayXpIntoLevel = xpIntoLevel;
  let displayXpTotal = xpTotal;

  const barLooksFull =
    level < MAX_LEVEL &&
    xpTotal > 0 &&
    // Treat as full if we're within ~0.5 XP of the end of the bar
    xpIntoLevel >= xpTotal - 0.5;

  if (barLooksFull) {
    const nextLevel = Math.min(level + 1, MAX_LEVEL);
    displayXpIntoLevel = 0;
    displayXpTotal = xpNeededForNext(nextLevel);
  }

  const levelProgress =
    displayXpTotal > 0 ? (displayXpIntoLevel / displayXpTotal) * 100 : 0;
  const totalXP = userProfile?.totalXP ?? 0;
  const dailyStreak = userProfile?.dailyStreak ?? 0;
  const friendsCount = userProfile?.friendsCount ?? 0;

  // Get next pet unlock
  const nextPetUnlock = useMemo(() => {
    const unlockLevels = [1, 3, 5, 7, 9];
    const petNames: Record<number, string> = {
      1: "Smurf",
      3: "Pebbles",
      5: "Chedrick",
      7: "Gooner",
      9: "Kitty",
    };

    for (const unlockLevel of unlockLevels) {
      if (level < unlockLevel) {
        return { level: unlockLevel, name: petNames[unlockLevel] };
      }
    }
    return null; // Max level reached
  }, [level]);

  // Collection counts
  const petsCount = userProfile?.ownedPets?.length ?? 0;
  const hatsCount = userProfile?.ownedHats?.length ?? 0;
  const facesCount = userProfile?.ownedFaces?.length ?? 0;
  const collarsCount = userProfile?.ownedCollars?.length ?? 0;
  const accessoriesCount = hatsCount + facesCount + collarsCount;
  const gadgetsCount = userProfile?.ownedGadgets?.length ?? 0;

  // Pet friendships - get all owned pets with their friendship data
  const petFriendships = userProfile?.petFriendships ?? {};
  const ownedPets = userProfile?.ownedPets ?? [];
  
  const petFriendshipData = ownedPets.map((petId) => {
    const pet = pets.find((p) => p.id === petId);
    const friendshipData = petFriendships[petId];
    const level = friendshipData?.level ?? 1;
    const xpIntoLevel = friendshipData?.xpIntoLevel ?? 0;
    const xpToNextLevel = friendshipData?.xpToNextLevel ?? 50;
    const xpTotal = xpIntoLevel + xpToNextLevel;
    const progress = xpTotal > 0 ? (xpIntoLevel / xpTotal) : 0;
    
    return {
      petId,
      petName: pet?.name ?? "Unknown",
      level,
      progress,
    };
  });

  if (loading || !userProfile) {
    return <ProfileSkeleton />;
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: CoralPalette.surface}}>
        

      {/* Header */}
      <View
        className="flex-row items-center justify-between px-5 py-2"
        style={{ backgroundColor: CoralPalette.surface }}
      >
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <ChevronLeft size={30} color={CoralPalette.dark} />
        </TouchableOpacity>
        <Text
          className="text-xl font-bold pr-2"
          style={[{ color: CoralPalette.dark }, FONT]}
        >
          Account
        </Text>
        <TouchableOpacity 
          onPress={() => router.push('/settings/editProfile')} 
          activeOpacity={0.7}
        >
          <Settings size={24} color={CoralPalette.dark} />
        </TouchableOpacity>
      </View>

    

  
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ backgroundColor: CoralPalette. surface}}
      >
        {/* Profile Header Section */}
        <View className="px-5 mt-4 pb-2" >
          <View className="items-center">
            <View
              className="rounded-full overflow-hidden"
              style={{
                width: 98,
                height: 98,
                borderWidth: 4,
                borderColor: CoralPalette.white,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ProfilePicture
                profileId={userProfile?.profileId ?? 1}
                size={90}
              />
            </View>
            <Text
              className="mt-1 text-lg font-extrabold mb-1"
              style={[{ color: CoralPalette.dark }, FONT]}
            >
              {userProfile?.displayName || "Petly Explorer"}
            </Text>
            <Text
              className="text-sm mb-0"
              style={[{ color: CoralPalette.mutedDark }, FONT]}
            >
              @{userProfile?.username || "no_username"}
            </Text>
          </View>
        </View>

        {/* Quick Stats Row */}
        <View className="px-5 mb-5">
          <View className="flex-row items-center justify-evenly">
            {/* Streak */}
            <View className="flex-row items-center">
              <Image
                source={images.fire}
                style={{ width: 25, height: 25 }}
                resizeMode="contain"
              />
              <Text
                className="text-2xl font-black mt-1 ml-2"
                style={[{ color: CoralPalette.dark }, FONT]}
              >
                {dailyStreak}
              </Text>
  
            </View>

            {/* Friends */}
            <View className="flex-row items-center">
              <Image
                source={images.friends}
                style={{ width: 25, height: 25 }}
                resizeMode="contain"
              />
              <Text
                className="text-2xl font-black mt-1 ml-2"
                style={[{ color: CoralPalette.dark }, FONT]}
              >
                {friendsCount}
              </Text>
 
            </View>

            {/* Achievements */}
            <View className="flex-row items-center">
              <Image
                source={images.trophy}
                style={{ width: 25, height: 25 }}
                resizeMode="contain"
              />
              <Text
                className="text-2xl font-black mt-1 ml-3"
                style={[{ color: CoralPalette.dark }, FONT]}
              >
                N/A
              </Text>

            </View>
          </View>
        </View>

        {/* Level Progress Section */}
        <View className="px-5 mb-6">
          <TouchableOpacity
            onPress={() => router.push('/account/progress-map')}
            activeOpacity={0.7}
            className="p-4"
            style={{
              backgroundColor: CoralPalette.white,
              borderWidth: 1,
              borderColor: CoralPalette.surfaceAlt,
              borderRadius: 10,
              position: 'relative',
            }}
          >
            {hasUnclaimedRewards && (
              <View
                style={{
                  position: 'absolute',
                  top: -6,
                  right: -6,
                  width: 18,
                  height: 18,
                  borderRadius: 10,
                  backgroundColor: '#FF3B30',
                  zIndex: 10,
                }}
              />
            )}
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-col items-start">
              <Text
                style={[{ paddingLeft: 2, color: CoralPalette.dark, fontSize: 16, fontWeight: "700" }, FONT]}
              >
               Focus Rank
              </Text>
              <Text
          
                style={[{ paddingLeft: 2, color: CoralPalette.mutedDark, fontSize: 10 }, FONT]}
              >
                Rank up to unlock new pets and gadgets
              </Text>
              </View>
              <View className="flex-row items-center">
              <View className="w-12 h-12 p-1 rounded-full" style={{ backgroundColor: CoralPalette.greenDark }}>
                <Text
                  className="text-center"
                  style={[{ color: CoralPalette.white, fontSize: 26, fontWeight: "700" }, FONT]}
                >
                  {level}
                </Text>
              </View>
         
              </View>
                  

            </View>
            
            <View
              style={{
                height: 12,
                borderRadius: 6,
                backgroundColor: CoralPalette.greenLighter,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  width: `${levelProgress}%`,
                  height: "100%",
                  backgroundColor: CoralPalette.green,
                  borderRadius: 6,
                }}
              />
            </View>
            <View className="flex-row mt-2 items-center justify-between">
            {nextPetUnlock && (
              <Text
                className="text-xs mt-2"
                style={[{ paddingLeft: 2, color: CoralPalette.greenDark }, FONT]}
              >
                Unlock {nextPetUnlock.name} at level {nextPetUnlock.level}
              </Text>
            )}
              <Text
                className="text-sm"
                style={[{ color: CoralPalette.mutedDark }, FONT]}
              >
                {Math.round(displayXpIntoLevel)} / {Math.round(displayXpTotal)} XP
              </Text>
              </View>
          </TouchableOpacity>
        </View>

        {/* Overview Section */}
        <View className="px-5 mb-6">
          <Text
            className="ml-2 text-sm font-bold mb-4 uppercase tracking-wider"
            style={[{ color: CoralPalette.mutedDark }, FONT]}
          >
            Overview
          </Text>
          <View className="flex-row flex-wrap" style={{ gap: 12 }}>
            {/* Streak Card */}
            <View
              className=" p-4"
              style={{
                width: "47%",
                backgroundColor: CoralPalette.white,
                borderWidth: 1,
                borderColor: CoralPalette.white,
                borderRadius: 10,
              }}
            >
              <View className="flex-row items-center mb-2">
                <Flame size={20} color={CoralPalette.primary} strokeWidth={2.5}/>
                <Text
                  className="ml-2 text-sm font-semibold"
                  style={[{ color: CoralPalette.mutedDark }, FONT]}
                >
                  Highest Streak 
                </Text>
              </View>
              <Text
                className="ml-1 text-2xl font-black"
                style={[{ color: CoralPalette.dark, fontWeight: "700" }, FONT]}
              >
                {userProfile?.highestStreak ?? 0}
              </Text>
            </View>

            {/* Total Focus Hours Card */}
            <View
              className="p-4"
              style={{
                width: "47%",
                backgroundColor: CoralPalette.white,
                borderWidth: 1,
                borderColor: CoralPalette.white,
                borderRadius: 10,
              }}
            >
              <View className="flex-row items-center mb-2">
                <Clock size={20} color={CoralPalette.primary} strokeWidth={2.5}/>
                <Text
                  className="ml-2 text-sm font-semibold"
                  style={[{ color: CoralPalette.mutedDark }, FONT]}
                >
                  Total Focus Hours
                </Text>
              </View>
              <Text
                className="ml-1 text-2xl font-black"
                style={[{ color: CoralPalette.dark, fontWeight: "700" }, FONT]}
              >
                    {((userProfile?.totalFocusSeconds ?? 0) / 3600).toFixed(0)}
              </Text>
            </View>

            {/* Achievements Card */}
            

            {/* Coins Card */}
            
          </View>
        </View>

        {/* Achievements Section */}
        <View className="px-5 mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text
              className="ml-2 text-sm font-bold uppercase tracking-wider"
              style={[{ color: CoralPalette.mutedDark }, FONT]}
            >
              Achievements
            </Text>
            <ChevronRight size={18} color={CoralPalette.mutedDark} />
          </View>
          <View
            className="p-6 items-center justify-center"
            style={{
              backgroundColor: CoralPalette.white,
              borderWidth: 1,
              borderColor: CoralPalette.white,
              borderRadius: 10,
            }}
          >
            <Text
              className="text-base"
              style={[{ color: CoralPalette.mutedDark }, FONT]}
            >
              Coming soon...
            </Text>
          </View>
        </View>

        {/* Collection Section */}
        <View className="px-5 mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text
              className="ml-2 text-sm font-bold uppercase tracking-wider"
              style={[{ color: CoralPalette.mutedDark }, FONT]}
            >
              Collection
            </Text>
            <ChevronRight size={18} color={CoralPalette.mutedDark} />
          </View>
          <View className="flex-row" style={{ gap: 12 }}>
            {/* Pets */}
            <View
              className="p-4 flex-1"
              style={{
                backgroundColor: CoralPalette.white,
                borderWidth: 1,
                borderColor: CoralPalette.white,
                borderRadius: 10,
              }}
            >
              <View className="flex-row items-center mb-2">
                <Package size={20} color={CoralPalette.primary} fill={CoralPalette.primary} />
                <Text
                  className="ml-2 text-sm font-semibold"
                  style={[{ color: CoralPalette.mutedDark }, FONT]}
                >
                  Pets
                </Text>
                </View>
                <Text
                className="ml-1 text-3xl font-black"
                style={[{ color: CoralPalette.dark }, FONT]}
              >
                {petsCount}
              </Text>
              <Text
                className="ml-1 text-xs"
                style={[{ color: CoralPalette.mutedDark }, FONT]}
              >
               owned
              </Text>
            </View>

            {/* Accessories */}
            <View
              className="p-4 flex-1"
              style={{
                backgroundColor: CoralPalette.white,
                borderWidth: 1,
                borderColor: CoralPalette.white,
                borderRadius: 10,
              }}
            >
              <View className="flex-row items-center mb-2">
                <Package size={20} color={CoralPalette.primary} fill={CoralPalette.primary} />
                <Text
                  className="ml-2 text-sm font-semibold"
                  style={[{ color: CoralPalette.mutedDark }, FONT]}
                >
                  Accessories
                </Text>
              </View>
              <Text
                className="ml-1 text-3xl font-black"
                style={[{ color: CoralPalette.dark }, FONT]}
              >
                {accessoriesCount}
              </Text>
              <Text
                className="ml-1 text-xs"
                style={[{ color: CoralPalette.mutedDark }, FONT]}
              >
                owned
              </Text>
            </View>

            {/* Gadgets */}
            <View
              className="p-4 flex-1"
              style={{
                backgroundColor: CoralPalette.white,
                borderWidth: 1,
                borderColor: CoralPalette.white,
                borderRadius: 10,
              }}
            >
              <View className="flex-row items-center mb-2">
                <Package size={20} color={CoralPalette.primary} fill={CoralPalette.primary} />
                <Text
                  className="ml-2 text-sm font-semibold"
                  style={[{ color: CoralPalette.mutedDark }, FONT]}
                >
                  Gadgets
                </Text>
              </View>
              <Text
                className="ml-1 text-3xl font-black"
                style={[{ color: CoralPalette.dark }, FONT]}
              >
                {gadgetsCount}
              </Text>
              <Text
                className="ml-1 text-xs"
                style={[{ color: CoralPalette.mutedDark }, FONT]}
              >
                owned
              </Text>
            </View>
          </View>
        </View>

        {/* Pet Friendships Section */}
        <View className="px-5 mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text
              className="ml-2 text-sm font-bold uppercase tracking-wider"
              style={[{ color: CoralPalette.mutedDark }, FONT]}
            >
              Pet Friendships
            </Text>
            <ChevronRight size={18} color={CoralPalette.mutedDark} />
          </View>
          {petFriendshipData.length === 0 ? (
            <View
              className="p-6 items-center justify-center"
              style={{
                backgroundColor: CoralPalette.white,
                borderWidth: 1,
                borderColor: CoralPalette.white,
                borderRadius: 10,
              }}
            >
              <Text
                className="text-base"
                style={[{ color: CoralPalette.mutedDark }, FONT]}
              >
                No pets yet
              </Text>
            </View>
          ) : (
            <View
              className="py-4"
              style={{
                backgroundColor: CoralPalette.white,
                borderWidth: 4,
                borderColor: CoralPalette.purpleLighter,
                borderRadius: 16,
              }}
            >
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 10, marginLeft: 10}}
              >
                {petFriendshipData.map(({ petId, petName, level, progress }) => {
                  const SIZE = 80;
                  const STROKE_WIDTH = 12;
                  const RADIUS = (SIZE - STROKE_WIDTH) / 2;
                  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
                  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);
                  
                  const petImage = images[petId as keyof typeof images] ?? images.lighting;

                  return (
                    <View
                      key={petId}
                      className="items-center"
                      style={{ width: SIZE + 20 }}
                    >
                      <View style={{ width: SIZE, height: SIZE, position: 'relative' }}>
                        <Svg width={SIZE} height={SIZE} style={{ position: 'absolute' }}>
                          {/* Background circle */}
                          <Circle
                            cx={SIZE / 2}
                            cy={SIZE / 2}
                            r={RADIUS}
                            stroke={CoralPalette.purpleLight}
                            strokeWidth={STROKE_WIDTH}
                            fill="none"
                          />
                          {/* Progress circle */}
                          <Circle
                            cx={SIZE / 2}
                            cy={SIZE / 2}
                            r={RADIUS}
                            stroke={CoralPalette.purpleDark}
                            strokeWidth={STROKE_WIDTH}
                            fill="none"
                            strokeDasharray={CIRCUMFERENCE}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
                          />
                        </Svg>
                        {/* Pet image */}
                        <View
                          style={{
                            width: SIZE - STROKE_WIDTH * 2,
                            height: SIZE - STROKE_WIDTH * 2,
                            position: 'absolute',
                            top: STROKE_WIDTH,
                            left: STROKE_WIDTH,
                            borderRadius: (SIZE - STROKE_WIDTH * 2) / 2,
                            overflow: 'hidden',
                            backgroundColor: CoralPalette.white,
                          }}
                        >
                          <Image
                            source={petImage}
                            style={{
                              width: '70%',
                              height: '70%',
                              resizeMode: 'contain',
                              alignSelf: 'center',
                              justifyContent: 'center',
                              marginTop: 9,
                            }}
                          />
                        </View>
                      </View>
                      {/* Level text */}
                      <View className="flex-row items-center justify-between pt-2">
                      <Text
     
                        style={[{ color: CoralPalette.dark, fontSize: 13, fontWeight: "700",paddingRight: 2}, FONT]}
                      >
                        {petName}
                      </Text>
                      <Text
                       
                        style={[{ color: CoralPalette.purple, fontSize: 13,  fontWeight: "700"}, FONT]}
                      >
                        ({level})
                      </Text>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>
        
      </ScrollView>
    </SafeAreaView>
  );
}
