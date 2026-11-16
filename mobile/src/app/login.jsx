import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const handleLogin = () => {
    if (!identifier.trim() || !password.trim()) {
      Alert.alert('Missing Info', 'Please enter your username/email and password.');
      return;
    }
    Alert.alert('Success', `Logged in as ${identifier}`);
    // Later, replace this with API call and router.replace('/dashboard')
    if (router.canGoBack()) {
    router.dismissAll();
    }
    router.replace('/homescreen');
  };

  return (
    <View style={styles.overlay}>
      {/* Tapping top area closes the modal */}
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
        {/* Header Row */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.closeText}>X</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>login</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Form Fields */}
        <View style={styles.form}>
          <Text style={styles.label}>username/email</Text>
          <TextInput
            style={styles.input}
            value={identifier}
            onChangeText={setIdentifier}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={[styles.label, { marginTop: 22 }]}>password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        {/* Bottom Red Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.loginButton}
            activeOpacity={0.85}
            onPress={handleLogin}
          >
            <Text style={styles.loginButtonText}>login</Text>
          </TouchableOpacity>
        </View>
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
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 48,
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
    marginTop: 56,
    alignItems: 'center',
  },
  loginButton: {
    width: '68%',
    paddingVertical: 15,
    backgroundColor: '#D32238',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    color: '#F3F4F6',
    fontSize: 24,
    fontWeight: '800',
  },
});