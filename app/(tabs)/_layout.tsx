import { useGlobalContext } from '@/lib/global-provider';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { router } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import { Cat, Home, Settings, Store, UserRound, UsersRound, BarChart3 } from 'lucide-react-native';
import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';

const CustomDrawerContent = (props: any) => {
  const { user } = useGlobalContext();
  const firstName = user?.name;
  const username = user?.username;
  
  return (
    <DrawerContentScrollView {...props}>
      <TouchableOpacity 
        className="py-5 bg-primary-100 items-center"
        onPress={() => router.replace('/(tabs)/settings')}
        activeOpacity={0.7}
      >
        <Image 
          source={{uri: user?.avatar}} 
          className="w-32 h-32 rounded-full" 
        />
        <Text className="text-2xl mt-2 font-semibold text-black-300">{firstName}</Text>
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
        headerShown: false,
        drawerStyle: {
          width: 250, // Adjust this value to make drawer narrower (default is usually 280-300)
        },
        drawerType: 'front',
        swipeEnabled: true,
      }}>
      <Drawer.Screen name='index' options={{ 
        title: 'Focus', drawerIcon: ({color, size}) => <Home color={color} size={size} />
      }} />
        <Drawer.Screen name='insights' options={{ 
          title: 'Insights', drawerIcon: ({color, size}) => <BarChart3 color={color} size={size} />
        }} />
      <Drawer.Screen name='pets' options={{ 
        title: 'My Pets', drawerIcon: ({color, size}) => <Cat color={color} size={size} />
      }} />
      <Drawer.Screen name='store' options={{ 
        title: 'Store', drawerIcon: ({color, size}) => <Store color={color} size={size} />
      }} />
      <Drawer.Screen name='friends' options={{ 
        title: 'Friends', drawerIcon: ({color, size}) => <UsersRound color={color} size={size} />
      }} />
      <Drawer.Screen name='settings' options={{ 
        title: 'Settings', drawerIcon: ({color, size}) => <Settings color={color} size={size} />
      }} />
    </Drawer>
  )
}

export default DrawerLayout
