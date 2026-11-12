import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';

export default function SignupScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const handleSignup = () => {
    if (!username.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Missing Info', 'Please fill in username, email, and password.');
      return;
    }
    Alert.alert('Account Created', `Welcome, ${username}!`);
    // Later, replace this with your API call and router.replace('/dashboard')
    if (router.canGoBack()) {
    router.dismissAll();
    }
    router.replace('/homescreen');
  };

  return (
    <View style={styles.overlay}>
      {/* Tapping the top blank area dismisses the sheet back to the landing screen */}
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={handleClose}
      />

      {/* Bottom Sheet Card */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.sheet}
      >
        {/* Header Row: X on left, centered "signup" */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.closeText}>X</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>signup</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Form Fields */}
          <View style={styles.form}>
            <Text style={styles.label}>username</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />

            <Text style={[styles.label, { marginTop: 18 }]}>email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Text style={[styles.label, { marginTop: 18 }]}>password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {/* Bottom Red Pill Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.signupButton}
              activeOpacity={0.85}
              onPress={handleSignup}
            >
              <Text style={styles.signupButtonText}>signup</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    height: '82%',
    backgroundColor: '#E5E7EB',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  closeText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0D0E10',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0D0E10',
  },
  headerSpacer: {
    width: 24,
  },
  scrollContent: {
    paddingBottom: 36,
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0D0E10',
    marginBottom: 6,
    marginLeft: 2,
  },
  input: {
    height: 52,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#0D0E10',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#0D0E10',
  },
  footer: {
    marginTop: 36,
    alignItems: 'center',
  },
  signupButton: {
    width: '68%',
    paddingVertical: 15,
    backgroundColor: '#D32238',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signupButtonText: {
    color: '#F3F4F6',
    fontSize: 24,
    fontWeight: '800',
  },
});