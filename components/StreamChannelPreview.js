import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { ChannelPreviewMessenger } from 'stream-chat-react-native';
import { useAuth } from '../context/AuthContext';
import {
  getOtherMemberFromChannel,
  getChannelDisplayName,
  isGroupChannelId,
} from '../utils/streamChannel';

const PreviewTitle = ({ channel }) => {
  const { user } = useAuth();
  const displayName = isGroupChannelId(channel?.id)
    ? channel?.data?.name || 'Group'
    : getChannelDisplayName(channel, user?._id) ||
      getOtherMemberFromChannel(channel, user?._id)?.name ||
      'Chat';

  return (
    <Text style={styles.title} numberOfLines={1}>
      {displayName}
    </Text>
  );
};

const StreamChannelPreview = (props) => (
  <ChannelPreviewMessenger
    {...props}
    PreviewTitle={() => <PreviewTitle channel={props.channel} />}
  />
);

const styles = StyleSheet.create({
  title: {
    color: '#D4AF37',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default StreamChannelPreview;
