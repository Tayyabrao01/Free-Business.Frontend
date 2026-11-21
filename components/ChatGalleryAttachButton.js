import React, { useCallback } from 'react';
import { Alert, Pressable, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { FileTypes, useMessageInputContext } from 'stream-chat-react-native';
import { captureMedia } from '../utils/captureMedia';

/**
 * Gallery icon for attaching photos/videos (clearer than the default + attach icon).
 */
const ChatGalleryAttachButton = ({ disabled }) => {
  const {
    uploadNewImage,
    uploadNewFile,
    handleAttachButtonPress,
    toggleAttachmentPicker,
  } = useMessageInputContext();

  const capture = useCallback(async mediaType => {
    try {
      const asset = await captureMedia({ mediaType });
      if (!asset) return;

      console.log('[chat attachment] upload start', { mediaType });
      if (mediaType === 'video') {
        await uploadNewFile({
          ...asset,
          mimeType: asset.type,
          type: FileTypes.Video,
          name: asset.fileName || `camera-${Date.now()}.mp4`,
        });
      } else {
        await uploadNewImage(asset);
      }
      console.log('[chat attachment] upload result', {
        mediaType,
        success: true,
      });
    } catch (error) {
      console.error('[chat attachment] upload result', {
        mediaType,
        success: false,
        error,
      });
      Alert.alert('Camera error', error.message || 'Could not attach the captured media.');
    }
  }, [uploadNewFile, uploadNewImage]);

  const openGallery = useCallback(() => {
    if (handleAttachButtonPress) {
      handleAttachButtonPress();
      return;
    }
    toggleAttachmentPicker?.();
  }, [handleAttachButtonPress, toggleAttachmentPicker]);

  const onPress = useCallback(() => {
    if (disabled) return;
    Alert.alert('Add media', 'Choose how to add media', [
      { text: 'Take Photo', onPress: () => capture('photo') },
      { text: 'Record Video', onPress: () => capture('video') },
      { text: 'Choose from Gallery', onPress: openGallery },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [capture, disabled, openGallery]);

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={styles.button}
      accessibilityLabel="Attach photo or video"
      testID="gallery-attach-button"
    >
      <Ionicons name="images-outline" size={26} color="#D4AF37" />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 6,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChatGalleryAttachButton;
