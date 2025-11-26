import { useGlobalContext } from '@/lib/GlobalProvider';
import { ProfilePicture } from '@/components/other/ProfilePicture';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { router } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import { Cat, Home, Settings, Store, UsersRound, BarChart3, LogOut } from 'lucide-react-native';
import React, { useState } from 'react';
import { Text, TouchableOpacity, View, Alert, ActivityIndicator } from 'react-native';
import { CoralPalette } from '@/constants/colors';

const CustomDrawerContent = (props: any) => {
  const { userProfile, logout } = useGlobalContext();
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
      <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 50 }}>
        <TouchableOpacity
          className="py-5 items-center"
          style={{ backgroundColor: CoralPalette.primaryMuted }}
          onPress={() => router.push('/settings/editProfile')}
          activeOpacity={0.7}
        >
          <ProfilePicture
            profileId={userProfile?.profileId || null}
            size={90}
            className="shadow-lg border border-white"
          />
          <Text
            className="text-2xl mt-5 font-bold text-white"
            style={{ fontFamily: "Nunito" }}
          >
            {displayName}
          </Text>
          <Text
            className="text-m mt-1 text-white mb-5"
            style={{ fontFamily: "Nunito" }}
          >
            {username ? `@${username}` : 'No username set'}
          </Text>
        </TouchableOpacity>

        <DrawerItemList {...props} />
      </DrawerContentScrollView>

      {/* Logout Button at Bottom */}
      <View className="p-10 pb-8">
        <TouchableOpacity
          className="flex-row items-center py-3 px-6 rounded-full"
          style={{ backgroundColor: CoralPalette.surfaceAlt, borderColor: isLogoutConfirm ? CoralPalette.primary : CoralPalette.border, borderWidth: 1 }}
          onPress={handleLogout}
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
  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: true,
        headerTitleStyle: { fontWeight: '800', color: CoralPalette.white, fontFamily: "Nunito" },
        headerTitleContainerStyle: { marginBottom: 10 },
        headerLeftContainerStyle: { marginLeft: 10, marginBottom: 10 },
        headerRightContainerStyle: { marginBottom: 10, marginRight: 10 },
        headerTintColor: CoralPalette.white,
        headerShadowVisible: false,
        headerStyle: {height: 110, backgroundColor: CoralPalette.primaryMuted },
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
          drawerLabel: 'Focus',
          drawerIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
        <Drawer.Screen
          name="insights"
          options={{
            title: 'Insights',
            drawerLabel: 'Insights',
            drawerIcon: ({ color, size }) => <BarChart3 color={color} size={size} />,
          }}
        />
      <Drawer.Screen
        name="pets"
        options={{
          title: 'My Pets',
          drawerIcon: ({ color, size }) => <Cat color={color} size={size} />,
        }}
      />
      <Drawer.Screen
        name="store"
        options={{
          title: 'Store',
          // headerRight removed (coins)
          drawerIcon: ({ color, size }) => <Store color={color} size={size} />,
        }}
      />
      <Drawer.Screen
        name="friends"
        options={{
          title: 'Friends',
          drawerIcon: ({ color, size }) => <UsersRound color={color} size={size} />,
        }}
      />
      <Drawer.Screen
        name="settings"
        options={{
          title: 'Settings',
          drawerIcon: ({ color, size }) => <Settings color={color} size={size} />,
        }}
      />
    </Drawer>
  );
};

export default DrawerLayout;
