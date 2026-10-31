import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Modal,
  StatusBar,
  Linking,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Svg, {
  Defs,
  LinearGradient as SvgGradient,
  Stop,
  Rect,
  Circle as SvgCircle,
  Path as SvgPath,
} from 'react-native-svg';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../hooks/useTranslation';
import { REFERRAL_ENABLED, COMMISSION_ENABLED } from '../config/features';
import Avatar from '../components/Avatar';
import { getMyProgress } from '../services/rewardsApi';
import { getUserProfile, updateSocialProfile } from '../services/socialApi';
import { uploadImageAsset } from '../services/uploadImageService';
import { getApiErrorMessage } from '../utils/apiError';
import { openPhoneDialer } from '../utils/phoneLinks';
import ProfileContactInfo from '../components/ProfileContactInfo';

const HELPLINE_PHONE = '+923264646455';

const formatMemberDate = (dateInput) => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

const ProfileScreen = ({ navigation }) => {
  const { user, logout, setUser } = useAuth();
  const { t, language, setLanguage } = useTranslation();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [bioModalVisible, setBioModalVisible] = useState(false);
  const [bioDraft, setBioDraft] = useState('');
  const [savingBio, setSavingBio] = useState(false);

  const loadProfile = async () => {
    try {
      const [profileRes, statsRes] = await Promise.all([
        getUserProfile(user._id),
        getMyProgress(),
      ]);
      setProfile(profileRes.data);
      setStats(statsRes.data);
      setBioDraft(profileRes.data?.bio || '');
    } catch (error) {
      console.error('Profile load error:', error);
      Alert.alert(t('common.error'), getApiErrorMessage(error, t('profile.loadFailed')));
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (user?._id) {
        setLoading(true);
        loadProfile();
      }
    }, [user?._id])
  );

  const handleAvatarPress = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, async (response) => {
      if (response.didCancel || response.error || !response.assets?.[0]) {
        return;
      }

      const asset = response.assets[0];
      setUploadingAvatar(true);

      try {
        const { url: avatarUrl } = await uploadImageAsset(asset);
        const profileRes = await updateSocialProfile({ avatar: avatarUrl });
        const updatedUser = profileRes.data?.user || { ...user, avatar: avatarUrl };
        setUser(updatedUser);
        await loadProfile();
        Alert.alert(t('common.success'), t('social.avatarUpdated'));
      } catch (error) {
        Alert.alert(t('common.error'), getApiErrorMessage(error, t('social.avatarFailed')));
      } finally {
        setUploadingAvatar(false);
      }
    });
  };

  const handleSaveBio = async () => {
    setSavingBio(true);
    try {
      const response = await updateSocialProfile({ bio: bioDraft });
      setProfile(response.data.user);
      setUser({ ...user, bio: response.data.user.bio });
      setBioModalVisible(false);
      Alert.alert(t('common.success'), t('social.bioUpdated'));
    } catch (error) {
      Alert.alert(t('common.error'), getApiErrorMessage(error, t('common.updateFailed')));
    } finally {
      setSavingBio(false);
    }
  };

  const openFollowers = (tab) => {
    navigation.navigate('Followers', {
      userId: user._id,
      userName: user.name,
      initialTab: tab,
    });
  };

  const handleLogout = () => {
    Alert.alert(
      t('profile.logoutTitle'),
      t('profile.logoutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('profile.logout'), style: 'destructive', onPress: () => logout() },
      ]
    );
  };

  const handleLanguageChange = () => {
    Alert.alert(t('profile.selectLanguage'), '', [
      { text: t('common.english'), onPress: () => setLanguage('en') },
      { text: t('common.urdu'), onPress: () => setLanguage('ur') },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
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

  const memberSinceDate = formatMemberDate(profile?.createdAt || user?.createdAt);
  const currentTier = stats?.currentTier && stats.currentTier !== 'none'
    ? stats.currentTier.toUpperCase()
    : 'VIP';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0E" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* HERO BANNER WITH LUXURY GRADIENT */}
        <View style={styles.heroCover}>
          <Svg style={StyleSheet.absoluteFill}>
            <Defs>
              <SvgGradient id="heroGradient" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0%" stopColor="#2A2210" stopOpacity="1" />
                <Stop offset="50%" stopColor="#141419" stopOpacity="1" />
                <Stop offset="100%" stopColor="#0A0A0E" stopOpacity="1" />
              </SvgGradient>
              <SvgGradient id="goldMesh" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#D4AF37" stopOpacity="0.25" />
                <Stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
              </SvgGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#heroGradient)" />
            <SvgCircle cx="85%" cy="30%" r="90" fill="url(#goldMesh)" />
            <SvgCircle cx="15%" cy="85%" r="70" fill="rgba(212, 175, 55, 0.08)" />
          </Svg>

          {/* Top Bar inside Hero */}
          <View style={styles.topBar}>
            <View style={styles.brandBadge}>
              <Ionicons name="sparkles" size={13} color="#D4AF37" />
              <Text style={styles.brandBadgeText}>FREE BUSINESS</Text>
            </View>

            <TouchableOpacity
              style={styles.topActionButton}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('EditProfile')}
            >
              <Ionicons name="create-outline" size={18} color="#D4AF37" />
            </TouchableOpacity>
          </View>
        </View>

        {/* PROFILE IDENTITY CARD (OVERLAPPING HERO) */}
        <View style={styles.identityContainer}>
          <View style={styles.avatarWrapper}>
            <TouchableOpacity
              style={styles.avatarTouchable}
              activeOpacity={0.85}
              onPress={handleAvatarPress}
              disabled={uploadingAvatar}
            >
              <View style={styles.avatarGlowRing}>
                <Avatar uri={profile?.avatar || user?.avatar} name={user?.name} size={94} />
              </View>

              <View style={styles.cameraBadge}>
                {uploadingAvatar ? (
                  <ActivityIndicator size="small" color="#0A0A0E" />
                ) : (
                  <Ionicons name="camera" size={15} color="#0A0A0E" />
                )}
              </View>
            </TouchableOpacity>
          </View>

          <Text style={styles.photoHint}>{t('social.tapToChangePhoto')}</Text>

          <View style={styles.nameRow}>
            <Text style={styles.userName}>{user?.name || 'Free Business Member'}</Text>
            <Ionicons name="checkmark-circle" size={20} color="#D4AF37" style={styles.verifiedIcon} />
          </View>

          <Text style={styles.userEmail}>{user?.email}</Text>

          {/* Role & Member Since Badges */}
          <View style={styles.tagsRow}>
            <View style={styles.tierTag}>
              <Ionicons name="ribbon-outline" size={13} color="#D4AF37" />
              <Text style={styles.tierTagText}>{currentTier} MEMBER</Text>
            </View>

            {memberSinceDate ? (
              <View style={styles.memberSinceTag}>
                <Ionicons name="calendar-outline" size={12} color="#8E8E9F" />
                <Text style={styles.memberSinceText}>Joined {memberSinceDate}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* METRICS & SOCIAL ENGAGEMENT CARD */}
        <View style={styles.metricsCard}>
          <TouchableOpacity
            style={styles.metricItem}
            activeOpacity={0.7}
            onPress={() => openFollowers('followers')}
          >
            <Text style={styles.metricValue}>{profile?.followersCount || 0}</Text>
            <Text style={styles.metricLabel}>{t('social.followers')}</Text>
          </TouchableOpacity>

          <View style={styles.metricDivider} />

          <TouchableOpacity
            style={styles.metricItem}
            activeOpacity={0.7}
            onPress={() => openFollowers('following')}
          >
            <Text style={styles.metricValue}>{profile?.followingCount || 0}</Text>
            <Text style={styles.metricLabel}>{t('social.following')}</Text>
          </TouchableOpacity>

          <View style={styles.metricDivider} />

          <View style={styles.metricItem}>
            <Text style={[styles.metricValue, styles.metricValuePosts]}>
              {stats?.postsCount || 0}
            </Text>
            <Text style={styles.metricLabel}>{t('social.posts')}</Text>
          </View>
        </View>

        {/* COMMISSION / EARNINGS BANNER (IF ENABLED) */}
        {COMMISSION_ENABLED ? (
          <View style={styles.commissionCard}>
            <View style={styles.commissionLeft}>
              <View style={styles.commissionIconBox}>
                <Ionicons name="cash-outline" size={20} color="#10B981" />
              </View>
              <View>
                <Text style={styles.commissionLabel}>{t('profile.totalCommission')}</Text>
                <Text style={styles.commissionAmount}>
                  PKR {(stats?.totalCommission || 0).toLocaleString()}
                </Text>
              </View>
            </View>
            <View style={styles.commissionBadge}>
              <Text style={styles.commissionBadgeText}>Verified</Text>
            </View>
          </View>
        ) : null}

        {/* BIO / INVESTOR INTRO CARD */}
        <View style={styles.bioCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Ionicons name="reader-outline" size={15} color="#D4AF37" />
              <Text style={styles.cardHeaderTitle}>ABOUT & INVESTOR BIO</Text>
            </View>
            <TouchableOpacity
              style={styles.editBioPill}
              activeOpacity={0.7}
              onPress={() => setBioModalVisible(true)}
            >
              <Ionicons name="pencil-outline" size={12} color="#D4AF37" />
              <Text style={styles.editBioText}>{t('social.editBio')}</Text>
            </TouchableOpacity>
          </View>

          <Text
            style={[
              styles.bioContent,
              !profile?.bio && styles.bioPlaceholder,
            ]}
          >
            {profile?.bio || 'Add a bio to introduce yourself to partners, clients, and fellow investors in the Free Business Network.'}
          </Text>
        </View>

        {/* PRIMARY SHORTCUT ACTIONS ROW */}
        <View style={styles.quickActionRow}>
          <TouchableOpacity
            style={styles.primaryActionButton}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Ionicons name="create-outline" size={18} color="#0A0A0E" />
            <Text style={styles.primaryActionText}>{t('profile.editProfile')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryActionButton}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('UserSearch')}
          >
            <Ionicons name="people-outline" size={18} color="#D4AF37" />
            <Text style={styles.secondaryActionText}>{t('social.findPeople')}</Text>
          </TouchableOpacity>
        </View>

        {/* VERIFIED CONTACT INFO COMPONENT */}
        <ProfileContactInfo
          phone={profile?.phone || user?.phone}
          whatsappNumber={profile?.whatsappNumber || user?.whatsappNumber}
        />

        {/* SECTION 1: NETWORK & REWARDS */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>NETWORK & COMMUNITY</Text>

          <View style={styles.groupedCard}>
            <TouchableOpacity
              style={styles.settingRow}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('UserSearch')}
            >
              <View style={[styles.settingIconBox, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                <Ionicons name="search-outline" size={18} color="#60A5FA" />
              </View>
              <View style={styles.settingTextGroup}>
                <Text style={styles.settingTitle}>{t('social.findPeople')}</Text>
                <Text style={styles.settingSubtitle}>Discover members, brokers & investors</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#4A4A5A" />
            </TouchableOpacity>

            {REFERRAL_ENABLED ? (
              <TouchableOpacity
                style={[styles.settingRow, styles.rowBorderTop]}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('Referral')}
              >
                <View style={[styles.settingIconBox, { backgroundColor: 'rgba(212, 175, 55, 0.15)' }]}>
                  <Ionicons name="gift-outline" size={18} color="#D4AF37" />
                </View>
                <View style={styles.settingTextGroup}>
                  <Text style={styles.settingTitle}>{t('profile.viewReferrals')}</Text>
                  <Text style={styles.settingSubtitle}>Invite network & earn commissions</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#4A4A5A" />
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={[styles.settingRow, styles.rowBorderTop]}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Rewards')}
            >
              <View style={[styles.settingIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                <Ionicons name="trophy-outline" size={18} color="#F59E0B" />
              </View>
              <View style={styles.settingTextGroup}>
                <Text style={styles.settingTitle}>{t('rewards.title')}</Text>
                <Text style={styles.settingSubtitle}>Track milestone progress & tier rewards</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#4A4A5A" />
            </TouchableOpacity>
          </View>
        </View>

        {/* SECTION 2: SECURITY & PREFERENCES */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>ACCOUNT & PREFERENCES</Text>

          <View style={styles.groupedCard}>
            <TouchableOpacity
              style={styles.settingRow}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('ChangePassword')}
            >
              <View style={[styles.settingIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                <Ionicons name="shield-checkmark-outline" size={18} color="#10B981" />
              </View>
              <View style={styles.settingTextGroup}>
                <Text style={styles.settingTitle}>{t('password.changeTitle')}</Text>
                <Text style={styles.settingSubtitle}>Update password & security credentials</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#4A4A5A" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.settingRow, styles.rowBorderTop]}
              activeOpacity={0.7}
              onPress={handleLanguageChange}
            >
              <View style={[styles.settingIconBox, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
                <Ionicons name="globe-outline" size={18} color="#A78BFA" />
              </View>
              <View style={styles.settingTextGroup}>
                <Text style={styles.settingTitle}>{t('profile.language')}</Text>
                <Text style={styles.settingSubtitle}>Choose interface language</Text>
              </View>
              <View style={styles.languageBadge}>
                <Text style={styles.languageBadgeText}>
                  {language === 'ur' ? t('common.urdu') : t('common.english')}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* SECTION 3: TRUST & POLICIES */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>SUPPORT & COMPLIANCE</Text>

          <View style={styles.groupedCard}>
            <TouchableOpacity
              style={styles.settingRow}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('PrivacyPolicy')}
            >
              <View style={[styles.settingIconBox, { backgroundColor: 'rgba(212, 175, 55, 0.12)' }]}>
                <Ionicons name="document-text-outline" size={18} color="#D4AF37" />
              </View>
              <View style={styles.settingTextGroup}>
                <Text style={styles.settingTitle}>{t('profile.privacyPolicy')}</Text>
                <Text style={styles.settingSubtitle}>Confidentiality, security & platform terms</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#4A4A5A" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.settingRow, styles.rowBorderTop]}
              activeOpacity={0.7}
              onPress={() => openPhoneDialer(HELPLINE_PHONE)}
            >
              <View style={[styles.settingIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                <Ionicons name="headset-outline" size={18} color="#10B981" />
              </View>
              <View style={styles.settingTextGroup}>
                <Text style={styles.settingTitle}>Free Business Helpline</Text>
                <Text style={styles.settingSubtitle}>{HELPLINE_PHONE} (24/7 Support)</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#4A4A5A" />
            </TouchableOpacity>
          </View>
        </View>

        {/* SECTION 4: DANGER ZONE & SESSION */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionHeader, { color: '#EF4444' }]}>ACCOUNT ACTIONS</Text>

          <View style={[styles.groupedCard, styles.dangerCard]}>
            <TouchableOpacity
              style={styles.settingRow}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('DeleteAccount')}
            >
              <View style={[styles.settingIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
              </View>
              <View style={styles.settingTextGroup}>
                <Text style={[styles.settingTitle, { color: '#EF4444' }]}>
                  {t('profile.deleteAccount')}
                </Text>
                <Text style={styles.settingSubtitle}>Permanently remove account and data</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        {/* LOGOUT BUTTON */}
        <TouchableOpacity
          style={styles.logoutButton}
          activeOpacity={0.8}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#D4AF37" />
          <Text style={styles.logoutButtonText}>{t('profile.logout')}</Text>
        </TouchableOpacity>

        {/* BOTTOM BRAND FOOTER */}
        <View style={styles.footerNote}>
          <Text style={styles.footerBrand}>FREE BUSINESS REAL ESTATE APP</Text>
          <Text style={styles.footerVersion}>Version 2.4.0 • Enterprise Edition</Text>
        </View>
      </ScrollView>

      {/* MODERN LUXURY BIO MODAL */}
      <Modal visible={bioModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleGroup}>
                <Ionicons name="create-outline" size={18} color="#D4AF37" />
                <Text style={styles.modalTitle}>{t('social.editBio')}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setBioModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={22} color="#8E8E9F" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Share your real estate focus, investment interests, or broker experience.
            </Text>

            <TextInput
              style={styles.bioInput}
              value={bioDraft}
              onChangeText={setBioDraft}
              placeholder={t('social.bioPlaceholder')}
              placeholderTextColor="#555566"
              multiline
              maxLength={500}
            />

            <View style={styles.charCountRow}>
              <Text style={styles.charCountText}>
                {bioDraft.length} / 500 characters
              </Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setBioModalVisible(false)}
                disabled={savingBio}
              >
                <Text style={styles.modalCancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSave}
                onPress={handleSaveBio}
                disabled={savingBio}
              >
                {savingBio ? (
                  <ActivityIndicator color="#0A0A0E" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={16} color="#0A0A0E" />
                    <Text style={styles.modalSaveText}>{t('common.save')}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    gap: 12,
  },
  loadingText: {
    color: '#8E8E9F',
    fontSize: 14,
    fontWeight: '500',
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
    letterSpacing: 1.2,
  },
  topActionButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(10, 10, 14, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
  },

  /* IDENTITY SECTION */
  identityContainer: {
    alignItems: 'center',
    marginTop: -48,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarTouchable: {
    position: 'relative',
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
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#D4AF37',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0A0A0E',
    elevation: 4,
  },
  photoHint: {
    fontSize: 11,
    color: '#6B6B7F',
    marginTop: 6,
    marginBottom: 4,
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
  tierTag: {
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
  tierTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D4AF37',
    letterSpacing: 0.6,
  },
  memberSinceTag: {
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
  memberSinceText: {
    fontSize: 11,
    color: '#8E8E9F',
    fontWeight: '500',
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

  /* COMMISSION CARD */
  commissionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#141419',
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  commissionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  commissionIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commissionLabel: {
    fontSize: 11,
    color: '#8E8E9F',
    fontWeight: '600',
  },
  commissionAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 0.3,
  },
  commissionBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  commissionBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10B981',
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#8E8E9F',
  },
  editBioPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
  },
  editBioText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D4AF37',
  },
  bioContent: {
    fontSize: 13,
    color: '#E2E2EA',
    lineHeight: 20,
    fontWeight: '400',
  },
  bioPlaceholder: {
    color: '#6B6B7F',
    fontStyle: 'italic',
  },

  /* QUICK ACTIONS ROW */
  quickActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  primaryActionButton: {
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
  primaryActionText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0A0A0E',
    letterSpacing: 0.3,
  },
  secondaryActionButton: {
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
  secondaryActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D4AF37',
    letterSpacing: 0.3,
  },

  /* GROUPED SETTINGS */
  sectionContainer: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#8E8E9F',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  groupedCard: {
    backgroundColor: '#141419',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#23232C',
    overflow: 'hidden',
  },
  dangerCard: {
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  rowBorderTop: {
    borderTopWidth: 1,
    borderTopColor: '#1E1E26',
  },
  settingIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingTextGroup: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 11,
    color: '#8E8E9F',
  },
  languageBadge: {
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  languageBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D4AF37',
  },

  /* LOGOUT BUTTON */
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#141419',
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    marginBottom: 24,
  },
  logoutButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#D4AF37',
    letterSpacing: 0.5,
  },

  /* BRAND FOOTER */
  footerNote: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  footerBrand: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: '#4A4A5A',
  },
  footerVersion: {
    fontSize: 10,
    color: '#3B3B48',
    marginTop: 3,
  },

  /* MODAL */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#16161D',
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: '#D4AF37',
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  modalTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#D4AF37',
    letterSpacing: 0.3,
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#8E8E9F',
    marginBottom: 16,
    lineHeight: 18,
  },
  bioInput: {
    backgroundColor: '#0E0E14',
    borderWidth: 1,
    borderColor: '#2A2A36',
    borderRadius: 14,
    padding: 14,
    color: '#FFFFFF',
    fontSize: 14,
    minHeight: 110,
    textAlignVertical: 'top',
    lineHeight: 20,
  },
  charCountRow: {
    alignItems: 'flex-end',
    marginTop: 6,
    marginBottom: 16,
  },
  charCountText: {
    fontSize: 11,
    color: '#6B6B7F',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
  },
  modalCancel: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E9F',
  },
  modalSave: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#D4AF37',
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 12,
    elevation: 3,
  },
  modalSaveText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0A0A0E',
  },
});

export default ProfileScreen;
