import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../context/AuthContext';
import { ensureChatClientReady } from '../services/streamClientService';
import { useStream } from '../context/StreamProvider';
import {
  getCallLogs,
  clearCallLogs,
  formatCallDuration,
} from '../services/callLogService';

const CallLogsScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { reconnect } = useStream();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

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
    Alert.alert(item.peerName, t('calls.chooseCallType'), [
      { text: t('common.cancel'), style: 'cancel' },
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

  const getIcon = (item) => {
    if (item.status === 'missed' || item.direction === 'missed') {
      return { name: 'call-outline', color: '#e74c3c' };
    }
    if (item.direction === 'incoming') {
      return { name: 'arrow-down-outline', color: '#2ecc71' };
    }
    return { name: 'arrow-up-outline', color: '#D4AF37' };
  };

  const renderItem = ({ item }) => {
    const icon = getIcon(item);
    const when = new Date(item.startedAt);
    const timeLabel = Number.isNaN(when.getTime())
      ? ''
      : when.toLocaleString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

    return (
      <TouchableOpacity style={styles.row} onPress={() => onItemPress(item)} activeOpacity={0.8}>
        <View style={styles.iconWrap}>
          <Ionicons name={icon.name} size={22} color={icon.color} />
        </View>
        <View style={styles.rowBody}>
          <Text style={styles.name}>{item.peerName}</Text>
          <Text style={styles.meta}>
            {item.direction === 'incoming' ? t('calls.incoming') : t('calls.outgoing')}
            {' · '}
            {item.kind === 'video' ? t('calls.video') : t('calls.audio')}
            {item.durationSec > 0 ? ` · ${formatCallDuration(item.durationSec)}` : ''}
          </Text>
        </View>
        <View style={styles.rowEnd}>
          <Text style={styles.time}>{timeLabel}</Text>
          <TouchableOpacity onPress={() => startCall(item, false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="call" size={22} color="#D4AF37" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('calls.title')}</Text>
        {logs.length > 0 ? (
          <TouchableOpacity onPress={handleClear}>
            <Text style={styles.clearBtn}>{t('calls.clearAction')}</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#D4AF37" />
        </View>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={logs.length ? styles.list : styles.listEmpty}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="call-outline" size={48} color="#444" />
              <Text style={styles.emptyText}>{t('calls.empty')}</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    backgroundColor: '#D4AF37',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  title: { fontSize: 26, fontWeight: 'bold', color: '#000' },
  clearBtn: { color: '#000', fontWeight: '600', fontSize: 14 },
  list: { paddingBottom: 24 },
  listEmpty: { flexGrow: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyText: { color: '#888', marginTop: 12, textAlign: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rowBody: { flex: 1 },
  name: { color: '#D4AF37', fontSize: 16, fontWeight: '600' },
  meta: { color: '#888', fontSize: 12, marginTop: 4 },
  rowEnd: { alignItems: 'flex-end' },
  time: { color: '#666', fontSize: 11, marginBottom: 6 },
});

export default CallLogsScreen;
