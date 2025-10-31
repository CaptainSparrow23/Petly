import { useGlobalContext } from '@/lib/GlobalProvider';
import { ProfilePicture } from '@/components/other/ProfilePicture';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { router } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import { Cat, Home, Settings, Store, UsersRound, BarChart3, LogOut } from 'lucide-react-native';
import React, { useState } from 'react';
import { Text, TouchableOpacity, View, Alert, ActivityIndicator } from 'react-native';

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
    <View style={{ flex: 1 }}>
      <DrawerContentScrollView {...props}>
        <TouchableOpacity
          className="py-5 bg-primary-100 items-center"
          onPress={() => router.replace('/(tabs)/settings')}
          activeOpacity={0.7}
        >
          <ProfilePicture
            profileId={userProfile?.profileId || null}
            size={128}
            className="border-4 border-white shadow-lg"
          />
          <Text className="text-2xl mt-2 font-semibold text-black-300">{displayName}</Text>
          <Text className="text-m mt-1 text-gray-600 mb-5">
            {username ? `@${username}` : 'No username set'}
          </Text>
        </TouchableOpacity>

        <DrawerItemList {...props} />
      </DrawerContentScrollView>

      {/* Logout Button at Bottom */}
      <View className="p-4 pb-8">
        <TouchableOpacity
          className="flex-row items-center py-3 px-4 rounded-full"
          style={{ backgroundColor: isLogoutConfirm ? '#fee2e2' : '#f3f4f6' }}
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
            className="text-base font-rubik-medium"
            style={{ color: isLogoutConfirm ? '#dc2626' : '#ef4444' }}
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
        headerStyle: { backgroundColor: '#fff', borderBottomWidth: 0, elevation: 0, shadowOpacity: 0 },
        headerTitleStyle: { fontWeight: '600', color: '#000' },
        headerTintColor: '#000',
        drawerStyle: { width: 250 },
        drawerActiveBackgroundColor: '#191d31',
        drawerInactiveBackgroundColor: 'transparent',
        drawerActiveTintColor: '#ffffff',
        drawerInactiveTintColor: '#1f2937',
        drawerType: 'front',
        swipeEnabled: true,
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          title: '',
          headerTitle: () => null,
          // headerRight removed (coins)
          drawerLabel: 'Focus',
          drawerIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Drawer.Screen
        name="insights"
        options={({ navigation }) => ({
          title: 'Insights',
          // Keep profile picture right action (no coins)
          headerRight: () => {
            const { userProfile } = useGlobalContext();
            return (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => navigation.navigate('settings')}
                style={{ marginRight: 16 }}
              >
                <ProfilePicture
                  profileId={userProfile?.profileId || null}
                  size={40}
                  className="border-2 border-blue-100"
                />
              </TouchableOpacity>
            );
          },
          drawerIcon: ({ color, size }) => <BarChart3 color={color} size={size} />,
        })}
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
