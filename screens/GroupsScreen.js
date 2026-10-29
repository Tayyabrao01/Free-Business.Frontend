import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from '../hooks/useTranslation';
import { isAbortError } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useStream } from '../context/StreamProvider';
import { getGroups, deleteGroup } from '../services/socialApi';
import { getApiErrorMessage } from '../utils/apiError';
import { navigateToGroupChat } from '../services/groupChatService';

const PRIVACY_COLORS = {
  public: '#2ecc71',
  private: '#f39c12',
  secret: '#9b59b6',
};

const GroupsScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { reconnect } = useStream();
  const [groups, setGroups] = useState([]);
  const [openingChatId, setOpeningChatId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadGroups = useCallback(async (signal, showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const response = await getGroups({ signal });
      setGroups(response.data || []);
    } catch (error) {
      if (!isAbortError(error)) {
        console.error('Groups load error:', error);
        Alert.alert(t('common.error'), getApiErrorMessage(error, t('groups.loadFailed')));
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController();
      loadGroups(controller.signal);
      return () => controller.abort();
    }, [loadGroups])
  );

  const openGroupChatFromList = async (item) => {
    setOpeningChatId(item._id);
    try {
      await navigateToGroupChat({
        navigation,
        user,
        reconnect,
        groupId: item._id,
        groupName: item.name,
        memberIds: item.memberIds || [],
        isGroupOwner: Boolean(item.isOwner),
        t,
      });
    } finally {
      setOpeningChatId(null);
    }
  };

  const handleDeleteGroup = (item) => {
    Alert.alert(t('groups.deleteGroupTitle'), t('groups.deleteGroupConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('groups.deleteGroup'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteGroup(item._id);
            Alert.alert(t('common.success'), t('groups.deletedSuccess'));
            const controller = new AbortController();
            loadGroups(controller.signal, false);
          } catch (error) {
            Alert.alert(t('common.error'), getApiErrorMessage(error, t('groups.actionFailed')));
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => navigation.navigate('GroupDetail', { groupId: item._id })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.iconWrap}>
            <Ionicons name="people" size={28} color="#D4AF37" />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.groupName}>{item.name}</Text>
            <Text style={styles.groupDesc} numberOfLines={2}>
              {item.description || t('groups.noDescription')}
            </Text>
          </View>
        </View>
        <View style={styles.cardMeta}>
          <View style={[styles.privacyBadge, { backgroundColor: PRIVACY_COLORS[item.privacy] || '#888' }]}>
            <Text style={styles.privacyText}>{t(`groups.privacy.${item.privacy}`)}</Text>
          </View>
          <Text style={styles.meta}>
            {item.membersCount} {t('groups.members')} · {item.postsCount} {t('groups.posts')}
          </Text>
          {item.isMember && <Text style={styles.memberTag}>{t('groups.joined')}</Text>}
          {item.isPending && <Text style={styles.pendingTag}>{t('groups.pending')}</Text>}
        </View>
      </TouchableOpacity>
      <View style={styles.cardActions}>
        {(item.isMember || item.isOwner) && item.canChat !== false ? (
          <TouchableOpacity
            style={styles.chatBtn}
            onPress={() => openGroupChatFromList(item)}
            disabled={openingChatId === item._id}
          >
            {openingChatId === item._id ? (
              <ActivityIndicator size="small" color="#000000" />
            ) : (
              <>
                <Ionicons name="chatbubble-ellipses" size={16} color="#000000" />
                <Text style={styles.chatBtnText}>{t('groups.openGroupChat')}</Text>
              </>
            )}
          </TouchableOpacity>
        ) : null}
        {item.isOwner ? (
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDeleteGroup(item)}
          >
            <Ionicons name="trash-outline" size={18} color="#e74c3c" />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('groups.title')}</Text>
        <Text style={styles.subtitle}>{t('groups.subtitle')}</Text>
      </View>

      <FlatList
        data={groups}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              const controller = new AbortController();
              loadGroups(controller.signal, false);
            }}
            tintColor="#D4AF37"
          />
        }
        ListEmptyComponent={<Text style={styles.empty}>{t('groups.noGroups')}</Text>}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateGroup')}
      >
        <Ionicons name="add" size={32} color="#000000" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: '#D4AF37',
    paddingTop: 50,
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  title: { fontSize: 26, fontWeight: 'bold', color: '#000000' },
  subtitle: { fontSize: 14, color: '#1a1a1a', marginTop: 6 },
  list: { padding: 16, paddingBottom: 100 },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardInfo: { flex: 1 },
  groupName: { fontSize: 18, fontWeight: 'bold', color: '#D4AF37' },
  groupDesc: { fontSize: 13, color: '#888888', marginTop: 4 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 12, flexWrap: 'wrap' },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  privacyBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginRight: 8 },
  privacyText: { color: '#000000', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  meta: { color: '#888888', fontSize: 12, flex: 1 },
  memberTag: { color: '#2ecc71', fontSize: 11, fontWeight: 'bold', marginLeft: 8 },
  pendingTag: { color: '#f39c12', fontSize: 11, fontWeight: 'bold', marginLeft: 8 },
  chatBtn: {
    backgroundColor: '#D4AF37',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    gap: 6,
  },
  chatBtnText: { color: '#000000', fontSize: 12, fontWeight: '700' },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  empty: { color: '#888888', textAlign: 'center', marginTop: 40, fontSize: 16 },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#D4AF37',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
});

export default GroupsScreen;
