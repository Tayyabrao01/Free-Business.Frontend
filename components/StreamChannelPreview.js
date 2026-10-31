import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';
import {
  getChannelDisplayName,
  getChannelDisplayAvatar,
  isGroupChannelId,
  getOtherMemberFromChannel,
} from '../utils/streamChannel';

const formatChatTimestamp = (dateInput) => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return 'Yesterday';

  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  }

  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const getPreviewText = (latestMsg, previews) => {
  if (previews?.[0]?.text && previews[0].text !== 'Member') {
    return previews[0].text;
  }
  if (latestMsg?.text && latestMsg.text !== 'Member') {
    return latestMsg.text;
  }
  if (latestMsg?.attachments && latestMsg.attachments.length > 0) {
    const type = latestMsg.attachments[0]?.type;
    if (type === 'image') return '📷 Photo';
    if (type === 'video') return '🎥 Video';
    if (type === 'audio' || type === 'voiceRecording') return '🎙️ Voice note';
    if (type === 'file') return '📄 Document';
    return '📎 Attachment';
  }
  return 'Start conversation';
};

const StreamChannelPreview = ({
  channel,
  onSelect,
  unread,
  latestMessagePreview,
}) => {
  const { user } = useAuth();

  const isGroup = isGroupChannelId(channel?.id);
  const displayName = getChannelDisplayName(channel, user?._id);
  const avatarUri = getChannelDisplayAvatar(channel, user?._id);
  const otherMember = !isGroup ? getOtherMemberFromChannel(channel, user?._id) : null;
  const isOnline = Boolean(otherMember?.online);

  const unreadCount = useMemo(() => {
    if (typeof unread === 'number') return unread;
    if (typeof channel?.countUnread === 'function') {
      return channel.countUnread();
    }
    return 0;
  }, [channel, unread]);

  // Messages & Preview
  const latestMessage = useMemo(() => {
    if (latestMessagePreview?.messageObject) {
      return latestMessagePreview.messageObject;
    }
    const messages = channel?.state?.messages;
    if (messages && messages.length > 0) {
      return messages[messages.length - 1];
    }
    return null;
  }, [channel?.state?.messages, latestMessagePreview]);

  const previewSnippet = useMemo(() => {
    return getPreviewText(latestMessage, latestMessagePreview?.previews);
  }, [latestMessage, latestMessagePreview]);

  const timestamp = useMemo(() => {
    const rawTime =
      latestMessage?.created_at ||
      channel?.state?.last_message_at ||
      channel?.data?.created_at;
    return formatChatTimestamp(rawTime);
  }, [latestMessage, channel?.state?.last_message_at, channel?.data?.created_at]);

  // Group Initial
  const groupInitial = (displayName || 'G').trim().charAt(0).toUpperCase() || 'G';

  return (
    <TouchableOpacity
      style={[styles.container, unreadCount > 0 && styles.containerUnread]}
      onPress={() => onSelect && onSelect(channel)}
      activeOpacity={0.8}
    >
      {/* Avatar Container */}
      <View style={styles.avatarWrap}>
        {isGroup ? (
          <View style={styles.groupAvatar}>
            <Text style={styles.groupInitial}>{groupInitial}</Text>
            <View style={styles.groupBadgeMini}>
              <Ionicons name="people" size={10} color="#0A0A0E" />
            </View>
          </View>
        ) : (
          <View style={styles.userAvatarWrap}>
            <Avatar uri={avatarUri} name={displayName} size={48} />
            {isOnline ? <View style={styles.onlineDot} /> : null}
          </View>
        )}
      </View>

      {/* Center Details */}
      <View style={styles.detailsCol}>
        <View style={styles.headerRow}>
          <View style={styles.nameWrap}>
            <Text
              style={[styles.displayName, unreadCount > 0 && styles.displayNameUnread]}
              numberOfLines={1}
            >
              {displayName}
            </Text>
            {isGroup ? (
              <View style={styles.groupChip}>
                <Text style={styles.groupChipText}>GROUP</Text>
              </View>
            ) : null}
          </View>
          <Text style={[styles.timeText, unreadCount > 0 && styles.timeTextUnread]}>
            {timestamp}
          </Text>
        </View>

        <View style={styles.messageRow}>
          <Text
            style={[styles.messageSnippet, unreadCount > 0 && styles.messageSnippetUnread]}
            numberOfLines={1}
          >
            {previewSnippet}
          </Text>

          {unreadCount > 0 ? (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141419',
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#20202A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 2,
  },
  containerUnread: {
    borderColor: 'rgba(212, 175, 55, 0.4)',
    backgroundColor: '#171722',
  },
  avatarWrap: {
    position: 'relative',
    marginRight: 12,
  },
  userAvatarWrap: {
    position: 'relative',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#141419',
  },
  groupAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#1C1C28',
    borderWidth: 1.5,
    borderColor: '#D4AF37',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  groupInitial: {
    color: '#D4AF37',
    fontSize: 18,
    fontWeight: '800',
  },
  groupBadgeMini: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    backgroundColor: '#D4AF37',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsCol: {
    flex: 1,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  nameWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  displayName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    flexShrink: 1,
  },
  displayNameUnread: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  groupChip: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  groupChipText: {
    color: '#D4AF37',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  timeText: {
    fontSize: 11.5,
    color: '#70707D',
  },
  timeTextUnread: {
    color: '#D4AF37',
    fontWeight: '600',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  messageSnippet: {
    fontSize: 13,
    color: '#8A8A96',
    flex: 1,
    marginRight: 8,
  },
  messageSnippetUnread: {
    color: '#E0E0EA',
    fontWeight: '600',
  },
  unreadBadge: {
    backgroundColor: '#D4AF37',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadBadgeText: {
    color: '#0A0A0E',
    fontSize: 11,
    fontWeight: '800',
  },
});

export default StreamChannelPreview;
