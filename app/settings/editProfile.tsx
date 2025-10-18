import React, { useState, useEffect } from "react";
import { ScrollView, Text, TouchableOpacity, View, TextInput, Alert, ActivityIndicator, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGlobalContext } from "@/lib/global-provider";
import { ChevronLeft } from "lucide-react-native";
import { router } from "expo-router";
import Constants from 'expo-constants';

const API_BASE_URL = Constants.expoConfig?.extra?.backendUrl as string;

interface UserProfile {
  username: string | null;
  email: string;
}

const EditProfile = () => {
  const { user } = useGlobalContext();
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [originalUsername, setOriginalUsername] = useState<string | null>(null);

  const fetchUserProfile = async () => {
    if (!user?.$id) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/profile/${user.$id}`);
      if (response.ok) {
        const result = await response.json();
        const currentUsername = result.data?.username || "";
        setUsername(currentUsername);
        setOriginalUsername(currentUsername);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, [user?.$id]);

  const handleSave = async () => {
    if (!user?.$id) {
      Alert.alert("Error", "User not found. Please try again.");
      return;
    }

    // Check if username has changed
    if (username.trim() === originalUsername) {
      router.back();
      return;
    }

    if (username.trim().length < 2) {
      Alert.alert("Error", "Username must be at least 2 characters long");
      return;
    }

    setIsSaving(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/username/${user.$id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: username.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update username');
      }

      const result = await response.json();
      console.log("✅ Username updated successfully:", result.data.username);
      
      Alert.alert("Success", "Profile updated successfully!", [
        { text: "OK", onPress: () => router.back() }
      ]);
      
    } catch (error) {
      console.error("❌ Error updating username:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to update username";
      Alert.alert("Error", errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = username.trim() !== originalUsername;

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
          <Text className="mt-4 text-gray-600 font-rubik">Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
          <View className="rounded-xl bg-gray-50 overflow-hidden shadow-sm border border-gray-200">
            <View className="flex-row items-center py-4 px-4">
              <Image 
                source={{ uri: user?.avatar }} 
                className="w-12 h-12 rounded-full mr-3" 
              />
              <View className="flex-1">
                <Text className="text-lg font-rubik-medium text-gray-900">Change Photo</Text>
                <Text className="text-base font-rubik text-gray-500 mt-1">
                  Tap to update your profile picture
                </Text>
              </View>
              <TouchableOpacity 
                onPress={() => Alert.alert("Coming Soon", "Profile picture update will be available soon")}
              >
                <Text className="text-lg font-rubik-medium text-blue-500">Change</Text>
              </TouchableOpacity>
            </View>
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
                className="text-lg font-rubik text-gray-700 bg-white rounded-lg px-3 py-3 border border-gray-200"
                placeholder="Enter your username"
                value={username}
                onChangeText={setUsername}
                maxLength={30}
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor="#9ca3af"
              />
              <Text className="text-base font-rubik text-gray-500 mt-2">
                This is how others will see you on Petly
              </Text>
            </View>

            {/* Name Field (Read Only) */}
            <View className="py-4 px-4 border-b border-gray-100">
              <Text className="text-lg font-rubik-medium text-gray-900 mb-2">Full Name</Text>
              <View className="bg-gray-100 rounded-lg px-3 py-3">
                <Text className="text-lg font-rubik text-gray-600">
                  {user?.name || "No name provided"}
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
                  {user?.email || "No email provided"}
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
    </SafeAreaView>
  );
};

export default EditProfile;
