import { Stack } from 'expo-router';

export default function AccountLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: false,
        gestureDirection: 'horizontal',
        fullScreenGestureEnabled: false,
      }}
    >
      <Stack.Screen 
        name="profile" 
        options={{
          presentation: 'card',
          animation: 'slide_from_right',
          gestureEnabled: false,
          gestureDirection: 'horizontal',
          fullScreenGestureEnabled: false,
        }}
      />
    </Stack>
  );
}

