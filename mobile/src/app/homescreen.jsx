import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';

// Initial mock items so you can preview the FlatList layout right away
const INITIAL_CLOSET = [
  {
    id: '1',
    uri: 'https://placehold.co/600x600/222222/FFFFFF/png?text=Vintage+Tee',
    prompt: 'Black graphic band t-shirt',
  },
  {
    id: '2',
    uri: 'https://placehold.co/600x600/4A6B82/FFFFFF/png?text=Baggy+Denim',
    prompt: 'Wide-leg embroidered jeans',
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const cameraRef = useRef(null);

  const [activeTab, setActiveTab] = useState('camera'); // 'camera' | 'closet'
  const [permission, requestPermission] = useCameraPermissions();
  const [promptText, setPromptText] = useState('');
  const [closetItems, setClosetItems] = useState(INITIAL_CLOSET);

  const handleTakePicture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      const newItem = {
        id: Date.now().toString(),
        uri: photo.uri,
        prompt: promptText.trim() || 'Captured outfit item',
      };
      setClosetItems((prev) => [newItem, ...prev]);
      setPromptText('');
      Alert.alert('Saved to Closet', 'Your photo has been added to the closet tab.');
    } catch (error) {
      Alert.alert('Camera Error', 'Could not capture photo.');
    }
  };

  const renderCameraBox = () => {
    // Permission state still loading
    if (!permission) {
      return <View style={styles.cameraBox} />;
    }

    // Permission not granted yet
    if (!permission.granted) {
      return (
        <View style={[styles.cameraBox, styles.permissionContainer]}>
          <Text style={styles.permissionText}>
            Camera access is needed to snap your outfits.
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
            activeOpacity={0.8}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Active Camera View
    return (
  <View style={styles.cameraBox}>
    <CameraView
      ref={cameraRef}
      style={StyleSheet.absoluteFill}
      facing="back"
      active={activeTab === 'camera'}
    />
    <View style={styles.shutterOverlay} pointerEvents="box-none">
      <TouchableOpacity
        style={styles.shutterButton}
        onPress={handleTakePicture}
        activeOpacity={0.7}
      />
    </View>
  </View>
);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Top Header: Centered FIT'D + Top-Right Profile Circle */}
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Text style={styles.logoTitle}>FIT’D</Text>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => router.push('/profile')}
          activeOpacity={0.8}
        />
      </View>

      {/* Two Pill Tabs: camera & closet */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[
            styles.tabPill,
            activeTab === 'camera' ? styles.tabPillActive : styles.tabPillInactive,
          ]}
          onPress={() => setActiveTab('camera')}
          activeOpacity={0.85}
        >
          <Text style={styles.tabText}>camera</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabPill,
            activeTab === 'closet' ? styles.tabPillActive : styles.tabPillInactive,
          ]}
          onPress={() => setActiveTab('closet')}
          activeOpacity={0.85}
        >
          <Text style={styles.tabText}>closet</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'camera' ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.cameraTabContent}
        >
          {renderCameraBox()}

          <TextInput
            style={styles.promptInput}
            placeholder="type prompt here..."
            placeholderTextColor="#0D0E10"
            value={promptText}
            onChangeText={setPromptText}
            multiline
            textAlign="center"
            textAlignVertical="center"
          />
        </KeyboardAvoidingView>
      ) : (
        <FlatList
          data={closetItems}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.closetList}
          renderItem={({ item }) => (
            <View style={styles.closetCard}>
              <Image source={{ uri: item.uri }} style={styles.closetImage} />
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6F8',
    paddingHorizontal: 22,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 24,
  },
  headerSpacer: {
    width: 44, // Balances the 44px profile circle so FIT'D stays dead-center
  },
  logoTitle: {
    fontSize: 38,
    fontWeight: '900',
    color: '#0D0E10',
    letterSpacing: -0.5,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0D0E10',
  },
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 22,
    gap: 24,
  },
  tabPill: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: '#0D0E10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabPillActive: {
    backgroundColor: '#D32238',
  },
  tabPillInactive: {
    backgroundColor: '#FFFFFF',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0D0E10',
  },
  cameraTabContent: {
    flex: 1,
    paddingBottom: 24,
    gap: 20,
  },
  cameraBox: {
    flex: 1,
    borderWidth: 3,
    borderColor: '#0D0E10',
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
  },
  shutterOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(209, 213, 219, 0.85)',
  },
  cameraPreview: {
    ...StyleSheet.absoluteFillObject,
  },
  shutterButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(209, 213, 219, 0.85)',
    marginBottom: 18,
  },
  permissionContainer: {
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 14,
  },
  permissionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0D0E10',
    textAlign: 'center',
  },
  permissionButton: {
    backgroundColor: '#D32238',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  promptInput: {
    height: 92,
    borderWidth: 3,
    borderColor: '#0D0E10',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    fontSize: 18,
    fontWeight: '800',
    color: '#0D0E10',
  },
  closetList: {
    paddingBottom: 32,
    gap: 18,
  },
  closetCard: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  closetImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
});