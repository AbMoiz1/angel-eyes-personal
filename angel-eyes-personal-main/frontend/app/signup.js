import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';
import authService from '../services/auth';
import apiClient from '../services/api';

export default function SignupScreen() {
  const router = useRouter();
  const { currentColors } = useTheme();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    try {
      setLoading(true);
      const result = await apiClient.testConnection();
      Alert.alert('Success', 'Connected to backend successfully!');
      console.log('Connection test result:', result);
    } catch (error) {
      Alert.alert('Connection Failed', `Error: ${error.message}`);
      console.error('Connection test failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const result = await authService.register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        password,
        confirmPassword
      });

      if (result.success) {
        Alert.alert(
          'Registration Successful', 
          `Welcome to Angel Eyes, ${result.user.firstName}!`,
          [
            {
              text: 'Continue',
              onPress: () => router.push('/babyprofile')
            }
          ]
        );
      } else {
        Alert.alert('Registration Failed', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.authContainer, { backgroundColor: currentColors.screenBackground }]}>
      <Text style={[styles.title, { color: currentColors.secondary }]}>Create Account</Text>

      <TextInput
        style={[styles.input, { 
          backgroundColor: currentColors.inputBackground,
          borderColor: currentColors.border,
          color: currentColors.text
        }]}
        placeholder="First Name"
        placeholderTextColor={currentColors.textSecondary}
        value={firstName}
        onChangeText={setFirstName}
        autoCapitalize="words"
        editable={!loading}
      />

      <TextInput
        style={[styles.input, { 
          backgroundColor: currentColors.inputBackground,
          borderColor: currentColors.border,
          color: currentColors.text
        }]}
        placeholder="Last Name"
        placeholderTextColor={currentColors.textSecondary}
        value={lastName}
        onChangeText={setLastName}
        autoCapitalize="words"
        editable={!loading}
      />

      <TextInput
        style={[styles.input, { 
          backgroundColor: currentColors.inputBackground,
          borderColor: currentColors.border,
          color: currentColors.text
        }]}
        placeholder="Email"
        placeholderTextColor={currentColors.textSecondary}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        editable={!loading}
      />

      <TextInput
        style={[styles.input, { 
          backgroundColor: currentColors.inputBackground,
          borderColor: currentColors.border,
          color: currentColors.text
        }]}
        placeholder="Password"
        placeholderTextColor={currentColors.textSecondary}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!loading}
      />

      <TextInput
        style={[styles.input, { 
          backgroundColor: currentColors.inputBackground,
          borderColor: currentColors.border,
          color: currentColors.text
        }]}
        placeholder="Confirm Password"
        placeholderTextColor={currentColors.textSecondary}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        editable={!loading}
      />

      <TouchableOpacity 
        style={[
          styles.button, 
          { backgroundColor: currentColors.buttonBackground },
          loading && styles.buttonDisabled
        ]} 
        onPress={handleSignup} 
        activeOpacity={0.8}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={currentColors.buttonText} />
        ) : (
          <Text style={[styles.buttonText, { color: currentColors.buttonText }]}>Sign Up</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={() => router.push('/login')}
        disabled={loading}
      >
        <Text style={[styles.linkText, { color: currentColors.secondary }]}>Already have an account? Log in</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  authContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    marginBottom: 30,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  input: {
    width: '100%',
    height: 55,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 20,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  testButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 12,
    marginBottom: 10,
    width: '100%',
    alignItems: 'center',
  },
  testButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    marginBottom: 15,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  linkText: {
    marginTop: 15,
    textDecorationLine: 'underline',
    fontSize: 16,
    textAlign: 'center',
  },
});