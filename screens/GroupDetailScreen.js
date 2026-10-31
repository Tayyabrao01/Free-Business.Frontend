import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  StatusBar,
  Share,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Defs, LinearGradient as SvgGradient, Stop, Rect } from 'react-native-svg';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from '../hooks/useTranslation';
import Avatar from '../components/Avatar';
import ExpandableText from '../components/ExpandableText';
import MediaViewerModal from '../components/MediaViewerModal';
import { resolveMediaUrl } from '../utils/imageUrl';
import { getApiErrorMessage } from '../utils/apiError';
import { useAuth } from '../context/AuthContext';
import { useStream } from '../context/StreamProvider';
import {
  getGroupDetails,
  joinGroup,
  leaveGroup,
  deleteGroup,
  removeGroupMember,
  approveGroupMember,
  rejectGroupMember,
  createGroupPost,
} from '../services/socialApi';
import {
  navigateToGroupChat,
  navigateToGroupCall,
} from '../services/groupChatService';

const PRIVACY_CONFIG = {
  public: {
    label: 'Public Hub',
    icon: 'globe-outline',
    color: '#10B981',
    bg: 'rgba(16, 185, 129, 0.15)',
  },
  private: {
    label: 'Private Community',
    icon: 'lock-closed-outline',
    color: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.15)',
  },
  secret: {
    label: 'Secret Hub',
    icon: 'eye-off-outline',
    color: '#8B5CF6',
    bg: 'rgba(139, 92, 246, 0.15)',
  },
};

const formatRelativeTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString();
};

const GroupDetailScreen = ({ route, navigation }) => {
  const { groupId } = route.params;
  const { t } = useTranslation();
  const { user } = useAuth();
  const { reconnect } = useStream();

  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [postText, setPostText] = useState('');
  const [posting, setPosting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('feed'); // 'feed' | 'members' | 'about'
  const [viewerUri, setViewerUri] = useState(null);

  const loadGroup = async () => {
    try {
      const response = await getGroupDetails(groupId);
      setGroup(response.data);
    } catch (error) {
      console.error('Group detail error:', error);
      Alert.alert(t('common.error'), getApiErrorMessage(error, t('groups.loadFailed')));
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadGroup();
    }, [groupId])
  );

  const handleJoinLeave = async () => {
    setActionLoading(true);
    try {
      if (group.isMember || group.isOwner) {
        Alert.alert(
          'Leave Community',
          `Are you sure you want to leave ${group.name}?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Leave',
              style: 'destructive',
              onPress: async () => {
                try {
                  await leaveGroup(groupId);
                  Alert.alert(t('common.success'), t('groups.leftSuccess'));
                  await loadGroup();
                } catch (err) {
                  Alert.alert(t('common.error'), getApiErrorMessage(err, t('groups.actionFailed')));
                }
              },
            },
          ]
        );
      } else {
        const res = await joinGroup(groupId);
        Alert.alert(t('common.success'), res.data?.message || 'Joined group successfully');
        await loadGroup();
      }
    } catch (error) {
      Alert.alert(t('common.error'), getApiErrorMessage(error, t('groups.actionFailed')));
    } finally {
      setActionLoading(false);
    }
  };

  const getMemberIds = () => {
    const ids = new Set();
    if (group?.owner?._id) ids.add(group.owner._id.toString());
    (group?.members || []).forEach((member) => {
      if (member?._id) ids.add(member._id.toString());
    });
    return Array.from(ids);
  };

  const handleOpenGroupChat = async () => {
    if (!group?.canChat) {
      Alert.alert(t('groups.groupChat'), t('groups.joinToChat'));
      return;
    }
    setChatLoading(true);
    try {
      await navigateToGroupChat({
        navigation,
        user,
        reconnect,
        groupId,
        groupName: group.name,
        memberIds: getMemberIds(),
        isGroupOwner: group.isOwner,
        t,
      });
    } finally {
      setChatLoading(false);
    }
  };

  const handleGroupCall = async (video) => {
    if (!group?.canChat) {
      Alert.alert(t('groups.groupChat'), t('groups.joinToChat'));
      return;
    }
    setChatLoading(true);
    try {
      await navigateToGroupCall({
        navigation,
        user,
        reconnect,
        groupId,
        groupName: group.name,
        memberIds: getMemberIds(),
        video,
        t,
      });
    } finally {
      setChatLoading(false);
    }
  };

  const handleShareGroup = async () => {
    try {
      await Share.share({
        message: `Join our business hub "${group.name}" on Free Business App: ${group.description || ''}`,
        title: group.name,
      });
    } catch (err) {
      console.log('Share error', err);
    }
  };

  const handleDeleteGroup = () => {
    Alert.alert(t('groups.deleteGroupTitle'), t('groups.deleteGroupConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('groups.deleteGroup'),
        style: 'destructive',
        onPress: async () => {
          setActionLoading(true);
          try {
            await deleteGroup(groupId);
            Alert.alert(t('common.success'), t('groups.deletedSuccess'));
            navigation.goBack();
          } catch (error) {
            Alert.alert(t('common.error'), getApiErrorMessage(error, t('groups.deleteFailed')));
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  const handleRemoveMember = (member) => {
    Alert.alert(t('groups.removeMemberTitle'), t('groups.removeMemberConfirm', { name: member.name }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('groups.removeMember'),
        style: 'destructive',
        onPress: async () => {
          try {
            await removeGroupMember(groupId, member._id);
            await loadGroup();
          } catch (error) {
            Alert.alert(t('common.error'), getApiErrorMessage(error, t('groups.actionFailed')));
          }
        },
      },
    ]);
  };

  const handleApproveMember = async (memberId) => {
    try {
      await approveGroupMember(groupId, memberId);
      await loadGroup();
      Alert.alert(t('common.success'), t('groups.memberApproved'));
    } catch (error) {
      Alert.alert(t('common.error'), getApiErrorMessage(error, t('groups.actionFailed')));
    }
  };

  const handleRejectMember = async (memberId) => {
    try {
      await rejectGroupMember(groupId, memberId);
      await loadGroup();
    } catch (error) {
      Alert.alert(t('common.error'), getApiErrorMessage(error, t('groups.actionFailed')));
    }
  };

  const handleCreatePost = async () => {
    if (!postText.trim()) return;
    setPosting(true);
    try {
      await createGroupPost(groupId, { content: postText.trim() });
      setPostText('');
      await loadGroup();
    } catch (error) {
      Alert.alert(t('common.error'), getApiErrorMessage(error, t('groups.postFailed')));
    } finally {
      setPosting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <StatusBar barStyle="light-content" backgroundColor="#0A0A0E" />
        <ActivityIndicator size="large" color="#D4AF37" />
        <Text style={styles.loadingText}>Opening community hub...</Text>
      </View>
    );
  }

  if (!group) {
    return (
      <View style={styles.center}>
        <StatusBar barStyle="light-content" backgroundColor="#0A0A0E" />
        <Ionicons name="alert-circle-outline" size={48} color="#D4AF37" />
        <Text style={styles.errorText}>{t('groups.notFound')}</Text>
        <TouchableOpacity style={styles.backButtonSimple} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonSimpleText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const privacy = PRIVACY_CONFIG[group.privacy] || PRIVACY_CONFIG.public;
  const isOwner = Boolean(group.isOwner);
  const isMember = Boolean(group.isMember);
  const isPending = Boolean(group.isPending);

  const emblemInitials = (group.name || 'FB')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const postsList = group.posts || [];
  const membersList = group.members || [];
  const pendingList = group.pendingMembers || [];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0E" />

      {/* Top Fixed Floating Navigation Bar */}
      <View style={styles.floatingTopBar}>
        <TouchableOpacity
          style={styles.navIconButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.navBarTitle} numberOfLines={1}>
          {group.name}
        </Text>

        <TouchableOpacity
          style={styles.navIconButton}
          onPress={handleShareGroup}
          activeOpacity={0.7}
        >
          <Ionicons name="share-outline" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Luxury Hero Banner / Cover */}
        <View style={styles.heroCover}>
          {/* Geometric / Luxury Dark SVG Gradient Background */}
          <View style={StyleSheet.absoluteFill}>
            <Svg height="100%" width="100%">
              <Defs>
                <SvgGradient id="coverGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#262215" stopOpacity="1" />
                  <Stop offset="50%" stopColor="#171720" stopOpacity="1" />
                  <Stop offset="100%" stopColor="#0A0A0E" stopOpacity="1" />
                </SvgGradient>
              </Defs>
              <Rect x="0" y="0" width="100%" height="100%" fill="url(#coverGradient)" />
            </Svg>
          </View>

          {/* Decorative Pattern Lines */}
          <View style={styles.bannerPattern}>
            <Ionicons name="business" size={140} color="rgba(212, 175, 55, 0.05)" />
          </View>
        </View>

        {/* Group Identity Card Overlapping Banner */}
        <View style={styles.identityCard}>
          <View style={styles.identityTopRow}>
            {/* Emblem */}
            <View style={styles.largeEmblem}>
              <Text style={styles.largeEmblemText}>{emblemInitials}</Text>
              {isOwner ? (
                <View style={styles.emblemCrownBadge}>
                  <Ionicons name="star" size={13} color="#0A0A0E" />
                </View>
              ) : null}
            </View>

            {/* Badges */}
            <View style={styles.identityBadges}>
              <View style={[styles.privacyBadge, { backgroundColor: privacy.bg }]}>
                <Ionicons name={privacy.icon} size={13} color={privacy.color} />
                <Text style={[styles.privacyBadgeText, { color: privacy.color }]}>
                  {privacy.label}
                </Text>
              </View>

              {isOwner ? (
                <View style={styles.ownerBadge}>
                  <Ionicons name="shield-checkmark" size={13} color="#D4AF37" />
                  <Text style={styles.ownerBadgeText}>Leader</Text>
                </View>
              ) : isMember ? (
                <View style={styles.memberBadge}>
                  <Ionicons name="checkmark-circle" size={13} color="#10B981" />
                  <Text style={styles.memberBadgeText}>Member</Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Group Title & Details */}
          <Text style={styles.groupMainTitle}>{group.name}</Text>

          {group.description ? (
            <ExpandableText
              text={group.description}
              maxLength={150}
              style={styles.groupDescription}
            />
          ) : (
            <Text style={styles.groupNoDesc}>{t('groups.noDescription')}</Text>
          )}

          {/* Community Stats Counters */}
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{group.membersCount || membersList.length || 1}</Text>
              <Text style={styles.metricLabel}>{t('groups.members')}</Text>
            </View>

            <View style={styles.metricDivider} />

            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{group.postsCount || postsList.length || 0}</Text>
              <Text style={styles.metricLabel}>{t('groups.posts')}</Text>
            </View>

            <View style={styles.metricDivider} />

            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{t(`groups.privacy.${group.privacy}`) || 'Public'}</Text>
              <Text style={styles.metricLabel}>Access</Text>
            </View>
          </View>

          {/* Primary Action Button (Join / Joined Status) */}
          {!isOwner && (
            <View style={styles.primaryActionWrap}>
              {isMember ? (
                <TouchableOpacity
                  style={styles.joinedPillButton}
                  onPress={handleJoinLeave}
                  disabled={actionLoading}
                  activeOpacity={0.8}
                >
                  {actionLoading ? (
                    <ActivityIndicator size="small" color="#C8C8D2" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle-outline" size={18} color="#10B981" />
                      <Text style={styles.joinedPillText}>Joined Community</Text>
                      <Ionicons name="chevron-down" size={14} color="#8A8A96" style={{ marginLeft: 4 }} />
                    </>
                  )}
                </TouchableOpacity>
              ) : isPending ? (
                <View style={styles.pendingPillButton}>
                  <Ionicons name="time-outline" size={18} color="#F59E0B" />
                  <Text style={styles.pendingPillText}>Membership Pending Approval</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.joinPrimaryButton}
                  onPress={handleJoinLeave}
                  disabled={actionLoading}
                  activeOpacity={0.85}
                >
                  {actionLoading ? (
                    <ActivityIndicator size="small" color="#0A0A0E" />
                  ) : (
                    <>
                      <Ionicons name="person-add" size={18} color="#0A0A0E" />
                      <Text style={styles.joinPrimaryText}>Join This Community</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Instant Communications Hub (Stream Chat & Calls) */}
          {group.canChat ? (
            <View style={styles.commHubCard}>
              <View style={styles.commHubHeader}>
                <View style={styles.livePulse} />
                <Text style={styles.commHubTitle}>LIVE HUB CHAT & CALLS</Text>
              </View>

              <View style={styles.commButtonsRow}>
                {/* Chat Button */}
                <TouchableOpacity
                  style={styles.chatHubButton}
                  onPress={handleOpenGroupChat}
                  disabled={chatLoading}
                  activeOpacity={0.85}
                >
                  {chatLoading ? (
                    <ActivityIndicator size="small" color="#0A0A0E" />
                  ) : (
                    <>
                      <Ionicons name="chatbubbles" size={17} color="#0A0A0E" />
                      <Text style={styles.chatHubButtonText}>{t('groups.openGroupChat')}</Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* Audio Call */}
                <TouchableOpacity
                  style={styles.callIconBtn}
                  onPress={() => handleGroupCall(false)}
                  disabled={chatLoading}
                  activeOpacity={0.8}
                >
                  <Ionicons name="call" size={18} color="#D4AF37" />
                  <Text style={styles.callIconBtnText}>Audio</Text>
                </TouchableOpacity>

                {/* Video Call */}
                <TouchableOpacity
                  style={styles.callIconBtn}
                  onPress={() => handleGroupCall(true)}
                  disabled={chatLoading}
                  activeOpacity={0.8}
                >
                  <Ionicons name="videocam" size={18} color="#D4AF37" />
                  <Text style={styles.callIconBtnText}>Video</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : !isOwner && !isMember ? (
            <View style={styles.lockedChatBox}>
              <Ionicons name="lock-closed" size={14} color="#8A8A96" />
              <Text style={styles.lockedChatText}>{t('groups.joinToChat')}</Text>
            </View>
          ) : null}
        </View>

        {/* Pending Requests Alert Drawer for Group Owner */}
        {isOwner && pendingList.length > 0 ? (
          <View style={styles.pendingSection}>
            <View style={styles.pendingSectionHeader}>
              <View style={styles.pendingBadgeCount}>
                <Text style={styles.pendingCountText}>{pendingList.length}</Text>
              </View>
              <Text style={styles.pendingSectionTitle}>{t('groups.pendingRequests')}</Text>
            </View>

            {pendingList.map((member) => (
              <View key={member._id} style={styles.pendingUserCard}>
                <Avatar uri={member.avatar} name={member.name} size={38} />
                <View style={styles.pendingUserInfo}>
                  <Text style={styles.pendingUserName} numberOfLines={1}>
                    {member.name}
                  </Text>
                  <Text style={styles.pendingSub}>Wants to join this group</Text>
                </View>

                <View style={styles.pendingActions}>
                  <TouchableOpacity
                    style={styles.approveChip}
                    onPress={() => handleApproveMember(member._id)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="checkmark" size={15} color="#0A0A0E" />
                    <Text style={styles.approveChipText}>{t('groups.approve')}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.rejectChip}
                    onPress={() => handleRejectMember(member._id)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="close" size={15} color="#FF6B6B" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {/* Tab Navigation Segment */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'feed' && styles.tabButtonActive]}
            onPress={() => setActiveTab('feed')}
            activeOpacity={0.8}
          >
            <Ionicons
              name={activeTab === 'feed' ? 'newspaper' : 'newspaper-outline'}
              size={17}
              color={activeTab === 'feed' ? '#D4AF37' : '#8A8A96'}
            />
            <Text style={[styles.tabButtonText, activeTab === 'feed' && styles.tabButtonTextActive]}>
              Discussions
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'members' && styles.tabButtonActive]}
            onPress={() => setActiveTab('members')}
            activeOpacity={0.8}
          >
            <Ionicons
              name={activeTab === 'members' ? 'people' : 'people-outline'}
              size={17}
              color={activeTab === 'members' ? '#D4AF37' : '#8A8A96'}
            />
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'members' && styles.tabButtonTextActive,
              ]}
            >
              Members ({membersList.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'about' && styles.tabButtonActive]}
            onPress={() => setActiveTab('about')}
            activeOpacity={0.8}
          >
            <Ionicons
              name={activeTab === 'about' ? 'information-circle' : 'information-circle-outline'}
              size={17}
              color={activeTab === 'about' ? '#D4AF37' : '#8A8A96'}
            />
            <Text style={[styles.tabButtonText, activeTab === 'about' && styles.tabButtonTextActive]}>
              About Hub
            </Text>
          </TouchableOpacity>
        </View>

        {/* TAB 1: FEED & DISCUSSIONS */}
        {activeTab === 'feed' && (
          <View style={styles.tabContentWrap}>
            {/* Quick Post Composer */}
            {group.canPost ? (
              <View style={styles.composerCard}>
                <View style={styles.composerTopRow}>
                  <Avatar uri={user?.avatar || user?.profileImage} name={user?.name} size={36} />
                  <TextInput
                    style={styles.composerInput}
                    placeholder={t('groups.writePost')}
                    placeholderTextColor="#686875"
                    value={postText}
                    onChangeText={setPostText}
                    multiline
                  />
                </View>

                <View style={styles.composerBottomRow}>
                  <View style={styles.composerHintRow}>
                    <Ionicons name="chatbubble-ellipses-outline" size={14} color="#D4AF37" />
                    <Text style={styles.composerHintText}>Visible to group members</Text>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.composerSubmitBtn,
                      !postText.trim() && styles.composerSubmitBtnDisabled,
                    ]}
                    onPress={handleCreatePost}
                    disabled={posting || !postText.trim()}
                    activeOpacity={0.8}
                  >
                    {posting ? (
                      <ActivityIndicator size="small" color="#0A0A0E" />
                    ) : (
                      <Text style={styles.composerSubmitText}>{t('groups.post')}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}

            {/* Posts Feed */}
            {postsList.length > 0 ? (
              postsList.map((post) => {
                const authorName = post.author?.name || t('common.user');
                const authorAvatar = post.author?.avatar;
                const authorId = post.author?._id;
                const timeAgo = formatRelativeTime(post.createdAt);
                const postMedia = post.imageUrl ? resolveMediaUrl(post.imageUrl) : null;

                return (
                  <View key={post._id} style={styles.postCard}>
                    {/* Post Header */}
                    <View style={styles.postCardHeader}>
                      <TouchableOpacity
                        style={styles.postAuthorRow}
                        activeOpacity={0.8}
                        onPress={() => {
                          if (authorId) {
                            navigation.navigate('UserProfile', { userId: authorId.toString() });
                          }
                        }}
                        disabled={!authorId}
                      >
                        <Avatar uri={authorAvatar} name={authorName} size={38} />
                        <View style={styles.postAuthorMeta}>
                          <View style={styles.authorNameRow}>
                            <Text style={styles.postAuthorName} numberOfLines={1}>
                              {authorName}
                            </Text>
                            {post.author?._id === group.owner?._id ? (
                              <View style={styles.postAdminBadge}>
                                <Text style={styles.postAdminBadgeText}>Admin</Text>
                              </View>
                            ) : null}
                          </View>
                          <Text style={styles.postTime}>{timeAgo || 'Recently'}</Text>
                        </View>
                      </TouchableOpacity>
                    </View>

                    {/* Post Body with Expandable Text */}
                    {post.content ? (
                      <ExpandableText text={post.content} maxLength={160} />
                    ) : null}

                    {/* Post Image */}
                    {postMedia ? (
                      <TouchableOpacity
                        style={styles.postMediaWrapper}
                        activeOpacity={0.9}
                        onPress={() => setViewerUri(postMedia)}
                      >
                        <Image source={{ uri: postMedia }} style={styles.postMediaImage} />
                        <View style={styles.zoomBadge}>
                          <Ionicons name="scan-outline" size={12} color="#FFFFFF" />
                          <Text style={styles.zoomBadgeText}>Tap to zoom</Text>
                        </View>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyFeedBox}>
                <Ionicons name="chatbubbles-outline" size={44} color="#D4AF37" />
                <Text style={styles.emptyFeedTitle}>{t('groups.noPosts')}</Text>
                <Text style={styles.emptyFeedSubtitle}>
                  Be the first to share an update, property deal, or question with the group!
                </Text>
              </View>
            )}
          </View>
        )}

        {/* TAB 2: MEMBERS & LEADERS */}
        {activeTab === 'members' && (
          <View style={styles.tabContentWrap}>
            {/* Group Creator / Admin Highlight Card */}
            {group.owner ? (
              <View style={styles.adminCard}>
                <View style={styles.adminCardHeader}>
                  <Ionicons name="shield-checkmark" size={16} color="#D4AF37" />
                  <Text style={styles.adminCardTitle}>Community Founder & Admin</Text>
                </View>
                <TouchableOpacity
                  style={styles.adminUserRow}
                  activeOpacity={0.8}
                  onPress={() => {
                    if (group.owner._id) {
                      navigation.navigate('UserProfile', { userId: group.owner._id.toString() });
                    }
                  }}
                >
                  <Avatar uri={group.owner.avatar} name={group.owner.name} size={46} />
                  <View style={styles.adminUserInfo}>
                    <Text style={styles.adminUserName} numberOfLines={1}>
                      {group.owner.name}
                    </Text>
                    <Text style={styles.adminUserSub}>Group Administrator</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#8A8A96" />
                </TouchableOpacity>
              </View>
            ) : null}

            {/* Members Directory */}
            <View style={styles.membersDirectoryHeader}>
              <Text style={styles.membersDirectoryTitle}>All Members ({membersList.length})</Text>
              {isOwner ? (
                <Text style={styles.adminActionHint}>{t('groups.adminHint')}</Text>
              ) : null}
            </View>

            {membersList.length > 0 ? (
              <View style={styles.membersGrid}>
                {membersList.map((member) => {
                  const isGroupAdmin = group.owner?._id === member._id;
                  const canRemove = isOwner && !isGroupAdmin && member._id !== user?._id;

                  return (
                    <TouchableOpacity
                      key={member._id}
                      style={styles.memberCard}
                      activeOpacity={0.8}
                      onPress={() => {
                        if (canRemove) {
                          handleRemoveMember(member);
                        } else {
                          navigation.navigate('UserProfile', { userId: member._id });
                        }
                      }}
                      onLongPress={() => canRemove && handleRemoveMember(member)}
                    >
                      <View style={styles.memberAvatarWrap}>
                        <Avatar uri={member.avatar} name={member.name} size={44} />
                        {isGroupAdmin ? (
                          <View style={styles.memberCrownMini}>
                            <Ionicons name="star" size={9} color="#0A0A0E" />
                          </View>
                        ) : null}
                      </View>

                      <View style={styles.memberTextCol}>
                        <Text style={styles.memberDisplayName} numberOfLines={1}>
                          {member.name}
                        </Text>
                        <Text style={styles.memberRoleLabel}>
                          {isGroupAdmin ? 'Admin' : 'Member'}
                        </Text>
                      </View>

                      {canRemove ? (
                        <TouchableOpacity
                          style={styles.removeMemberBtn}
                          onPress={() => handleRemoveMember(member)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons name="remove-circle-outline" size={18} color="#FF6B6B" />
                        </TouchableOpacity>
                      ) : (
                        <Ionicons name="chevron-forward" size={14} color="#686875" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.emptyMembersText}>No members found.</Text>
            )}
          </View>
        )}

        {/* TAB 3: ABOUT & SETTINGS */}
        {activeTab === 'about' && (
          <View style={styles.tabContentWrap}>
            {/* About Information Card */}
            <View style={styles.aboutCard}>
              <Text style={styles.aboutCardHeader}>About This Community</Text>
              <Text style={styles.aboutCardBody}>
                {group.description || 'Welcome to this community. Members can discuss real estate listings, exchange market insights, and communicate directly through group chat and calls.'}
              </Text>

              <View style={styles.aboutMetaItem}>
                <Ionicons name="shield-outline" size={17} color="#D4AF37" />
                <View style={styles.aboutMetaTextCol}>
                  <Text style={styles.aboutMetaKey}>Privacy Level</Text>
                  <Text style={styles.aboutMetaVal}>{privacy.label}</Text>
                </View>
              </View>

              <View style={styles.aboutMetaItem}>
                <Ionicons name="calendar-outline" size={17} color="#D4AF37" />
                <View style={styles.aboutMetaTextCol}>
                  <Text style={styles.aboutMetaKey}>Created On</Text>
                  <Text style={styles.aboutMetaVal}>
                    {group.createdAt ? new Date(group.createdAt).toLocaleDateString() : 'Active'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Danger / Administrative Zone */}
            <View style={styles.dangerZoneCard}>
              <Text style={styles.dangerZoneTitle}>Community Actions</Text>

              {isOwner ? (
                <TouchableOpacity
                  style={styles.deleteGroupDangerBtn}
                  onPress={handleDeleteGroup}
                  disabled={actionLoading}
                  activeOpacity={0.8}
                >
                  <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
                  <Text style={styles.deleteGroupDangerText}>{t('groups.deleteGroup')}</Text>
                </TouchableOpacity>
              ) : isMember ? (
                <TouchableOpacity
                  style={styles.leaveGroupDangerBtn}
                  onPress={handleJoinLeave}
                  disabled={actionLoading}
                  activeOpacity={0.8}
                >
                  <Ionicons name="log-out-outline" size={18} color="#FF6B6B" />
                  <Text style={styles.leaveGroupDangerText}>Leave This Community</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Media Viewer Modal */}
      <MediaViewerModal
        visible={Boolean(viewerUri)}
        uri={viewerUri}
        onClose={() => setViewerUri(null)}
      />
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
    padding: 24,
  },
  loadingText: {
    color: '#8A8A96',
    fontSize: 13,
    marginTop: 12,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 10,
    textAlign: 'center',
  },
  backButtonSimple: {
    marginTop: 16,
    backgroundColor: '#D4AF37',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonSimpleText: {
    color: '#0A0A0E',
    fontWeight: '700',
    fontSize: 14,
  },
  scrollContent: {
    paddingBottom: 70,
  },

  /* Floating Top Bar */
  floatingTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    backgroundColor: 'rgba(10, 10, 14, 0.88)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    zIndex: 10,
  },
  navIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(26, 26, 36, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  navBarTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginHorizontal: 12,
  },

  /* Hero Cover */
  heroCover: {
    height: 120,
    width: '100%',
    position: 'relative',
    backgroundColor: '#161620',
  },
  bannerPattern: {
    position: 'absolute',
    right: 10,
    bottom: -20,
    opacity: 0.8,
  },

  /* Identity Card */
  identityCard: {
    marginTop: -40,
    marginHorizontal: 16,
    backgroundColor: '#141419',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#242432',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  identityTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  largeEmblem: {
    width: 62,
    height: 62,
    borderRadius: 18,
    backgroundColor: '#1D1D28',
    borderWidth: 2,
    borderColor: '#D4AF37',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  largeEmblemText: {
    color: '#D4AF37',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  emblemCrownBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#D4AF37',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  identityBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  privacyBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  ownerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  ownerBadgeText: {
    color: '#D4AF37',
    fontSize: 11,
    fontWeight: '700',
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  memberBadgeText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
  },
  groupMainTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
    marginBottom: 6,
  },
  groupDescription: {
    fontSize: 13.5,
    color: '#C0C0CB',
    lineHeight: 20,
  },
  groupNoDesc: {
    fontSize: 13,
    color: '#70707D',
    fontStyle: 'italic',
    marginBottom: 8,
  },

  /* Metrics Row */
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E0E13',
    borderRadius: 12,
    paddingVertical: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#1E1E28',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  metricLabel: {
    fontSize: 11,
    color: '#8A8A96',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  metricDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#22222E',
  },

  /* Membership Buttons */
  primaryActionWrap: {
    marginTop: 12,
  },
  joinPrimaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D4AF37',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  joinPrimaryText: {
    color: '#0A0A0E',
    fontSize: 14,
    fontWeight: '700',
  },
  joinedPillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1A24',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  joinedPillText: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '700',
  },
  pendingPillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1A24',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  pendingPillText: {
    color: '#F59E0B',
    fontSize: 13,
    fontWeight: '600',
  },

  /* Communications Hub */
  commHubCard: {
    marginTop: 12,
    backgroundColor: '#0D0D12',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#242432',
  },
  commHubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  livePulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4ADE80',
    marginRight: 6,
  },
  commHubTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D4AF37',
    letterSpacing: 0.6,
  },
  commButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chatHubButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D4AF37',
    paddingVertical: 9,
    borderRadius: 10,
    gap: 6,
  },
  chatHubButtonText: {
    color: '#0A0A0E',
    fontSize: 12.5,
    fontWeight: '700',
  },
  callIconBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#181822',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    paddingVertical: 9,
    borderRadius: 10,
    gap: 5,
  },
  callIconBtnText: {
    color: '#D4AF37',
    fontSize: 12,
    fontWeight: '700',
  },
  lockedChatBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#121218',
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 12,
    gap: 6,
  },
  lockedChatText: {
    color: '#8A8A96',
    fontSize: 12,
  },

  /* Pending Requests Section */
  pendingSection: {
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: '#141419',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F59E0B',
    padding: 14,
  },
  pendingSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  pendingBadgeCount: {
    backgroundColor: '#F59E0B',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  pendingCountText: {
    color: '#0A0A0E',
    fontSize: 11,
    fontWeight: '800',
  },
  pendingSectionTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  pendingUserCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A24',
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
  },
  pendingUserInfo: {
    flex: 1,
    marginLeft: 10,
  },
  pendingUserName: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  pendingSub: {
    color: '#8A8A96',
    fontSize: 11,
  },
  pendingActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  approveChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D4AF37',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  approveChipText: {
    color: '#0A0A0E',
    fontWeight: '700',
    fontSize: 11,
  },
  rejectChip: {
    padding: 6,
    backgroundColor: '#262634',
    borderRadius: 6,
  },

  /* Tabs */
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: '#141419',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#22222E',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 9,
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: '#1E1E2A',
  },
  tabButtonText: {
    color: '#8A8A96',
    fontSize: 12,
    fontWeight: '600',
  },
  tabButtonTextActive: {
    color: '#D4AF37',
    fontWeight: '700',
  },
  tabContentWrap: {
    marginTop: 12,
  },

  /* Quick Composer */
  composerCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#141419',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#242432',
    padding: 14,
  },
  composerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  composerInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13.5,
    color: '#FFFFFF',
    minHeight: 46,
    maxHeight: 110,
    textAlignVertical: 'top',
    paddingTop: 4,
  },
  composerBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#20202A',
    paddingTop: 8,
    marginTop: 8,
  },
  composerHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  composerHintText: {
    color: '#8A8A96',
    fontSize: 11,
  },
  composerSubmitBtn: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 7,
  },
  composerSubmitBtnDisabled: {
    opacity: 0.45,
  },
  composerSubmitText: {
    color: '#0A0A0E',
    fontSize: 12,
    fontWeight: '700',
  },

  /* Post Card */
  postCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#141419',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#22222E',
    padding: 14,
  },
  postCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  postAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  postAuthorMeta: {
    marginLeft: 10,
    flex: 1,
  },
  authorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  postAuthorName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    flexShrink: 1,
  },
  postAdminBadge: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  postAdminBadgeText: {
    color: '#D4AF37',
    fontSize: 10,
    fontWeight: '700',
  },
  postTime: {
    color: '#70707E',
    fontSize: 11,
    marginTop: 2,
  },
  postMediaWrapper: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#0A0A0E',
  },
  postMediaImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  zoomBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 10, 14, 0.7)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  zoomBadgeText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '600',
  },

  /* Empty Feed */
  emptyFeedBox: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyFeedTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 10,
  },
  emptyFeedSubtitle: {
    color: '#8A8A96',
    fontSize: 12.5,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },

  /* Members Tab */
  adminCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#141419',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    padding: 14,
  },
  adminCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 6,
  },
  adminCardTitle: {
    color: '#D4AF37',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  adminUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  adminUserInfo: {
    flex: 1,
    marginLeft: 12,
  },
  adminUserName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  adminUserSub: {
    color: '#8A8A96',
    fontSize: 12,
    marginTop: 2,
  },
  membersDirectoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 18,
    marginBottom: 8,
  },
  membersDirectoryTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  adminActionHint: {
    color: '#8A8A96',
    fontSize: 11,
    fontStyle: 'italic',
  },
  membersGrid: {
    marginHorizontal: 16,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141419',
    padding: 12,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#20202A',
  },
  memberAvatarWrap: {
    position: 'relative',
  },
  memberCrownMini: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#D4AF37',
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberTextCol: {
    flex: 1,
    marginLeft: 12,
  },
  memberDisplayName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  memberRoleLabel: {
    color: '#8A8A96',
    fontSize: 11.5,
    marginTop: 2,
  },
  removeMemberBtn: {
    padding: 4,
  },
  emptyMembersText: {
    color: '#8A8A96',
    textAlign: 'center',
    marginVertical: 20,
    fontSize: 13,
  },

  /* About Tab */
  aboutCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#141419',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#22222E',
    padding: 16,
  },
  aboutCardHeader: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  aboutCardBody: {
    color: '#C0C0CB',
    fontSize: 13.5,
    lineHeight: 20,
    marginBottom: 14,
  },
  aboutMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1E1E28',
    gap: 12,
  },
  aboutMetaTextCol: {
    flex: 1,
  },
  aboutMetaKey: {
    color: '#8A8A96',
    fontSize: 11,
  },
  aboutMetaVal: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '600',
    marginTop: 1,
  },
  dangerZoneCard: {
    marginHorizontal: 16,
    backgroundColor: '#141419',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
    padding: 16,
  },
  dangerZoneTitle: {
    color: '#FF6B6B',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  deleteGroupDangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.12)',
    borderWidth: 1,
    borderColor: '#FF6B6B',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  deleteGroupDangerText: {
    color: '#FF6B6B',
    fontWeight: '700',
    fontSize: 13.5,
  },
  leaveGroupDangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.5)',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  leaveGroupDangerText: {
    color: '#FF6B6B',
    fontWeight: '700',
    fontSize: 13.5,
  },
});

export default GroupDetailScreen;
