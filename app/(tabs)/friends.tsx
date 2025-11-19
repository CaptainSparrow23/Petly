import React, { useState, useEffect, useCallback } from 'react'
import { Pressable, ScrollView, Text, View, ActivityIndicator, Alert } from 'react-native'
import { Plus, Users, Trash2, Check, Edit3 } from 'lucide-react-native'
import { useGlobalContext } from '@/lib/GlobalProvider'
import { router, useFocusEffect } from 'expo-router'
import Constants from 'expo-constants'
import Svg, { Path } from 'react-native-svg'
import { ProfilePicture } from '@/components/other/ProfilePicture'

const API_BASE_URL = Constants.expoConfig?.extra?.backendUrl as string

interface Friend {
  username: string | null
  displayName: string
  profileId: number | null
  userId: string
  timeActiveTodayMinutes: number
}


const TopDropdownBadge = ({ labelBottom, top, labelTop, width = 60, height = 70, fontSize = 18, smallFontSize = 11 }: { labelBottom: string; labelTop: string; width?: number; height?: number; fontSize?: number; smallFontSize?: number, top: number }) => {
  // geometry: rectangle part ~28 high, point reaches to full height
  const rectH = Math.max(24, Math.max(32, height - 16))
  const pointY = height
  const midX = width / 2

  return (
    <View style={{ position: 'absolute', top: 0, right: 20, alignSelf: 'center' }}>
      <View style={{ width, height, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          <Path
            d={`M 0 0 L ${width} 0 L ${width} ${rectH} L ${midX} ${pointY} L 0 ${rectH} Z`}
            fill="#f2f2f2"
          />
        </Svg>
          <View
            style={{
              position: 'absolute',
              top: top,
              alignItems: 'center',
            }}
          >
            <Text
            className='font-bold'
              style={{

                fontSize: fontSize,
                color: '#191d31',
                lineHeight: fontSize + 2,
              }}
            >
              {labelTop}
            </Text>
            <Text
              style={{
                fontSize: smallFontSize,
                color: '#8C8E98', // Tailwind blue-400 (lighter)
                marginTop: 1,
              }}
            >
              {labelBottom}
            </Text>
          </View>
      </View>
    </View>
  )
}

const FriendCard = ({
  friend,
  isEditMode,
  isSelected,
  onToggleSelect,
}: {
  friend: Friend
  isEditMode: boolean
  isSelected: boolean
  onToggleSelect?: (friendId: string) => void
}) => {
  const handlePress = () => {
    if (isEditMode && onToggleSelect) onToggleSelect(friend.userId)
  }

  return (
    <Pressable
      className={`rounded-2xl p-4 mb-3 shadow-sm border ${
        isSelected ? 'border-red-500 bg-red-50' : 'border-gray-100 bg-white'
      }`}
      onPress={handlePress}
      disabled={!isEditMode}
    >
      <TopDropdownBadge
        labelTop={`${friend.timeActiveTodayMinutes}m`}
        labelBottom="today"
        width={50}
        height={65}
        fontSize={15}
        smallFontSize={11}
        top={10}
      />
      
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          {isEditMode && (
            <View
              className={`w-6 h-6 rounded-full border-2 mr-3 items-center justify-center ${
                isSelected ? 'bg-red-500 border-red-500' : 'border-gray-300'
              }`}
            >
              {isSelected && <Check size={16} color="#ffffff" />}
            </View>
          )}

          <ProfilePicture profileId={friend.profileId} size={48} />

          <View className="ml-3 flex-1">
            <Text className="font-rubik-bold text-gray-900">{friend.displayName}</Text>
            {friend.username && <Text className="text-sm text-gray-500 mt-0.5">@{friend.username}</Text>}
          </View>
        </View>
      </View>
    </Pressable>
  )
}

const Friends = () => {
  const { userProfile, showBanner } = useGlobalContext()
  const [tab, setTab] = useState<"friends" | "global">("friends")
  const [friends, setFriends] = useState<Friend[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set())
  const [isDeletingFriends, setIsDeletingFriends] = useState(false)

  const fetchFriends = async () => {
    if (!userProfile?.userId) {
      setIsLoading(false)
      return
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/get_friends/${userProfile.userId}`)
      if (response.ok) {
        const result = await response.json()
        setFriends(result.data?.friends || [])
      } else {
        const errorText = await response.text()
        console.error('Failed to fetch friends:', response.status, response.statusText, errorText)
      }
    } catch (error) {
      console.error('Error fetching friends:', error)
      Alert.alert('Error', 'Failed to load friends. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddFriend = () => router.push('/friends/search' as any)

  const handleSwitchTab = (next: typeof tab) => {
    if (next === tab) return
    setTab(next)
  }

  const handleToggleEdit = () => {
    if (isEditMode) setSelectedFriends(new Set())
    setIsEditMode(!isEditMode)
  }

  const handleToggleSelect = (friendId: string) => {
    setSelectedFriends(prev => {
      const next = new Set(prev)
      next.has(friendId) ? next.delete(friendId) : next.add(friendId)
      return next
    })
  }

  const handleDeleteSelected = async () => {
    if (selectedFriends.size === 0 || !userProfile?.userId) return
    Alert.alert(
      'Remove Friends',
      `Are you sure you want to remove ${selectedFriends.size} friend${selectedFriends.size > 1 ? 's' : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setIsDeletingFriends(true)
            try {
              const removePromises = Array.from(selectedFriends).map(friendId =>
                fetch(`${API_BASE_URL}/api/friends/remove`, {
                  method: 'DELETE',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ userId: userProfile.userId, friendId }),
                })
              )
              await Promise.all(removePromises)
              setFriends(prev => prev.filter(f => !selectedFriends.has(f.userId)))
              setSelectedFriends(new Set())
              setIsEditMode(false)
              const count = selectedFriends.size
              showBanner(`${count} friend${count > 1 ? 's' : ''} removed successfully`, 'success')
            } catch (e) {
              console.error('Error removing friends:', e)
              showBanner('Failed to remove friends. Please try again.', 'error')
            } finally {
              setIsDeletingFriends(false)
            }
          },
        },
      ]
    )
  }

  useEffect(() => {
    if (tab === "friends") {
      fetchFriends()
    }
  }, [userProfile?.userId, tab])

  useFocusEffect(
    useCallback(() => {
      if (tab === "friends") {
        fetchFriends()
      }
    }, [userProfile?.userId, tab])
  )

  if (isLoading && tab === "friends") {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    )
  }

  return (
    <View className="flex-1 bg-white">
      {/* Top right buttons */}
      <View className="absolute -top-12 right-0 z-10 pt-2 pr-6 flex-row gap-2">
        {!isEditMode ? (
          <>
            {friends.length > 0 && (
              <Pressable
                onPress={handleToggleEdit}
                className="bg-white rounded-full w-9 h-9 items-center justify-center border border-black-500"
              >
                <Edit3 size={18} color="#3b82f6" />
              </Pressable>
            )}
            <Pressable onPress={handleAddFriend} className="bg-black-300 rounded-full w-9 h-9 items-center justify-center">
              <Plus size={24} color="#ffffff" />
            </Pressable>
          </>
        ) : (
          <>
            {selectedFriends.size > 0 && (
              <Pressable 
                onPress={handleDeleteSelected} 
                className="bg-red-500 rounded-full px-3 py-2 flex-row items-center"
                disabled={isDeletingFriends}
              >
                {isDeletingFriends ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Trash2 size={18} color="#ffffff" />
                )}
              </Pressable>
            )}
            <Pressable
              onPress={handleToggleEdit}
              className="bg-gray-100 rounded-full px-2 py-2 border border-gray-300"
              disabled={isDeletingFriends}
            >
              <Text className="font-rubik-medium text-gray-700">Cancel</Text>
            </Pressable>
          </>
        )}
      </View>

      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="flex-row items-center gap-2 mt-6 mb-5">
          <View className="flex-row bg-black-100 rounded-full p-1.5 flex-1">
            <Pressable
              className={`flex-1 py-2.5 rounded-full px-4 ${
                tab === "friends" ? "bg-black-300" : "bg-transparent"
              }`}
              onPress={() => handleSwitchTab("friends")}
            >
              <Text
                className={'text-center font-semibold text-white'}
              >
                Friends
              </Text>
            </Pressable>
            <Pressable
              className={`flex-1 py-2.5 rounded-full px-4 ${
                tab === "global" ? "bg-black-300" : "bg-transparent"
              }`}
              onPress={() => handleSwitchTab("global")}
            >
              <Text
                className={'text-center font-semibold text-white'}
              >
                Global
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Toggle between Friends and Global */}
        {tab === "friends" ? (
          friends.length === 0 ? (
            <View className="bg-white rounded-2xl p-6 mt-10 items-center">
              <Users size={48} color="#9ca3af" />
              <Text className="font-rubik-bold text-gray-900 text-lg mt-4">No Friends Yet</Text>
              <Text className="text-gray-600 font-rubik text-center mt-2">
                Start building your focus community by adding friends!
              </Text>
              <Pressable className="bg-black-500 rounded-xl px-6 py-3 mt-4" onPress={handleAddFriend}>
                <Text className="text-white font-rubik-medium">Find Friends</Text>
              </Pressable>
            </View>
          ) : (
            friends.map(friend => (
              <FriendCard
                key={friend.userId}
                friend={friend}
                isEditMode={isEditMode}
                isSelected={selectedFriends.has(friend.userId)}
                onToggleSelect={handleToggleSelect}
              />
            ))
          )
        ) : (
          <View className="bg-white rounded-2xl p-6 mt-10 items-center">
            <Users size={48} color="#9ca3af" />
            <Text className="font-rubik-bold text-gray-900 text-lg mt-4">Global Ranking</Text>
            <Text className="text-gray-600 font-rubik text-center mt-2">
              Coming soon. Stay tuned!
            </Text>
          </View>
        )}

        <View className="h-6" />
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 overflow-hidden bg-black-100">
        <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}>
          <Svg height="100%" width="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
            <Path d="M 0 100 L 0 0 L 90 0 L 35 100 L 0 100 Z" fill="#191d31" />
          </Svg>
        </View>

        {/* the white dropdown coming from the top center */}
        <TopDropdownBadge labelTop={`${userProfile?.timeActiveTodayMinutes}m`} labelBottom="today" top={15} />

        {/* content row */}
        <View className="px-6 pt-4 pb-8">
          <View className="flex-row items-center">
            <ProfilePicture profileId={userProfile?.profileId || null} size={54} />
            <View className="ml-3 flex-1">
              <Text className="font-bold text-xl mb-1 text-white">{userProfile?.displayName || 'You'}</Text>
              {userProfile?.username && <Text className="text-m text-gray-100">@{userProfile?.username}</Text>}
            </View>
          </View>
        </View>
      </View>
    </View>
  )
}

export default Friends
