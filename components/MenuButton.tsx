import { DrawerActions } from '@react-navigation/native';
import { useNavigation } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity } from 'react-native';

export const MenuButton = () => {
  const navigation = useNavigation();

  return (
    <TouchableOpacity 
      className="absolute top-[50px] left-5 z-10 p-2.5 bg-white/90 rounded-lg"
      onPress={() => {
        navigation.dispatch(DrawerActions.toggleDrawer());
      }}
    >
      <Text className="text-[28px] text-black">☰</Text>
    </TouchableOpacity>
  );
};
