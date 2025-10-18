import GlobalProvider from "@/lib/global-provider";
import { Stack } from "expo-router";
import 'react-native-gesture-handler';
import "./global.css";


export default function RootLayout() {
  return (
    <GlobalProvider>
      <Stack 
        screenOptions={{ 
          headerShown: false,
          animation: 'none',
          presentation: 'card',
          gestureEnabled: false,
        }} 
      >
        <Stack.Screen 
          name="(auth)" 
          options={{
            animation: 'none',
            gestureEnabled: false,
          }}
        />
        <Stack.Screen 
          name="settings" 
          options={{
            animation: 'slide_from_right',
            gestureEnabled: true,
            gestureDirection: 'horizontal',
            fullScreenGestureEnabled: true,
          }}
        />
        <Stack.Screen 
          name="friends" 
          options={{
            animation: 'slide_from_right',
            gestureEnabled: true,
            gestureDirection: 'horizontal',
            fullScreenGestureEnabled: true,
          }}
        />
      </Stack>
    </GlobalProvider>
  );
}
