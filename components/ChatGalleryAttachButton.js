import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useMessageInputContext } from 'stream-chat-react-native';

/**
 * Gallery icon for attaching photos/videos (clearer than the default + attach icon).
 */
const ChatGalleryAttachButton = ({ disabled }) => {
  const { handleAttachButtonPress, toggleAttachmentPicker } = useMessageInputContext();

  const onPress = () => {
    if (disabled) {
      return;
    }
    if (handleAttachButtonPress) {
      handleAttachButtonPress();
      return;
    }
    toggleAttachmentPicker?.();
  };

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
