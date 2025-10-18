import { Stack } from "expo-router";
import React from "react";

export default function AuthLayout() {
  return (
    <Stack 
      screenOptions={{ 
        headerShown: false,
        animation: 'none',
        presentation: 'card',
      }}
    >
      <Stack.Screen 
        name="sign-in" 
        options={{
          title: "Sign In",
          headerShown: false,
          animation: 'none',
        }}
      />
      <Stack.Screen 
        name="set-profile" 
        options={{
          title: "Set Profile",
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
    </Stack>
  );
}