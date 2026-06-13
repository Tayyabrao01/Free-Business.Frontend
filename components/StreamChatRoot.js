import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { OverlayProvider, Chat } from 'stream-chat-react-native';
import { useStream } from '../context/StreamProvider';
import { getStreamVideo } from '../services/streamVideoOptional';
import { streamChatStyle } from '../theme/streamTheme';

/**
 * Wrap only chat screens — NOT the whole app (prevents crashes on Posts/Properties).
 */
const StreamChatRoot = ({ children }) => {
  const { chatClient, videoClient, isReady, isConnecting } = useStream();

  if (!chatClient || !isReady) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  const chatTree = (
    <OverlayProvider value={streamChatStyle}>
      <Chat client={chatClient}>{children}</Chat>
    </OverlayProvider>
  );

  const StreamVideo = getStreamVideo();
  if (videoClient && StreamVideo) {
    return <StreamVideo client={videoClient}>{chatTree}</StreamVideo>;
  }

  return chatTree;
};

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
});

export default StreamChatRoot;
