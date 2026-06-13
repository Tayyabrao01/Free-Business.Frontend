import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from '../hooks/useTranslation';
import Avatar from '../components/Avatar';
import ProfileContactInfo from '../components/ProfileContactInfo';
import { useAuth } from '../context/AuthContext';
import { useStream } from '../context/StreamProvider';
import { getUserProfile, followUser, unfollowUser } from '../services/socialApi';
import { ensureChatClientReady } from '../services/streamClientService';

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
      Alert.alert(t('common.error'), error.response?.data?.message || t('social.actionFailed'));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{t('social.userNotFound')}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>{t('common.back')}</Text>
        </TouchableOpacity>
        <Avatar uri={profile.avatar} name={profile.name} size={90} style={styles.avatar} />
        <Text style={styles.name}>{profile.name}</Text>
        <Text style={styles.location}>{profile.location}</Text>
        {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
      </View>

      <View style={styles.countsRow}>
        <TouchableOpacity
          style={styles.countBox}
          onPress={() =>
            navigation.navigate('Followers', {
              userId,
              userName: profile.name,
              initialTab: 'followers',
            })
          }
        >
          <Text style={styles.countValue}>{profile.followersCount || 0}</Text>
          <Text style={styles.countLabel}>{t('social.followers')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.countBox}
          onPress={() =>
            navigation.navigate('Followers', {
              userId,
              userName: profile.name,
              initialTab: 'following',
            })
          }
        >
          <Text style={styles.countValue}>{profile.followingCount || 0}</Text>
          <Text style={styles.countLabel}>{t('social.following')}</Text>
        </TouchableOpacity>
        <View style={styles.countBox}>
          <Text style={styles.countValue}>{profile.postsCount || 0}</Text>
          <Text style={styles.countLabel}>{t('social.posts')}</Text>
        </View>
      </View>

      <ProfileContactInfo phone={profile.phone} whatsappNumber={profile.whatsappNumber} />

      <TouchableOpacity
        style={[styles.followButton, profile.isFollowing && styles.unfollowButton]}
        onPress={handleFollowToggle}
        disabled={actionLoading}
      >
        {actionLoading ? (
          <ActivityIndicator color="#000000" />
        ) : (
          <Text style={styles.followButtonText}>
            {profile.isFollowing ? t('social.unfollow') : t('social.follow')}
          </Text>
        )}
      </TouchableOpacity>

      {!isOwnProfile ? (
        <TouchableOpacity
          style={styles.messageButton}
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
          <Text style={styles.messageButtonText}>{t('stream.sendMessage')}</Text>
        </TouchableOpacity>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000000' },
  errorText: { color: '#D4AF37', fontSize: 16 },
  header: { backgroundColor: '#D4AF37', paddingTop: 50, padding: 24, alignItems: 'center' },
  back: { alignSelf: 'flex-start', color: '#000000', fontWeight: '600', marginBottom: 16 },
  avatar: { marginBottom: 12 },
  name: { fontSize: 24, fontWeight: 'bold', color: '#000000' },
  location: { fontSize: 14, color: '#1a1a1a', marginTop: 4 },
  bio: { fontSize: 14, color: '#000000', marginTop: 12, textAlign: 'center', lineHeight: 20 },
  countsRow: { flexDirection: 'row', padding: 20, justifyContent: 'space-around' },
  countBox: { alignItems: 'center' },
  countValue: { fontSize: 22, fontWeight: 'bold', color: '#D4AF37' },
  countLabel: { fontSize: 12, color: '#888888', marginTop: 4 },
  followButton: {
    margin: 20,
    backgroundColor: '#D4AF37',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  unfollowButton: { backgroundColor: '#333333', borderWidth: 1, borderColor: '#D4AF37' },
  followButtonText: { color: '#000000', fontSize: 18, fontWeight: 'bold' },
  messageButton: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D4AF37',
    alignItems: 'center',
  },
  messageButtonText: { color: '#D4AF37', fontSize: 18, fontWeight: 'bold' },
});

export default UserProfileScreen;
