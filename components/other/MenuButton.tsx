import { DrawerActions } from '@react-navigation/native';
import { useNavigation, useSegments } from 'expo-router';
import React, { useMemo } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Menu } from 'lucide-react-native';
import { useNotifications } from '@/hooks/useNotifications';
import { CoralPalette } from '@/constants/colors';
import * as Haptics from 'expo-haptics';
import { useGlobalContext } from '@/providers/GlobalProvider';

export const MenuButton = () => {
  const navigation = useNavigation();
  const segments = useSegments();
  const { appSettings } = useGlobalContext();
  
  // Get current route path from segments
  const currentRoute = useMemo(() => {
    return segments.join('/');
  }, [segments]);
  
  const notifications = useNotifications(currentRoute);

  return (
    <TouchableOpacity 
      className="p-3 rounded-lg ml-3 mt-2"
      onPressIn={() => {
        if (appSettings.vibrations) {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        }
      }}
      onPress={() => {
        navigation.dispatch(DrawerActions.toggleDrawer());
      }}
      style={{ 
        position: 'relative',
        backgroundColor: CoralPalette.primaryMuted,
      }}
    >
      <Menu size={24} color={CoralPalette.white} />
      {notifications.hasAny && (
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
