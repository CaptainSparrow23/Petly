import { MenuButton } from '@/components/other/MenuButton'
import React, { useState, useEffect } from 'react'
import { FlatList, Image, Pressable, ScrollView, Text, View, ActivityIndicator, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Crown, Flame, Plus, Trophy, Users } from 'lucide-react-native'
import { useGlobalContext } from '@/lib/global-provider'
import { router } from 'expo-router'
import Constants from 'expo-constants'

const API_BASE_URL = Constants.expoConfig?.extra?.backendUrl as string;

interface Friend {
  id: string;
  name: string;
  username: string | null;
  email: string;
  avatar: string;
  focusStreak: number;
  weeklyMinutes: number;
  todayFocus: number;
  isOnline: boolean;
  petType: string;
}

const FriendCard = ({ 
  friend, 
  onRemoveFriend 
}: { 
  friend: Friend;
  onRemoveFriend?: (friendId: string) => void;
}) => {
  const handleLongPress = () => {
    if (onRemoveFriend) {
      Alert.alert(
        'Remove Friend',
        `Are you sure you want to remove ${friend.name} from your friends?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Remove', 
            style: 'destructive',
            onPress: () => onRemoveFriend(friend.id)
          }
        ]
      );
    }
  };

  return (
    <Pressable 
      className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100"
      onLongPress={handleLongPress}
      delayLongPress={500}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <View className="relative">
            <Image 
              source={{ uri: friend.avatar }} 
              className="w-12 h-12 rounded-full"
            />
            {friend.isOnline && (
              <View className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
            )}
          </View>
          
          <View className="ml-3 flex-1">
            <Text className="font-rubik-bold text-gray-900">{friend.name}</Text>
            <View className="flex-row items-center mt-1">
              <Flame size={14} color="#f97316" />
              <Text className="text-sm text-gray-600 ml-1">{friend.focusStreak} day streak</Text>
              <Text className="text-gray-400 mx-2">•</Text>
              <Text className="text-sm text-gray-600">{friend.petType}</Text>
            </View>
          </View>
        </View>

        <View className="items-end">
          <Text className="font-rubik-bold text-blue-600">{friend.todayFocus}m</Text>
          <Text className="text-xs text-gray-500">today</Text>
        </View>
      </View>
    </Pressable>
  );
};

const LeaderboardItem = ({ 
  friend, 
  index, 
  onRemoveFriend 
}: { 
  friend: Friend; 
  index: number;
  onRemoveFriend?: (friendId: string) => void;
}) => {
  const handleLongPress = () => {
    if (onRemoveFriend) {
      Alert.alert(
        'Remove Friend',
        `Are you sure you want to remove ${friend.name} from your friends?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Remove', 
            style: 'destructive',
            onPress: () => onRemoveFriend(friend.id)
          }
        ]
      );
    }
  };

  return (
    <Pressable 
      className="flex-row items-center p-4 bg-white rounded-xl mb-2 shadow-sm border border-gray-100"
      onLongPress={handleLongPress}
      delayLongPress={500}
    >
      <View className="w-8 items-center">
        {index === 0 ? (
          <Crown size={20} color="#fbbf24" />
        ) : index === 1 ? (
          <Trophy size={18} color="#94a3b8" />
        ) : index === 2 ? (
          <Trophy size={18} color="#a78bfa" />
        ) : (
          <Text className="font-rubik-bold text-gray-500">{index + 1}</Text>
        )}
      </View>

      <Image source={{ uri: friend.avatar }} className="w-10 h-10 rounded-full ml-3" />
      
      <View className="flex-1 ml-3">
        <Text className="font-rubik-medium text-gray-900">{friend.name}</Text>
        <View className="flex-row items-center mt-1">
          <Flame size={12} color="#f97316" />
          <Text className="text-xs text-gray-600 ml-1">{friend.focusStreak} days</Text>
        </View>
      </View>

      <View className="items-end">
        <Text className="font-rubik-bold text-blue-600">{friend.weeklyMinutes}m</Text>
        <Text className="text-xs text-gray-500">this week</Text>
      </View>
    </Pressable>
  );
};

const Friends = () => {
  const { user } = useGlobalContext();
  const [activeTab, setActiveTab] = useState<'friends' | 'leaderboard'>('friends');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchFriends = async () => {
    if (!user?.$id) {
      console.log('❌ No user ID available for fetching friends');
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }
    
    console.log('🔄 Fetching friends for user:', user.$id);
    console.log('🌐 API URL:', `${API_BASE_URL}/api/friends/list/${user.$id}`);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/friends/list/${user.$id}`);
      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Friends data received:', result);
        setFriends(result.data?.friends || []);
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to fetch friends:', response.status, response.statusText, errorText);
      }
    } catch (error) {
      console.error('💥 Error fetching friends:', error);
      Alert.alert('Error', 'Failed to load friends. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchFriends();
  };

  const handleAddFriend = () => {
    router.push('/friends/search' as any);
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (!user?.$id) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/friends/remove`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.$id,
          friendId: friendId,
        }),
      });

      if (response.ok) {
        // Remove friend from local state
        setFriends(prev => prev.filter(friend => friend.id !== friendId));
        Alert.alert('Success', 'Friend removed successfully');
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.error || 'Failed to remove friend');
      }
    } catch (error) {
      console.error('Error removing friend:', error);
      Alert.alert('Error', 'Failed to remove friend. Please try again.');
    }
  };

  useEffect(() => {
    console.log('👤 User context in friends:', user);
    console.log('🆔 User ID:', user?.$id);
    fetchFriends();
  }, [user?.$id]);

  if (isLoading) {
    return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="w-full flex-row items-center justify-between px-6 pt-4 bg-white">
        <MenuButton />
        <Text className="text-xl font-rubik-bold text-gray-900">Friends</Text>
        <View className="w-10 h-10" />
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="mt-4 text-gray-600 font-rubik">Loading friends...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="w-full flex-row items-center justify-between px-6 pt-4 bg-white">
        <MenuButton />
        <Text className="text-xl font-rubik-bold text-gray-900">Friends</Text>
        <Pressable 
          className="w-10 h-10 items-center justify-center"
          onPress={handleAddFriend}
        >
          <Plus size={24} color="#3b82f6" />
        </Pressable>
      </View>

      {/* Tab Navigation */}
      <View className="bg-white px-6 pb-4">
        <View className="flex-row bg-gray-100 rounded-xl p-1 mt-4">
          <Pressable
            className={`flex-1 flex-row items-center justify-center py-2 rounded-lg ${
              activeTab === 'friends' ? 'bg-white shadow-sm' : ''
            }`}
            onPress={() => setActiveTab('friends')}
          >
            <Users size={18} color={activeTab === 'friends' ? '#3b82f6' : '#6b7280'} />
            <Text className={`ml-2 font-rubik-medium ${
              activeTab === 'friends' ? 'text-blue-600' : 'text-gray-600'
            }`}>
              Friends
            </Text>
          </Pressable>

          <Pressable
            className={`flex-1 flex-row items-center justify-center py-2 rounded-lg ${
              activeTab === 'leaderboard' ? 'bg-white shadow-sm' : ''
            }`}
            onPress={() => setActiveTab('leaderboard')}
          >
            <Trophy size={18} color={activeTab === 'leaderboard' ? '#3b82f6' : '#6b7280'} />
            <Text className={`ml-2 font-rubik-medium ${
              activeTab === 'leaderboard' ? 'text-blue-600' : 'text-gray-600'
            }`}>
              Leaderboard
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Content */}
      {activeTab === 'friends' ? (
        <ScrollView className="flex-1 px-6">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="font-rubik-bold text-gray-900 text-lg">Your Friends</Text>
            <Text className="text-blue-600 font-rubik-medium">{friends.length} friends</Text>
          </View>
          
          {friends.length > 0 && (
            <Text className="text-sm text-gray-500 font-rubik mb-4">
              Long press on any friend to remove them
            </Text>
          )}

          {friends.length === 0 ? (
            <View className="bg-white rounded-2xl p-6 items-center">
              <Users size={48} color="#9ca3af" />
              <Text className="font-rubik-bold text-gray-900 text-lg mt-4">No Friends Yet</Text>
              <Text className="text-gray-600 font-rubik text-center mt-2">
                Start building your focus community by adding friends!
              </Text>
              <Pressable 
                className="bg-blue-500 rounded-xl px-6 py-3 mt-4"
                onPress={handleAddFriend}
              >
                <Text className="text-white font-rubik-medium">Find Friends</Text>
              </Pressable>
            </View>
          ) : (
            friends.map((friend: Friend) => (
              <FriendCard 
                key={friend.id} 
                friend={friend} 
                onRemoveFriend={handleRemoveFriend}
              />
            ))
          )}

          <View className="h-6" />
        </ScrollView>
      ) : (
        <ScrollView className="flex-1 px-6">
          <View className="bg-yellow-400 rounded-2xl p-4 mb-6">
            <View className="flex-row items-center">
              <Crown size={24} color="white" />
              <Text className="text-white font-rubik-bold text-lg ml-2">This Week's Leaders</Text>
            </View>
            <Text className="text-yellow-100 mt-1">Compete with friends and climb the ranks!</Text>
          </View>

          <Text className="font-rubik-bold text-gray-900 text-lg mb-4">Weekly Rankings</Text>

          {friends.length === 0 ? (
            <View className="bg-white rounded-2xl p-6 items-center">
              <Trophy size={48} color="#9ca3af" />
              <Text className="font-rubik-bold text-gray-900 text-lg mt-4">No Rankings Yet</Text>
              <Text className="text-gray-600 font-rubik text-center mt-2">
                Add friends to see who's leading this week!
              </Text>
            </View>
          ) : (
            [...friends]
              .sort((a: Friend, b: Friend) => b.weeklyMinutes - a.weeklyMinutes)
              .map((friend: Friend, index: number) => (
                <LeaderboardItem 
                  key={friend.id} 
                  friend={friend} 
                  index={index} 
                  onRemoveFriend={handleRemoveFriend}
                />
              ))
          )}

          <View className="h-6" />
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

export default Friends
