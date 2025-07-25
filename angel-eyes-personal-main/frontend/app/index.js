import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, SafeAreaView, Image, StatusBar } from "react-native";
import { Link } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

export default function Page() {
  const { isDarkMode, toggleTheme, currentColors } = useTheme();

  return (
    <ImageBackground
      source={{ uri: 'https://via.placeholder.com/600x1200' }}
      style={styles.backgroundImage}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: currentColors.overlay }]}>
        <StatusBar 
          translucent 
          backgroundColor="transparent" 
          barStyle={isDarkMode ? "light-content" : "dark-content"}
        />

        {/* Theme Toggle Button */}
        <TouchableOpacity 
          style={[styles.themeToggle, { backgroundColor: currentColors.surface }]} 
          onPress={toggleTheme}
        >
          <Ionicons 
            name={isDarkMode ? "sunny" : "moon"} 
            size={24} 
            color={currentColors.primary} 
          />
        </TouchableOpacity>

        <View style={styles.logoContainer}>
          <View style={[styles.logo, { 
            backgroundColor: currentColors.background,
            borderColor: currentColors.primary 
          }]}>
            {/* App Logo */}
            <Image 
              source={require('../assets/logo/8.png')} 
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={[styles.appName, { color: currentColors.primary }]}>Angel Eyes</Text>
          <Text style={[styles.tagline, { color: currentColors.accent }]}>Advanced Baby Monitoring Solution</Text>
        </View>

        <View style={[styles.welcomeContainer, { backgroundColor: currentColors.cardBackground }]}>
          <Text style={[styles.angelEyesText, { color: currentColors.secondary }]}>Welcome Dear Parent</Text>
          <Text style={[styles.description, { color: currentColors.textSecondary }]}>
            AI-Powered protection for your little one, monitoring their safety and well-being 24/7.
          </Text>
        </View>

        <View style={styles.buttonContainer}>
  <Link href="/login" asChild>
    <TouchableOpacity style={styles.loginButton}>
      <Text style={styles.buttonText}>Login</Text>
    </TouchableOpacity>
  </Link>

<Link href="/signup" asChild>
    <TouchableOpacity style={styles.signupButton}>
      <Text style={styles.buttonText}>Signup</Text>
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
  themeToggle: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1000,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  logo: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 3,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
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
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
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
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  loginButton: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: '#6A1B9A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  signupButton: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: '#6A1B9A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

});
