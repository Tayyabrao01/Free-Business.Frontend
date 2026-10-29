import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ChannelPreviewMessenger } from 'stream-chat-react-native';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';
import {
  getChannelDisplayName,
  getChannelDisplayAvatar,
  isGroupChannelId,
} from '../utils/streamChannel';

const PreviewTitle = ({ channel }) => {
  const { user } = useAuth();
  const displayName = getChannelDisplayName(channel, user?._id);

  return (
    <Text style={styles.title} numberOfLines={1}>
      {displayName}
    </Text>
  );
};

const PreviewAvatar = ({ channel }) => {
  const { user } = useAuth();
  const displayName = getChannelDisplayName(channel, user?._id);
  const avatarUri = getChannelDisplayAvatar(channel, user?._id);

  if (isGroupChannelId(channel?.id)) {
    const initial = (displayName || 'G').trim().charAt(0).toUpperCase() || 'G';
    return (
      <View style={styles.groupAvatar}>
        <Text style={styles.groupInitial}>{initial}</Text>
      </View>
    );
  }

  return <Avatar uri={avatarUri} name={displayName} size={48} />;
};

const PreviewMessage = ({ latestMessagePreview }) => {
  const text = latestMessagePreview?.previews?.[0]?.text || latestMessagePreview?.messageObject?.text || '';
  const cleaned = text === 'Member' ? '' : text;

  return (
    <Text style={styles.message} numberOfLines={1}>
      {cleaned || ' '}
    </Text>
  );
};

const StreamChannelPreview = (props) => (
  <ChannelPreviewMessenger
    {...props}
    PreviewTitle={() => <PreviewTitle channel={props.channel} />}
    PreviewAvatar={() => <PreviewAvatar channel={props.channel} />}
    PreviewMessage={PreviewMessage}
  />
);

const styles = StyleSheet.create({
  title: {
    color: '#D4AF37',
    fontSize: 16,
    fontWeight: '700',
  },
  message: {
    color: '#888888',
    fontSize: 13,
  },
  groupAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#D4AF37',
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupInitial: {
    color: '#D4AF37',
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default StreamChannelPreview;
