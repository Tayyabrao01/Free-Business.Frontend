import React, { useEffect, useState, useLayoutEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  Text,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
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
    otherUserId,
    otherUserName,
    otherUserAvatar,
    isGroupChat: isGroupChatParam,
    isGroupOwner: isGroupOwnerParam,
    groupId: groupIdParam,
    groupName: groupNameParam,
    groupMemberIds = [],
  } = route.params || {};

  const { user } = useAuth();
  const { isReady, reconnect, chatClient } = useStream();
  const { t } = useTranslation();
  const headerHeight = useHeaderHeight();
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

  const messagePlaceholder = useMemo(() => {
    if (isGroupChat) {
      return t('groups.messagePlaceholder', {
        name: groupName || t('groups.groupChat'),
      });
    }
    return t('chat.messagePlaceholder', {
      name: otherUserName || t('common.user'),
    });
  }, [groupName, isGroupChat, otherUserName, t]);

  const messageInputProps = useMemo(
    () => ({
      placeholder: messagePlaceholder,
      placeholderTextColor: '#888888',
      color: '#D4AF37',
      multiline: true,
    }),
    [messagePlaceholder]
  );

  const startDirectCall = useCallback(
    async (withVideo) => {
      const peerId =
        otherUserId || getOtherMemberFromChannel(channel, user._id)?.id;

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
        otherUserName: otherUserName || getOtherMemberFromChannel(channel, user._id)?.name,
        video: withVideo,
      });
    },
    [channel, navigation, otherUserId, otherUserName, reconnect, t, user]
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

  useEffect(() => {
    let cancelled = false;
    const userId = user?._id?.toString();

    const run = async () => {
      // Keep showing the existing channel while reloading the same id (avoids "cleared" flash).
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
          otherUserId,
          otherUserName,
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
        navigation.setOptions({
          title: channelIsGroup
            ? groupNameParam || activeChannel?.data?.name || t('groups.groupChat')
            : otherUserName ||
              getOtherMemberFromChannel(activeChannel, user._id)?.name ||
              t('chat.chatTitle'),
        });
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
    otherUserId,
    groupIdParam,
    otherUserName,
    isGroupChatParam,
    reloadKey,
  ]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => startCall(false)}>
            <Ionicons name="call-outline" size={22} color="#D4AF37" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => startCall(true)}>
            <Ionicons name="videocam-outline" size={24} color="#D4AF37" />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, startCall]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#D4AF37" />
        <Text style={styles.hint}>{t('stream.connecting')}</Text>
      </View>
    );
  }

  if (loadError || !channel) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{loadError || t('stream.chatLoadFailed')}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => setReloadKey((k) => k + 1)}>
          <Text style={styles.retryText}>{t('stream.retry')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>{t('common.back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <StreamChatRoot>
      <SafeAreaView style={styles.container} edges={['bottom']}>
        {isGroupChat ? (
          <View style={styles.groupBanner}>
            <Ionicons name="people" size={18} color="#D4AF37" />
            <Text style={styles.groupBannerText} numberOfLines={2}>
              {isGroupOwner
                ? t('groups.adminChatHint')
                : groupName || t('groups.groupChat')}
            </Text>
          </View>
        ) : null}
        <View style={styles.channelWrap}>
          <Channel
            channel={channel}
            hasCameraPicker
            hasFilePicker
            hasImagePicker
            audioRecordingEnabled
            asyncMessagesMultiSendEnabled
            keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : 0}
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
  container: { flex: 1, backgroundColor: '#000000' },
  channelWrap: { flex: 1 },
  groupBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  groupBannerText: {
    color: '#D4AF37',
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
    fontWeight: '600',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    padding: 24,
  },
  hint: { color: '#888888', marginTop: 12 },
  errorText: { color: '#D4AF37', textAlign: 'center', marginBottom: 16, lineHeight: 22 },
  retryBtn: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  retryText: { color: '#000000', fontWeight: '700' },
  backBtn: { padding: 12 },
  backText: { color: '#888888' },
  headerActions: { flexDirection: 'row', alignItems: 'center', marginRight: 8 },
  iconBtn: { padding: 8, marginLeft: 4 },
});

export default StreamChatScreen;
