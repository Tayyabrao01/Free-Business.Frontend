import React, { useMemo, useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  StatusBar,
} from 'react-native';
import { ChannelList } from 'stream-chat-react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../context/AuthContext';
import { useStream } from '../../context/StreamProvider';
import { useTranslation } from '../../hooks/useTranslation';
import {
  getOtherMemberFromChannel,
  getChannelDisplayName,
  isGroupChannelId,
  getGroupIdFromChannelId,
} from '../../utils/streamChannel';
import StreamChannelPreview from '../../components/StreamChannelPreview';
import StreamChatRoot from '../../components/StreamChatRoot';
import { formatDisplayError } from '../../utils/apiError';

const FILTER_TABS = [
  { id: 'all', label: 'All Chats' },
  { id: 'direct', label: 'Direct' },
  { id: 'groups', label: 'Groups' },
  { id: 'unread', label: 'Unread' },
];

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
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

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

  // Filter channels based on Search Query and Active Filter tab
  const channelRenderFilterFn = useCallback(
    (channels) => {
      if (!channels || !Array.isArray(channels)) return [];

      return channels.filter((channel) => {
        const isGroup = isGroupChannelId(channel.id);
        const unreadCount =
          typeof channel.countUnread === 'function' ? channel.countUnread() : 0;

        // Filter tab selection
        if (activeFilter === 'direct' && isGroup) return false;
        if (activeFilter === 'groups' && !isGroup) return false;
        if (activeFilter === 'unread' && unreadCount === 0) return false;

        // Search text matching
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase().trim();
          const displayName = getChannelDisplayName(channel, user._id)?.toLowerCase() || '';
          const lastMsg =
            channel.state?.messages?.[channel.state.messages.length - 1]?.text?.toLowerCase() || '';
          return displayName.includes(query) || lastMsg.includes(query);
        }

        return true;
      });
    },
    [activeFilter, searchQuery, user._id]
  );

  if (isConnecting && !isReady) {
    return (
      <View style={styles.center}>
        <StatusBar barStyle="light-content" backgroundColor="#0A0A0E" />
        <ActivityIndicator size="large" color="#D4AF37" />
        <Text style={styles.hint}>{t('stream.connecting')}</Text>
      </View>
    );
  }

  if (!isReady || error) {
    const errorText = formatDisplayError(error, t('stream.connectionFailed'));

    return (
      <View style={styles.center}>
        <StatusBar barStyle="light-content" backgroundColor="#0A0A0E" />
        <Ionicons name="chatbubbles-outline" size={48} color="#D4AF37" />
        <Text style={styles.error}>{errorText}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={reconnect} activeOpacity={0.85}>
          <Text style={styles.retryText}>{t('stream.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <StreamChatRoot>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0A0A0E" />

        {/* Top App Bar */}
        <View style={styles.topBar}>
          <View>
            <View style={styles.statusBadgeRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.statusBadgeText}>COMMUNICATION NETWORK</Text>
            </View>
            <Text style={styles.screenTitle}>{t('tabs.messages')}</Text>
          </View>

          <TouchableOpacity
            style={styles.newChatBtn}
            onPress={() => navigation.navigate('UserSearch')}
            activeOpacity={0.85}
          >
            <Ionicons name="create-outline" size={17} color="#D4AF37" />
            <Text style={styles.newChatBtnText}>New Chat</Text>
          </TouchableOpacity>
        </View>

        {/* Search Input Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={17} color="#8A8A96" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations, clients, partners..."
            placeholderTextColor="#666675"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
              <Ionicons name="close-circle" size={17} color="#8A8A96" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filter Segment Tabs */}
        <View style={styles.filterRow}>
          {FILTER_TABS.map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setActiveFilter(tab.id)}
                activeOpacity={0.75}
              >
                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Channels List Container */}
        <View style={styles.listWrap}>
          <ChannelList
            filters={filters}
            sort={sort}
            options={{ state: true, presence: true }}
            channelRenderFilterFn={channelRenderFilterFn}
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
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons name="chatbubbles-outline" size={50} color="#D4AF37" />
                </View>
                <Text style={styles.emptyTitle}>
                  {searchQuery ? 'No matching conversations' : 'No conversations yet'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery
                    ? `No chats found for "${searchQuery}". Search for a contact to start messaging.`
                    : 'Connect directly with verified property owners, brokers, and investors.'}
                </Text>
                <TouchableOpacity
                  style={styles.emptyActionBtn}
                  onPress={() => navigation.navigate('UserSearch')}
                  activeOpacity={0.85}
                >
                  <Ionicons name="person-add" size={17} color="#0A0A0E" />
                  <Text style={styles.emptyActionBtnText}>{t('stream.findPeople')}</Text>
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
  container: {
    flex: 1,
    backgroundColor: '#0A0A0E',
  },
  listWrap: {
    flex: 1,
  },
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
  error: {
    color: '#D4AF37',
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
    marginTop: 8,
  },
  retryText: {
    color: '#0A0A0E',
    fontWeight: '700',
    fontSize: 13.5,
  },

  /* Top Bar */
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A22',
  },
  statusBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4ADE80',
    marginRight: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D4AF37',
    letterSpacing: 0.6,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  newChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16161E',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  newChatBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D4AF37',
    marginLeft: 6,
  },

  /* Search Bar */
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141419',
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#22222E',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13.5,
    paddingVertical: 10,
  },
  clearBtn: {
    padding: 4,
  },

  /* Filter Tabs */
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#16161E',
    borderWidth: 1,
    borderColor: '#242430',
  },
  filterChipActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderColor: '#D4AF37',
  },
  filterChipText: {
    color: '#8A8A96',
    fontSize: 12,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#D4AF37',
    fontWeight: '700',
  },

  /* Empty State */
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#16161E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#242430',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#8A8A96',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D4AF37',
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 10,
    gap: 8,
  },
  emptyActionBtnText: {
    color: '#0A0A0E',
    fontSize: 13.5,
    fontWeight: '700',
  },
});

export default StreamMessagesScreen;
