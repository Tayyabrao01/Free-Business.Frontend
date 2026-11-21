import React, { useCallback, useEffect, useState } from 'react';
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
import {
  errorCodes,
  isErrorWithCode,
  pick,
  types,
} from '@react-native-documents/picker';
import api from '../services/api';
import { useTranslation } from '../hooks/useTranslation';
import { uploadImageAsset } from '../services/uploadImageService';
import { getApiErrorMessage } from '../utils/apiError';
import { resolveMediaUrl } from '../utils/imageUrl';
import { detectMediaType } from '../services/MediaService';
import Video from 'react-native-video';
import { captureMedia } from '../utils/captureMedia';

const AddPostScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const editingPost = route.params?.post;
  const isEditing = Boolean(editingPost?._id);
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [mediaUrls, setMediaUrls] = useState([]);
  const [media, setMedia] = useState([]);
  const sharedAssets = route.params?.sharedAssets;

  useEffect(() => {
    if (!editingPost) {
      return;
    }

    const existingMedia = Array.isArray(editingPost.media) && editingPost.media.length
      ? editingPost.media
      : editingPost.imageUrl
        ? [{ url: editingPost.imageUrl, type: detectMediaType(editingPost.imageUrl) }]
        : [];
    const existingUrls = Array.isArray(editingPost.mediaUrls)
      ? editingPost.mediaUrls.length
        ? editingPost.mediaUrls
        : existingMedia.map(item => item.url)
      : existingMedia.length
        ? existingMedia.map(item => item.url)
        : [];
    setContent(editingPost.content || '');
    setImageUrl(editingPost.imageUrl || existingUrls[0] || '');
    setMediaUrls(existingUrls);
    setMedia(existingMedia);
  }, [editingPost]);

  const attachSharedMedia = useCallback(
    async assets => {
      setUploading(true);
      try {
        const urls = [];
        const uploadedMedia = [];
        for (const asset of assets) {
          if (!/^(image|video|audio)\//i.test(asset.type || '')) {
            throw new Error('Only image, video, and audio files are supported.');
          }
          console.log('[post media] upload start', {
            mediaType: asset.type,
            fileName: asset.fileName,
          });
          const uploaded = await uploadImageAsset(asset);
          console.log('[post media] upload result', {
            mediaType: uploaded.mediaType,
            url: uploaded.url,
            success: true,
          });
          const { url, mediaType, thumbnailUrl } = uploaded;
          urls.push(url);
          uploadedMedia.push({ url, type: mediaType, thumbnailUrl });
        }
        setMediaUrls(previous => (isEditing ? [...previous, ...urls] : urls));
        setImageUrl(previous => (isEditing ? previous || urls[0] || '' : urls[0] || ''));
        setMedia(previous => (isEditing ? [...previous, ...uploadedMedia] : uploadedMedia));
      } catch (error) {
        console.error('[post media] upload result', {
          success: false,
          error,
        });
        Alert.alert(
          t('common.error'),
          error.message || 'Could not attach shared media.',
        );
      } finally {
        setUploading(false);
      }
    },
    [isEditing, t],
  );

  useEffect(() => {
    if (sharedAssets?.length) {
      attachSharedMedia(sharedAssets);
    }
  }, [attachSharedMedia, sharedAssets]);

  const pickImage = async () => {
    try {
      const selected = await pick({
        type: [
          types.images,
          types.video,
          types.audio,
        ],
        allowMultiSelection: true,
      });
      if (selected?.length) {
        await attachSharedMedia(
          selected.map(file => ({
            uri: file.fileCopyUri || file.uri,
            fileCopyUri: file.fileCopyUri,
            type: file.type,
            fileName: file.name,
            fileSize: file.size,
          })),
        );
      }
    } catch (error) {
      if (
        !isErrorWithCode(error) ||
        error.code !== errorCodes.OPERATION_CANCELED
      ) {
        Alert.alert(t('common.error'), getApiErrorMessage(error, 'Could not select media.'));
      }
    }
  };

  const capturePostMedia = async mediaType => {
    setUploading(true);
    try {
      const asset = await captureMedia({ mediaType });
      if (asset) {
        await attachSharedMedia([asset]);
      }
    } catch (error) {
      Alert.alert(t('common.error'), error.message || 'Could not capture media.');
    } finally {
      setUploading(false);
    }
  };

  const showCaptureOptions = () => {
    Alert.alert('Add media', 'Choose how to add media', [
      { text: 'Take Photo', onPress: () => capturePostMedia('photo') },
      { text: 'Record Video', onPress: () => capturePostMedia('video') },
      { text: 'Choose from Gallery', onPress: pickImage },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      Alert.alert(t('common.error'), t('posts.enterContent'));
      return;
    }

    setLoading(true);
    try {
      const postData = {
        content: content.trim(),
        imageUrl: imageUrl || '',
        mediaUrls,
        media,
      };
      if (isEditing) {
        await api.put(`/posts/${editingPost._id}`, postData);
      } else {
        await api.post('/posts', postData);
      }
      Alert.alert(t('common.success'), t('posts.createdSuccess'));
      navigation.goBack();
    } catch (error) {
      Alert.alert(
        t('common.error'),
        getApiErrorMessage(error, t('posts.createFailed')),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>
        {isEditing ? 'Edit post' : t('posts.createNewPost')}
      </Text>

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

      <TouchableOpacity
        style={styles.mediaButton}
        onPress={showCaptureOptions}
        disabled={uploading}
      >
        {uploading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.mediaButtonText}>
            📷 {t('posts.selectFromGallery')}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.mediaButton}
        onPress={showCaptureOptions}
        disabled={uploading}
        accessibilityLabel="Capture photo or video"
      >
        <Text style={styles.mediaButtonText}>📷 {t('posts.captureMedia')}</Text>
      </TouchableOpacity>

      {media.length ? (
        <View style={styles.previewContainer}>
          {media[0].type === 'image' ? (
            <Image source={{ uri: resolveMediaUrl(media[0].url) }} style={styles.previewImage} />
          ) : media[0].type === 'video' ? (
            <Video source={{ uri: resolveMediaUrl(media[0].url) }} style={styles.previewImage} paused controls />
          ) : (
            <Text style={styles.audioPreview}>Audio attached</Text>
          )}
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => {
              setImageUrl('');
              setMedia([]);
              setMediaUrls([]);
            }}
          >
            <Text style={styles.removeText}>✕ {t('posts.remove')}</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.submitButtonText}>
          {loading ? t('posts.creating') : t('posts.createPost')}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#000000' },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#D4AF37',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    marginTop: 10,
    color: '#D4AF37',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D4AF37',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 10,
    backgroundColor: '#1a1a1a',
    color: '#D4AF37',
  },
  textArea: { height: 150, textAlignVertical: 'top' },
  mediaButton: {
    backgroundColor: '#D4AF37',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  mediaButtonText: { color: '#000000', fontSize: 16, fontWeight: '600' },
  previewContainer: { marginTop: 10, marginBottom: 10, position: 'relative' },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  audioPreview: {
    height: 80,
    color: '#D4AF37',
    textAlign: 'center',
    textAlignVertical: 'center',
    backgroundColor: '#1a1a1a',
    padding: 25,
  },
  removeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 8,
    borderRadius: 8,
  },
  removeText: { color: '#D4AF37', fontSize: 12, fontWeight: 'bold' },
  submitButton: {
    backgroundColor: '#D4AF37',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  submitButtonText: { color: '#000000', fontSize: 18, fontWeight: '600' },
});

export default AddPostScreen;
