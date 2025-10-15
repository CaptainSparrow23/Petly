import FocusTimer from '@/components/FocusTimer';
import { MenuButton } from '@/components/MenuButton';
import React from 'react';
import { View, Text} from 'react-native';

    
const Index = () => {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <MenuButton />
       <FocusTimer />
    </View>
  );
};

export default Index;