import FocusTimer from '@/components/focus/FocusTimer';
import { useGlobalContext } from '@/lib/global-provider';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect } from 'react';
import { View } from 'react-native';

const Index = () => {
  const { loggedIn } = useLocalSearchParams();
  const { showBanner } = useGlobalContext();

  // Show banner if user just logged in
  useEffect(() => {
    if (loggedIn === "true") {
      showBanner("Successfully logged in", "success");
    }
  }, [loggedIn]);

  return (
    <View className="flex-1 bg-white">
      <FocusTimer />
    </View>
  );
};

export default Index;
