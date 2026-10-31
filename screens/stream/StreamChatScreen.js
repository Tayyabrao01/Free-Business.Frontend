import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  Text,
  StyleSheet,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import {
  Channel,
  MessageList,
  MessageInput,
} from 'stream-chat-react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../context/AuthContext';
import { useStream } from '../../context/StreamProvider';
import { useTranslation } from '../../hooks/useTranslation';
import Avatar from '../../components/Avatar';
import {
  loadChatChannel,
  ensureChatClientReady,
  ensureVideoClientReady,
} from '../../services/streamClientService';
import {
  getOtherMemberFromChannel,
  getChannelMemberIds,
  isGroupChannelId,
  getGroupIdFromChannelId,
} from '../../utils/streamChannel';
import StreamChatRoot from '../../components/StreamChatRoot';
import { isStreamVideoAvailable } from '../../services/streamVideoOptional';
import { formatDisplayError } from '../../utils/apiError';
import { mapStreamChatError } from '../../utils/streamChatErrors';
import ChatGalleryAttachButton from '../../components/ChatGalleryAttachButton';
import { setActiveChatChannelId } from '../../services/chatNotificationListener';

const StreamChatScreen = ({ route, navigation }) => {
  const {
    channelId,
    channelType = 'messaging',
    otherUserId: otherUserIdParam,
    otherUserName: otherUserNameParam,
    otherUserAvatar: otherUserAvatarParam,
    isGroupChat: isGroupChatParam,
    isGroupOwner: isGroupOwnerParam,
    groupId: groupIdParam,
    groupName: groupNameParam,
    groupMemberIds = [],
  } = route.params || {};

  const { user } = useAuth();
  const { isReady, reconnect, chatClient } = useStream();
  const { t } = useTranslation();

  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [isGroupChat, setIsGroupChat] = useState(Boolean(isGroupChatParam));
  const [isGroupOwner, setIsGroupOwner] = useState(Boolean(isGroupOwnerParam));
  const [groupId, setGroupId] = useState(groupIdParam || null);
  const [groupName, setGroupName] = useState(groupNameParam || '');
  const [reloadKey, setReloadKey] = useState(0);

  const channelRef = useRef(null);

  useFocusEffect(
    useCallback(() => {
      const active = channelRef.current;
      if (!active?.id || !chatClient?.userID) {
        return undefined;
      }
      active.watch().catch(() => {});
      return undefined;
    }, [chatClient?.userID])
  );

  const otherMember = useMemo(() => {
    if (isGroupChat) return null;
    return getOtherMemberFromChannel(channel, user?._id);
  }, [channel, isGroupChat, user?._id]);

  const resolvedPeerId = otherUserIdParam || otherMember?.id;
  const resolvedName = useMemo(() => {
    if (isGroupChat) {
      return groupName || channel?.data?.name || t('groups.groupChat');
    }
    return otherUserNameParam || otherMember?.name || t('common.user');
  }, [groupName, channel?.data?.name, isGroupChat, otherUserNameParam, otherMember?.name, t]);

  const resolvedAvatar = otherUserAvatarParam || otherMember?.image;
  const isPeerOnline = Boolean(otherMember?.online);

  const messagePlaceholder = useMemo(() => {
    if (isGroupChat) {
      return t('groups.messagePlaceholder', {
        name: groupName || t('groups.groupChat'),
      });
    }
    return t('chat.messagePlaceholder', {
      name: resolvedName,
    });
  }, [groupName, isGroupChat, resolvedName, t]);

  const messageInputProps = useMemo(
    () => ({
      placeholder: messagePlaceholder,
      placeholderTextColor: '#666675',
      color: '#FFFFFF',
      multiline: true,
    }),
    [messagePlaceholder]
  );

  const startDirectCall = useCallback(
    async (withVideo) => {
      const peerId = resolvedPeerId;

      if (!peerId) {
        Alert.alert(t('common.error'), t('stream.cannotCall'));
        return;
      }

      const client = await ensureChatClientReady(user, reconnect);
      if (!client) {
        Alert.alert(t('common.error'), t('stream.connectionFailed'));
        return;
      }

      navigation.navigate('StreamCall', {
        otherUserId: peerId,
        otherUserName: resolvedName,
        video: withVideo,
      });
    },
    [navigation, resolvedName, resolvedPeerId, reconnect, t, user]
  );

  const startGroupCall = useCallback(
    async (withVideo) => {
      if (!isStreamVideoAvailable()) {
        Alert.alert(t('stream.callsUnavailableTitle'), t('stream.callsUnavailableMessage'));
        return;
      }

      const resolvedGroupId =
        groupId || getGroupIdFromChannelId(channel?.id || channelId);
      if (!resolvedGroupId) {
        Alert.alert(t('common.error'), t('groups.callFailed'));
        return;
      }

      const memberIds =
        groupMemberIds.length > 0
          ? groupMemberIds
          : getChannelMemberIds(channel);

      const videoClient = await ensureVideoClientReady(user, reconnect);
      if (!videoClient) {
        Alert.alert(t('common.error'), t('stream.videoNotReady'));
        return;
      }

      navigation.navigate('StreamCall', {
        isGroupCall: true,
        groupId: resolvedGroupId,
        groupName: groupName || channel?.data?.name || t('groups.groupChat'),
        groupMemberIds: memberIds,
        video: withVideo,
      });
    },
    [
      channel,
      channelId,
      groupId,
      groupMemberIds,
      groupName,
      navigation,
      reconnect,
      t,
      user,
    ]
  );

  const startCall = useCallback(
    (withVideo) => {
      if (isGroupChat) {
        return startGroupCall(withVideo);
      }
      return startDirectCall(withVideo);
    },
    [isGroupChat, startDirectCall, startGroupCall]
  );

  const handleHeaderPress = useCallback(() => {
    if (isGroupChat) {
      const resolvedGroupId =
        groupId || getGroupIdFromChannelId(channel?.id || channelId);
      if (resolvedGroupId) {
        navigation.navigate('GroupDetail', { groupId: resolvedGroupId });
      }
    } else if (resolvedPeerId) {
      navigation.navigate('UserProfile', { userId: resolvedPeerId.toString() });
    }
  }, [channel?.id, channelId, groupId, isGroupChat, navigation, resolvedPeerId]);

  useEffect(() => {
    let cancelled = false;
    const userId = user?._id?.toString();

    const run = async () => {
      const sameChannel =
        channelRef.current?.id &&
        channelId &&
        channelRef.current.id.toString() === channelId.toString();
      if (!sameChannel) {
        setLoading(true);
        setChannel(null);
      }
      setLoadError(null);

      try {
        let client = await ensureChatClientReady(user, reconnect);
        if (!client) {
          await reconnect();
          client = await ensureChatClientReady(user, null);
        }
        if (!client) {
          throw new Error(t('stream.connectionFailed'));
        }

        if (cancelled) return;

        const activeChannel = await loadChatChannel(client, user, reconnect, {
          otherUserId: otherUserIdParam,
          otherUserName: otherUserNameParam,
          groupId: groupIdParam,
          channelId,
          channelType,
        });

        if (cancelled) return;

        const channelIsGroup =
          isGroupChatParam ||
          isGroupChannelId(activeChannel?.id) ||
          Boolean(groupIdParam);

        setIsGroupChat(channelIsGroup);
        setIsGroupOwner(Boolean(isGroupOwnerParam));
        if (channelIsGroup) {
          setGroupId(
            groupIdParam || getGroupIdFromChannelId(activeChannel.id) || null
          );
          setGroupName(
            groupNameParam ||
              activeChannel?.data?.name ||
              t('groups.groupChat')
          );
        }

        setChannel(activeChannel);
        channelRef.current = activeChannel;
        setActiveChatChannelId(activeChannel.id);
      } catch (error) {
        console.error('Channel load error:', error);
        if (!cancelled) {
          setLoadError(
            formatDisplayError(
              mapStreamChatError(error) || error,
              t('stream.chatLoadFailed')
            )
          );
          if (!channelRef.current) {
            setChannel(null);
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    if (userId) {
      run();
    }

    return () => {
      cancelled = true;
      setActiveChatChannelId(null);
    };
  }, [
    user?._id,
    channelId,
    channelType,
    otherUserIdParam,
    groupIdParam,
    otherUserNameParam,
    isGroupChatParam,
    reloadKey,
  ]);

  if (loading) {
    return (
      <View style={styles.center}>
        <StatusBar barStyle="light-content" backgroundColor="#0A0A0E" />
        <ActivityIndicator size="large" color="#D4AF37" />
        <Text style={styles.hint}>{t('stream.connecting')}</Text>
      </View>
    );
  }

  if (loadError || !channel) {
    return (
      <View style={styles.center}>
        <StatusBar barStyle="light-content" backgroundColor="#0A0A0E" />
        <Ionicons name="chatbubble-ellipses-outline" size={48} color="#D4AF37" />
        <Text style={styles.errorText}>{loadError || t('stream.chatLoadFailed')}</Text>
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={() => setReloadKey((k) => k + 1)}
          activeOpacity={0.85}
        >
          <Text style={styles.retryText}>{t('stream.retry')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>{t('common.back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const groupInitial = (resolvedName || 'G').trim().charAt(0).toUpperCase() || 'G';

  return (
    <StreamChatRoot>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <StatusBar barStyle="light-content" backgroundColor="#0A0A0E" />

        {/* Custom Luxury Chat Header Bar */}
        <View style={styles.chatHeader}>
          {/* Back Button */}
          <TouchableOpacity
            style={styles.navBackBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>

          {/* User/Group Info & Profile shortcut */}
          <TouchableOpacity
            style={styles.headerInfoCol}
            onPress={handleHeaderPress}
            activeOpacity={0.8}
          >
            <View style={styles.headerAvatarWrap}>
              {isGroupChat ? (
                <View style={styles.headerGroupAvatar}>
                  <Text style={styles.headerGroupInitial}>{groupInitial}</Text>
                </View>
              ) : (
                <View style={styles.headerUserAvatar}>
                  <Avatar uri={resolvedAvatar} name={resolvedName} size={38} />
                  {isPeerOnline ? <View style={styles.headerOnlineDot} /> : null}
                </View>
              )}
            </View>

            <View style={styles.headerMeta}>
              <View style={styles.headerTitleRow}>
                <Text style={styles.headerTitleName} numberOfLines={1}>
                  {resolvedName}
                </Text>
                <Ionicons
                  name={isGroupChat ? 'people' : 'shield-checkmark'}
                  size={13}
                  color="#D4AF37"
                  style={{ marginLeft: 5 }}
                />
              </View>

              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {isGroupChat
                  ? `${channel?.data?.member_count || 1} members · Tap for info`
                  : isPeerOnline
                    ? 'Online'
                    : 'Tap to view profile'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Quick Audio & Video Call Actions */}
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.callActionButton}
              onPress={() => startCall(false)}
              activeOpacity={0.75}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            >
              <Ionicons name="call" size={17} color="#D4AF37" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.callActionButton}
              onPress={() => startCall(true)}
              activeOpacity={0.75}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            >
              <Ionicons name="videocam" size={18} color="#D4AF37" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Group Admin Advisory Banner */}
        {isGroupChat && isGroupOwner ? (
          <View style={styles.groupAdminBanner}>
            <Ionicons name="shield-checkmark" size={14} color="#D4AF37" />
            <Text style={styles.groupAdminBannerText}>{t('groups.adminChatHint')}</Text>
          </View>
        ) : null}

        {/* Stream Chat Message View */}
        <View style={styles.channelWrap}>
          <Channel
            channel={channel}
            hasCameraPicker
            hasFilePicker
            hasImagePicker
            audioRecordingEnabled
            asyncMessagesMultiSendEnabled
            keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
          >
            <MessageList />
            <MessageInput
              hasImagePicker
              hasFilePicker
              hasCameraPicker
              audioRecordingEnabled
              AttachButton={ChatGalleryAttachButton}
              additionalTextInputProps={messageInputProps}
            />
          </Channel>
        </View>
      </SafeAreaView>
    </StreamChatRoot>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0E',
  },
  channelWrap: {
    flex: 1,
    backgroundColor: '#0A0A0E',
  },

  /* Custom Chat Header */
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A0A0E',
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A24',
  },
  navBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#161620',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#262634',
    marginRight: 10,
  },
  headerInfoCol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerAvatarWrap: {
    position: 'relative',
    marginRight: 10,
  },
  headerUserAvatar: {
    position: 'relative',
  },
  headerOnlineDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
    borderWidth: 1.5,
    borderColor: '#0A0A0E',
  },
  headerGroupAvatar: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: '#1C1C28',
    borderWidth: 1.5,
    borderColor: '#D4AF37',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerGroupInitial: {
    color: '#D4AF37',
    fontSize: 16,
    fontWeight: '800',
  },
  headerMeta: {
    flex: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitleName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    flexShrink: 1,
  },
  headerSubtitle: {
    color: '#8A8A96',
    fontSize: 11.5,
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },
  callActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#161622',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Admin Advisory Banner */
  groupAdminBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141419',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#20202C',
    gap: 8,
  },
  groupAdminBannerText: {
    color: '#D4AF37',
    fontSize: 11.5,
    fontWeight: '600',
    flex: 1,
  },

  /* Loader & Error States */
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0A0E',
    padding: 24,
  },
  hint: {
    color: '#8A8A96',
    marginTop: 12,
    fontSize: 13,
  },
  errorText: {
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 16,
    fontSize: 14,
    lineHeight: 20,
  },
  retryBtn: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 10,
    marginBottom: 12,
  },
  retryText: {
    color: '#0A0A0E',
    fontWeight: '700',
    fontSize: 13.5,
  },
  backBtn: {
    padding: 8,
  },
  backText: {
    color: '#8A8A96',
    fontSize: 13,
  },
});

export default StreamChatScreen;
