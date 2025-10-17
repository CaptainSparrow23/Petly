import { useGlobalContext } from '@/lib/global-provider';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { router } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import { Cat, Home, Settings, Store, UserRound, UsersRound } from 'lucide-react-native';
import React from 'react';
import { Image, Text, TouchableOpacity } from 'react-native';

const CustomDrawerContent = (props: any) => {
  const { user } = useGlobalContext();
  const firstName = user?.name?.split(' ')[0];
  
  return (
    <DrawerContentScrollView {...props}>
      <TouchableOpacity 
        className="py-5 bg-primary-100 items-center"
        onPress={() => router.push('/(root)/(tabs)/settings')}
        activeOpacity={0.7}
      >
        <Image 
          source={{uri: user?.avatar}} 
          className="w-32 h-32 rounded-full" 
        />
        <Text className="text-lg mt-5 font-rubik-bold text-black-300">Welcome {firstName}!</Text>
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
        }
      }}>
      <Drawer.Screen name='index' options={{ 
        title: 'Focus', drawerIcon: ({color, size}) => <Home color={color} size={size} />
      }} />
        <Drawer.Screen name='account' options={{ 
          title: 'Account', drawerIcon: ({color, size}) => <UserRound color={color} size={size} />
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