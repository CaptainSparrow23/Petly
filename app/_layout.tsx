import GlobalProvider from "@/lib/GlobalProvider";
import { Stack } from "expo-router";
import 'react-native-gesture-handler';
import "./global.css";
import { SheetProvider } from "react-native-actions-sheet";
import "@/components/store/register-sheets";
import { useEffect } from "react";
import { Text, TextInput } from "react-native";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";

SplashScreen.preventAutoHideAsync().catch(() => null);

const applyDefaultFont = () => {
  const TextAny = Text as any;
  const TextInputAny = TextInput as any;

  if (!TextAny.defaultProps) TextAny.defaultProps = {};
  TextAny.defaultProps.style = {
    ...(TextAny.defaultProps.style as object | undefined),
    fontFamily: "Nunito",
  };

  if (!TextInputAny.defaultProps) TextInputAny.defaultProps = {};
  TextInputAny.defaultProps.style = {
    ...(TextInputAny.defaultProps.style as object | undefined),
    fontFamily: "Nunito",
  };
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Nunito: require("@/assets/fonts/Nunito-VariableFont_wght.ttf"),
    "Nunito-Italic": require("@/assets/fonts/Nunito-Italic-VariableFont_wght.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) {
      applyDefaultFont();
      SplashScreen.hideAsync().catch(() => null);
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SheetProvider>
      <GlobalProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "none",
            presentation: "card",
            gestureEnabled: false,
          }}
        >
          <Stack.Screen
            name="(tabs)"
            options={{
              animation: "none",
              gestureEnabled: false,
            }}
          />
          <Stack.Screen
            name="(auth)"
            options={{
              animation: "none",
              gestureEnabled: false,
            }}
          />
          <Stack.Screen
            name="settings"
            options={{
              animation: "slide_from_right",
              gestureEnabled: true,
              gestureDirection: "horizontal",
              fullScreenGestureEnabled: true,
            }}
          />
          <Stack.Screen
            name="friends"
            options={{
              animation: "slide_from_right",
              gestureEnabled: true,
              gestureDirection: "horizontal",
              fullScreenGestureEnabled: true,
            }}
          />
        </Stack>
      </GlobalProvider>
    </SheetProvider>
  );
}
