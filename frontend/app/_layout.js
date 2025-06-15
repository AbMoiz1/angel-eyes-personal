import React from 'react';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function Layout() {
  return (
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
      <Stack.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="login"
        options={{
          title: 'Login',
          headerBackTitleVisible: false,
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="signup"
        options={{
          title: 'Sign Up',
          headerBackTitleVisible: false,
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="babyprofile"
        options={{
          title: 'Baby Profile',
          headerBackTitleVisible: false,
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          headerBackTitleVisible: false,
          presentation: 'card',
          headerRight: () => (
            <Ionicons name="settings-outline" size={24} color="#512da8" style={{ marginRight: 15 }} />
          ),
        }}
      />
    </Stack>
  );
}
