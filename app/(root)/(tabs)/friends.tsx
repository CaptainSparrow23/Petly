import { MenuButton } from '@/components/MenuButton';
import React from 'react';
import { Text, View } from 'react-native';


const Friends = () => {
  return (
    <View className="flex-1 bg-white">
      <MenuButton />
      
      <View className="flex-1 justify-center items-center">
        <Text>Friends List</Text>
      </View>
    </View>
  );
};

export default Friends;