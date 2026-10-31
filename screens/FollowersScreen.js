import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
  StatusBar,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
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

  const renderItem = ({ item }) => {
    const isSelf = user?._id?.toString() === item._id?.toString();

    return (
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.cardMain}
          activeOpacity={0.7}
          onPress={() => navigation.push('UserProfile', { userId: item._id })}
        >
          <View style={styles.avatarBorder}>
            <Avatar uri={item.avatar} name={item.name} size={46} />
          </View>
          <View style={styles.cardInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
              <Ionicons name="checkmark-circle" size={14} color="#D4AF37" />
            </View>
            <Text style={styles.bio} numberOfLines={1}>
              {item.bio || item.location || t('social.noBio')}
            </Text>
          </View>
        </TouchableOpacity>

        {!isSelf ? (
          <TouchableOpacity
            style={styles.chatIconBtn}
            activeOpacity={0.7}
            onPress={() => openChat(item)}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={18} color="#D4AF37" />
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0E" />

      {/* TOP HEADER */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={20} color="#D4AF37" />
        </TouchableOpacity>
        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {userName ? `${userName}'s Network` : t('social.connections')}
          </Text>
          <Text style={styles.headerSubtitle}>Verified Investor Connections</Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      {/* SEGMENTED TABS */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, tab === 'followers' && styles.tabItemActive]}
          activeOpacity={0.7}
          onPress={() => setTab('followers')}
        >
          <Text style={[styles.tabText, tab === 'followers' && styles.tabTextActive]}>
            {t('social.followers')} ({followers.length})
          </Text>
          {tab === 'followers' ? <View style={styles.tabIndicator} /> : null}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, tab === 'following' && styles.tabItemActive]}
          activeOpacity={0.7}
          onPress={() => setTab('following')}
        >
          <Text style={[styles.tabText, tab === 'following' && styles.tabTextActive]}>
            {t('social.following')} ({following.length})
          </Text>
          {tab === 'following' ? <View style={styles.tabIndicator} /> : null}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#D4AF37" size="large" />
          <Text style={styles.loadingText}>Loading network...</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={(item) => item._id?.toString()}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={54} color="#2A2A38" />
              <Text style={styles.emptyTitle}>
                {tab === 'followers' ? t('social.noFollowers') : t('social.noFollowing')}
              </Text>
              <Text style={styles.emptySubtitle}>
                {tab === 'followers'
                  ? 'Connect with investors to build your following'
                  : 'Discover brokers and investors to follow'}
              </Text>
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#8E8E9F',
    fontSize: 13,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A22',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#141419',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  headerTitleGroup: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#8E8E9F',
    marginTop: 2,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#0E0E14',
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A22',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabItemActive: {},
  tabText: {
    color: '#8E8E9F',
    fontWeight: '600',
    fontSize: 13,
  },
  tabTextActive: {
    color: '#D4AF37',
    fontWeight: '800',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 60,
    height: 2.5,
    backgroundColor: '#D4AF37',
    borderRadius: 2,
  },
  list: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141419',
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#23232C',
  },
  cardMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBorder: {
    borderRadius: 25,
    padding: 2,
    borderWidth: 1.5,
    borderColor: '#D4AF37',
  },
  cardInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  name: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  bio: {
    color: '#8E8E9F',
    fontSize: 12,
    marginTop: 3,
  },
  chatIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    gap: 8,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: '#8E8E9F',
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 240,
  },
});

export default FollowersScreen;
