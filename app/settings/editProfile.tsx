import React, { useState, useEffect } from "react";
import {
 ScrollView,
 Text,
 TouchableOpacity,
 View,
 TextInput,
 Alert,
 ActivityIndicator,
 Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGlobalContext } from "@/lib/GlobalProvider";
import { ChevronLeft, Check, Edit2 } from "lucide-react-native";
import { router } from "expo-router";
import Constants from "expo-constants";
import { ProfilePicture } from "@/components/other/ProfilePicture";

const API_BASE_URL = Constants.expoConfig?.extra?.backendUrl as string;

// Profile picture options
const PROFILE_OPTIONS = [
 { id: 1, name: "Profile 1" },
 { id: 2, name: "Profile 2" },
];

const EditProfile = () => {
 const { userProfile, updateUserProfile } = useGlobalContext();
 const [username, setUsername] = useState("");
 const [selectedProfileId, setSelectedProfileId] = useState<number>(1);
 const [showProfilePicker, setShowProfilePicker] = useState(false);
 const [showUsernameModal, setShowUsernameModal] = useState(false);
 const [usernameDraft, setUsernameDraft] = useState("");
 const [isSaving, setIsSaving] = useState(false);
 const [originalUsername, setOriginalUsername] = useState<string | null>(null);
 const [originalProfileId, setOriginalProfileId] = useState<number>(1);

 // Initialize state from global userProfile
 useEffect(() => {
  if (userProfile) {
   const currentUsername = userProfile.username || "";
   const currentProfileId = userProfile.profileId || 1;
   setUsername(currentUsername);
   setOriginalUsername(currentUsername);
   setSelectedProfileId(currentProfileId);
   setOriginalProfileId(currentProfileId);
   setUsernameDraft(currentUsername);
  }
 }, [userProfile]);

 const handleSave = async () => {
  if (!userProfile?.userId) {
   Alert.alert("Error", "User not found. Please try again.");
   return;
  }

  // Check if anything has changed
  const usernameChanged = username.trim() !== originalUsername;
  const profileIdChanged = selectedProfileId !== originalProfileId;

  if (!usernameChanged && !profileIdChanged) {
   router.back();
   return;
  }

  if (username.trim().length < 2) {
   Alert.alert("Error", "Username must be at least 2 characters long");
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

   updateUserProfile({
    username: username.trim(),
    profileId: selectedProfileId,
   });

   Alert.alert("Success", "Profile updated successfully!", [
    { text: "OK", onPress: () => router.back() },
   ]);
  } catch (error) {
   console.error("❌ Error updating profile:", error);
   const errorMessage =
    error instanceof Error ? error.message : "Failed to update profile";
   Alert.alert("Error", errorMessage);
  } finally {
   setIsSaving(false);
  }
 };

 const hasChanges =
  username.trim() !== originalUsername ||
  selectedProfileId !== originalProfileId;

 return (
  <SafeAreaView className="flex-1 bg-[#f3f4f6]">
   <View className="flex-row items-center justify-between px-4 py-4">
    <TouchableOpacity onPress={() => router.back()}>
     <ChevronLeft size={24} color="#0f172a" />
    </TouchableOpacity>
    <Text className="text-[17px] font-semibold text-black">
     Edit Profile
    </Text>
    <TouchableOpacity
     onPress={handleSave}
     disabled={isSaving || !hasChanges}
    >
     {isSaving ? (
      <ActivityIndicator size="small" color="#007AFF" />
     ) : (
      <Text
       className={`text-lg font-medium ${hasChanges ? "text-blue-500" : "text-gray-400"}`}
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
    <View className="rounded-3xl border border-gray-100 bg-white px-8 py-8 shadow-sm">
     <TouchableOpacity
      className="items-center"
      activeOpacity={0.8}
      onPress={() => setShowProfilePicker(true)}
     >
      <ProfilePicture profileId={selectedProfileId} size={120} />
      <Text className="mt-4 text-2xl font-bold text-black">
       {userProfile?.displayName || "Petly Explorer"}
      </Text>
     </TouchableOpacity>

     <View className="px-2 py-2">
      <View className="flex-row items-center justify-center">
       <View className="mr-3">
        <Text className="mt-2 ml-8 text-lg text-gray-800">
         @ {username || "Not set"}
        </Text>
       </View>
       <TouchableOpacity
        className="flex-row items-center rounded-full mt-2 border border-gray-200 px-2 py-1.5"
        onPress={() => {
         setUsernameDraft(username);
         setShowUsernameModal(true);
        }}
       >
        <Edit2 size={16} color="#64748b" />
       </TouchableOpacity>
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
      <Text className="text-2xl font-bold text-gray-900 mb-4 text-center">
       Choose Profile Picture
      </Text>

      <View className="flex-row justify-around mb-6">
       {PROFILE_OPTIONS.map((option) => (
        <TouchableOpacity
         key={option.id}
         onPress={() => setSelectedProfileId(option.id)}
         className="items-center"
        >
         <View className="relative">
          <ProfilePicture profileId={option.id} size={100} />
          {selectedProfileId === option.id && (
           <View className="absolute -top-2 -right-2 bg-blue-500 rounded-full p-1">
            <Check size={20} color="#fff" />
           </View>
          )}
         </View>
         <Text className="text-base text-gray-700 mt-2">
          {option.name}
         </Text>
        </TouchableOpacity>
       ))}
      </View>

      <TouchableOpacity
       onPress={() => setShowProfilePicker(false)}
       className="bg-blue-500 rounded-xl py-3 px-6"
      >
       <Text className="text-lg font-medium text-white text-center">
        Done
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
      className="bg-white rounded-3xl p-5 mx-6 w-2/3"
      onPress={(e) => e.stopPropagation()}
     >
      <Text className="text-xl font-bold text-gray-900 mb-4 text-center">
       Edit Username
      </Text>
      <View className="rounded-2xl border border-gray-200 bg-gray-50 py-4 px-4 justify-center ">
       <TextInput
        className="text-xl text-gray-900"
        placeholder="Enter a new username"
        value={usernameDraft}
        onChangeText={setUsernameDraft}
        maxLength={30}
        autoCapitalize="none"
        autoCorrect={false}
        placeholderTextColor="#94a3b8"
        textAlign="center"
        style={{ lineHeight: 0 }}
       />
      </View>
      <View className="flex-row justify-between mt-4 gap-3">
       <TouchableOpacity
        onPress={() => setShowUsernameModal(false)}
        className="rounded-full border border-gray-200 w-[48%] items-center justify-center px-4 py-4"
       >
        <Text className="text-md font-medium text-gray-600">
         Cancel
        </Text>
       </TouchableOpacity>
       <TouchableOpacity
        onPress={() => {
         setUsername(usernameDraft);
         setShowUsernameModal(false);
        }}
        className="rounded-full bg-blue-500 w-[48%] items-center justify-center px-4 py-4"
       >
        <Text className="text-md font-semibold text-white">Save</Text>
       </TouchableOpacity>
      </View>
     </TouchableOpacity>
    </TouchableOpacity>
   </Modal>
  </SafeAreaView>
 );
};

export default EditProfile;
