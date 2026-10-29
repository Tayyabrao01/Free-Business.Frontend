import React, { useMemo, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { ChannelList } from 'stream-chat-react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../context/AuthContext';
import { useStream } from '../../context/StreamProvider';
import { useTranslation } from '../../hooks/useTranslation';
import {
  getOtherMemberFromChannel,
  isGroupChannelId,
  getGroupIdFromChannelId,
} from '../../utils/streamChannel';
import StreamChannelPreview from '../../components/StreamChannelPreview';
import StreamChatRoot from '../../components/StreamChatRoot';
import { formatDisplayError } from '../../utils/apiError';

const getRootNavigation = (navigation) => {
  let nav = navigation;
  while (nav?.getParent?.()) {
    nav = nav.getParent();
  }
  return nav;
};

const StreamMessagesScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { isReady, isConnecting, error, reconnect } = useStream();
  const { t } = useTranslation();

  const openingChat = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (!isReady && !isConnecting) {
        reconnect();
      }
    }, [reconnect, isReady, isConnecting])
  );

  const filters = useMemo(
    () => ({
      type: 'messaging',
      members: { $in: [user._id.toString()] },
    }),
    [user._id]
  );

  const sort = useMemo(() => ({ last_message_at: -1 }), []);

  if (isConnecting && !isReady) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#D4AF37" />
        <Text style={styles.hint}>{t('stream.connecting')}</Text>
      </View>
    );
  }

  if (!isReady || error) {
    const errorText = formatDisplayError(error, t('stream.connectionFailed'));

    return (
      <View style={styles.center}>
        <Text style={styles.error}>{errorText}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={reconnect}>
          <Text style={styles.retryText}>{t('stream.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <StreamChatRoot>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('tabs.messages')}</Text>
          <TouchableOpacity
            style={styles.newChatBtn}
            onPress={() => navigation.navigate('UserSearch')}
          >
            <Ionicons name="create-outline" size={22} color="#000000" />
          </TouchableOpacity>
        </View>

        <View style={styles.listWrap}>
          <ChannelList
          filters={filters}
          sort={sort}
          options={{ state: true, presence: true }}
          Preview={StreamChannelPreview}
          onSelect={(channel) => {
            if (openingChat.current) {
              return;
            }
            openingChat.current = true;
            const channelIsGroup = isGroupChannelId(channel.id);
            const other = getOtherMemberFromChannel(channel, user._id);
            if (channelIsGroup) {
              getRootNavigation(navigation).navigate('Chat', {
                channelId: channel.id,
                channelType: channel.type || 'messaging',
                isGroupChat: true,
                groupId: getGroupIdFromChannelId(channel.id),
                groupName: channel.data?.name || t('groups.groupChat'),
              });
            } else {
              getRootNavigation(navigation).navigate('Chat', {
                channelId: channel.id,
                channelType: channel.type || 'messaging',
                otherUserId: other?.id,
                otherUserName: other?.name || channel.data?.name,
                otherUserAvatar: other?.image,
              });
            }
            setTimeout(() => {
              openingChat.current = false;
            }, 600);
          }}
          EmptyStateIndicator={() => (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>{t('chat.noUsers')}</Text>
              <Text style={styles.emptySub}>{t('stream.startChatHint')}</Text>
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={() => navigation.navigate('UserSearch')}
              >
                <Text style={styles.retryText}>{t('stream.findPeople')}</Text>
              </TouchableOpacity>
            </View>
          )}
          />
        </View>
      </View>
    </StreamChatRoot>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  listWrap: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000000', padding: 24 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#D4AF37',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#000000' },
  newChatBtn: {
    backgroundColor: '#000000',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hint: { color: '#888888', marginTop: 12 },
  error: { color: '#D4AF37', textAlign: 'center', marginBottom: 16 },
  retryBtn: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  retryText: { color: '#000000', fontWeight: 'bold' },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#D4AF37', fontSize: 18, fontWeight: '600' },
  emptySub: { color: '#888888', textAlign: 'center', marginTop: 8 },
});

export default StreamMessagesScreen;
