import { useGlobalContext } from '@/lib/global-provider';
import { ProfilePicture } from '@/components/other/ProfilePicture';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { router } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import { Cat, Home, Settings, Store, UserRound, UsersRound, BarChart3 } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

const CustomDrawerContent = (props: any) => {
  const { userProfile } = useGlobalContext();
  const displayName = userProfile?.displayName || 'User';
  const username = userProfile?.username;
  
  return (
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
        <Text className="text-m mt-1 font-rubik-bold text-gray-500">
          {username ? `@${username}` : 'No username set'}
        </Text>
        <View className="h-px bg-gray-200 mt-6 -mb-2 w-[90%] align-center" />
      </TouchableOpacity>
      <DrawerItemList {...props} />
    </DrawerContentScrollView>
  );
};

const DrawerLayout = () => {
  return (
    <Drawer 
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{ 
        headerShown: true,
        headerStyle: {
          backgroundColor: '#fff',
          borderBottomWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: {
          fontWeight: '600',
          color: '#000',
        },
        headerTintColor: '#000',
        drawerStyle: {
          width: 250,
        },
        drawerType: 'front',
        swipeEnabled: true,
      }}>
      <Drawer.Screen name='index' options={{ 
        title: '',
        headerTitle: () => null,
        drawerLabel: 'Focus',
        drawerIcon: ({color, size}) => <Home color={color} size={size} />
      }} />
      <Drawer.Screen name='insights' options={({ navigation }) => ({ 
        title: 'Insights',
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
        drawerIcon: ({color, size}) => <BarChart3 color={color} size={size} />
      })} />
      <Drawer.Screen name='pets' options={{ 
        title: 'My Pets', 
        drawerIcon: ({color, size}) => <Cat color={color} size={size} />
      }} />
      <Drawer.Screen name='store' options={{ 
        title: 'Store', 
        drawerIcon: ({color, size}) => <Store color={color} size={size} />
      }} />
      <Drawer.Screen name='friends' options={{ 
        title: 'Friends', 
        drawerIcon: ({color, size}) => <UsersRound color={color} size={size} />
      }} />
      <Drawer.Screen name='settings' options={{ 
        title: 'Settings', 
        drawerIcon: ({color, size}) => <Settings color={color} size={size} />
      }} />
    </Drawer>
  )
}

export default DrawerLayout
