import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  ActivityIndicator, 
  Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Search, UserPlus, Users } from 'lucide-react-native';
import { router } from 'expo-router';
import { useGlobalContext } from '@/lib/global-provider';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000';

interface SearchUser {
  id: string;
  name: string;
  username: string | null;
  email: string;
  avatar: string;
  isFriend: boolean;
}

const UserCard = ({ 
  user, 
  onAddFriend, 
  isAdding 
}: { 
  user: SearchUser; 
  onAddFriend: (userId: string) => void;
  isAdding: boolean;
}) => (
  <View className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100">
    <View className="flex-row items-center justify-between">
      <View className="flex-row items-center flex-1">
        <Image 
          source={{ uri: user.avatar }} 
          className="w-12 h-12 rounded-full"
        />
        
        <View className="ml-3 flex-1">
          <Text className="font-rubik-bold text-gray-900">{user.name}</Text>
          <Text className="text-sm text-gray-600 mt-1">
            {user.username ? `@${user.username}` : user.email}
          </Text>
        </View>
      </View>

      <TouchableOpacity 
        className={`px-4 py-2 rounded-xl ${user.isFriend ? 'bg-gray-100' : 'bg-blue-500'}`}
        onPress={() => onAddFriend(user.id)}
        disabled={user.isFriend || isAdding}
      >
        {isAdding ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <>
            {user.isFriend ? (
              <Text className="font-rubik-medium text-gray-600">Friends</Text>
            ) : (
              <View className="flex-row items-center">
                <UserPlus size={16} color="white" />
                <Text className="font-rubik-medium text-white ml-1">Add</Text>
              </View>
            )}
          </>
        )}
      </TouchableOpacity>
    </View>
  </View>
);

const SearchFriends = () => {
  const { user } = useGlobalContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addingUserId, setAddingUserId] = useState<string | null>(null);
  const [searchPerformed, setSearchPerformed] = useState(false);

  const searchUsers = async (query: string) => {
    if (!user?.$id || query.trim().length < 2) {
      setSearchResults([]);
      setSearchPerformed(false);
      return;
    }

    setIsSearching(true);
    setSearchPerformed(true);
    
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/friends/search/${user.$id}?query=${encodeURIComponent(query.trim())}`
      );
      
      if (response.ok) {
        const result = await response.json();
        setSearchResults(result.data?.users || []);
      } else {
        console.error('Search failed:', response.statusText);
        Alert.alert('Error', 'Failed to search users. Please try again.');
      }
    } catch (error) {
      console.error('Error searching users:', error);
      Alert.alert('Error', 'Failed to search users. Please check your connection.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddFriend = async (friendId: string) => {
    if (!user?.$id) return;

    setAddingUserId(friendId);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/friends/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.$id,
          friendId: friendId,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update the search results to mark this user as a friend
        setSearchResults(prev => 
          prev.map(searchUser => 
            searchUser.id === friendId 
              ? { ...searchUser, isFriend: true }
              : searchUser
          )
        );

        Alert.alert(
          'Success', 
          `You're now friends with ${result.data?.friend?.name || 'this user'}!`
        );
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.error || 'Failed to add friend');
      }
    } catch (error) {
      console.error('Error adding friend:', error);
      Alert.alert('Error', 'Failed to add friend. Please try again.');
    } finally {
      setAddingUserId(null);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, user?.$id]);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-4 bg-white">
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text className="text-2xl font-rubik-medium text-gray-900">Find Friends</Text>
        <View className="w-6" />
      </View>

      {/* Search Input */}
      <View className="px-4 py-4 bg-white border-b border-gray-100">
        <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
          <Search size={20} color="#6b7280" />
          <TextInput
            className="flex-1 ml-3 font-rubik text-gray-900"
            placeholder="Search by name or username..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            placeholderTextColor="#9ca3af"
          />
        </View>
        <Text className="text-sm font-rubik text-gray-500 mt-2">
          Enter at least 2 characters to search for users
        </Text>
      </View>

      {/* Search Results */}
      <ScrollView className="flex-1 px-4 py-4">
        {isSearching ? (
          <View className="flex-1 items-center justify-center py-12">
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text className="mt-4 text-gray-600 font-rubik">Searching users...</Text>
          </View>
        ) : searchPerformed && searchResults.length === 0 ? (
          <View className="flex-1 items-center justify-center py-12">
            <Users size={48} color="#9ca3af" />
            <Text className="font-rubik-bold text-gray-900 text-lg mt-4">No Users Found</Text>
            <Text className="text-gray-600 font-rubik text-center mt-2">
              Try searching with a different name or username
            </Text>
          </View>
        ) : searchQuery.trim().length < 2 ? (
          <View className="flex-1 items-center justify-center py-12">
            <Search size={48} color="#9ca3af" />
            <Text className="font-rubik-bold text-gray-900 text-lg mt-4">Search for Friends</Text>
            <Text className="text-gray-600 font-rubik text-center mt-2">
              Enter a name or username to find other Petly users
            </Text>
          </View>
        ) : (
          <>
            <Text className="font-rubik-bold text-gray-900 text-lg mb-4">
              Search Results ({searchResults.length})
            </Text>
            
            {searchResults.map((searchUser) => (
              <UserCard
                key={searchUser.id}
                user={searchUser}
                onAddFriend={handleAddFriend}
                isAdding={addingUserId === searchUser.id}
              />
            ))}
          </>
        )}

        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
};

export default SearchFriends;