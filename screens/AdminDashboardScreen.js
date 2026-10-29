import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from '../hooks/useTranslation';
import api from '../services/api';
import {
  getAdminStats,
  getAdminUsers,
  getAdminActivities,
  deleteAdminUser,
  deleteAdminPost,
} from '../services/adminApi';
import { getApiErrorMessage } from '../utils/apiError';

const TOP_TABS = ['followers', 'posts', 'sales'];

const AdminDashboardScreen = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);
  const [topUsers, setTopUsers] = useState({ byFollowers: [], byPosts: [], bySales: [] });
  const [users, setUsers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [posts, setPosts] = useState([]);
  const [topTab, setTopTab] = useState('followers');
  const [actionId, setActionId] = useState(null);

  const loadDashboard = async () => {
    try {
      const [statsRes, usersRes, activitiesRes, postsRes] = await Promise.all([
        getAdminStats(),
        getAdminUsers(),
        getAdminActivities(30),
        api.get('/posts'),
      ]);

      setStats(statsRes.data);
      setTopUsers(statsRes.data.topUsers || { byFollowers: [], byPosts: [], bySales: [] });
      setUsers(usersRes.data || []);
      setActivities(activitiesRes.data || []);
      setPosts(postsRes.data || []);
    } catch (error) {
      console.error('Admin dashboard load error:', error);
      Alert.alert(
        t('common.error'),
        getApiErrorMessage(error, t('admin.loadFailed'))
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadDashboard();
    }, [])
  );

  const confirmDeleteUser = (user) => {
    Alert.alert(
      t('admin.deleteUserTitle'),
      t('admin.deleteUserConfirm', { name: user.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('admin.delete'),
          style: 'destructive',
          onPress: () => handleDeleteUser(user._id),
        },
      ]
    );
  };

  const confirmDeletePost = (post) => {
    Alert.alert(t('admin.deletePostTitle'), t('admin.deletePostConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('admin.delete'),
        style: 'destructive',
        onPress: () => handleDeletePost(post._id),
      },
    ]);
  };

  const handleDeleteUser = async (userId) => {
    setActionId(userId);
    try {
      await deleteAdminUser(userId);
      Alert.alert(t('common.success'), t('admin.userDeleted'));
      await loadDashboard();
    } catch (error) {
      Alert.alert(
        t('common.error'),
        getApiErrorMessage(error, t('admin.deleteFailed'))
      );
    } finally {
      setActionId(null);
    }
  };

  const handleDeletePost = async (postId) => {
    setActionId(postId);
    try {
      await deleteAdminPost(postId);
      Alert.alert(t('common.success'), t('admin.postDeleted'));
      await loadDashboard();
    } catch (error) {
      Alert.alert(
        t('common.error'),
        getApiErrorMessage(error, t('admin.deleteFailed'))
      );
    } finally {
      setActionId(null);
    }
  };

  const formatActivity = (item) => {
    const userName = item.user?.name || t('common.user');
    const label = t(`admin.actions.${item.action}`);
    return `${userName} · ${label}`;
  };

  const getTopList = () => {
    if (topTab === 'posts') return topUsers.byPosts || [];
    if (topTab === 'sales') return topUsers.bySales || [];
    return topUsers.byFollowers || [];
  };

  const getTopMetric = (user) => {
    if (topTab === 'posts') return user.postsCount;
    if (topTab === 'sales') return user.salesCount;
    return user.followersCount;
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadDashboard();
          }}
          tintColor="#D4AF37"
        />
      }
    >
      <View style={styles.header}>
        <Ionicons name="shield-checkmark" size={28} color="#000000" />
        <Text style={styles.headerTitle}>{t('admin.title')}</Text>
        <Text style={styles.headerSubtitle}>{t('admin.subtitle')}</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats?.totalUsers ?? 0}</Text>
          <Text style={styles.statLabel}>{t('admin.totalUsers')}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats?.totalPosts ?? 0}</Text>
          <Text style={styles.statLabel}>{t('admin.totalPosts')}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats?.totalGroups ?? 0}</Text>
          <Text style={styles.statLabel}>{t('admin.totalGroups')}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>{t('admin.topUsers')}</Text>
      <View style={styles.tabRow}>
        {TOP_TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabBtn, topTab === tab && styles.tabBtnActive]}
            onPress={() => setTopTab(tab)}
          >
            <Text style={[styles.tabBtnText, topTab === tab && styles.tabBtnTextActive]}>
              {t(`admin.topBy.${tab}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {getTopList().map((user, index) => (
        <View key={user._id} style={styles.rankRow}>
          <Text style={styles.rank}>#{index + 1}</Text>
          <View style={styles.rankInfo}>
            <Text style={styles.rankName}>{user.name}</Text>
            <Text style={styles.rankEmail}>{user.email}</Text>
          </View>
          <Text style={styles.rankMetric}>{getTopMetric(user)}</Text>
        </View>
      ))}
      {getTopList().length === 0 && (
        <Text style={styles.emptyText}>{t('admin.noData')}</Text>
      )}

      <Text style={styles.sectionTitle}>{t('admin.recentActivities')}</Text>
      {activities.map((item) => (
        <View key={item._id} style={styles.activityCard}>
          <Text style={styles.activityText}>{formatActivity(item)}</Text>
          <Text style={styles.activityDate}>
            {new Date(item.createdAt).toLocaleString()}
          </Text>
        </View>
      ))}
      {activities.length === 0 && (
        <Text style={styles.emptyText}>{t('admin.noActivities')}</Text>
      )}

      <Text style={styles.sectionTitle}>{t('admin.userManagement')}</Text>
      {users.map((user) => (
        <View key={user._id} style={styles.manageCard}>
          <View style={styles.manageInfo}>
            <Text style={styles.manageName}>{user.name}</Text>
            <Text style={styles.manageMeta}>
              {user.email} · {user.role}
            </Text>
            <Text style={styles.manageMeta}>
              {t('admin.followers')}: {user.followersCount} · {t('admin.posts')}:{' '}
              {user.postsCount} · {t('admin.sales')}: {user.salesCount} ·{' '}
              {t('admin.activities')}: {user.activityCount}
            </Text>
          </View>
          {user.role !== 'admin' && (
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => confirmDeleteUser(user)}
              disabled={actionId === user._id}
            >
              {actionId === user._id ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <Ionicons name="trash-outline" size={20} color="#000000" />
              )}
            </TouchableOpacity>
          )}
        </View>
      ))}

      <Text style={styles.sectionTitle}>{t('admin.postModeration')}</Text>
      {posts.map((post) => (
        <View key={post._id} style={styles.manageCard}>
          <View style={styles.manageInfo}>
            <Text style={styles.manageName}>
              {post.author?.name || t('common.user')}
            </Text>
            <Text style={styles.postContent} numberOfLines={3}>
              {post.content}
            </Text>
            <Text style={styles.manageMeta}>
              {new Date(post.createdAt).toLocaleString()}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => confirmDeletePost(post)}
            disabled={actionId === post._id}
          >
            {actionId === post._id ? (
              <ActivityIndicator size="small" color="#000000" />
            ) : (
              <Ionicons name="trash-outline" size={20} color="#000000" />
            )}
          </TouchableOpacity>
        </View>
      ))}
      {posts.length === 0 && <Text style={styles.emptyText}>{t('admin.noPosts')}</Text>}

      <View style={styles.bottomPad} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000000' },
  header: {
    backgroundColor: '#D4AF37',
    paddingTop: 50,
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#000000', marginTop: 8 },
  headerSubtitle: { fontSize: 14, color: '#1a1a1a', marginTop: 6 },
  statsRow: { flexDirection: 'row', padding: 16 },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  statValue: { fontSize: 22, fontWeight: 'bold', color: '#D4AF37' },
  statLabel: { fontSize: 11, color: '#888888', marginTop: 4, textAlign: 'center' },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 10,
  },
  tabRow: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 10 },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#D4AF37',
    borderRadius: 8,
    alignItems: 'center',
  },
  tabBtnActive: { backgroundColor: '#D4AF37' },
  tabBtnText: { color: '#D4AF37', fontSize: 11, fontWeight: '600' },
  tabBtnTextActive: { color: '#000000' },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  rank: { color: '#D4AF37', fontWeight: 'bold', width: 28 },
  rankInfo: { flex: 1 },
  rankName: { color: '#D4AF37', fontWeight: '600', fontSize: 15 },
  rankEmail: { color: '#666666', fontSize: 12, marginTop: 2 },
  rankMetric: { color: '#D4AF37', fontWeight: 'bold', fontSize: 16 },
  activityCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#D4AF37',
  },
  activityText: { color: '#D4AF37', fontSize: 14 },
  activityDate: { color: '#666666', fontSize: 11, marginTop: 4 },
  manageCard: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 12,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333333',
  },
  manageInfo: { flex: 1 },
  manageName: { color: '#D4AF37', fontWeight: 'bold', fontSize: 15 },
  manageMeta: { color: '#888888', fontSize: 12, marginTop: 4 },
  postContent: { color: '#cccccc', fontSize: 13, marginTop: 6 },
  deleteBtn: {
    backgroundColor: '#c0392b',
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginLeft: 8,
  },
  emptyText: { color: '#666666', textAlign: 'center', marginBottom: 16, fontSize: 14 },
  bottomPad: { height: 24 },
});

export default AdminDashboardScreen;
