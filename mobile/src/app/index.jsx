import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Big Title */}
      <Text style={styles.title}>FIT’D</Text>

      {/* Button Group */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.loginButton]}
          activeOpacity={0.8}
          onPress={() => router.push('/login')}
        >
          <Text style={styles.buttonText}>login</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.signupButton]}
          activeOpacity={0.8}
          onPress={() => router.push('/signup')}
        >
          <Text style={styles.buttonText}>signup</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6F8', // Soft off-white background
    alignItems: 'center',       // Centers everything horizontally
    justifyContent: 'center',   // Centers the group vertically
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 64,               // Large display size
    fontWeight: '900',          // Extra bold / Black weight
    color: '#0D0E10',           // Deep black text
    letterSpacing: -1,          // Tightens letter spacing slightly like modern display fonts
    marginBottom: 110,          // Creates the wide gap between the title and the buttons
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 20,                    // Space between the login and signup buttons
  },
  button: {
    width: '75%',               // Matches the pill width relative to screen
    paddingVertical: 16,
    borderRadius: 999,          // Full pill shape
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButton: {
    backgroundColor: '#D32238', // Crimson red
  },
  signupButton: {
    backgroundColor: '#0D0E10', // Solid black
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
});