import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  Text,
  View,
  Alert,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { Check, Mail, Plus, UsersRound, X } from "lucide-react-native";
import { useGlobalContext } from "@/lib/GlobalProvider";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import Constants from "expo-constants";
import Svg, { Path } from "react-native-svg";
import { ProfilePicture } from "@/components/other/ProfilePicture";
import { FriendItemSkeleton } from "@/components/other/Skeleton";
import { CoralPalette } from "@/constants/colors";

const API_BASE_URL = Constants.expoConfig?.extra?.backendUrl as string;
const nunitoFont = { fontFamily: "Nunito" };

interface Friend {
  username: string | null;
  displayName: string;
  profileId: number | null;
  userId: string;
  timeActiveToday: number;
}

interface FriendRequest {
  userId: string;
  displayName: string;
  username: string | null;
  profileId: number | null;
  email: string | null;
}

const FriendDropdownBadge = ({
  labelBottom,
  top,
  labelTop,
  width = 60,
  height = 70,
  fontSize = 18,
  smallFontSize = 11,
}: {
  labelBottom: string;
  labelTop: string;
  width?: number;
  height?: number;
  fontSize?: number;
  smallFontSize?: number;
  top: number;
}) => {
  // geometry: rectangle part ~28 high, point reaches to full height
  const rectH = Math.max(24, Math.max(32, height - 16));
  const pointY = height;
  const midX = width / 2;

  return (
    <View
      style={{ position: "absolute", top: 0, right: 20, alignSelf: "center" }}
    >
      <View
        style={{
          width,
          height,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          <Path
            d={`M 0 0 L ${width} 0 L ${width} ${rectH} L ${midX} ${pointY} L 0 ${rectH} Z`}
            fill={CoralPalette.primaryMuted}
          />
        </Svg>
        <View
          style={{
            position: "absolute",
            top: top,
            alignItems: "center",
          }}
        >
          <Text
            className="font-bold"
            style={[
              nunitoFont,
              {
                fontSize,
                color: CoralPalette.surface,
                lineHeight: fontSize + 2,
                fontWeight: "800",
              },
            ]}
          >
            {labelTop}
          </Text>
          <Text
            style={[
              nunitoFont,
              {
                fontSize: smallFontSize,
                color: CoralPalette.surfaceAlt,
                marginTop: 1,
                fontWeight: "600",
              },
            ]}
          >
            {labelBottom}
          </Text>
        </View>
      </View>
    </View>
  );
};

const MyDropdownBadge = ({
  labelBottom,
  top,
  labelTop,
  width = 60,
  height = 70,
  fontSize = 18,
  smallFontSize = 11,
}: {
  labelBottom: string;
  labelTop: string;
  width?: number;
  height?: number;
  fontSize?: number;
  smallFontSize?: number;
  top: number;
}) => {
  // geometry: rectangle part ~28 high, point reaches to full height
  const rectH = Math.max(24, Math.max(32, height - 16));
  const pointY = height;
  const midX = width / 2;

  return (
    <View
      style={{ position: "absolute", top: 0, right: 20, alignSelf: "center" }}
    >
      <View
        style={{
          width,
          height,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          <Path
            d={`M 0 0 L ${width} 0 L ${width} ${rectH} L ${midX} ${pointY} L 0 ${rectH} Z`}
            fill={CoralPalette.surfaceAlt}
          />
        </Svg>
        <View
          style={{
            position: "absolute",
            top: top,
            alignItems: "center",
          }}
        >
          <Text
            className="font-bold"
            style={[
              nunitoFont,
              {
                fontSize,
                color: CoralPalette.dark,
                lineHeight: fontSize + 2,
              },
            ]}
          >
            {labelTop}
          </Text>
          <Text
            style={[
              nunitoFont,
              {
                fontSize: smallFontSize,
                color: CoralPalette.mutedDark,
                marginTop: 1,
              },
            ]}
          >
            {labelBottom}
          </Text>
        </View>
      </View>
    </View>
  );
};

const FriendDropdownBadgeMemo = React.memo(FriendDropdownBadge);

const FriendCard = ({
  friend,
}: {
  friend: Friend;
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const animateScale = (toValue: number) => {
    Animated.spring(scaleAnim, {
      toValue,
      useNativeDriver: true,
      friction: 7,
      tension: 120,
    }).start();
  };

  const handlePress = () => {
    router.push(`/friends/friendProfile?userId=${friend.userId}`);
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        className="rounded-2xl p-4 mb-3 shadow-sm bg-white"
        onPress={handlePress}
        onPressIn={() => animateScale(0.97)}
        onPressOut={() => animateScale(1)}
        style={({ pressed }) => [
          {
            backgroundColor: CoralPalette.white,
            opacity: pressed ? 0.9 : 1,
            shadowColor: "#000",
            shadowOpacity: pressed ? 0.08 : 0.12,
            shadowRadius: pressed ? 6 : 10,
            shadowOffset: { width: 0, height: pressed ? 1 : 4 },
            elevation: pressed ? 1 : 3,
          },
        ]}
      >
        <FriendDropdownBadgeMemo
          labelTop={`${friend.timeActiveToday}m`}
          labelBottom="today"
          width={50}
          height={65}
          fontSize={15}
          smallFontSize={11}
          top={10}
        />

        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <ProfilePicture profileId={friend.profileId} size={48} />

            <View className="ml-3 flex-1">
              <Text className="font-bold text-gray-900" style={nunitoFont}>
                {friend.displayName}
              </Text>
              {friend.username && (
                <Text className="text-sm text-gray-400 mt-0.5" style={nunitoFont}>
                  @{friend.username}
                </Text>
              )}
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const RequestCard = ({
  request,
  onRespond,
  isProcessing,
}: {
  request: FriendRequest;
  onRespond: (action: "accept" | "decline") => void;
  isProcessing: boolean;
}) => {
  const usernameOrEmail = request.username
    ? `@${request.username}`
    : request.email || "";

  const renderButtonContent = (type: "accept" | "decline") => {

    return type === "accept" ? (
      <Check size={20} color={CoralPalette.white} />
    ) : (
      <X size={20} color={CoralPalette.dark} />
    );
  };

  return (
    <View
      className="rounded-2xl p-4 mb-3 shadow-sm"
      style={{
        backgroundColor: CoralPalette.surfaceAlt,
      }}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <ProfilePicture profileId={request.profileId} size={48} />
          <View className="ml-3 flex-1">
            <Text className="font-bold" style={[nunitoFont, { color: CoralPalette.dark }]}>
              {request.displayName}
            </Text>
            {usernameOrEmail ? (
              <Text className="text-sm mt-1" style={[nunitoFont, { color: CoralPalette.mutedDark }]}>
                {usernameOrEmail}
              </Text>
            ) : null}
          </View>
        </View>

        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            className="w-11 h-11 rounded-full items-center justify-center"
            style={{ backgroundColor: CoralPalette.primary }}
            disabled={isProcessing}
            onPress={() => onRespond("accept")}
          >
            {renderButtonContent("accept")}
          </TouchableOpacity>
          <TouchableOpacity
            className="w-11 h-11 rounded-full items-center justify-center"
            style={{ backgroundColor: CoralPalette.primaryLight }}
            disabled={isProcessing}
            onPress={() => onRespond("decline")}
          >
            {renderButtonContent("decline")}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const Friends = () => {
  const params = useLocalSearchParams<{ tab?: string }>();
  const normalizedRequestedTab = Array.isArray(params.tab)
    ? params.tab?.[0]?.toLowerCase()
    : params.tab?.toLowerCase();
  const { userProfile, showBanner, refetchUserProfile } = useGlobalContext();
  const [tab, setTab] = useState<"friends" | "requests">("friends");
  const tabTranslate = useRef(new Animated.Value(0)).current;
  const plusScale = useRef(new Animated.Value(1)).current;
  const [tabPillDims, setTabPillDims] = useState({ width: 0, height: 0 });
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchFriends = useCallback(async (showSpinner = true) => {
    if (!userProfile?.userId) {
      setIsLoading(false);
      return;
    }
    if (showSpinner) {
      setIsLoading(true);
    }
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/get_friends/${userProfile.userId}`
      );
      if (response.ok) {
        const result = await response.json();
        setFriends(result.data?.friends || []);
        setRequests(result.data?.requests || []);
      } else {
        const errorText = await response.text();
        console.error(
          "Failed to fetch friends:",
          response.status,
          response.statusText,
          errorText
        );
      }
    } catch (error) {
      console.error("Error fetching friends:", error);
      Alert.alert("Error", "Failed to load friends. Please try again.");
    } finally {
      if (showSpinner) {
        setIsLoading(false);
      }
    }
  }, [userProfile?.userId]);

  const handleAddFriend = () => router.push("/friends/search" as any);

  const handleSwitchTab = (next: "friends" | "requests") => {
    if (next !== tab) setTab(next);
  };

  const handleRespond = useCallback(
    async (requesterId: string, action: "accept" | "decline") => {
      if (!userProfile?.userId) return;
      setRespondingId(requesterId);
      try {
        const response = await fetch(`${API_BASE_URL}/api/friends/respond`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: userProfile.userId,
            requesterId,
            action,
          }),
        });

        if (response.ok) {
          await fetchFriends(false);
          // Refresh user profile to update hasFriendRequests boolean
          await refetchUserProfile();
          if (action === "accept") {
            showBanner({
              title: "Friend request accepted",
              preset: "done",
              haptic: "success",
            });
          }
        } else {
          const errorText = await response.text();
          Alert.alert("Error", errorText || "Failed to update friend request");
        }
      } catch (error) {
        console.error("Error responding to friend request:", error);
        Alert.alert("Error", "Failed to update friend request. Please try again.");
      } finally {
        setRespondingId(null);
      }
    },
    [fetchFriends, showBanner, userProfile?.userId, refetchUserProfile]
  );

  useEffect(() => {
    Animated.spring(tabTranslate, {
      toValue: tab === "friends" ? 0 : 1,
      useNativeDriver: true,
    }).start();
  }, [tab, tabTranslate]);

  const animatePlus = useCallback(
    (toValue: number) => {
      Animated.spring(plusScale, {
        toValue,
        useNativeDriver: true,
        friction: 7,
        tension: 120,
      }).start();
    },
    [plusScale]
  );

  useFocusEffect(
    useCallback(() => {
      fetchFriends();
      // Refresh user profile to update hasFriendRequests boolean
      void refetchUserProfile();
      if (normalizedRequestedTab === "requests") {
        setTab("requests");
        tabTranslate.setValue(1);
        router.setParams({ tab: undefined });
      }
    }, [fetchFriends, normalizedRequestedTab, tabTranslate, refetchUserProfile])
  );

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await fetchFriends(false);
      // Refresh user profile to update hasFriendRequests boolean
      await refetchUserProfile();
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchFriends, refetchUserProfile]);

  const LoadingState = () => (
    <View style={{ paddingTop: 8 }}>
      {[1, 2, 3].map((i) => (
        <View
          key={i}
          className="rounded-2xl mb-3"
          style={{ backgroundColor: CoralPalette.white }}
        >
          <FriendItemSkeleton />
        </View>
      ))}
    </View>
  );

  return (
    <View className="flex-1" style={{ backgroundColor: CoralPalette.surface }}>
      {/* Top right buttons */}
      <View className="absolute -top-14 right-0 z-10 pt-2 pr-6 flex-row gap-2">
        <Animated.View style={{ transform: [{ scale: plusScale }] }}>
          <Pressable
            onPress={handleAddFriend}
            className="rounded-full w-9 h-9 items-center justify-center"
            onPressIn={() => animatePlus(0.85)}
            onPressOut={() => animatePlus(1)}
            style={{ backgroundColor: CoralPalette.primaryMuted }}
          >
            <Plus size={30} color={CoralPalette.white} />
          </Pressable>
        </Animated.View>
      </View>

      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={CoralPalette.primary}
            colors={[CoralPalette.primary]}
          />
        }
      >
        <View className="flex-row items-center gap-2 mt-6 mb-5">
          <View
            className="flex-row rounded-full flex-1"
            style={{
              backgroundColor: CoralPalette.white,
              padding: 4,
              position: "relative",
            }}
            onLayout={(e) =>
              setTabPillDims({
                width: e.nativeEvent.layout.width,
                height: e.nativeEvent.layout.height,
              })
            }
          >
            {tabPillDims.width > 0 && (
              <Animated.View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  top: 4,
                  left: 4,
                  width: Math.max(0, (tabPillDims.width - 8) / 2),
                  height: Math.max(0, tabPillDims.height - 8),
                  borderRadius: 999,
                  backgroundColor: CoralPalette.primary,
                  transform: [
                    {
                      translateX: tabTranslate.interpolate({
                        inputRange: [0, 1],
                        outputRange: [
                          0,
                          Math.max(0, (tabPillDims.width - 8) / 2),
                        ],
                      }),
                    },
                  ],
                }}
              />
            )}
            <Pressable
              className="flex-1 py-2.5 rounded-full px-4"
              onPress={() => handleSwitchTab("friends")}
            >
              <Text
                className={"text-center font-semibold"}
                style={[
                  nunitoFont,
                  {
                    color: tab === "friends" ? "#fff" : CoralPalette.mutedDark,
                  },
                ]}
              >
                Friends
              </Text>
            </Pressable>
            <Pressable
              className="flex-1 py-2.5 rounded-full px-4"
              onPress={() => handleSwitchTab("requests")}
            >
              <Text
                className="text-center font-semibold"
                style={[
                  nunitoFont,
                  { color: tab === "requests" ? "#fff" : CoralPalette.mutedDark },
                ]}
              >
                Requests
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Toggle between Friends and Requests */}
        {isLoading && !isRefreshing ? (
          <LoadingState />
        ) : tab === "friends" ? (
          friends.length === 0 ? (
            <View
              className="rounded-3xl p-6 mt-10 items-center"
              style={{
                backgroundColor: CoralPalette.surface,
                borderColor: CoralPalette.surface,
                borderWidth: 1,
              }}
            >
              <UsersRound size={48} color={CoralPalette.primary} />
              <Text
                className="font-bold text-lg mt-4"
                style={[nunitoFont, { color: CoralPalette.dark }]}
              >
                No Friends Yet
              </Text>
              <Text
                className="text-center mt-2"
                style={[nunitoFont, { color: CoralPalette.mutedDark }]}
              >
                Start building your focus community by adding friends!
              </Text>
              <Pressable
                className="rounded-xl px-6 py-3 mt-4"
                style={{ backgroundColor: CoralPalette.primary }}
                onPress={handleAddFriend}
              >
                <Text className="text-white font-medium" style={nunitoFont}>
                  Find Friends
                </Text>
              </Pressable>
            </View>
          ) : (
            friends.map((friend) => (
              <FriendCard key={friend.userId} friend={friend} />
            ))
          )
        ) : requests.length === 0 ? (
          <View
            className="rounded-3xl p-6 mt-10 items-center"
            style={{
              backgroundColor: CoralPalette.surface,
              borderColor: CoralPalette.surface,
              borderWidth: 1,
            }}
          >
            <Mail size={48} color={CoralPalette.primary} />
            <Text
              className="font-bold text-lg mt-4"
              style={[nunitoFont, { color: CoralPalette.dark }]}
            >
              No Requests Yet
            </Text>
            <Text
              className="text-center mt-2"
              style={[nunitoFont, { color: CoralPalette.mutedDark }]}
            >
              Friend requests you receive will show up here.
            </Text>
          </View>
        ) : (
          requests.map((request) => (
            <RequestCard
              key={request.userId}
              request={request}
              isProcessing={respondingId === request.userId}
              onRespond={(action) => handleRespond(request.userId, action)}
            />
          ))
        )}

        <View className="h-6" />
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 overflow-hidden">
        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            backgroundColor: CoralPalette.primary,
          }}
        />

        {/* the white dropdown coming from the top center */}
        <MyDropdownBadge
          labelTop={`${userProfile?.timeActiveTodayMinutes}m`}
          labelBottom="today"
          top={15}
        />

        {/* content row */}
        <View className="px-6 pt-4 pb-8">
          <View className="flex-row items-center">
            <ProfilePicture
              profileId={userProfile?.profileId || null}
              size={54}
              className="border-2 border-white"
            />
            <View className="ml-4 flex-1">
              <Text
                className="font-extrabold text-xl mb-1 text-white"
                style={nunitoFont}
              >
                {userProfile?.displayName || "You"}
              </Text>
              {userProfile?.username && (
                <Text
                  className="text-sm font-bold text-gray-100"
                  style={nunitoFont}
                >
                  @{userProfile?.username}
                </Text>
              )}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

export default Friends;
