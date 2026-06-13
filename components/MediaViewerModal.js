import React, { useState } from 'react';
import {
  Modal,
  View,
  Image,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Alert,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { detectMediaType } from '../services/MediaService';

let VideoPlayer = null;
try {
  VideoPlayer = require('react-native-video').default;
} catch (error) {
  // Optional: npm install react-native-video for in-app video playback
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const MediaViewerModal = ({ visible, uri, onClose, title }) => {
  const [loading, setLoading] = useState(true);
  const mediaType = uri ? detectMediaType(uri) : null;

  if (!visible || !uri) {
    return null;
  }

  const openExternally = () => {
    Linking.openURL(uri).catch(() => {
      Alert.alert('Cannot open media', uri);
    });
  };

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
          {title ? <Text style={styles.title} numberOfLines={1}>{title}</Text> : null}
        </View>

        <View style={styles.body}>
          {mediaType === 'video' && VideoPlayer ? (
            <>
              {loading ? (
                <ActivityIndicator size="large" color="#D4AF37" style={styles.loader} />
              ) : null}
              <VideoPlayer
                source={{ uri }}
                style={styles.video}
                resizeMode="contain"
                controls
                onLoad={() => setLoading(false)}
                onError={() => {
                  setLoading(false);
                  openExternally();
                }}
              />
            </>
          ) : mediaType === 'video' ? (
            <View style={styles.fallback}>
              <Text style={styles.fallbackText}>Video preview requires react-native-video</Text>
              <TouchableOpacity style={styles.openBtn} onPress={openExternally}>
                <Text style={styles.openBtnText}>Open video</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {loading ? (
                <ActivityIndicator size="large" color="#D4AF37" style={styles.loader} />
              ) : null}
              <Image
                source={{ uri }}
                style={styles.image}
                resizeMode="contain"
                onLoadEnd={() => setLoading(false)}
                onError={() => setLoading(false)}
              />
            </>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  closeBtn: { padding: 8, marginRight: 8 },
  closeText: { color: '#D4AF37', fontSize: 22, fontWeight: '700' },
  title: { flex: 1, color: '#fff', fontSize: 16 },
  body: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  image: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT * 0.75 },
  video: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT * 0.75 },
  loader: { position: 'absolute' },
  fallback: { padding: 24, alignItems: 'center' },
  fallbackText: { color: '#ccc', textAlign: 'center', marginBottom: 16 },
  openBtn: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  openBtnText: { color: '#000', fontWeight: '700' },
});

export default MediaViewerModal;
