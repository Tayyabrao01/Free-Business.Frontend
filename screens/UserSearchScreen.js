import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Svg, {
  Defs,
  LinearGradient as SvgGradient,
  Stop,
  Rect,
  Circle as SvgCircle,
} from 'react-native-svg';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../context/AuthContext';
import { useStream } from '../context/StreamProvider';
import { ensureChatClientReady } from '../services/streamClientService';
import Avatar from '../components/Avatar';
import { getUsers, followUser, unfollowUser } from '../services/socialApi';
import { getApiErrorMessage } from '../utils/apiError';

const FILTER_TABS = [
  { id: 'all', label: 'All Members', icon: 'people-outline' },
  { id: 'brokers', label: 'Brokers & Agents', icon: 'business-outline' },
  { id: 'following', label: 'Following', icon: 'checkmark-circle-outline' },
];

const UserSearchScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { reconnect } = useStream();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [openingChatId, setOpeningChatId] = useState(null);

  const loadUsers = async (query = '') => {
    try {
      const response = await getUsers(query);
      setUsers(response.data || []);
    } catch (error) {
      console.error('User search error:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadUsers('');
    }, [])
  );

  const handleSearchSubmit = () => {
    setLoading(true);
    loadUsers(search.trim());
  };

  const handleClearSearch = () => {
    setSearch('');
    setLoading(true);
    loadUsers('');
  };

  const toggleFollow = async (item) => {
    setActionId(item._id);
    try {
      if (item.isFollowing) {
        await unfollowUser(item._id);
      } else {
        await followUser(item._id);
      }
      loadUsers(search.trim());
    } catch (error) {
      Alert.alert(t('common.error'), getApiErrorMessage(error, t('social.actionFailed')));
    } finally {
      setActionId(null);
    }
  };

  const openDirectChat = async (item) => {
    if (openingChatId) return;
    setOpeningChatId(item._id);
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
    } finally {
      setOpeningChatId(null);
    }
  };

  // Filter users based on active tab
  const filteredUsers = useMemo(() => {
    if (activeTab === 'brokers') {
      return users.filter(
        (u) =>
          u.role === 'agent' ||
          u.role === 'broker' ||
          u.role === 'admin'
      );
    }
    if (activeTab === 'following') {
      return users.filter((u) => Boolean(u.isFollowing));
    }
    return users;
  }, [users, activeTab]);

  const renderMemberCard = ({ item }) => {
    const isSelf = user?._id?.toString() === item._id?.toString();
    const isBroker = item.role === 'agent' || item.role === 'broker';

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('UserProfile', { userId: item._id })}
      >
        {/* Top Info Row */}
        <View style={styles.cardTopRow}>
          <View style={styles.avatarGlowRing}>
            <Avatar uri={item.avatar} name={item.name} size={52} />
          </View>

          <View style={styles.identityCol}>
            <View style={styles.nameRow}>
              <Text style={styles.userName} numberOfLines={1}>
                {item.name}
              </Text>
              <Ionicons name="checkmark-circle" size={16} color="#D4AF37" style={styles.verifiedIcon} />
            </View>

            <View style={styles.tagsRow}>
              <View style={[styles.roleBadge, isBroker && styles.brokerBadge]}>
                <Ionicons
                  name={isBroker ? 'business-outline' : 'ribbon-outline'}
                  size={11}
                  color={isBroker ? '#F59E0B' : '#D4AF37'}
                />
                <Text style={[styles.roleBadgeText, isBroker && styles.brokerBadgeText]}>
                  {item.role ? item.role.toUpperCase() : 'INVESTOR'}
                </Text>
              </View>

              <View style={styles.locationPill}>
                <Ionicons name="location-outline" size={11} color="#8E8E9F" />
                <Text style={styles.locationText} numberOfLines={1}>
                  {item.location || 'Pakistan'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bio snippet if available */}
        {item.bio ? (
          <Text style={styles.bioSnippet} numberOfLines={2}>
            {item.bio}
          </Text>
        ) : null}

        {/* Social Metrics Bar */}
        <View style={styles.cardMetricsRow}>
          <View style={styles.metricItem}>
            <Ionicons name="people-outline" size={13} color="#D4AF37" />
            <Text style={styles.metricText}>
              <Text style={styles.metricHighlight}>{item.followersCount || 0}</Text> Followers
            </Text>
          </View>

          <View style={styles.metricDivider} />

          <View style={styles.metricItem}>
            <Ionicons name="newspaper-outline" size={13} color="#8E8E9F" />
            <Text style={styles.metricText}>
              <Text style={styles.metricHighlight}>{item.postsCount || 0}</Text> Posts
            </Text>
          </View>
        </View>

        {/* Action Buttons Row */}
        {!isSelf ? (
          <View style={styles.cardActionsRow}>
            {/* Direct Message Button */}
            <TouchableOpacity
              style={styles.chatButton}
              activeOpacity={0.8}
              onPress={() => openDirectChat(item)}
              disabled={openingChatId === item._id}
            >
              {openingChatId === item._id ? (
                <ActivityIndicator color="#D4AF37" size="small" />
              ) : (
                <>
                  <Ionicons name="chatbubble-ellipses-outline" size={16} color="#D4AF37" />
                  <Text style={styles.chatButtonText}>{t('stream.message') || 'Message'}</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Follow / Following Toggle Button */}
            <TouchableOpacity
              style={[
                styles.followButton,
                item.isFollowing && styles.followingButton,
              ]}
              activeOpacity={0.8}
              onPress={() => toggleFollow(item)}
              disabled={actionId === item._id}
            >
              {actionId === item._id ? (
                <ActivityIndicator
                  color={item.isFollowing ? '#D4AF37' : '#0A0A0E'}
                  size="small"
                />
              ) : (
                <>
                  <Ionicons
                    name={item.isFollowing ? 'checkmark-outline' : 'person-add-outline'}
                    size={16}
                    color={item.isFollowing ? '#D4AF37' : '#0A0A0E'}
                  />
                  <Text
                    style={[
                      styles.followButtonText,
                      item.isFollowing && styles.followingButtonText,
                    ]}
                  >
                    {item.isFollowing ? t('social.following') || 'Following' : t('social.follow') || 'Follow'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0E" />

      {/* LUXURY COVER HERO */}
      <View style={styles.heroCover}>
        <Svg style={StyleSheet.absoluteFill}>
          <Defs>
            <SvgGradient id="peopleHeroGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#2A2210" stopOpacity="1" />
              <Stop offset="50%" stopColor="#141419" stopOpacity="1" />
              <Stop offset="100%" stopColor="#0A0A0E" stopOpacity="1" />
            </SvgGradient>
            <SvgGradient id="peopleGoldMesh" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#D4AF37" stopOpacity="0.25" />
              <Stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
            </SvgGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#peopleHeroGrad)" />
          <SvgCircle cx="85%" cy="30%" r="85" fill="url(#peopleGoldMesh)" />
          <SvgCircle cx="12%" cy="85%" r="65" fill="rgba(212, 175, 55, 0.08)" />
        </Svg>

        {/* Top Header Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={20} color="#D4AF37" />
          </TouchableOpacity>

          <View style={styles.brandTitleGroup}>
            <View style={styles.brandBadge}>
              <Ionicons name="sparkles" size={11} color="#D4AF37" />
              <Text style={styles.brandBadgeText}>COMMUNITY DIRECTORY</Text>
            </View>
            <Text style={styles.pageTitle}>{t('social.findPeople') || 'Find People'}</Text>
          </View>

          <View style={styles.countChip}>
            <Text style={styles.countChipText}>{users.length}</Text>
          </View>
        </View>
      </View>

      {/* SEARCH INPUT BAR */}
      <View style={styles.searchSection}>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search-outline" size={18} color="#D4AF37" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('social.searchPlaceholder') || 'Search by name, email, or city...'}
            placeholderTextColor="#555566"
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
          {search ? (
            <TouchableOpacity onPress={handleClearSearch} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color="#8E8E9F" />
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.searchBtn}
          activeOpacity={0.8}
          onPress={handleSearchSubmit}
        >
          <Text style={styles.searchBtnText}>{t('social.search') || 'Search'}</Text>
        </TouchableOpacity>
      </View>

      {/* SEGMENTED FILTER TABS */}
      <View style={styles.filterTabsRow}>
        {FILTER_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.filterTab, isActive && styles.filterTabActive]}
              activeOpacity={0.75}
              onPress={() => setActiveTab(tab.id)}
            >
              <Ionicons
                name={tab.icon}
                size={13}
                color={isActive ? '#0A0A0E' : '#8E8E9F'}
              />
              <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* SECTION HEADER SUMMARY */}
      <View style={styles.listHeaderRow}>
        <Text style={styles.listHeaderTitle}>
          VERIFIED NETWORK ({filteredUsers.length})
        </Text>
        <Text style={styles.listHeaderSubtitle}>Tap member to view investor profile</Text>
      </View>

      {/* LIST OR EMPTY / LOADING STATES */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#D4AF37" size="large" />
          <Text style={styles.loadingText}>Loading Free Business Network...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderMemberCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBox}>
                <Ionicons name="people-outline" size={42} color="#D4AF37" />
              </View>
              <Text style={styles.emptyTitle}>
                {activeTab === 'following'
                  ? 'Not Following Anyone Yet'
                  : t('social.noUsersFound') || 'No Members Found'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'following'
                  ? 'Connect with brokers and investors to stay updated with their property deals.'
                  : 'Try searching with a different name, city, or email address.'}
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
    padding: 20,
    gap: 12,
  },
  loadingText: {
    color: '#8E8E9F',
    fontSize: 13,
    fontWeight: '500',
  },

  /* HERO BANNER */
  heroCover: {
    height: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 70 : 94,
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 16,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(10, 10, 14, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
  },
  brandTitleGroup: {
    alignItems: 'center',
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    marginBottom: 3,
  },
  brandBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#D4AF37',
    letterSpacing: 1,
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  countChip: {
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  countChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#D4AF37',
  },

  /* SEARCH SECTION */
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141419',
    borderRadius: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#23232C',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 14,
  },
  searchBtn: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 16,
    elevation: 3,
  },
  searchBtnText: {
    color: '#0A0A0E',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.3,
  },

  /* FILTER TABS */
  filterTabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#141419',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#23232C',
  },
  filterTabActive: {
    backgroundColor: '#D4AF37',
    borderColor: '#D4AF37',
  },
  filterTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E8E9F',
  },
  filterTabTextActive: {
    color: '#0A0A0E',
    fontWeight: '800',
  },

  /* LIST HEADER SUMMARY */
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  listHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#8E8E9F',
  },
  listHeaderSubtitle: {
    fontSize: 10,
    color: '#555566',
  },

  /* MEMBER CARD */
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#141419',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#23232C',
    elevation: 3,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarGlowRing: {
    borderRadius: 30,
    padding: 2.5,
    backgroundColor: '#0A0A0E',
    borderWidth: 1.8,
    borderColor: '#D4AF37',
    marginRight: 14,
  },
  identityCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  verifiedIcon: {
    marginTop: 1,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
  },
  brokerBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D4AF37',
    letterSpacing: 0.5,
  },
  brokerBadgeText: {
    color: '#F59E0B',
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  locationText: {
    fontSize: 11,
    color: '#8E8E9F',
    fontWeight: '500',
  },
  bioSnippet: {
    fontSize: 12,
    color: '#A0A0B0',
    lineHeight: 18,
    marginTop: 10,
    fontStyle: 'italic',
  },
  cardMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#0E0E14',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1C1C24',
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metricHighlight: {
    color: '#D4AF37',
    fontWeight: '800',
  },
  metricText: {
    fontSize: 11,
    color: '#8E8E9F',
    fontWeight: '500',
  },
  metricDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#23232C',
  },

  /* ACTION BUTTONS ROW */
  cardActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  chatButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    paddingVertical: 10,
    borderRadius: 12,
  },
  chatButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#D4AF37',
    letterSpacing: 0.2,
  },
  followButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#D4AF37',
    paddingVertical: 10,
    borderRadius: 12,
    elevation: 2,
  },
  followingButton: {
    backgroundColor: '#1E1E26',
    borderWidth: 1,
    borderColor: '#3B3B48',
  },
  followButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0A0A0E',
    letterSpacing: 0.2,
  },
  followingButtonText: {
    color: '#D4AF37',
  },

  /* EMPTY STATE */
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  emptySubtitle: {
    color: '#8E8E9F',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
    maxWidth: 270,
  },
});

export default UserSearchScreen;
