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
import { ChevronLeft, Edit2, User, Award } from "lucide-react-native";
import { router } from "expo-router";
import Constants from "expo-constants";
import { ProfilePicture } from "@/components/other/ProfilePicture";
import { CoralPalette } from "@/constants/colors";

const API_BASE_URL = Constants.expoConfig?.extra?.backendUrl as string;
const FONT = { fontFamily: "Nunito" };

const CARD_SHADOW = {
  shadowColor: "#191d31",
  shadowOpacity: 0.25,
  shadowOffset: { width: 3, height: 5 },
  shadowRadius: 2,
  elevation: 10,
};

// Profile picture options
const PROFILE_OPTIONS = [
  { id: 1, name: "Profile 1" },
  { id: 2, name: "Profile 2" },
  { id: 3, name: "Profile 3" },
  { id: 4, name: "Profile 4" },
];

const CardSeparator = () => (
  <View
    className="h-px mx-5"
    style={{ backgroundColor: CoralPalette.lightGrey }}
  />
);

type SectionCardProps = {
  title: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  children: React.ReactNode;
};

const SectionCard = ({ title, icon: Icon, children }: SectionCardProps) => {
  const rows = React.Children.toArray(children);
  return (
    <View
      className="mb-6"
      style={[
        {
          borderRadius: 5,
          backgroundColor: CoralPalette.white,
          borderColor: CoralPalette.lightGrey,
          borderWidth: 1,
        },
        CARD_SHADOW,
      ]}
    >
      <View className="flex-row items-center px-5 pt-5 pb-3">
        <View
          className="mr-2 rounded-full p-2"
          style={{ backgroundColor: CoralPalette.greyVeryLight }}
        >
          <Icon size={20} color={CoralPalette.primary} />
        </View>
        <Text className="font-bold" style={[{ color: CoralPalette.dark }, FONT]}>
          {title}
        </Text>
      </View>
      <View className="pb-2">
        {rows.map((child, index) => (
          <React.Fragment key={index}>
            {child}
            {index < rows.length - 1 && <CardSeparator />}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
};

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
        className="items-center mx-3"
      >
        <View
          className="rounded-full"
          style={{
            width: 72,
            height: 72,
            borderWidth: 3,
            borderColor: isSelected ? CoralPalette.primary : CoralPalette.lightGrey,
            backgroundColor: CoralPalette.greyVeryLight,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ProfilePicture profileId={item.id} size={64} />
        </View>
      </TouchableOpacity>
    );
  };

  if (!isInitialized) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: CoralPalette.primaryMuted }}>
        <View className="relative flex-row items-center justify-between px-5 py-4">
          <TouchableOpacity onPress={() => router.back()}>
            <ChevronLeft size={28} color={CoralPalette.white} />
          </TouchableOpacity>
          <View className="absolute items-center justify-center left-0 right-0">
            <Text className="text-lg font-bold" style={[{ color: CoralPalette.white }, FONT]}>
              Profile
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <View className="flex-1 items-center justify-center" style={{ backgroundColor: CoralPalette.greyLighter }}>
          <ActivityIndicator size="large" color={CoralPalette.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: CoralPalette.primaryMuted }}>
      <View className="relative flex-row items-center justify-between px-5 py-4" style={{ backgroundColor: CoralPalette.primaryMuted }}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={28} color={CoralPalette.white} />
        </TouchableOpacity>
        <View className="absolute items-center justify-center left-0 right-0">
          <Text className="text-lg font-bold" style={[{ color: CoralPalette.white }, FONT]}>
            Profile
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving || !hasChanges}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={CoralPalette.white} />
          ) : (
            <Text
              className="text-base font-semibold"
              style={[{ color: hasChanges ? CoralPalette.white : "transparent" }, FONT]}
            >
              Save
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        style={{ backgroundColor: CoralPalette.greyLighter }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
      >
        {/* Profile Card */}
        <View
          className="mb-6 px-5 py-5"
          style={[
            {
              borderRadius: 5,
              backgroundColor: CoralPalette.white,
              borderColor: CoralPalette.lightGrey,
              borderWidth: 1,
            },
            CARD_SHADOW,
          ]}
        >
          <View className="flex-row items-center">
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setShowProfilePicker(true)}
            >
              <View className="relative">
                <View className="w-14 h-14 rounded-full bg-gray-100 items-center justify-center">
                  <ProfilePicture profileId={selectedProfileId} size={56} />
                </View>
                <View
                  className="absolute -bottom-1 -right-1 rounded-full p-1"
                  style={{ backgroundColor: CoralPalette.primary }}
                >
                  <Edit2 size={12} color={CoralPalette.white} />
                </View>
              </View>
            </TouchableOpacity>
            <View className="ml-4 flex-1">
              <Text className="text-lg font-bold" style={[{ color: CoralPalette.dark }, FONT]}>
                {userProfile?.displayName || "Petly Explorer"}
              </Text>
              <Text className="text-base" style={[{ color: CoralPalette.mutedDark }, FONT]}>
                @{username || "Not set"}
              </Text>
            </View>
          </View>
        </View>

        {/* Username Section */}
        <SectionCard title="Username" icon={User}>
          <TouchableOpacity
            className="flex-row items-center justify-between px-5 py-4"
            activeOpacity={0.7}
            onPress={() => {
              setUsernameDraft(username);
              setShowUsernameModal(true);
            }}
          >
            <Text className="text-base" style={[{ color: CoralPalette.dark }, FONT]}>
              Change Username
            </Text>
            <View className="flex-row items-center gap-2">
              <Text className="text-base" style={[{ color: CoralPalette.mutedDark }, FONT]}>
                @{username || "Not set"}
              </Text>
              <Edit2 size={16} color={CoralPalette.mutedDark} />
            </View>
          </TouchableOpacity>
        </SectionCard>

        {/* Stats Section */}
        <SectionCard title="Your Stats" icon={Award}>
          <View className="flex-row items-center justify-between px-5 py-4">
            <Text className="text-base" style={[{ color: CoralPalette.dark }, FONT]}>
              Highest Streak
            </Text>
            <Text className="text-base font-bold" style={[{ color: CoralPalette.primary }, FONT]}>
              {userProfile?.highestStreak ?? 0} days
            </Text>
          </View>
          <CardSeparator />
          <View className="flex-row items-center justify-between px-5 py-4">
            <Text className="text-base" style={[{ color: CoralPalette.dark }, FONT]}>
              Total Focus Time
            </Text>
            <Text className="text-base font-bold" style={[{ color: CoralPalette.primary }, FONT]}>
              {((userProfile?.totalFocusSeconds ?? 0) / 3600).toFixed(0)} hours
            </Text>
          </View>
        </SectionCard>
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
            className="mx-6 w-11/12 max-w-md p-6"
            style={[
              {
                borderRadius: 5,
                backgroundColor: CoralPalette.white,
                borderColor: CoralPalette.lightGrey,
                borderWidth: 1,
              },
              CARD_SHADOW,
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text className="text-lg font-bold mb-4 text-center" style={[{ color: CoralPalette.dark }, FONT]}>
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
              className="py-3 px-6 mt-2 items-center"
              style={{
                backgroundColor: CoralPalette.primary,
                borderRadius: 5,
              }}
            >
              <Text className="text-base font-semibold text-white" style={FONT}>
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
          className="flex-1 bg-black/50 justify-center items-center"
          activeOpacity={1}
          onPress={() => setShowUsernameModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            className="mx-6 w-4/5 p-5"
            style={[
              {
                borderRadius: 5,
                backgroundColor: CoralPalette.white,
                borderColor: CoralPalette.lightGrey,
                borderWidth: 1,
              },
              CARD_SHADOW,
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text className="text-lg font-bold mb-4 text-center" style={[{ color: CoralPalette.dark }, FONT]}>
              Edit Username
            </Text>
            <View
              className="py-3 px-4 justify-center"
              style={{
                borderColor: CoralPalette.lightGrey,
                borderWidth: 1,
                backgroundColor: CoralPalette.greyVeryLight,
                borderRadius: 5,
              }}
            >
              <TextInput
                className="text-base"
                style={[{ color: CoralPalette.dark }, FONT]}
                placeholder="Enter a new username"
                value={usernameDraft}
                onChangeText={setUsernameDraft}
                maxLength={30}
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor={CoralPalette.mutedDark}
                textAlign="center"
              />
            </View>
            <View className="flex-row justify-between mt-4 gap-3">
              <TouchableOpacity
                onPress={() => setShowUsernameModal(false)}
                className="flex-1 items-center justify-center py-3"
                style={{
                  borderColor: CoralPalette.lightGrey,
                  borderWidth: 1,
                  borderRadius: 5,
                }}
              >
                <Text className="text-base font-medium" style={[{ color: CoralPalette.mutedDark }, FONT]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setUsername(usernameDraft);
                  setShowUsernameModal(false);
                }}
                className="flex-1 items-center justify-center py-3"
                style={{
                  backgroundColor: CoralPalette.primary,
                  borderRadius: 5,
                }}
              >
                <Text className="text-base font-semibold text-white" style={FONT}>Save</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

export default EditProfile;
