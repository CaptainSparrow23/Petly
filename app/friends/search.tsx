import React, { useState, useEffect } from 'react';
import { 
 View, 
 Text, 
 TextInput, 
 TouchableOpacity, 
 ScrollView, 
 ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Search, UserPlus, Users } from 'lucide-react-native';
import { router } from 'expo-router';
import { useGlobalContext } from '@/lib/GlobalProvider';
import { ProfilePicture } from '@/components/other/ProfilePicture';
import Constants from 'expo-constants';

const API_BASE_URL = Constants.expoConfig?.extra?.backendUrl as string;

interface SearchUser {
 id: string;
 displayName: string;
 username: string | null;
 email: string;
 profileId: number | null;
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
    <ProfilePicture 
     profileId={user.profileId} 
     size={48}
    />
    
    <View className="ml-3 flex-1">
     <Text className="font-bold text-gray-900">{user.displayName}</Text>
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
       <Text className="font-medium text-gray-600">Friends</Text>
      ) : (
       <View className="flex-row items-center">
        <UserPlus size={16} color="white" />
        <Text className="font-medium text-white ml-1">Add</Text>
       </View>
      )}
     </>
    )}
   </TouchableOpacity>
  </View>
 </View>
);

const SearchFriends = () => {
 const { userProfile, showBanner } = useGlobalContext();
 const [searchQuery, setSearchQuery] = useState('');
 const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
 const [isSearching, setIsSearching] = useState(false);
 const [addingUserId, setAddingUserId] = useState<string | null>(null);
 const [searchPerformed, setSearchPerformed] = useState(false);

 const searchUsers = async (query: string) => {
  if (!userProfile?.userId || query.trim().length < 2) {
   setSearchResults([]);
   setSearchPerformed(false);
   return;
  }

  setIsSearching(true);
  setSearchPerformed(true);
  
  try {
   const response = await fetch(
    `${API_BASE_URL}/api/search_friends/${userProfile.userId}?query=${encodeURIComponent(query.trim())}`
   );
   
   if (response.ok) {
    const result = await response.json();
    setSearchResults(result.data?.users || []);
   } else {
    console.error('Search failed:', response.statusText);
    showBanner('Failed to search users. Please try again.', 'error');
   }
  } catch (error) {
   console.error('Error searching users:', error);
   showBanner('Failed to search users. Please check your connection.', 'error');
  } finally {
   setIsSearching(false);
  }
 };

 const handleAddFriend = async (friendId: string) => {
  if (!userProfile?.userId) return;

  setAddingUserId(friendId);
  
  try {
   const response = await fetch(`${API_BASE_URL}/api/friends/add`, {
    method: 'POST',
    headers: {
     'Content-Type': 'application/json',
    },
    body: JSON.stringify({
     userId: userProfile.userId,
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

    const friendName = result.data?.friend?.displayName || 'this user';
    showBanner(`You're now friends with ${friendName}!`, 'success');
    
    // Navigate back to trigger refresh on friends page
    setTimeout(() => {
     router.back();
    }, 1500); // Give time to see the success banner
   } else {
    const errorData = await response.json();
    showBanner(errorData.error || 'Failed to add friend', 'error');
   }
  } catch (error) {
   console.error('Error adding friend:', error);
   showBanner('Failed to add friend. Please try again.', 'error');
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
 }, [searchQuery, userProfile?.userId]);

 return (
  <SafeAreaView className="flex-1 bg-white">
   {/* Header */}
   <View className="flex-row items-center justify-between px-4 py-2 bg-white">
    <TouchableOpacity onPress={() => router.back()}>
     <ChevronLeft size={24} color="#000" />
    </TouchableOpacity>
    <Text className="text-[17px] font-semibold text-black">Find Friends</Text>
    <View className="w-6" />
   </View>

   {/* Search Input */}
   <View className="px-4 py-4 bg-white border-b border-gray-100">
    <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
     <Search size={20} color="#6b7280" />
     <TextInput
      className="flex-1 ml-3 text-gray-900"
      placeholder="Search by username..."
      value={searchQuery}
      onChangeText={setSearchQuery}
      autoCapitalize="none"
      autoCorrect={false}
      placeholderTextColor="#9ca3af"
     />
    </View>
   </View>

   {/* Search Results */}
   <ScrollView className="flex-1 px-4 py-4">
    {isSearching ? (
     <View className="flex-1 items-center justify-center py-12">
      <ActivityIndicator size="large" color="#3b82f6" />
      <Text className="mt-4 text-gray-600 ">Searching users...</Text>
     </View>
    ) : searchPerformed && searchResults.length === 0 ? (
     <View className="flex-1 items-center justify-center py-12">
      <Users size={48} color="#9ca3af" />
      <Text className="font-bold text-gray-900 text-lg mt-4">No Users Found</Text>
      <Text className="text-gray-600 text-center mt-2">
       Try searching with a different name or username
      </Text>
     </View>
    ) : searchQuery.trim().length < 2 ? (
     <View className="flex-1 items-center justify-center py-12">
      <Search size={48} color="#9ca3af" />
      <Text className="font-bold text-gray-900 text-lg mt-4">Search for Friends</Text>
      <Text className="text-gray-600 text-center mt-2">
       Enter a username to find other Petly users
      </Text>
     </View>
    ) : (
     <>
      
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