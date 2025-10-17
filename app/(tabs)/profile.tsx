import React, { useState, useEffect } from "react";
import { ScrollView, Text, TouchableOpacity, View, Image, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGlobalContext } from "@/lib/global-provider";
import { MenuButton } from "@/components/other/MenuButton";
import { Edit3, Mail } from "lucide-react-native";
import { router } from "expo-router";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000';

interface UserProfile {
  username: string | null;
  email: string;
  joinedDate: string;
  friendsCount: number;
}

interface UserStats {
  postsCount: number;
  friendsCount: number;
  petsCount: number;
  totalFocusSessions: number;
}

const Account = () => {
  const { user } = useGlobalContext();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserProfile = async () => {
    if (!user?.$id) return;
    
    try {
      // Fetch profile data
      const profileResponse = await fetch(`${API_BASE_URL}/api/user/profile/${user.$id}`);
      const statsResponse = await fetch(`${API_BASE_URL}/api/user/stats/${user.$id}`);
      
      let profileData = null;
      let statsData = {
        postsCount: 0,
        friendsCount: 0,
        petsCount: 0,
        totalFocusSessions: 0
      };

      if (profileResponse.ok) {
        const profileResult = await profileResponse.json();
        profileData = profileResult.data;
      }

      if (statsResponse.ok) {
        const statsResult = await statsResponse.json();
        statsData = statsResult.data;
      }
      
      // Set profile data
      setUserProfile({
        username: profileData?.username || null,
        email: user.email || "No email provided",
        joinedDate: new Date().toISOString(), // TODO: Get actual join date from user profile
        friendsCount: statsData.friendsCount
      });

      // Set stats data
      setUserStats(statsData);
      
    } catch (error) {
      console.error("Error fetching user profile:", error);
      // Fallback to default data on error
      setUserProfile({
        username: null,
        email: user.email || "No email provided",
        joinedDate: new Date().toISOString(), // TODO: Get actual join date from user profile
        friendsCount: 0
      });
      
      setUserStats({
        postsCount: 0,
        friendsCount: 0,
        petsCount: 0,
        totalFocusSessions: 0
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, [user?.$id]);

  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.toLocaleDateString('en-US', { month: 'long' });
    const year = date.getFullYear();
    return `${month} ${year}`;
  };

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
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4">
        <MenuButton />
        <TouchableOpacity onPress={() => router.push('/(tabs)/settings')}>
          <Edit3 size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View className="px-6 py-4">
          {/* Profile Picture */}
          <View className="items-center mb-3">
            <Image 
              source={{ uri: user?.avatar }} 
              className="w-44 h-44 rounded-full border-2 border-gray-200" 
            />
          </View>

          {/* Name and Username */}
          <View className="items-center mb-6">
            <Text className="text-3xl font-rubik-bold text-gray-900 mb-1">
              {user?.name || "User"}
            </Text>
            <Text className="text-lg font-rubik text-gray-600 mb-3">
              @{userProfile?.username || "username-not-set"}
            </Text>
            
            {/* Stats Row */}
            <View className="flex-row items-center justify-center mb-6">
              <View className="items-center w-20">
                <Text className="text-xl font-rubik-bold text-gray-900">
                  {userStats?.postsCount || 0}
                </Text>
                <Text className="text-sm font-rubik text-gray-600">Sessions</Text>
              </View>
              <View className="items-center w-20">
                <Text className="text-xl font-rubik-bold text-gray-900">
                  {userStats?.friendsCount || 0}
                </Text>
                <Text className="text-sm font-rubik text-gray-600">Friends</Text>
              </View>
              <View className="items-center w-20">
                <Text className="text-xl font-rubik-bold text-gray-900">
                  {userStats?.petsCount || 0}
                </Text>
                <Text className="text-sm font-rubik text-gray-600">Pets</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Profile Info Cards */}
        <View className="px-6 space-y-4 ">
          {/* Email Card */}
          <View className="bg-gray-50 rounded-xl p-4 mb-2">
            <View className="flex-row items-center mb-2">
              <Mail size={20} color="#6b7280" />
              <Text className="ml-3 font-rubik-medium text-gray-700">Email</Text>
            </View>
            <Text className="text-gray-600 font-rubik">
              {userProfile?.email}
            </Text>
          </View>

          {/* Join Date Card */}
          <View className="bg-gray-50 rounded-xl p-4">
            <Text className="font-rubik-medium text-gray-700 mb-2">Member Since</Text>
            <Text className="text-gray-600 font-rubik">
              Joined {formatJoinDate(userProfile?.joinedDate || new Date().toISOString())}
            </Text>
          </View>
        </View>

        {/* Bottom Spacing */}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
};

export default Account;
