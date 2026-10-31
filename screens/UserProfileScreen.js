import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
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
import Avatar from '../components/Avatar';
import ProfileContactInfo from '../components/ProfileContactInfo';
import { useAuth } from '../context/AuthContext';
import { useStream } from '../context/StreamProvider';
import { getUserProfile, followUser, unfollowUser } from '../services/socialApi';
import { ensureChatClientReady } from '../services/streamClientService';
import { getApiErrorMessage } from '../utils/apiError';

const UserProfileScreen = ({ route, navigation }) => {
  const { userId } = route.params;
  const { user: currentUser } = useAuth();
  const { reconnect } = useStream();
  const { t } = useTranslation();
  const [openingChat, setOpeningChat] = useState(false);
  const isOwnProfile = currentUser?._id?.toString() === userId?.toString();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadProfile = async () => {
    try {
      const response = await getUserProfile(userId);
      setProfile(response.data);
    } catch (error) {
      console.error('Profile load error:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadProfile();
    }, [userId])
  );

  const handleFollowToggle = async () => {
    setActionLoading(true);
    try {
      if (profile.isFollowing) {
        await unfollowUser(userId);
      } else {
        await followUser(userId);
      }
      await loadProfile();
    } catch (error) {
      Alert.alert(t('common.error'), getApiErrorMessage(error, t('social.actionFailed')));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <StatusBar barStyle="light-content" backgroundColor="#0A0A0E" />
        <ActivityIndicator size="large" color="#D4AF37" />
        <Text style={styles.loadingText}>Loading Profile...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.center}>
        <StatusBar barStyle="light-content" backgroundColor="#0A0A0E" />
        <Ionicons name="person-circle-outline" size={64} color="#3B3B48" />
        <Text style={styles.errorText}>{t('social.userNotFound')}</Text>
        <TouchableOpacity
          style={styles.errorBack}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.errorBackText}>{t('common.back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0E" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* HERO COVER */}
        <View style={styles.heroCover}>
          <Svg style={StyleSheet.absoluteFill}>
            <Defs>
              <SvgGradient id="userHeroGradient" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0%" stopColor="#2A2210" stopOpacity="1" />
                <Stop offset="50%" stopColor="#141419" stopOpacity="1" />
                <Stop offset="100%" stopColor="#0A0A0E" stopOpacity="1" />
              </SvgGradient>
              <SvgGradient id="userGoldMesh" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#D4AF37" stopOpacity="0.25" />
                <Stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
              </SvgGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#userHeroGradient)" />
            <SvgCircle cx="85%" cy="30%" r="90" fill="url(#userGoldMesh)" />
            <SvgCircle cx="15%" cy="85%" r="70" fill="rgba(212, 175, 55, 0.08)" />
          </Svg>

          {/* Top Bar with Back Button */}
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.backButton}
              activeOpacity={0.7}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={20} color="#D4AF37" />
            </TouchableOpacity>

            <View style={styles.brandBadge}>
              <Ionicons name="sparkles" size={12} color="#D4AF37" />
              <Text style={styles.brandBadgeText}>MEMBER PROFILE</Text>
            </View>
          </View>
        </View>

        {/* IDENTITY OVERLAPPING HERO */}
        <View style={styles.identityContainer}>
          <View style={styles.avatarGlowRing}>
            <Avatar uri={profile.avatar} name={profile.name} size={94} />
          </View>

          <View style={styles.nameRow}>
            <Text style={styles.userName}>{profile.name}</Text>
            <Ionicons name="checkmark-circle" size={20} color="#D4AF37" style={styles.verifiedIcon} />
          </View>

          {profile.email ? <Text style={styles.userEmail}>{profile.email}</Text> : null}

          {/* Location / Role Chips */}
          <View style={styles.tagsRow}>
            {profile.location ? (
              <View style={styles.locationTag}>
                <Ionicons name="location-outline" size={13} color="#D4AF37" />
                <Text style={styles.locationTagText}>{profile.location}</Text>
              </View>
            ) : null}

            <View style={styles.roleTag}>
              <Ionicons name="ribbon-outline" size={13} color="#D4AF37" />
              <Text style={styles.roleTagText}>
                {profile.role ? `${profile.role.toUpperCase()} MEMBER` : 'COMMUNITY MEMBER'}
              </Text>
            </View>
          </View>
        </View>

        {/* METRICS ROW */}
        <View style={styles.metricsCard}>
          <TouchableOpacity
            style={styles.metricItem}
            activeOpacity={0.7}
            onPress={() =>
              navigation.navigate('Followers', {
                userId,
                userName: profile.name,
                initialTab: 'followers',
              })
            }
          >
            <Text style={styles.metricValue}>{profile.followersCount || 0}</Text>
            <Text style={styles.metricLabel}>{t('social.followers')}</Text>
          </TouchableOpacity>

          <View style={styles.metricDivider} />

          <TouchableOpacity
            style={styles.metricItem}
            activeOpacity={0.7}
            onPress={() =>
              navigation.navigate('Followers', {
                userId,
                userName: profile.name,
                initialTab: 'following',
              })
            }
          >
            <Text style={styles.metricValue}>{profile.followingCount || 0}</Text>
            <Text style={styles.metricLabel}>{t('social.following')}</Text>
          </TouchableOpacity>

          <View style={styles.metricDivider} />

          <View style={styles.metricItem}>
            <Text style={[styles.metricValue, styles.metricValuePosts]}>
              {profile.postsCount || 0}
            </Text>
            <Text style={styles.metricLabel}>{t('social.posts')}</Text>
          </View>
        </View>

        {/* BIO CARD */}
        {profile.bio ? (
          <View style={styles.bioCard}>
            <View style={styles.bioCardHeader}>
              <Ionicons name="reader-outline" size={15} color="#D4AF37" />
              <Text style={styles.bioCardTitle}>ABOUT & INVESTOR BIO</Text>
            </View>
            <Text style={styles.bioContent}>{profile.bio}</Text>
          </View>
        ) : null}

        {/* ACTION BUTTONS (FOLLOW & SEND MESSAGE) */}
        {!isOwnProfile ? (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[
                styles.followButton,
                profile.isFollowing && styles.followingButton,
              ]}
              activeOpacity={0.8}
              onPress={handleFollowToggle}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator color={profile.isFollowing ? '#D4AF37' : '#0A0A0E'} size="small" />
              ) : (
                <>
                  <Ionicons
                    name={profile.isFollowing ? 'checkmark-outline' : 'person-add-outline'}
                    size={18}
                    color={profile.isFollowing ? '#D4AF37' : '#0A0A0E'}
                  />
                  <Text
                    style={[
                      styles.followButtonText,
                      profile.isFollowing && styles.followingButtonText,
                    ]}
                  >
                    {profile.isFollowing ? t('social.unfollow') : t('social.follow')}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.messageButton}
              activeOpacity={0.8}
              disabled={openingChat}
              onPress={async () => {
                setOpeningChat(true);
                try {
                  const client = await ensureChatClientReady(currentUser, reconnect);
                  if (!client) {
                    Alert.alert(t('common.error'), t('stream.connectionFailed'));
                    return;
                  }
                  navigation.navigate('Chat', {
                    otherUserId: userId,
                    otherUserName: profile.name,
                    otherUserAvatar: profile.avatar,
                  });
                } finally {
                  setOpeningChat(false);
                }
              }}
            >
              {openingChat ? (
                <ActivityIndicator color="#D4AF37" size="small" />
              ) : (
                <>
                  <Ionicons name="chatbubbles-outline" size={18} color="#D4AF37" />
                  <Text style={styles.messageButtonText}>{t('stream.sendMessage')}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : null}

        {/* VERIFIED CONTACT INFO */}
        <ProfileContactInfo
          phone={profile.phone}
          whatsappNumber={profile.whatsappNumber}
        />
      </ScrollView>
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
    backgroundColor: '#0A0A0E',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 12,
  },
  loadingText: {
    color: '#8E8E9F',
    fontSize: 14,
    fontWeight: '500',
  },
  errorText: {
    color: '#D4AF37',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  errorBack: {
    marginTop: 10,
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: '#141419',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#23232C',
  },
  errorBackText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: 40,
  },

  /* HERO BANNER */
  heroCover: {
    height: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 105 : 130,
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(10, 10, 14, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
  },
  brandBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D4AF37',
    letterSpacing: 1,
  },

  /* IDENTITY SECTION */
  identityContainer: {
    alignItems: 'center',
    marginTop: -48,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  avatarGlowRing: {
    borderRadius: 52,
    padding: 3,
    backgroundColor: '#0A0A0E',
    borderWidth: 2.5,
    borderColor: '#D4AF37',
    elevation: 8,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    marginBottom: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 2,
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  verifiedIcon: {
    marginTop: 2,
  },
  userEmail: {
    fontSize: 13,
    color: '#8E8E9F',
    marginTop: 2,
    fontWeight: '500',
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  locationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  locationTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D4AF37',
  },
  roleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#141419',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#23232C',
  },
  roleTagText: {
    fontSize: 11,
    color: '#8E8E9F',
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  /* METRICS CARD */
  metricsCard: {
    flexDirection: 'row',
    backgroundColor: '#141419',
    marginHorizontal: 16,
    borderRadius: 18,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#23232C',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 14,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#D4AF37',
    letterSpacing: 0.3,
  },
  metricValuePosts: {
    color: '#FFFFFF',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E8E9F',
    marginTop: 3,
    letterSpacing: 0.3,
  },
  metricDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#23232C',
  },

  /* BIO CARD */
  bioCard: {
    backgroundColor: '#141419',
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#23232C',
  },
  bioCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  bioCardTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#8E8E9F',
  },
  bioContent: {
    fontSize: 13,
    color: '#E2E2EA',
    lineHeight: 20,
    fontWeight: '400',
  },

  /* ACTION ROW */
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  followButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#D4AF37',
    paddingVertical: 13,
    borderRadius: 14,
    elevation: 3,
  },
  followingButton: {
    backgroundColor: '#141419',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0A0A0E',
    letterSpacing: 0.3,
  },
  followingButtonText: {
    color: '#D4AF37',
  },
  messageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#141419',
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
  },
  messageButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D4AF37',
    letterSpacing: 0.3,
  },
});

export default UserProfileScreen;
