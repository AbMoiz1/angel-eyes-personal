import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ImageBackground,
  SafeAreaView, Image, StatusBar
} from "react-native";
import { Link } from "expo-router";
import { useTheme } from './contexts/ThemeContext';

export default function Page() {
  const { isDark, toggleTheme, colors } = useTheme();

  return (
    <ImageBackground
      source={{ uri: 'https://via.placeholder.com/600x1200' }}
      style={styles.backgroundImage}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.card }]}>
        <StatusBar translucent backgroundColor="transparent" />

        {/* Toggle Button at top right */}
        <View style={styles.topRight}>
          <TouchableOpacity style={[styles.toggleButton, { borderColor: colors.text }]} onPress={toggleTheme}>
            <Text style={{ color: colors.text }}>
              Switch to {isDark ? 'Light' : 'Dark'} Mode
            </Text>
          </TouchableOpacity>
        </View>

        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Image source={require('../assets/logo/8.png')} style={styles.logoImage} resizeMode="contain" />
          </View>
          <Text style={[styles.appName, { color: colors.text }]}>Angel Eyes</Text>
          <Text style={[styles.tagline, { color: colors.text }]}>
            Advanced Baby Monitoring Solution
          </Text>
        </View>

        {/* Welcome Box */}
        <View style={[styles.welcomeContainer, { backgroundColor: isDark ? '#1E1E1E' : 'rgba(255, 255, 255, 0.7)' }]}>
          <Text style={[styles.angelEyesText, { color: colors.text }]}>Welcome Dear Parent</Text>
          <Text style={[styles.description, { color: colors.text }]}>
            AI-Powered protection for your little one, monitoring their safety and well-being 24/7.
          </Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <Link href="/login" asChild>
            <TouchableOpacity style={[styles.loginButton, { backgroundColor: colors.button }]}>
              <Text style={[styles.buttonText, { color: colors.text }]}>Login</Text>
            </TouchableOpacity>
          </Link>

          <Link href="/signup" asChild>
            <TouchableOpacity style={[styles.signupButton, { backgroundColor: colors.button }]}>
              <Text style={[styles.buttonText, { color: colors.text }]}>Signup</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    resizeMode: 'cover',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  topRight: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
  },
  toggleButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderRadius: 8,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 80,
  },
  logo: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 3,
    borderColor: '#fff',
    backgroundColor: '#fff',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  logoImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    marginTop: 10,
  },
  tagline: {
    fontSize: 16,
    marginTop: 5,
    textAlign: 'center',
  },
  welcomeContainer: {
    marginTop: 30,
    alignItems: 'center',
    paddingHorizontal: 20,
    padding: 20,
    borderRadius: 15,
  },
  angelEyesText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 10,
  },
  buttonContainer: {
    width: '100%',
    marginTop: 30,
    marginBottom: 40,
    alignItems: 'center',
  },
  loginButton: {
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  signupButton: {
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
