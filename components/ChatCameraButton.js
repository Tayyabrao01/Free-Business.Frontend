import React, { useCallback, useState } from 'react';
import { Alert, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { FileTypes, useMessageInputContext } from 'stream-chat-react-native';
import { captureMedia } from '../utils/captureMedia';

const ChatCameraButton = () => {
  const {
    uploadNewImage,
    uploadNewFile,
    handleAttachButtonPress,
    toggleAttachmentPicker,
  } = useMessageInputContext();
  const [capturing, setCapturing] = useState(false);

  const capture = useCallback(async mediaType => {
    if (capturing) return;
    setCapturing(true);
    try {
      const asset = await captureMedia({ mediaType });
      if (!asset) return;
      if (mediaType === 'video') {
        console.log('[chat camera] upload start', { mediaType });
        await uploadNewFile({
          ...asset,
          mimeType: asset.type,
          type: FileTypes.Video,
          name: asset.fileName || `camera-${Date.now()}.mp4`,
        });
        console.log('[chat camera] upload result', { mediaType, success: true });
      } else {
        console.log('[chat camera] upload start', { mediaType });
        await uploadNewImage(asset);
        console.log('[chat camera] upload result', { mediaType, success: true });
      }
    } catch (error) {
      console.error('[chat camera] upload result', {
        mediaType,
        success: false,
        error,
      });
      Alert.alert('Camera error', error.message || 'Could not attach the captured media.');
    } finally {
      setCapturing(false);
    }
  }, [capturing, uploadNewFile, uploadNewImage]);

  const onPress = useCallback(() => {
    if (capturing) return;
    Alert.alert('Add media', 'Choose how to add media', [
      { text: 'Take Photo', onPress: () => capture('photo') },
      { text: 'Record Video', onPress: () => capture('video') },
      {
        text: 'Choose from Gallery',
        onPress: () => {
          if (handleAttachButtonPress) {
            handleAttachButtonPress();
          } else {
            toggleAttachmentPicker?.();
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [capturing, capture, handleAttachButtonPress, toggleAttachmentPicker]);

  return (
    <Pressable
      disabled={capturing}
      onPress={onPress}
      style={styles.button}
      accessibilityLabel="Capture photo or video"
    >
      {capturing ? (
        <ActivityIndicator size="small" color="#D4AF37" />
      ) : (
        <Ionicons name="camera-outline" size={23} color="#D4AF37" />
      )}
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

export default ChatCameraButton;
