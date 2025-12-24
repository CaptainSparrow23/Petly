import React, { useState, useEffect, useRef } from 'react';
import { 
 View, 
 Text, 
 TextInput, 
 TouchableOpacity, 
 ScrollView, 
 ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Search, UserRoundPlus, UsersRound, UserRoundCheck, Mail } from 'lucide-react-native';
import { router } from 'expo-router';
import { useGlobalContext } from '@/providers/GlobalProvider';
import { ProfilePicture } from '@/components/other/ProfilePicture';
import Constants from 'expo-constants';
import { CoralPalette } from '@/constants/colors';

const API_BASE_URL = Constants.expoConfig?.extra?.backendUrl as string;

interface SearchUser {
 id: string;
 displayName: string;
 username: string | null;
 email: string;
 profileId: number | null;
 isFriend: boolean;
 requestedByYou?: boolean;
 requestedYou?: boolean;
}

const UserCard = ({ 
 user, 
 onAddFriend, 
 onPendingRequestPress,
 isAdding 
}: { 
 user: SearchUser; 
 onAddFriend: (userId: string) => void;
 onPendingRequestPress: () => void;
 isAdding: boolean;
}) => {
 const showMailIcon = !!user.requestedYou;
 const showCheckIcon = !!user.requestedByYou || user.isFriend;
 const disabled = isAdding || (showCheckIcon && !showMailIcon);

 const handlePress = () => {
  if (isAdding) return;
  if (showMailIcon) {
   onPendingRequestPress();
   return;
  }
  if (showCheckIcon) return;
  onAddFriend(user.id);
 };

 const renderIcon = () => {
  if (isAdding) {
   return <ActivityIndicator size="small" color={CoralPalette.dark} />;
  }
  if (showMailIcon) {
   return <Mail size={26} color={CoralPalette.primary} />;
  }
  if (showCheckIcon) {
   return <UserRoundCheck size={26} color={CoralPalette.primaryMuted} />;
  }
  return (
   <View className="flex-row items-center">
    <UserRoundPlus size={26} color={CoralPalette.primary} />
   </View>
  );
 };

 return (
  <View
   className="relative rounded-2xl p-4 mb-3 shadow-sm"
   style={{ backgroundColor: CoralPalette.surfaceAlt, borderColor: CoralPalette.border, borderWidth: 1 }}
  >
   <View className="flex-row items-center justify-between">
    <View className="flex-row items-center flex-1">
     <ProfilePicture 
      profileId={user.profileId} 
      size={48}
     />
     
     <View className="ml-3 flex-1">
      <Text className="font-bold" style={{ color: CoralPalette.dark, fontFamily: "Nunito" }}>{user.displayName}</Text>
      <Text className="text-sm mt-1" style={{ color: CoralPalette.mutedDark, fontFamily: "Nunito" }}>
       {user.username ? `@${user.username}` : user.email}
      </Text>
     </View>
    </View>
    <View className='absolute right-1'>
    <TouchableOpacity 
     className="px-4 py-4 rounded-full"
     onPress={handlePress}
     disabled={disabled}
     style={{
       backgroundColor: CoralPalette.surfaceAlt,
       opacity: disabled ? 0.7 : 1,
     }}
    >
     {renderIcon()}
    </TouchableOpacity>
    </View>
   </View>
  </View>
 );
};

const SearchFriends = () => {
 const { userProfile, showBanner } = useGlobalContext();
 const [searchQuery, setSearchQuery] = useState('');
 const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
 const [isSearching, setIsSearching] = useState(false);
 const [addingUserId, setAddingUserId] = useState<string | null>(null);
 const [searchPerformed, setSearchPerformed] = useState(false);
 const searchInputRef = useRef<TextInput>(null);

 // Auto-focus search input on mount
 useEffect(() => {
  const timer = setTimeout(() => {
   searchInputRef.current?.focus();
  }, 500);
  return () => clearTimeout(timer);
 }, []);

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
    const incomingUsers: SearchUser[] = result.data?.users || [];
    setSearchResults(incomingUsers);
   } else {
    console.error('Search failed:', response.statusText);
    showBanner({
     title: 'Failed to search users. Please try again.',
     preset: 'error',
     haptic: 'error',
    });
   }
  } catch (error) {
  console.error('Error searching users:', error);
  showBanner({
   title: 'Failed to search. Please check your connection.',
   preset: 'error',
   haptic: 'error',
  });
  } finally {
   setIsSearching(false);
  }
 };

  const handleAddFriend = async (friendId: string) => {
  if (!userProfile?.userId) return;

  setAddingUserId(friendId);
  
  try {
   const response = await fetch(`${API_BASE_URL}/api/friends/request`, {
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
   setSearchResults((prev) =>
    prev.map((searchUser) =>
    searchUser.id === friendId
      ? { ...searchUser, requestedByYou: true }
      : searchUser
    )
   );
    showBanner({
     title: 'Friend request sent!',
     preset: 'done',
     haptic: 'success',
    });
   } else {
    const errorData = await response.json().catch(() => null);
    const message =
     errorData?.error ||
     (response.status === 403
      ? 'This user does not allow friend requests.'
      : 'Failed to add friend');
    showBanner({
     title: message,
     preset: 'error',
     haptic: 'error',
    });
   }
  } catch (error) {
  console.error('Error adding friend:', error);
  showBanner({
   title: 'Failed to add friend. Please try again.',
   preset: 'error',
   haptic: 'error',
  });
  } finally {
   setAddingUserId(null);
  }
 };

 const handlePendingRequestPress = () => {
  showBanner({
   title: 'Pending request from this user.',
   preset: 'none',
   haptic: 'warning',
  });
 };

 // Debounced search
 useEffect(() => {
  const timer = setTimeout(() => {
   searchUsers(searchQuery);
  }, 500);

  return () => clearTimeout(timer);
 }, [searchQuery, userProfile?.userId]);

 return (
  <SafeAreaView className="flex-1" style={{ backgroundColor: CoralPalette.primaryMuted }}>
   <View className="flex-1" style={{ backgroundColor: CoralPalette.greyLighter }}>
    {/* Header */}
    <View
      className="flex-row items-center justify-between px-4 py-4"
     style={{ backgroundColor: CoralPalette.primaryMuted }}
    >
     <TouchableOpacity onPress={() => router.back()}>
      <ChevronLeft size={30} color={CoralPalette.white} />
     </TouchableOpacity>
     <Text className="text-[17px] font-extrabold" style={{ color: CoralPalette.white, fontFamily: "Nunito" }}>Find Friends</Text>
     <View style={{ width: 24 }} />
    </View>

    {/* Search Input */}
    <View className="px-4 py-4">
     <View className="flex-row items-center rounded-xl px-4 py-3" style={{ backgroundColor: CoralPalette.white }}>
      <Search size={20} color={CoralPalette.mutedDark} />
      <TextInput
       ref={searchInputRef}
       className="flex-1 ml-3 text-gray-900"
       placeholder="Search by username..."  
       value={searchQuery}
       onChangeText={setSearchQuery}
       autoCapitalize="none"
       autoCorrect={false}
       placeholderTextColor={CoralPalette.mutedDark}
       style={{ color: CoralPalette.dark, fontFamily: "Nunito" }}
      />
     </View>
    </View>

    {/* Search Results */}
    <ScrollView className="flex-1 px-4 py-1" showsVerticalScrollIndicator={false}>
    {isSearching ? (
     <View className="flex-1 items-center justify-center py-12">
      <ActivityIndicator size="large" color={CoralPalette.primary} />
      <Text className="mt-4" style={{ color: CoralPalette.mutedDark, fontFamily: "Nunito" }}>Searching users...</Text>
     </View>
    ) : searchPerformed && searchResults.length === 0 ? (
     <View className="flex-1 items-center justify-center py-12">
      <UsersRound size={48} color={CoralPalette.primary} />
      <Text className="font-bold text-lg mt-4" style={{ color: CoralPalette.dark, fontFamily: "Nunito" }}>No Users Found</Text>
      <Text className="text-center mt-2" style={{ color: CoralPalette.mutedDark, fontFamily: "Nunito" }}>
       Try searching with a different name or username
      </Text>
     </View>
    ) : searchQuery.trim().length < 2 ? (
     <View className="flex-1 items-center justify-center py-12">
      <Search size={48} color={CoralPalette.primary} />
      <Text className="font-bold text-lg mt-4" style={{ color: CoralPalette.dark, fontFamily: "Nunito" }}>Search for Friends</Text>
      <Text className="text-center mt-2" style={{ color: CoralPalette.mutedDark, fontFamily: "Nunito" }}>
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
        onPendingRequestPress={handlePendingRequestPress}
        isAdding={addingUserId === searchUser.id}
       />
      ))}
     </>
    )}

    <View className="h-6" />
    </ScrollView>
   </View>
  </SafeAreaView>
 );
};

export default SearchFriends;
