import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
  StatusBar,
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

const PRIVACY_CONFIG = {
  public: {
    label: 'Public',
    icon: 'globe-outline',
    color: '#10B981',
    bg: 'rgba(16, 185, 129, 0.12)',
  },
  private: {
    label: 'Private',
    icon: 'lock-closed-outline',
    color: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.12)',
  },
  secret: {
    label: 'Secret',
    icon: 'eye-off-outline',
    color: '#8B5CF6',
    bg: 'rgba(139, 92, 246, 0.12)',
  },
};

const FILTER_TABS = [
  { id: 'all', label: 'All Hubs' },
  { id: 'joined', label: 'My Groups' },
  { id: 'public', label: 'Public' },
];

const GroupsScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { reconnect } = useStream();

  const [groups, setGroups] = useState([]);
  const [openingChatId, setOpeningChatId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

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
  }, [t]);

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

  // Filter & Search Logic
  const filteredGroups = useMemo(() => {
    return groups.filter((g) => {
      // Filter tab
      if (activeFilter === 'joined' && !(g.isMember || g.isOwner)) return false;
      if (activeFilter === 'public' && g.privacy !== 'public') return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const nameMatch = g.name?.toLowerCase().includes(query);
        const descMatch = g.description?.toLowerCase().includes(query);
        return nameMatch || descMatch;
      }
      return true;
    });
  }, [groups, activeFilter, searchQuery]);

  const renderGroupCard = ({ item }) => {
    const privacy = PRIVACY_CONFIG[item.privacy] || PRIVACY_CONFIG.public;
    const isOwner = Boolean(item.isOwner);
    const isMember = Boolean(item.isMember);
    const isPending = Boolean(item.isPending);

    // Initial letters for emblem
    const emblemInitials = (item.name || 'FB')
      .split(' ')
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

    return (
      <View style={[styles.card, (isMember || isOwner) && styles.cardJoined]}>
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => navigation.navigate('GroupDetail', { groupId: item._id })}
        >
          {/* Card Top: Emblem + Info + Privacy */}
          <View style={styles.cardHeader}>
            <View style={styles.emblemContainer}>
              <View style={styles.emblemWrap}>
                <Text style={styles.emblemText}>{emblemInitials}</Text>
              </View>
              {isOwner ? (
                <View style={styles.ownerCrownBadge}>
                  <Ionicons name="star" size={10} color="#0A0A0E" />
                </View>
              ) : null}
            </View>

            <View style={styles.cardInfo}>
              <View style={styles.titleRow}>
                <Text style={styles.groupName} numberOfLines={1}>
                  {item.name}
                </Text>
                <View style={[styles.privacyChip, { backgroundColor: privacy.bg }]}>
                  <Ionicons name={privacy.icon} size={11} color={privacy.color} />
                  <Text style={[styles.privacyText, { color: privacy.color }]}>
                    {t(`groups.privacy.${item.privacy}`) || privacy.label}
                  </Text>
                </View>
              </View>

              <Text style={styles.groupDesc} numberOfLines={2}>
                {item.description || t('groups.noDescription')}
              </Text>
            </View>
          </View>

          {/* Card Stats & Membership Status */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="people-outline" size={13} color="#9E9EA8" />
              <Text style={styles.statText}>
                {item.membersCount || 1} {t('groups.members')}
              </Text>
            </View>

            <View style={styles.statDot} />

            <View style={styles.statItem}>
              <Ionicons name="chatbox-ellipses-outline" size={13} color="#9E9EA8" />
              <Text style={styles.statText}>
                {item.postsCount || 0} {t('groups.posts')}
              </Text>
            </View>

            <View style={styles.statusRightWrap}>
              {isOwner ? (
                <View style={styles.roleTagAdmin}>
                  <Ionicons name="shield-checkmark" size={11} color="#D4AF37" />
                  <Text style={styles.roleTagAdminText}>Admin</Text>
                </View>
              ) : isMember ? (
                <View style={styles.roleTagMember}>
                  <Ionicons name="checkmark-circle" size={11} color="#10B981" />
                  <Text style={styles.roleTagMemberText}>{t('groups.joined')}</Text>
                </View>
              ) : isPending ? (
                <View style={styles.roleTagPending}>
                  <Ionicons name="time-outline" size={11} color="#F59E0B" />
                  <Text style={styles.roleTagPendingText}>{t('groups.pending')}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </TouchableOpacity>

        {/* Action Bar (Chat & Delete buttons) */}
        {(isMember || isOwner) && (
          <View style={styles.cardActions}>
            {item.canChat !== false ? (
              <TouchableOpacity
                style={styles.chatActionBtn}
                onPress={() => openGroupChatFromList(item)}
                disabled={openingChatId === item._id}
                activeOpacity={0.8}
              >
                {openingChatId === item._id ? (
                  <ActivityIndicator size="small" color="#0A0A0E" />
                ) : (
                  <>
                    <Ionicons name="chatbubbles" size={14} color="#0A0A0E" />
                    <Text style={styles.chatActionText}>{t('groups.openGroupChat')}</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={styles.enterHubBtn}
              onPress={() => navigation.navigate('GroupDetail', { groupId: item._id })}
              activeOpacity={0.7}
            >
              <Text style={styles.enterHubText}>View Hub</Text>
              <Ionicons name="chevron-forward" size={14} color="#D4AF37" />
            </TouchableOpacity>

            {isOwner ? (
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDeleteGroup(item)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={16} color="#FF6B6B" />
              </TouchableOpacity>
            ) : null}
          </View>
        )}
      </View>
    );
  };

  // Header Component for FlatList
  const listHeader = (
    <View style={styles.headerContainer}>
      {/* Top Banner */}
      <View style={styles.topBar}>
        <View>
          <View style={styles.statusBadgeRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.statusBadgeText}>PROFESSIONAL NETWORK</Text>
          </View>
          <Text style={styles.screenTitle}>{t('groups.title')}</Text>
        </View>

        <TouchableOpacity
          style={styles.createTopBtn}
          onPress={() => navigation.navigate('CreateGroup')}
          activeOpacity={0.85}
        >
          <Ionicons name="add-circle" size={17} color="#D4AF37" />
          <Text style={styles.createTopBtnText}>Create Hub</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={17} color="#8A8A96" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search groups, societies, or topics..."
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

      {/* Filter Tabs */}
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
          <Text style={styles.loadingText}>Loading communities...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredGroups}
          renderItem={renderGroupCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={listHeader}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                const controller = new AbortController();
                loadGroups(controller.signal, false);
              }}
              tintColor="#D4AF37"
              colors={['#D4AF37']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="people-circle-outline" size={54} color="#D4AF37" />
              </View>
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'No matching communities' : t('groups.noGroups')}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? `No groups found for "${searchQuery}". Try a different search.`
                  : 'Create a private hub or public real estate group to collaborate with partners.'}
              </Text>
              <TouchableOpacity
                style={styles.emptyCreateBtn}
                onPress={() => navigation.navigate('CreateGroup')}
                activeOpacity={0.85}
              >
                <Ionicons name="add" size={18} color="#0A0A0E" />
                <Text style={styles.emptyCreateBtnText}>{t('groups.createGroup')}</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('CreateGroup')}
      >
        <Ionicons name="add" size={28} color="#0A0A0E" />
      </TouchableOpacity>
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0A0E',
  },
  loadingText: {
    color: '#8A8A96',
    fontSize: 13,
    marginTop: 10,
  },
  list: {
    paddingBottom: 95,
  },

  /* Header Section */
  headerContainer: {
    paddingBottom: 10,
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
  createTopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16161E',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  createTopBtnText: {
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

  /* Card Design */
  card: {
    backgroundColor: '#141419',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#22222E',
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  cardJoined: {
    borderColor: 'rgba(212, 175, 55, 0.28)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  emblemContainer: {
    position: 'relative',
    marginRight: 12,
  },
  emblemWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#1B1B24',
    borderWidth: 1.5,
    borderColor: '#D4AF37',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emblemText: {
    color: '#D4AF37',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  ownerCrownBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#D4AF37',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    marginRight: 8,
  },
  privacyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  privacyText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  groupDesc: {
    fontSize: 12.5,
    color: '#9E9EA8',
    lineHeight: 18,
  },

  /* Stats & Tags */
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1E1E28',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statText: {
    fontSize: 11.5,
    color: '#8A8A96',
    fontWeight: '500',
  },
  statDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#40404E',
    marginHorizontal: 8,
  },
  statusRightWrap: {
    marginLeft: 'auto',
  },
  roleTagAdmin: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  roleTagAdminText: {
    color: '#D4AF37',
    fontSize: 10.5,
    fontWeight: '700',
  },
  roleTagMember: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  roleTagMemberText: {
    color: '#10B981',
    fontSize: 10.5,
    fontWeight: '700',
  },
  roleTagPending: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  roleTagPendingText: {
    color: '#F59E0B',
    fontSize: 10.5,
    fontWeight: '700',
  },

  /* Actions */
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1A1A22',
    gap: 8,
  },
  chatActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D4AF37',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  chatActionText: {
    color: '#0A0A0E',
    fontSize: 11.5,
    fontWeight: '700',
  },
  enterHubBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 3,
  },
  enterHubText: {
    color: '#D4AF37',
    fontSize: 11.5,
    fontWeight: '600',
  },
  deleteBtn: {
    marginLeft: 'auto',
    padding: 6,
  },

  /* Empty State */
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 30,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#16161E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#242430',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#8A8A96',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  emptyCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D4AF37',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  emptyCreateBtnText: {
    color: '#0A0A0E',
    fontSize: 13,
    fontWeight: '700',
  },

  /* FAB */
  fab: {
    position: 'absolute',
    bottom: 22,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#D4AF37',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
});

export default GroupsScreen;
