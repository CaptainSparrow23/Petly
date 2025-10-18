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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useGlobalContext } from "@/lib/global-provider";
import Constants from "expo-constants";
import { Check } from "lucide-react-native";

const API_BASE_URL = Constants.expoConfig?.extra?.backendUrl as string;

// 6 default profile picture colors
const DEFAULT_AVATARS = [
  { id: 1, color: "#FF6B6B", name: "Coral" },
  { id: 2, color: "#4ECDC4", name: "Turquoise" },
  { id: 3, color: "#45B7D1", name: "Sky" },
  { id: 4, color: "#FFA07A", name: "Salmon" },
  { id: 5, color: "#98D8C8", name: "Mint" },
  { id: 6, color: "#A78BFA", name: "Purple" },
];

export default function SetProfile() {
  const router = useRouter();
  const { user, refetch } = useGlobalContext();
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

    if (!user?.$id) {
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
            userId: user.$id,
            username: username.trim(),
            profilePicture: selectedAvatar?.color || "#FF6B6B"
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to setup profile");
      }

      console.log("✅ Profile setup successfully:", data);

      // Refetch user data to update global state
      await refetch();

      // Redirect to main app
      router.replace("/(tabs)");
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
            <Text className="text-4xl font-rubik-bold text-gray-900 text-center">
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
              <View
                className="w-32 h-32 rounded-full items-center justify-center shadow-lg"
                style={{ backgroundColor: selectedAvatar?.color }}
              >
                <Text className="text-5xl font-rubik-bold text-white">
                  {username.slice(0, 2).toUpperCase() || "?"}
                </Text>
              </View>
            </View>

            {/* Username Section */}
            <View className="mb-8">
              <Text className="text-lg font-rubik-semibold text-gray-900 mb-3">
                Username
              </Text>
              <View className="bg-gray-50 rounded-2xl border-2 border-gray-200 px-5 py-4">
                <TextInput
                  className="text-lg font-rubik text-gray-900"
                  placeholder="Choose a username"
                  placeholderTextColor="#9ca3af"
                  value={username}
                  onChangeText={setUsername}
                  maxLength={30}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* Avatar Selection Section */}
            <View className="mb-6">
              <Text className="text-lg font-rubik-semibold text-gray-900 mb-4">
                Choose Avatar Color
              </Text>

              {/* Avatar Grid - 3 columns */}
              <View className="flex-row flex-wrap justify-between">
                {DEFAULT_AVATARS.map((avatar) => (
                  <TouchableOpacity
                    key={avatar.id}
                    onPress={() => setSelectedAvatarId(avatar.id)}
                    disabled={isLoading}
                    className="mb-6 items-center"
                    style={{ width: "30%" }}
                  >
                    <View
                      className={`w-20 h-20 rounded-full items-center justify-center relative ${
                        selectedAvatarId === avatar.id
                          ? "border-4 border-blue-500"
                          : "border-2 border-gray-200"
                      }`}
                      style={{
                        backgroundColor: avatar.color,
                      }}
                    >
                      {selectedAvatarId === avatar.id && (
                        <View className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-1.5 shadow-md">
                          <Check size={18} color="white" strokeWidth={3} />
                        </View>
                      )}
                    </View>
                    <Text className={`mt-2 text-xs font-rubik-medium ${
                      selectedAvatarId === avatar.id ? "text-blue-500" : "text-gray-600"
                    }`}>
                      {avatar.name}
                    </Text>
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
              className={`py-4 rounded-2xl items-center justify-center shadow-lg ${
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
                <Text className="text-lg font-rubik-bold text-white">
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
