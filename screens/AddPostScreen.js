import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import api from '../services/api';
import { useTranslation } from '../hooks/useTranslation';
import { uploadImageAsset } from '../services/uploadImageService';
import { getApiErrorMessage } from '../utils/apiError';

const AddPostScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const pickImage = () => {
    const options = { mediaType: 'photo', quality: 0.8 };

    launchImageLibrary(options, async (response) => {
      if (response.didCancel) return;
      if (response.error) {
        Alert.alert(t('common.error'), t('properties.pickImageFailed'));
        return;
      }

      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        setUploading(true);

        try {
          const { url } = await uploadImageAsset(asset);
          setImageUrl(url);
          Alert.alert(t('common.success'), t('posts.imageUploaded'));
        } catch (error) {
          Alert.alert(t('common.error'), getApiErrorMessage(error, t('properties.uploadImageFailed')));
        } finally {
          setUploading(false);
        }
      }
    });
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      Alert.alert(t('common.error'), t('posts.enterContent'));
      return;
    }

    setLoading(true);
    try {
      const postData = { content };
      if (imageUrl) postData.imageUrl = imageUrl;
      await api.post('/posts', postData);
      Alert.alert(t('common.success'), t('posts.createdSuccess'));
      navigation.goBack();
    } catch (error) {
      Alert.alert(t('common.error'), error.response?.data?.message || t('posts.createFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{t('posts.createNewPost')}</Text>

      <Text style={styles.label}>{t('posts.contentLabel')}</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={content}
        onChangeText={setContent}
        placeholder={t('posts.whatsOnMind')}
        placeholderTextColor="#888"
        multiline
        numberOfLines={6}
      />

      <Text style={styles.label}>{t('posts.addImageOptional')}</Text>

      <TouchableOpacity style={styles.mediaButton} onPress={pickImage} disabled={uploading}>
        {uploading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.mediaButtonText}>📷 {t('posts.selectFromGallery')}</Text>
        )}
      </TouchableOpacity>

      {imageUrl ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: `${BASE_URL.replace('/api', '')}${imageUrl}` }} style={styles.previewImage} />
          <TouchableOpacity style={styles.removeButton} onPress={() => setImageUrl('')}>
            <Text style={styles.removeText}>✕ {t('posts.remove')}</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
        <Text style={styles.submitButtonText}>
          {loading ? t('posts.creating') : t('posts.createPost')}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#000000' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, color: '#D4AF37' },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 5, marginTop: 10, color: '#D4AF37' },
  input: { borderWidth: 1, borderColor: '#D4AF37', padding: 12, borderRadius: 8, fontSize: 16, marginBottom: 10, backgroundColor: '#1a1a1a', color: '#D4AF37' },
  textArea: { height: 150, textAlignVertical: 'top' },
  mediaButton: { backgroundColor: '#D4AF37', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10, marginBottom: 10 },
  mediaButtonText: { color: '#000000', fontSize: 16, fontWeight: '600' },
  previewContainer: { marginTop: 10, marginBottom: 10, position: 'relative' },
  previewImage: { width: '100%', height: 200, borderRadius: 8, resizeMode: 'cover' },
  removeButton: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.7)', padding: 8, borderRadius: 8 },
  removeText: { color: '#D4AF37', fontSize: 12, fontWeight: 'bold' },
  submitButton: { backgroundColor: '#D4AF37', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 20, marginBottom: 30 },
  submitButtonText: { color: '#000000', fontSize: 18, fontWeight: '600' },
});

export default AddPostScreen;
