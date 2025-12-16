import { DrawerActions } from '@react-navigation/native';
import { useNavigation } from 'expo-router';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Menu } from 'lucide-react-native';
import { useHasUnclaimedRewards } from '@/utils/hasUnclaimedRewards';
import { useHasFriendRequests } from '@/utils/hasFriendRequests';
import { CoralPalette } from '@/constants/colors';

export const MenuButton = () => {
  const navigation = useNavigation();
  const hasUnclaimedRewards = useHasUnclaimedRewards();
  const hasFriendRequests = useHasFriendRequests();

  return (
    <TouchableOpacity 
      className="p-2.5 rounded-lg ml-2"
      onPress={() => {
        navigation.dispatch(DrawerActions.toggleDrawer());
      }}
      style={{ 
        position: 'relative',
        backgroundColor: CoralPalette.primaryMuted,
      }}
    >
      <Menu size={24} color={CoralPalette.white} />
      {(hasUnclaimedRewards || hasFriendRequests) && (
        <View
          style={{
            position: 'absolute',
            top: 4,
            right: 4,
            width: 12,
            height: 12,
            borderRadius: 5,
            backgroundColor: '#FF3B30',
          }}
        />
      )}
    </TouchableOpacity>
  );
};
