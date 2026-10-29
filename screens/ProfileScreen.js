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
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../hooks/useTranslation';
import { REFERRAL_ENABLED, COMMISSION_ENABLED } from '../config/features';
import Avatar from '../components/Avatar';
import { getMyProgress } from '../services/rewardsApi';
import { getUserProfile, updateSocialProfile } from '../services/socialApi';
import { uploadImageAsset } from '../services/uploadImageService';
import { getApiErrorMessage } from '../utils/apiError';
import ProfileContactInfo from '../components/ProfileContactInfo';

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
        { text: t('profile.logout'), onPress: () => logout() },
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
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleAvatarPress} disabled={uploadingAvatar}>
          <Avatar uri={profile?.avatar || user?.avatar} name={user?.name} size={90} />
          {uploadingAvatar && (
            <ActivityIndicator color="#000000" style={styles.avatarLoader} />
          )}
        </TouchableOpacity>
        <Text style={styles.tapHint}>{t('social.tapToChangePhoto')}</Text>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <Text style={styles.bioPreview}>{profile?.bio || t('social.noBio')}</Text>
      </View>

      <ProfileContactInfo
        phone={profile?.phone || user?.phone}
        whatsappNumber={profile?.whatsappNumber || user?.whatsappNumber}
      />

      <View style={styles.countsRow}>
        <TouchableOpacity style={styles.countBox} onPress={() => openFollowers('followers')}>
          <Text style={styles.countValue}>{profile?.followersCount || 0}</Text>
          <Text style={styles.countLabel}>{t('social.followers')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.countBox} onPress={() => openFollowers('following')}>
          <Text style={styles.countValue}>{profile?.followingCount || 0}</Text>
          <Text style={styles.countLabel}>{t('social.following')}</Text>
        </TouchableOpacity>
        <View style={styles.countBox}>
          <Text style={styles.countValue}>{stats?.postsCount || 0}</Text>
          <Text style={styles.countLabel}>{t('social.posts')}</Text>
        </View>
      </View>

      <View style={styles.infoContainer}>
        <TouchableOpacity style={styles.settingsRow} onPress={() => setBioModalVisible(true)}>
          <Text style={styles.infoLabel}>{t('social.editBio')}</Text>
          <Text style={styles.infoValue}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingsRow}
          onPress={() => navigation.navigate('UserSearch')}
        >
          <Text style={styles.infoLabel}>{t('social.findPeople')}</Text>
          <Text style={styles.infoValue}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingsRow} onPress={handleLanguageChange}>
          <Text style={styles.infoLabel}>{t('profile.language')}</Text>
          <Text style={styles.infoValue}>
            {language === 'ur' ? t('common.urdu') : t('common.english')}
          </Text>
        </TouchableOpacity>

        {REFERRAL_ENABLED ? (
          <TouchableOpacity
            style={styles.settingsRow}
            onPress={() => navigation.navigate('Referral')}
          >
            <Text style={styles.infoLabel}>{t('profile.viewReferrals')}</Text>
            <Text style={styles.infoValue}>→</Text>
          </TouchableOpacity>
        ) : null}

        {COMMISSION_ENABLED ? (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('profile.totalCommission')}</Text>
            <Text style={styles.infoValue}>
              PKR {(stats?.totalCommission || 0).toLocaleString()}
            </Text>
          </View>
        ) : null}
      </View>

      <TouchableOpacity
        style={styles.discoverButton}
        onPress={() => navigation.navigate('UserSearch')}
      >
        <Text style={styles.discoverButtonText}>{t('stream.findPeople')}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate('EditProfile')}>
        <Text style={styles.editButtonText}>{t('profile.editProfile')}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.changePasswordButton}
        onPress={() => navigation.navigate('ChangePassword')}
      >
        <Text style={styles.changePasswordButtonText}>{t('password.changeTitle')}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.rewardsButton} onPress={() => navigation.navigate('Rewards')}>
        <Text style={styles.rewardsButtonText}>{t('rewards.title')}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.legalButton}
        onPress={() => navigation.navigate('PrivacyPolicy')}
      >
        <Text style={styles.legalButtonText}>{t('profile.privacyPolicy')}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.deleteAccountButton}
        onPress={() => navigation.navigate('DeleteAccount')}
      >
        <Text style={styles.deleteAccountButtonText}>{t('profile.deleteAccount')}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>{t('profile.logout')}</Text>
      </TouchableOpacity>

      <Modal visible={bioModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('social.editBio')}</Text>
            <TextInput
              style={styles.bioInput}
              value={bioDraft}
              onChangeText={setBioDraft}
              placeholder={t('social.bioPlaceholder')}
              placeholderTextColor="#666"
              multiline
              maxLength={500}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setBioModalVisible(false)}>
                <Text style={styles.modalCancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={handleSaveBio} disabled={savingBio}>
                {savingBio ? (
                  <ActivityIndicator color="#000000" />
                ) : (
                  <Text style={styles.modalSaveText}>{t('common.save')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#D4AF37', paddingTop: 50, padding: 24, alignItems: 'center' },
  avatarLoader: { marginTop: 8 },
  tapHint: { fontSize: 12, color: '#1a1a1a', marginTop: 8 },
  name: { fontSize: 24, fontWeight: 'bold', color: '#000000', marginTop: 8 },
  email: { fontSize: 14, color: '#1a1a1a' },
  bioPreview: { fontSize: 14, color: '#000000', marginTop: 10, textAlign: 'center', paddingHorizontal: 10 },
  countsRow: { flexDirection: 'row', paddingVertical: 20, justifyContent: 'space-around' },
  countBox: { alignItems: 'center' },
  countValue: { fontSize: 22, fontWeight: 'bold', color: '#D4AF37' },
  countLabel: { fontSize: 12, color: '#888888', marginTop: 4 },
  infoContainer: {
    backgroundColor: '#1a1a1a',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#D4AF37',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    marginTop: 8,
  },
  infoLabel: { fontSize: 16, color: '#888' },
  infoValue: { fontSize: 16, fontWeight: '600', color: '#D4AF37' },
  discoverButton: {
    backgroundColor: '#333',
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  discoverButtonText: { color: '#D4AF37', fontSize: 16, fontWeight: '600' },
  editButton: {
    backgroundColor: '#D4AF37',
    margin: 20,
    marginBottom: 10,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: { color: '#000000', fontSize: 18, fontWeight: '600' },
  changePasswordButton: {
    backgroundColor: '#1a1a1a',
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  changePasswordButtonText: { color: '#D4AF37', fontSize: 16, fontWeight: '600' },
  rewardsButton: {
    backgroundColor: '#333',
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  rewardsButtonText: { color: '#D4AF37', fontSize: 18, fontWeight: '600' },
  legalButton: {
    backgroundColor: '#333',
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  legalButtonText: { color: '#D4AF37', fontSize: 16, fontWeight: '600' },
  deleteAccountButton: {
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#c0392b',
  },
  deleteAccountButtonText: { color: '#ff6b6b', fontSize: 16, fontWeight: '600' },
  logoutButton: {
    backgroundColor: '#333',
    marginHorizontal: 20,
    marginBottom: 30,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#666',
  },
  logoutButtonText: { color: '#D4AF37', fontSize: 18, fontWeight: '600' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#D4AF37', marginBottom: 12 },
  bioInput: {
    borderWidth: 1,
    borderColor: '#D4AF37',
    borderRadius: 8,
    padding: 12,
    color: '#D4AF37',
    minHeight: 100,
    textAlignVertical: 'top',
    backgroundColor: '#000000',
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 },
  modalCancel: { marginRight: 12, padding: 10 },
  modalCancelText: { color: '#888888' },
  modalSave: { backgroundColor: '#D4AF37', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  modalSaveText: { color: '#000000', fontWeight: 'bold' },
});

export default ProfileScreen;
