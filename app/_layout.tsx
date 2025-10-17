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
        }} 
      />
    </GlobalProvider>
  );
}
