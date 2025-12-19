import React, { useState, useEffect, useCallback } from "react";
import {
 ScrollView,
 Text,
 TouchableOpacity,
 View,
 TextInput,
 ActivityIndicator,
 Modal,
 FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGlobalContext } from "@/lib/GlobalProvider";
import { useFocusEffect } from "@react-navigation/native";
import { ChevronLeft, Edit2 } from "lucide-react-native";
import { router } from "expo-router";
import Constants from "expo-constants";
import { ProfilePicture } from "@/components/other/ProfilePicture";
import { CoralPalette } from "@/constants/colors";

const API_BASE_URL = Constants.expoConfig?.extra?.backendUrl as string;
const FONT = { fontFamily: "Nunito" };

// Profile picture options
const PROFILE_OPTIONS = [
 { id: 1, name: "Profile 1" },
 { id: 2, name: "Profile 2" },
 { id: 3, name: "Profile 3" },
 { id: 4, name: "Profile 4" },
];

const EditProfile = () => {
 const { userProfile, updateUserProfile, refetchUserProfile, showBanner } = useGlobalContext();
 const initialUsername = userProfile?.username ?? "";
 const initialProfileId = userProfile?.profileId ?? 1;

 const [isInitialized, setIsInitialized] = useState(() => !!userProfile);
 const [username, setUsername] = useState(initialUsername);
 const [selectedProfileId, setSelectedProfileId] = useState<number>(initialProfileId);
 const [showProfilePicker, setShowProfilePicker] = useState(false);
 const [showUsernameModal, setShowUsernameModal] = useState(false);
 const [usernameDraft, setUsernameDraft] = useState(initialUsername);
 const [isSaving, setIsSaving] = useState(false);
 const [originalUsername, setOriginalUsername] = useState(initialUsername);
 const [originalProfileId, setOriginalProfileId] = useState<number>(initialProfileId);

 // Initialize state from global userProfile
 useEffect(() => {
  if (!userProfile) {
   setIsInitialized(false);
   return;
  }

  const currentUsername = userProfile.username ?? "";
  const currentProfileId = userProfile.profileId ?? 1;

  setUsername(currentUsername);
  setOriginalUsername(currentUsername);
  setSelectedProfileId(currentProfileId);
  setOriginalProfileId(currentProfileId);
  setUsernameDraft(currentUsername);
  setIsInitialized(true);
 }, [userProfile?.userId]);

 useFocusEffect(
  useCallback(() => {
   if (userProfile?.userId) return;
   refetchUserProfile().catch((err) => console.error("Failed to refetch profile", err));
  }, [userProfile?.userId, refetchUserProfile])
 );

 const handleSave = async () => {
  if (!userProfile?.userId) {
   showBanner({
    title: "User not found. Please try again.",
    preset: "error",
    haptic: "error",
   });
   return;
  }

  // Check if anything has changed
  const usernameChanged = username.trim() !== originalUsername;
  const profileIdChanged = selectedProfileId !== originalProfileId;

  

  if (username.trim().length < 2) {
   showBanner({
    title: "Username must be at least 2 characters long",
    preset: "error",
    haptic: "error",
   });
   return;
  }

  setIsSaving(true);

  try {
   const updateData: { username?: string; profileId?: number } = {};

   if (usernameChanged) {
    updateData.username = username.trim();
   }

   if (profileIdChanged) {
    updateData.profileId = selectedProfileId;
   }

   const response = await fetch(
    `${API_BASE_URL}/api/user/update_profile/${userProfile.userId}`,
    {
     method: "PUT",
     headers: {
      "Content-Type": "application/json",
     },
     body: JSON.stringify(updateData),
    }
   );

   if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to update profile");
   }

   const result = await response.json();
   console.log("✅ Profile updated successfully:", result.data);

   const nextUsername = username.trim();
   updateUserProfile({
    username: nextUsername,
    profileId: selectedProfileId,
   });

   setOriginalUsername(nextUsername);
   setOriginalProfileId(selectedProfileId);
   setUsernameDraft(nextUsername);

   showBanner({
    title: "Profile updated",
    preset: "done",
    haptic: "success",
   });
  } catch (error) {
   console.error("❌ Error updating profile:", error);
   const errorMessage =
    error instanceof Error ? error.message : "Failed to update profile";
  showBanner({
   title: errorMessage,
   preset: "error",
   haptic: "error",
  });
  } finally {
   setIsSaving(false);
  }
 };

const hasChanges =
 username.trim() !== originalUsername ||
 selectedProfileId !== originalProfileId;

const renderProfileOption = ({ item }: { item: { id: number; name: string } }) => {
  const isSelected = selectedProfileId === item.id;
  return (
    <TouchableOpacity
      onPress={() => setSelectedProfileId(item.id)}
      activeOpacity={0.8}
      className="items-center mx-5"
    >
      <View
        className="rounded-full"
        style={{
          width: 98,
          height: 98,
          borderWidth: 4,
          borderColor: isSelected ? CoralPalette.primary : CoralPalette.surface,
          backgroundColor: CoralPalette.surface,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ProfilePicture profileId={item.id} size={90} />
      </View>
    </TouchableOpacity>
  );
};

  if (!isInitialized) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: CoralPalette.surface }}>
        <View className="relative flex-row mb-1 items-center justify-between px-4 py-4">
          <TouchableOpacity onPress={() => router.back()}>
            <ChevronLeft size={30} color={CoralPalette.dark} />
          </TouchableOpacity>
          <View className="absolute items-center justify-center left-0 right-0">
            <Text className="text-[17px] font-bold" style={[{ color: CoralPalette.dark }, FONT]}>
              Profile
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={CoralPalette.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: CoralPalette.surface }}>
      <View className="relative flex-row mb-1 items-center justify-between px-4 py-4">
    <TouchableOpacity onPress={() => router.back()}>
     <ChevronLeft size={30} color={CoralPalette.dark} />
    </TouchableOpacity>
    <View className="absolute items-center justify-center left-0 right-0">
    <Text className="text-[17px] font-bold" style={[{color: CoralPalette.dark }, FONT]}>
     Profile
    </Text>
    </View>
    <TouchableOpacity
      onPress={handleSave}
      disabled={isSaving || !hasChanges}
    >
     {isSaving ? (
      <ActivityIndicator size="small" color={CoralPalette.primary} />
     ) : (
      <Text
       className="text-lg font-medium"
        style={[{ color: hasChanges ? CoralPalette.primary : "transparent" }, FONT]}
      >
       Done
      </Text>
     )}
    </TouchableOpacity>
   </View>

   <ScrollView
    className="flex-1"
    showsVerticalScrollIndicator={false}
    contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
   >
    <View
      className="rounded-3xl px-8 py-8 mt-16 shadow-sm"
      style={{ backgroundColor: CoralPalette.surfaceAlt, borderColor: CoralPalette.border, borderWidth: 1 }}
    >
     <TouchableOpacity
      className="items-center"
      activeOpacity={0.8}
      onPress={() => setShowProfilePicker(true)}
     >
      <View className="-mt-24">
       <View
        className="relative rounded-full overflow-hidden"
        style={{ 
          width: 120, 
          height: 120,
          borderWidth: 4,
          borderColor: CoralPalette.white,
          alignItems: 'center',
          justifyContent: 'center',
        }}
       >
        <ProfilePicture profileId={selectedProfileId} size={112} />
        <View className="absolute bottom-0 left-0 right-0 bg-black/70 items-center justify-center" style={{ height: 25 }}>
         <Text className="text-xs font-semibold tracking-wider text-white" style={FONT}>
          Edit
         </Text>
        </View>
       </View>
      </View>
      <Text className="mt-1 text-2xl font-bold" style={[{ color: CoralPalette.dark }, FONT]}>
       {userProfile?.displayName || "Petly Explorer"}
      </Text>
     </TouchableOpacity>

     <View className="px-2 py-1 -mt-3">
      <View className="flex-row items-center justify-center">
       <View className="mr-3">
        <Text className="mt-2 ml-8 text-md" style={[{ color: CoralPalette.mutedDark }, FONT]}>
         @ {username || "Not set"}
        </Text>
       </View>
       <TouchableOpacity
        className="flex-row items-center rounded-full mt-2 border border-gray-200 px-2 py-1.5"
        style={{ borderColor: CoralPalette.border }}
        onPress={() => {
         setUsernameDraft(username);
         setShowUsernameModal(true);
        }}
       >
        <Edit2 size={16} color="#64748b" />
       </TouchableOpacity>
      </View>
     </View>

     <View className="flex-row items-center justify-between">
      <View className="flex-1 items-center justify-center">
       <Text className="mt-4 text-center text-base font-sm" style={[{ color: CoralPalette.dark }, FONT]}>
        Highest Streak
       </Text>
       <Text className="mt-2 text-center text-4xl font-bold" style={[{ color: CoralPalette.primary }, FONT]}>
        {`${userProfile?.highestStreak ?? 0}`}
       </Text>
      </View>
     <View className="flex-1 items-center justify-center">
        <Text className="mt-4 text-center text-base font-sm" style={[{ color: CoralPalette.dark }, FONT]}>
          Total Focus Hours
        </Text>
        <Text className="mt-2 text-center text-4xl font-bold" style={[{ color: CoralPalette.primary }, FONT]}>
         {((userProfile?.totalFocusSeconds ?? 0) / 3600).toFixed(0)}
        </Text>
     </View>
     </View>
    </View>
   </ScrollView>

   {/* Profile Picture Picker Modal */}
  <Modal
    visible={showProfilePicker}
    transparent
    animationType="fade"
    onRequestClose={() => setShowProfilePicker(false)}
  >
    <TouchableOpacity
      className="flex-1 bg-black/50 justify-center items-center"
      activeOpacity={1}
      onPress={() => setShowProfilePicker(false)}
    >
      <TouchableOpacity
        activeOpacity={1}
        className="bg-white rounded-3xl p-6 mx-6 w-11/12 max-w-md"
        onPress={(e) => e.stopPropagation()}
      >
        <Text className="text-xl font-bold text-gray-900 mb-4 text-center" style={FONT}>
          Choose Profile Picture
        </Text>

        <FlatList
          data={PROFILE_OPTIONS}
          horizontal
          keyExtractor={(item) => String(item.id)}
          renderItem={renderProfileOption}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 12, paddingHorizontal: 6 }}
        />

        <TouchableOpacity
          onPress={() => setShowProfilePicker(false)}
          className="rounded-full py-3 px-6 mt-2"
          style={{ backgroundColor: CoralPalette.primary }}
        >
          <Text className="text-lg font-medium text-white text-center" style={FONT}>
            Save
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </TouchableOpacity>
   </Modal>

   {/* Username Modal */}
   <Modal
    visible={showUsernameModal}
    transparent
    animationType="fade"
    onRequestClose={() => setShowUsernameModal(false)}
   >
    <TouchableOpacity
     className="flex-1 bg-black/40 justify-center items-center"
     activeOpacity={1}
     onPress={() => setShowUsernameModal(false)}
    >
     <TouchableOpacity
      activeOpacity={1}
      className="rounded-3xl p-5 mx-6 w-2/3"
      style={{ backgroundColor: CoralPalette.surfaceAlt}}
      onPress={(e) => e.stopPropagation()}
     >
      <Text className="text-xl font-bold mb-4 text-center" style={[{ color: CoralPalette.dark }, FONT]}>
       Edit Username
      </Text>
      <View
        className="rounded-2xl py-4 px-4 justify-center"
        style={{ borderColor: CoralPalette.border, borderWidth: 1, backgroundColor: CoralPalette.surface }}
      >
       <TextInput
        className="text-xl"
         style={[{ color: CoralPalette.dark, lineHeight: 0 }, FONT]}
        placeholder="Enter a new username"
        value={usernameDraft}
        onChangeText={setUsernameDraft}
        maxLength={30}
        autoCapitalize="none"
        autoCorrect={false}
        placeholderTextColor="#94a3b8"
        textAlign="center"
      />
      </View>
      <View className="flex-row justify-between mt-4 gap-3">
       <TouchableOpacity
        onPress={() => setShowUsernameModal(false)}
        className="rounded-full w-[48%] items-center justify-center px-4 py-4"
        style={{ borderColor: CoralPalette.border, borderWidth: 1 }}
       >
        <Text className="text-md font-medium" style={[{ color: CoralPalette.mutedDark }, FONT]}>
         Cancel
        </Text>
       </TouchableOpacity>
       <TouchableOpacity
        onPress={() => {
         setUsername(usernameDraft);
         setShowUsernameModal(false);
        }}
        className="rounded-full w-[48%] items-center justify-center px-4 py-4"
        style={{ backgroundColor: CoralPalette.primary }}
       >
        <Text className="text-md font-semibold text-white" style={FONT}>Save</Text>
       </TouchableOpacity>
      </View>
     </TouchableOpacity>
    </TouchableOpacity>
   </Modal>
  </SafeAreaView>
 );
};

export default EditProfile;
