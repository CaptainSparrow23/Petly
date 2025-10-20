import FocusTimer from '@/components/focus/FocusTimer';
import { MenuButton } from '@/components/other/MenuButton';
import { Banner } from '@/components/other/Banner';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';

const Index = () => {
  const { loggedIn } = useLocalSearchParams();
  const [showBanner, setShowBanner] = useState(false);

  // Show banner if user just logged in
  useEffect(() => {
    if (loggedIn === "true") {
      setShowBanner(true);
    }
  }, [loggedIn]);

  return (
    <View className="flex-1 bg-white">
      <Banner
        message="Successfully logged in"
        type="success"
        visible={showBanner}
        onHide={() => setShowBanner(false)}
        duration={3000}
      />
      <FocusTimer headerLeft={<MenuButton />} />
    </View>
  );
};

export default Index;
