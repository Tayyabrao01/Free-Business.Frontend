import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  Linking,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../context/AuthContext';
import { ensureChatClientReady } from '../services/streamClientService';
import { useStream } from '../context/StreamProvider';
import Avatar from '../components/Avatar';
import {
  getCallLogs,
  clearCallLogs,
  formatCallDuration,
} from '../services/callLogService';

const FILTER_TABS = [
  { id: 'all', label: 'All Calls' },
  { id: 'missed', label: 'Missed' },
  { id: 'video', label: 'Video' },
];

const FREE_BUSINESS_PHONE = '+923264646455';

const formatCallTimestamp = (dateInput) => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) {
    return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}`;
  }

  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

const CallLogsScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { reconnect } = useStream();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');

  const loadLogs = async () => {
    setLoading(true);
    const data = await getCallLogs();
    setLogs(data);
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadLogs();
    }, [])
  );

  const startCall = async (item, video) => {
    if (!item.peerId) {
      Alert.alert(t('common.error'), t('stream.cannotCall'));
      return;
    }
    const client = await ensureChatClientReady(user, reconnect);
    if (!client) {
      Alert.alert(t('common.error'), t('stream.connectionFailed'));
      return;
    }
    navigation.navigate('StreamCall', {
      otherUserId: item.peerId,
      otherUserName: item.peerName,
      video,
    });
  };

  const onItemPress = (item) => {
    Alert.alert(item.peerName, 'Choose an action', [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: 'View Profile',
        onPress: () => {
          if (item.peerId) {
            navigation.navigate('UserProfile', { userId: item.peerId });
          }
        },
      },
      { text: t('calls.audioCall'), onPress: () => startCall(item, false) },
      { text: t('calls.videoCall'), onPress: () => startCall(item, true) },
    ]);
  };

  const handleClear = () => {
    Alert.alert(t('calls.clearTitle'), t('calls.clearConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('calls.clearAction'),
        style: 'destructive',
        onPress: async () => {
          await clearCallLogs();
          setLogs([]);
        },
      },
    ]);
  };

  const handleCallHotline = () => {
    Linking.openURL(`tel:${FREE_BUSINESS_PHONE}`).catch(() => {
      Alert.alert('Call Failed', 'Could not open phone dialer');
    });
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (activeFilter === 'missed') {
        return log.status === 'missed' || log.direction === 'missed';
      }
      if (activeFilter === 'video') {
        return log.kind === 'video';
      }
      return true;
    });
  }, [logs, activeFilter]);

  const getCallDirectionMeta = (item) => {
    const isMissed = item.status === 'missed' || item.direction === 'missed';
    if (isMissed) {
      return {
        icon: 'arrow-down',
        color: '#FF6B6B',
        label: t('calls.missed'),
        bg: 'rgba(255, 107, 107, 0.15)',
      };
    }
    if (item.direction === 'incoming') {
      return {
        icon: 'arrow-down',
        color: '#10B981',
        label: t('calls.incoming'),
        bg: 'rgba(16, 185, 129, 0.15)',
      };
    }
    return {
      icon: 'arrow-up',
      color: '#D4AF37',
      label: t('calls.outgoing'),
      bg: 'rgba(212, 175, 55, 0.15)',
    };
  };

  const renderItem = ({ item }) => {
    const dirMeta = getCallDirectionMeta(item);
    const isMissed = item.status === 'missed' || item.direction === 'missed';
    const isVideo = item.kind === 'video';
    const timeLabel = formatCallTimestamp(item.startedAt);

    return (
      <TouchableOpacity
        style={[styles.callCard, isMissed && styles.callCardMissed]}
        onPress={() => onItemPress(item)}
        activeOpacity={0.8}
      >
        {/* Avatar with direction indicator */}
        <View style={styles.avatarWrap}>
          <Avatar uri={null} name={item.peerName} size={46} />
          <View style={[styles.directionBadge, { backgroundColor: dirMeta.bg }]}>
            <Ionicons name={dirMeta.icon} size={11} color={dirMeta.color} />
          </View>
        </View>

        {/* Call Info */}
        <View style={styles.cardInfo}>
          <Text
            style={[styles.peerName, isMissed && styles.peerNameMissed]}
            numberOfLines={1}
          >
            {item.peerName}
          </Text>

          <View style={styles.metaRow}>
            <View style={[styles.kindChip, { backgroundColor: isVideo ? 'rgba(212, 175, 55, 0.12)' : '#1C1C28' }]}>
              <Ionicons
                name={isVideo ? 'videocam' : 'call'}
                size={11}
                color={isVideo ? '#D4AF37' : '#8A8A96'}
              />
              <Text
                style={[
                  styles.kindChipText,
                  isVideo && { color: '#D4AF37' },
                ]}
              >
                {isVideo ? 'Video' : 'Audio'}
              </Text>
            </View>

            <Text style={styles.dotSeparator}>•</Text>

            <Text style={[styles.directionLabel, { color: dirMeta.color }]}>
              {dirMeta.label}
            </Text>

            {item.durationSec > 0 ? (
              <>
                <Text style={styles.dotSeparator}>•</Text>
                <Text style={styles.durationText}>
                  {formatCallDuration(item.durationSec)}
                </Text>
              </>
            ) : null}
          </View>

          <Text style={styles.timeText}>{timeLabel}</Text>
        </View>

        {/* Quick Call Back Actions */}
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.actionIconBtn}
            onPress={() => startCall(item, false)}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            activeOpacity={0.7}
          >
            <Ionicons name="call" size={17} color="#D4AF37" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionIconBtn}
            onPress={() => startCall(item, true)}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            activeOpacity={0.7}
          >
            <Ionicons name="videocam" size={18} color="#D4AF37" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const listHeader = (
    <View style={styles.headerContainer}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View>
          <View style={styles.statusBadgeRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.statusBadgeText}>SECURE HD VOICE & VIDEO</Text>
          </View>
          <Text style={styles.screenTitle}>{t('calls.title')}</Text>
        </View>

        <View style={styles.topActionsRow}>
          <TouchableOpacity
            style={styles.newCallBtn}
            onPress={() => navigation.navigate('UserSearch')}
            activeOpacity={0.85}
          >
            <Ionicons name="call" size={15} color="#D4AF37" />
            <Text style={styles.newCallBtnText}>New Call</Text>
          </TouchableOpacity>

          {logs.length > 0 ? (
            <TouchableOpacity
              style={styles.clearIconButton}
              onPress={handleClear}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={17} color="#FF6B6B" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Free Business Official Support Hotline Card */}
      <TouchableOpacity
        style={styles.hotlineCard}
        onPress={handleCallHotline}
        activeOpacity={0.88}
      >
        <View style={styles.hotlineIconWrap}>
          <Ionicons name="headset" size={22} color="#0A0A0E" />
        </View>
        <View style={styles.hotlineInfo}>
          <View style={styles.hotlineTagRow}>
            <Text style={styles.hotlineTag}>DIRECT BROKER HELPLINE</Text>
          </View>
          <Text style={styles.hotlineTitle}>Free Business Official Support</Text>
          <Text style={styles.hotlineNumber}>0326-4646455 · Tap to Call Now</Text>
        </View>
        <View style={styles.hotlineCallBtn}>
          <Ionicons name="call" size={16} color="#0A0A0E" />
        </View>
      </TouchableOpacity>

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
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0E" />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#D4AF37" />
          <Text style={styles.loadingText}>Loading call logs...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredLogs}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={listHeader}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="call-outline" size={48} color="#D4AF37" />
              </View>
              <Text style={styles.emptyTitle}>
                {activeFilter === 'missed'
                  ? 'No missed calls'
                  : activeFilter === 'video'
                    ? 'No video calls yet'
                    : 'No call history yet'}
              </Text>
              <Text style={styles.emptySubtitle}>
                Make free encrypted voice and HD video calls to verified brokers, clients, and partners.
              </Text>
              <TouchableOpacity
                style={styles.emptyCallActionBtn}
                onPress={() => navigation.navigate('UserSearch')}
                activeOpacity={0.85}
              >
                <Ionicons name="person-add" size={17} color="#0A0A0E" />
                <Text style={styles.emptyCallActionText}>Find Contacts to Call</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0E',
  },
  list: {
    paddingBottom: 95,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0A0E',
    padding: 24,
  },
  loadingText: {
    color: '#8A8A96',
    marginTop: 12,
    fontSize: 13,
  },

  /* Header Section */
  headerContainer: {
    marginBottom: 8,
  },
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
  topActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  newCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16161E',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 6,
  },
  newCallBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D4AF37',
  },
  clearIconButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#1A1418',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },

  /* Official Hotline Banner Card */
  hotlineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141419',
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 12,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  hotlineIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#D4AF37',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  hotlineInfo: {
    flex: 1,
  },
  hotlineTagRow: {
    marginBottom: 2,
  },
  hotlineTag: {
    color: '#D4AF37',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  hotlineTitle: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
  },
  hotlineNumber: {
    color: '#A0A0AE',
    fontSize: 12,
    marginTop: 2,
  },
  hotlineCallBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#D4AF37',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },

  /* Filter Tabs */
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 6,
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

  /* Call Card */
  callCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141419',
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#20202A',
  },
  callCardMissed: {
    borderColor: 'rgba(255, 107, 107, 0.25)',
  },
  avatarWrap: {
    position: 'relative',
    marginRight: 12,
  },
  directionBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#141419',
  },
  cardInfo: {
    flex: 1,
  },
  peerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  peerNameMissed: {
    color: '#FFFFFF',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  kindChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  kindChipText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#8A8A96',
  },
  dotSeparator: {
    color: '#555562',
    marginHorizontal: 5,
    fontSize: 10,
  },
  directionLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  durationText: {
    fontSize: 11,
    color: '#8A8A96',
  },
  timeText: {
    fontSize: 11,
    color: '#70707D',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },
  actionIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#181822',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
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
  emptyCallActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D4AF37',
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 10,
    gap: 8,
  },
  emptyCallActionText: {
    color: '#0A0A0E',
    fontSize: 13.5,
    fontWeight: '700',
  },
});

export default CallLogsScreen;
