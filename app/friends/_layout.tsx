import { Stack } from "expo-router";

export default function FriendsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        gestureEnabled: true,
        gestureDirection: "horizontal",
        fullScreenGestureEnabled: true,
      }}
    >
      <Stack.Screen
        name="friendProfile"
        options={{
          presentation: "card",
        }}
      />
      <Stack.Screen name="search" />
    </Stack>
  );
}