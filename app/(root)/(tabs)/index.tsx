import { MenuButton } from '@/components/MenuButton';
import React from 'react';
import { Text, View } from 'react-native';

const Index = () => {
  return (
    <View className="flex-1 bg-white">
      <MenuButton />
      
      <View className="flex-1 justify-center items-center font-bold">
        <Text>Timer Screen</Text>
      </View>
    </View>
  );
};

export default Index;