import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../context/AuthContext';
import { useStream } from '../context/StreamProvider';
import { ensureChatClientReady } from '../services/streamClientService';
import Avatar from '../components/Avatar';
import { getUsers, followUser, unfollowUser } from '../services/socialApi';

const UserSearchScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { reconnect } = useStream();
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [openingChatId, setOpeningChatId] = useState(null);

  const loadUsers = async (query) => {
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

  const handleSearch = () => {
    setLoading(true);
    loadUsers(search.trim());
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
      Alert.alert(t('common.error'), error.response?.data?.message || t('social.actionFailed'));
    } finally {
      setActionId(null);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('UserProfile', { userId: item._id })}
    >
      <Avatar uri={item.avatar} name={item.name} size={50} />
      <View style={styles.cardInfo}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.meta}>{item.location || t('properties.locationNotSpecified')}</Text>
        <Text style={styles.meta}>
          {t('social.followers')}: {item.followersCount || 0}
        </Text>
      </View>
      <View style={styles.actionsCol}>
        <TouchableOpacity
          style={styles.msgBtn}
          onPress={async () => {
            if (openingChatId) {
              return;
            }
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
            } finally {
              setOpeningChatId(null);
            }
          }}
          disabled={openingChatId === item._id}
        >
          <Text style={styles.msgBtnText}>{t('stream.message')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.followBtn, item.isFollowing && styles.followingBtn]}
          onPress={() => toggleFollow(item)}
          disabled={actionId === item._id}
        >
          {actionId === item._id ? (
            <ActivityIndicator color="#000000" size="small" />
          ) : (
            <Text style={styles.followBtnText}>
              {item.isFollowing ? t('social.following') : t('social.follow')}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>{t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('social.findPeople')}</Text>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder={t('social.searchPlaceholder')}
          placeholderTextColor="#666"
          value={search}
          onChangeText={setSearch}
        />
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
          <Text style={styles.searchBtnText}>{t('social.search')}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color="#D4AF37" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={users}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>{t('social.noUsersFound')}</Text>}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  header: { paddingTop: 50, padding: 20, backgroundColor: '#1a1a1a', borderBottomWidth: 1, borderBottomColor: '#D4AF37' },
  back: { color: '#D4AF37', marginBottom: 8 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#D4AF37' },
  searchRow: { flexDirection: 'row', padding: 16, alignItems: 'center' },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D4AF37',
    borderRadius: 8,
    padding: 12,
    color: '#D4AF37',
    backgroundColor: '#1a1a1a',
    marginRight: 10,
  },
  searchBtn: { backgroundColor: '#D4AF37', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8 },
  searchBtnText: { color: '#000000', fontWeight: 'bold' },
  list: { padding: 16, paddingBottom: 40 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#333333',
  },
  cardInfo: { flex: 1, marginLeft: 12 },
  name: { color: '#D4AF37', fontSize: 16, fontWeight: 'bold' },
  meta: { color: '#888888', fontSize: 12, marginTop: 2 },
  actionsCol: { alignItems: 'flex-end' },
  msgBtn: {
    borderWidth: 1,
    borderColor: '#D4AF37',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 6,
  },
  msgBtnText: { color: '#D4AF37', fontSize: 11, fontWeight: 'bold' },
  followBtn: { backgroundColor: '#D4AF37', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  followingBtn: { backgroundColor: '#333333', borderWidth: 1, borderColor: '#D4AF37' },
  followBtnText: { color: '#000000', fontWeight: 'bold', fontSize: 12 },
  empty: { color: '#888888', textAlign: 'center', marginTop: 40 },
});

export default UserSearchScreen;
