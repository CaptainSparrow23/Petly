import { useGlobalContext } from '@/providers/GlobalProvider';
import { ProfilePicture } from '@/components/other/ProfilePicture';
import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { router } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import { Cat, Home, Settings, UsersRound, BarChart3, LogOut, ShoppingBag, PawPrint } from 'lucide-react-native';
import React, { useState } from 'react';
import { Text, TouchableOpacity, View, Alert, ActivityIndicator } from 'react-native';
import { CoralPalette } from '@/constants/colors';
import CoinBadge from '@/components/other/CoinBadge';
import KeyBadge from '@/components/other/KeyBadge';
import { useHasUnclaimedRewards } from '@/utils/hasUnclaimedRewards';
import { useHasFriendRequests } from '@/utils/hasFriendRequests';
import { useHasClaimableGoals } from '@/utils/hasClaimableGoals';
import { MenuButton } from '@/components/other/MenuButton';
import * as Haptics from 'expo-haptics';

const FriendsDrawerLabel = ({ color }: { color: string }) => {
  const hasFriendRequests = useHasFriendRequests();
  
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Text
        style={{
          fontFamily: "Nunito",
          fontSize: 16,
          fontWeight: '700',
          color: color,
        }}
      >
        Friends
      </Text>
      {hasFriendRequests && (
        <View
          style={{
            marginLeft: 8,
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: '#FF3B30',
          }}
        />
      )}
    </View>
  );
};

const InsightsDrawerLabel = ({ color }: { color: string }) => {
  const hasClaimableGoals = useHasClaimableGoals();
  
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Text
        style={{
          fontFamily: "Nunito",
          fontSize: 16,
          fontWeight: '700',
          color: color,
        }}
      >
        Insights
      </Text>
      {hasClaimableGoals && (
        <View
          style={{
            marginLeft: 8,
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: '#FF3B30',
          }}
        />
      )}
    </View>
  );
};

const FocusDrawerLabel = ({ color }: { color: string }) => (
  <Text
    style={{
      fontFamily: "Nunito",
      fontSize: 16,
      fontWeight: '700',
      color: color,
    }}
  >
    Focus
  </Text>
);

const MyPetsDrawerLabel = ({ color }: { color: string }) => (
  <Text
    style={{
      fontFamily: "Nunito",
      fontSize: 16,
      fontWeight: '700',
      color: color,
    }}
  >
    My Pets
  </Text>
);

const CompanionsDrawerLabel = ({ color }: { color: string }) => (
  <Text
    style={{
      fontFamily: "Nunito",
      fontSize: 16,
      fontWeight: '700',
      color: color,
    }}
  >
    Companions
  </Text>
);

const StoreDrawerLabel = ({ color }: { color: string }) => (
  <Text
    style={{
      fontFamily: "Nunito",
      fontSize: 16,
      fontWeight: '700',
      color: color,
    }}
  >
    Store
  </Text>
);

const SettingsDrawerLabel = ({ color }: { color: string }) => (
  <Text
    style={{
      fontFamily: "Nunito",
      fontSize: 16,
      fontWeight: '700',
      color: color,
    }}
  >
    Settings
  </Text>
);

const CustomDrawerContent = (props: any) => {
  const { userProfile, logout, appSettings } = useGlobalContext();
  const hasUnclaimedRewards = useHasUnclaimedRewards();
  const [isLogoutConfirm, setIsLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const displayName = userProfile?.displayName || 'User';
  const username = userProfile?.username;

  const handleLogout = async () => {
    if (!isLogoutConfirm) {
      setIsLogoutConfirm(true);
      setTimeout(() => setIsLogoutConfirm(false), 3000);
      return;
    }

    setIsLoggingOut(true);
    router.replace({ pathname: "/(auth)/sign-in", params: { loggedOut: "true" } });

    const success = await logout();

    if (!success) {
      Alert.alert("Error", "An error occurred while logging out, please try again");
      setIsLoggingOut(false);
    }
    setIsLogoutConfirm(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: CoralPalette.primaryMuted }}>
      <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 80 }}>
        <TouchableOpacity
          className=" items-center"
          style={{ backgroundColor: CoralPalette.primaryMuted }}
          onPress={() => {
            if (appSettings.vibrations) {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid).catch(() => {});
            }
            router.push('/paywall');
          }}
          activeOpacity={0.7}
        >
          <ProfilePicture
            profileId={userProfile?.profileId || null}
            size={90}
            className="shadow-lg border border-white"
          />
          <View className="flex-row items-center mt-5">
            <Text
              className="text-xl font-bold text-white"
              style={{ fontFamily: "Nunito", fontWeight: "700" }}
            >
              {displayName}
            </Text>
            {hasUnclaimedRewards && (
              <View
                style={{
                  marginLeft: 8,
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: '#FF3B30',
                }}
              />
            )}
          </View>
          <Text
            className="text-sm mt-1 text-white mb-5"
            style={{ fontFamily: "Nunito" }}
          >
            {username ? `@${username}` : 'No username set'}
          </Text>
        </TouchableOpacity>

        {props.state.routes.map((route: any, index: number) => {
          const { options } = props.descriptors[route.key];
          const label =
            options.drawerLabel !== undefined
              ? options.drawerLabel
              : options.title !== undefined
              ? options.title
              : route.name;

          const isFocused = props.state.index === index;

          const onPress = () => {
            const event = props.navigation.emit({
              type: 'drawerItemPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!event.defaultPrevented) {
              if (appSettings.vibrations) {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid).catch(() => {});
              }
              props.navigation.navigate(route.name, route.params);
            }
          };

          return (
            <DrawerItem
              key={route.key}
              label={label}
              focused={isFocused}
              activeTintColor={options.drawerActiveTintColor}
              inactiveTintColor={options.drawerInactiveTintColor}
              activeBackgroundColor={options.drawerActiveBackgroundColor}
              inactiveBackgroundColor={options.drawerInactiveBackgroundColor}
              icon={options.drawerIcon}
              onPress={onPress}
            />
          );
        })}
      </DrawerContentScrollView>

      {/* Logout Button at Bottom */}
      <View className="p-10 pb-8">
        <TouchableOpacity
          className="flex-row items-center py-3 px-6 rounded-full"
          style={{ backgroundColor: CoralPalette.surfaceAlt, borderColor: isLogoutConfirm ? CoralPalette.primary : CoralPalette.border, borderWidth: 1 }}
          onPress={() => {
            if (appSettings.vibrations) {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid).catch(() => {});
            }
            handleLogout();
          }}
          activeOpacity={0.7}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <ActivityIndicator size="small" color="#ef4444" style={{ marginRight: 12 }} />
          ) : (
            <LogOut size={22} color="#ef4444" style={{ marginRight: 12 }} />
          )}
          <Text
            className="text-base font-medium"
            style={{
              color: isLogoutConfirm ? CoralPalette.primary : CoralPalette.dark,
              fontFamily: "Nunito",
              fontWeight: "500",
            }}
          >
            {isLoggingOut ? "Logging Out..." : isLogoutConfirm ? "Confirm" : "Log Out"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Removed FocusHeaderCoins

const DrawerLayout = () => {
  const HeaderBadges = () => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginRight: 8, marginTop: 4 }}>
     
      <CoinBadge variant="inline" />
    </View>
  );

  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: true,
        headerTitleStyle: { marginTop: 5, fontSize: 18, fontWeight: '800', color: CoralPalette.white, fontFamily: "Nunito" },
        headerTitleContainerStyle: { marginBottom: 10 },
        headerLeftContainerStyle: { marginLeft: 10, marginBottom: 10 },
        headerRightContainerStyle: { marginBottom: 10, marginRight: 10 },
        headerLeft: () => <MenuButton />,
        headerTintColor: CoralPalette.white,
        headerShadowVisible: false,
        headerStyle: {height: 120, backgroundColor: CoralPalette.primaryMuted },
        drawerStyle: { width: 210, backgroundColor: CoralPalette.primaryMuted },
        drawerActiveBackgroundColor: CoralPalette.primaryLight,
        drawerInactiveBackgroundColor: 'transparent',
        drawerActiveTintColor: '#ffffff',
        drawerInactiveTintColor: CoralPalette.white,
        drawerLabelStyle: { fontFamily: "Nunito", fontSize: 16, fontWeight: '700' },
        drawerType: 'front',
        swipeEnabled: false,
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          title: 'Focus',
          headerTitle: () => null,
          // headerRight removed (coins)
          drawerLabel: ({ color }) => <FocusDrawerLabel color={color} />,
          drawerIcon: ({ color, size }) => <Home color={color} size={size} />,
          headerRight: () => <HeaderBadges />
        }}
      />
        <Drawer.Screen
          name="insights"
          options={{
            title: 'Insights',
            drawerLabel: ({ color }) => <InsightsDrawerLabel color={color} />,
            drawerIcon: ({ color, size }) => <BarChart3 color={color} size={size} />,
            headerRight: () => <HeaderBadges />
          }}
        />
   
      <Drawer.Screen
        name="pets copy"
        options={{
          title: 'Companions',
          drawerLabel: ({ color }) => <CompanionsDrawerLabel color={color} />,
          drawerIcon: ({ color, size }) => <PawPrint color={color} size={size} />,
          
        }}
      />
      <Drawer.Screen
        name="store"
        options={{
          title: 'Store',
          drawerLabel: ({ color }) => <StoreDrawerLabel color={color} />,
          drawerIcon: ({ color, size }) => <ShoppingBag color={color} size={size} />,
          headerRight: () => <HeaderBadges />,
        }}
      />
      <Drawer.Screen
        name="friends"
        options={{
          title: 'Friends',
          drawerIcon: ({ color, size }) => <UsersRound color={color} size={size} />,
          drawerLabel: ({ color }) => <FriendsDrawerLabel color={color} />,
        }}
      />
      <Drawer.Screen
        name="settings"
        options={{
          title: 'Settings',
          drawerLabel: ({ color }) => <SettingsDrawerLabel color={color} />,
          drawerIcon: ({ color, size }) => <Settings color={color} size={size} />,
        }}
      />
    </Drawer>
  );
};

export default DrawerLayout;
