import React, { useState, useEffect } from "react";
import { ScrollView, Text, TouchableOpacity, View, TextInput, Alert, ActivityIndicator, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGlobalContext } from "@/lib/global-provider";
import { ChevronLeft, Edit2, Check } from "lucide-react-native";
import { router } from "expo-router";
import Constants from 'expo-constants';
import { ProfilePicture } from "@/components/other/ProfilePicture";

const API_BASE_URL = Constants.expoConfig?.extra?.backendUrl as string;

// Profile picture options
const PROFILE_OPTIONS = [
  { id: 1, name: "Profile 1" },
  { id: 2, name: "Profile 2" },
];

interface UserProfile {
  username: string | null;
  email: string;
}

const EditProfile = () => {
  const { userProfile, refetch } = useGlobalContext();
  const [username, setUsername] = useState("");
  const [selectedProfileId, setSelectedProfileId] = useState<number>(1);
  const [showProfilePicker, setShowProfilePicker] = useState(false);
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

      const response = await fetch(`${API_BASE_URL}/api/user/update_profile/${userProfile.userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const result = await response.json();
      console.log("✅ Profile updated successfully:", result.data);
      
      // Refetch user profile to update global state
      await refetch();
      
      Alert.alert("Success", "Profile updated successfully!", [
        { text: "OK", onPress: () => router.back() }
      ]);
      
    } catch (error) {
      console.error("❌ Error updating profile:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to update profile";
      Alert.alert("Error", errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = username.trim() !== originalUsername || selectedProfileId !== originalProfileId;

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header with back chevron */}
      <View className="flex-row items-center justify-between px-4 py-4">
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text className="text-2xl font-rubik-medium text-gray-900">Edit Profile</Text>
        <TouchableOpacity 
          onPress={handleSave}
          disabled={isSaving || !hasChanges}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Text className={`text-lg font-rubik-medium ${hasChanges ? 'text-blue-500' : 'text-gray-400'}`}>
              Done
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16 }}
      >
        {/* Profile Picture Section */}
        <View className="mb-8">
          <Text className="text-base font-rubik-medium text-gray-500 uppercase tracking-wide mb-3 px-4">
            Profile Photo
          </Text>
          <View className="rounded-xl bg-gray-50 overflow-hidden shadow-sm border border-gray-200 py-4 px-4 flex-row items-center">
            <View className="w-12 h-12">
              <ProfilePicture profileId={selectedProfileId} size={48} />
            </View>
            <View className="flex-1 ml-5">
              <Text className="text-lg font-rubik-medium text-gray-900">Change Photo</Text>
              <Text className="text-base font-rubik text-gray-500">
                Tap to update your profile picture
              </Text>
            </View>
            <TouchableOpacity 
              onPress={() => setShowProfilePicker(true)}
            >
              <Edit2 size={20} color="#3b82f6" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Information Section */}
        <View className="mb-8">
          <Text className="text-base font-rubik-medium text-gray-500 uppercase tracking-wide mb-3 px-4">
            Profile Information
          </Text>
          <View className="rounded-xl bg-gray-50 overflow-hidden shadow-sm border border-gray-200">
            {/* Username Field */}
            <View className="py-4 px-4 border-b border-gray-100">
              <Text className="text-lg font-rubik-medium text-gray-900 mb-2">Username</Text>
              <TextInput
                className="text-lg font-rubik text-gray-700 bg-white rounded-xl border border-gray-200"
                style={{ height: 52, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10 }}
                placeholder="Enter your username"
                value={username}
                onChangeText={setUsername}
                maxLength={30}
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor="#9ca3af"
              />
              <Text className="text-base font-rubik text-gray-500 mt-2.5">
                This is how others will see you on Petly
              </Text>
            </View>

            {/* Name Field (Read Only) */}
            <View className="py-4 px-4 border-b border-gray-100">
              <Text className="text-lg font-rubik-medium text-gray-900 mb-2">Full Name</Text>
              <View className="bg-gray-100 rounded-lg px-3 py-3">
                <Text className="text-lg font-rubik text-gray-600">
                  {userProfile?.displayName || "No name provided"}
                </Text>
              </View>
              <Text className="text-base font-rubik text-gray-500 mt-2">
                Name is managed by your Google account
              </Text>
            </View>

            {/* Email Field (Read Only) */}
            <View className="py-4 px-4">
              <Text className="text-lg font-rubik-medium text-gray-900 mb-2">Email</Text>
              <View className="bg-gray-100 rounded-lg px-3 py-3">
                <Text className="text-lg font-rubik text-gray-600">
                  {userProfile?.email || "No email provided"}
                </Text>
              </View>
              <Text className="text-base font-rubik text-gray-500 mt-2">
                Email cannot be changed here
              </Text>
            </View>
          </View>
        </View>

        {/* Bottom spacing */}
        <View className="h-8" />
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
            <Text className="text-2xl font-rubik-bold text-gray-900 mb-4 text-center">
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
                  <Text className="text-base font-rubik text-gray-700 mt-2">
                    {option.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={() => setShowProfilePicker(false)}
              className="bg-blue-500 rounded-xl py-3 px-6"
            >
              <Text className="text-lg font-rubik-medium text-white text-center">
                Done
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

export default EditProfile;
