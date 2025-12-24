import React, { useState } from "react";
import {
 View,
 Text,
 TextInput,
 TouchableOpacity,
 ScrollView,
 Alert,
 ActivityIndicator,
 KeyboardAvoidingView,
 Platform,
 Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useGlobalContext } from "@/providers/GlobalProvider";
import { auth } from "@/lib/firebase";
import Constants from "expo-constants";
import { Check } from "lucide-react-native";
import images from "@/constants/images";

const API_BASE_URL = Constants.expoConfig?.extra?.backendUrl as string;

// Profile picture options
const DEFAULT_AVATARS = [
 { id: 1, image: images.profile1, name: "profile1" },
 { id: 2, image: images.profile2, name: "profile2" },
];

export default function SetProfile() {
 const router = useRouter();
 const { userProfile, refetchUserProfile } = useGlobalContext();
 const [username, setUsername] = useState("");
 const [selectedAvatarId, setSelectedAvatarId] = useState(1);
 const [isLoading, setIsLoading] = useState(false);

 const selectedAvatar = DEFAULT_AVATARS.find((a) => a.id === selectedAvatarId);

 const handleSubmit = async () => {
  if (!username.trim()) {
   Alert.alert("Error", "Please enter a username");
   return;
  }

  if (username.trim().length < 2) {
   Alert.alert("Error", "Username must be at least 2 characters long");
   return;
  }

  const uid = userProfile?.userId || auth.currentUser?.uid;
  if (!uid) {
   Alert.alert("Error", "User not found. Please try again.");
   return;
  }

  setIsLoading(true);

  try {
   // Save profile (username + profile picture) to backend
   const response = await fetch(
    `${API_BASE_URL}/api/auth/setup-profile`,
    {
     method: "POST",
     headers: {
      "Content-Type": "application/json",
     },
     body: JSON.stringify({ 
      userId: uid,
      username: username.trim(),
      profileId: selectedAvatar?.id || 1
     }),
    }
   );

   const data = await response.json();

   if (!response.ok) {
    throw new Error(data.error || "Failed to setup profile");
   }

   console.log("✅ Profile setup successfully:", data);

   // Refetch user data to update global state
   await refetchUserProfile();

   // Redirect to main app with loggedIn flag to show welcome banner
   router.replace({
    pathname: "/(tabs)",
    params: { loggedIn: "true" }
   });
  } catch (error) {
   console.error("❌ Error setting profile:", error);
   const errorMessage =
    error instanceof Error ? error.message : "Failed to set profile";
   Alert.alert("Error", errorMessage);
  } finally {
   setIsLoading(false);
  }
 };

 return (
  <SafeAreaView className="flex-1 bg-white" edges={['top']}>
   <KeyboardAvoidingView 
    behavior={Platform.OS === "ios" ? "padding" : "height"}
    className="flex-1"
   >
    <View className="flex-1">
     {/* Header */}
     <View className="px-6 pt-8 pb-6">
      <Text className="text-3xl font-bold text-gray-900 text-center">
       Set Up Your Profile
      </Text>
     </View>

     {/* Scrollable Content */}
     <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}
      className="flex-1"
     >
      {/* Avatar Preview */}
      <View className="items-center mb-8 mt-4">
       <View className="w-32 h-32 rounded-full overflow-hidden shadow-lg border-2 border-gray-200">
        <Image
         source={selectedAvatar?.image}
         className="w-full h-full"
         resizeMode="cover"
        />
       </View>
      </View>

      {/* Username Section */}
      <View className="mb-8">
       <Text className="text-lg font-semibold text-gray-900 mb-3">
        Username
       </Text>
        <TextInput
         className="text-lg text-gray-900 bg-gray-50 rounded-2xl border-2 border-gray-200 px-5 py-4"
         placeholder="Choose a username"
         placeholderTextColor="#9ca3af"
         value={username}
         onChangeText={setUsername}
         maxLength={30}
         autoCapitalize="none"
         autoCorrect={false}
         editable={!isLoading}
         style={{ lineHeight: 0 }}
        />
      </View>

      {/* Avatar Selection Section */}
      <View className="mb-6">
       <Text className="text-lg font-semibold text-gray-900 mb-4">
        Choose Profile Picture
       </Text>

       {/* Avatar Grid - 3 columns */}
       <View className="flex-row flex-wrap">
        {DEFAULT_AVATARS.map((avatar) => (
         <TouchableOpacity
          key={avatar.id}
          onPress={() => setSelectedAvatarId(avatar.id)}
          disabled={isLoading}
          className="mb-6 items-center relative"
          style={{ width: "33%" }}
         >
          <View
           className={`w-32 h-32 rounded-full overflow-hidden ${
            selectedAvatarId === avatar.id
             ? "border-4 border-blue-500"
             : "border-2 border-gray-200"
           }`}
          >
           <Image
            source={avatar.image}
            className="w-full h-full"
            resizeMode="cover"
           />
          </View>
          {selectedAvatarId === avatar.id && (
           <View className="absolute top-3 right-3 bg-blue-500 rounded-full p-1.5 shadow-md" style={{ transform: [{ translateX: 4 }, { translateY: -4 }] }}>
            <Check size={18} color="white" strokeWidth={3} />
           </View>
          )}
         </TouchableOpacity>
        ))}
       </View>
      </View>
     </ScrollView>

     {/* Fixed Bottom Button */}
     <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4">
      <TouchableOpacity
       onPress={handleSubmit}
       disabled={isLoading || !username.trim()}
       className={`py-4 rounded-2xl items-center justify-center shadow-lg mb-7 ${
        isLoading || !username.trim()
         ? "bg-gray-300"
         : "bg-blue-500"
       }`}
       style={{
        shadowColor: isLoading || !username.trim() ? "#000" : "#3b82f6",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
       }}
      >
       {isLoading ? (
        <ActivityIndicator size="small" color="white" />
       ) : (
        <Text className="text-lg font-bold text-white">
         Complete Profile
        </Text>
       )}
      </TouchableOpacity>
     </View>
    </View>
   </KeyboardAvoidingView>
  </SafeAreaView>
 );
}
