import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>X</Text>
        </TouchableOpacity>
        <Text style={styles.title}>profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.body}>
        <Text style={styles.placeholderText}>Profile management coming soon.</Text>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => router.replace('/')}
        >
          <Text style={styles.logoutText}>log out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6F8',
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  backText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0D0E10',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0D0E10',
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
  },
  logoutButton: {
    backgroundColor: '#0D0E10',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 999,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});