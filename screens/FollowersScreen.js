import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { FlatList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from '../hooks/useTranslation';
import Avatar from '../components/Avatar';
import { isAbortError } from '../services/api';
import { getFollowers, getFollowing } from '../services/socialApi';
import { useAuth } from '../context/AuthContext';
import { useStream } from '../context/StreamProvider';
import { ensureChatClientReady } from '../services/streamClientService';
import { getApiErrorMessage } from '../utils/apiError';

const FollowersScreen = ({ route, navigation }) => {
  const { userId, userName, initialTab = 'followers' } = route.params;
  const { t } = useTranslation();
  const { user } = useAuth();
  const { reconnect } = useStream();
  const [tab, setTab] = useState(initialTab);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController();

      const loadLists = async () => {
        setLoading(true);
        try {
          const [followersRes, followingRes] = await Promise.all([
            getFollowers(userId, { signal: controller.signal }),
            getFollowing(userId, { signal: controller.signal }),
          ]);
          if (!controller.signal.aborted) {
            setFollowers(followersRes.data?.followers || []);
            setFollowing(followingRes.data?.following || []);
          }
        } catch (error) {
          if (!isAbortError(error)) {
            console.error('Followers load error:', error);
          }
        } finally {
          if (!controller.signal.aborted) {
            setLoading(false);
          }
        }
      };

      loadLists();
      return () => controller.abort();
    }, [userId])
  );

  const data = tab === 'followers' ? followers : following;

  const openChat = async (item) => {
    try {
      const client = await ensureChatClientReady(user, reconnect);
      if (!client) {
        Alert.alert(t('common.error'), t('stream.connectionFailed'));
        return;
      }
      navigation.navigate('Chat', {
        otherUserId: item._id,
        otherUserName: item.name,
        otherUserAvatar: item.avatar,
      });
    } catch (error) {
      Alert.alert(t('common.error'), getApiErrorMessage(error, t('stream.chatLoadFailed')));
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.row}>
      <TouchableOpacity
        style={styles.rowMain}
        onPress={() => navigation.push('UserProfile', { userId: item._id })}
      >
        <Avatar uri={item.avatar} name={item.name} size={44} />
        <View style={styles.rowInfo}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.bio} numberOfLines={1}>
            {item.bio || item.location || t('social.noBio')}
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity style={styles.msgBtn} onPress={() => openChat(item)}>
        <Ionicons name="chatbubble-outline" size={22} color="#D4AF37" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>{t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{userName || t('social.connections')}</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'followers' && styles.tabActive]}
          onPress={() => setTab('followers')}
        >
          <Text style={[styles.tabText, tab === 'followers' && styles.tabTextActive]}>
            {t('social.followers')} ({followers.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'following' && styles.tabActive]}
          onPress={() => setTab('following')}
        >
          <Text style={[styles.tabText, tab === 'following' && styles.tabTextActive]}>
            {t('social.following')} ({following.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color="#D4AF37" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={(item) => item._id?.toString()}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {tab === 'followers' ? t('social.noFollowers') : t('social.noFollowing')}
            </Text>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  header: { paddingTop: 50, padding: 20, backgroundColor: '#D4AF37' },
  back: { color: '#000000', marginBottom: 8, fontWeight: '600' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#000000' },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#333333' },
  tab: { flex: 1, padding: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#D4AF37' },
  tabText: { color: '#888888', fontWeight: '600' },
  tabTextActive: { color: '#D4AF37' },
  list: { padding: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  msgBtn: { padding: 8, marginLeft: 8 },
  rowInfo: { flex: 1, marginLeft: 12 },
  name: { color: '#D4AF37', fontSize: 16, fontWeight: '600' },
  bio: { color: '#888888', fontSize: 12, marginTop: 2 },
  empty: { color: '#888888', textAlign: 'center', marginTop: 40 },
});

export default FollowersScreen;
