// frontend/_layout.js
import React from 'react';
import { Stack } from 'expo-router';
import { ThemeProvider } from './contexts/ThemeContext';

export default function Layout() {
  return (
    <ThemeProvider>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerTintColor: '#6a1b9a',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerShadowVisible: false,
        }}
      >
        {/* your screens here */}
        <Stack.Screen name="index" options={{ title: 'Home', headerShown: false }} />
        <Stack.Screen name="login" options={{ title: 'Login', presentation: 'card' }} />
        <Stack.Screen name="signup" options={{ title: 'Sign Up', presentation: 'card' }} />
        <Stack.Screen name="babyprofile" options={{ title: 'Baby Profile', presentation: 'card' }} />
        <Stack.Screen name="dashboard" options={{ title: 'Dashboard', presentation: 'card' }} />
      </Stack>
    </ThemeProvider>
  );
}
