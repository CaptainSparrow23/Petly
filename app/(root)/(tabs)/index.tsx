import FocusTimer from '@/components/FocusTimer';
import { MenuButton } from '@/components/MenuButton';
import React from 'react';
import { View } from 'react-native';

const Index = () => {
  return (
    <View className="flex-1 bg-white">
      <FocusTimer headerLeft={<MenuButton />} />
    </View>
  );
};

export default Index;
