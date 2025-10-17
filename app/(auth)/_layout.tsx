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
        name="sign-up" 
        options={{
          title: "Sign Up",
          headerShown: false,
          animation: 'none',
        }}
      />
      <Stack.Screen 
        name="forgot-password" 
        options={{
          title: "Forgot Password",
          headerShown: false,
          animation: 'none',
        }}
      />
    </Stack>
  );
}