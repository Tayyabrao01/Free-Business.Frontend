import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import api, { isAbortError } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../hooks/useTranslation';

const ConversationsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    const fetchUsers = async () => {
      try {
        const response = await api.get('/users', { signal: controller.signal });
        const otherUsers = response.data.filter((u) => u._id !== user?._id);
        setUsers(otherUsers);
      } catch (error) {
        if (!isAbortError(error)) {
          console.error('Error fetching users:', error);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchUsers();
    return () => controller.abort();
  }, [user?._id]);

  const startChat = (receiver) => {
    navigation.navigate('Chat', {
      receiverId: receiver._id,
      receiverName: receiver.name,
    });
  };

  const renderUser = ({ item }) => (
    <TouchableOpacity style={styles.userCard} onPress={() => startChat(item)}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.name?.charAt(0) || '?'}</Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
      </View>
    </TouchableOpacity>
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
      {users.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t('chat.noUsers')}</Text>
          <Text style={styles.emptySubtext}>{t('chat.noUsersHint')}</Text>
        </View>
      ) : (
        <FlashList
          data={users}
          renderItem={renderUser}
          keyExtractor={(item) => item._id}
          estimatedItemSize={76}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  list: {
    padding: 15,
  },
  userCard: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#D4AF37',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: '#000000',
    fontSize: 20,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D4AF37',
  },
  userEmail: {
    fontSize: 14,
    color: '#888888',
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#000000',
  },
  emptyText: {
    fontSize: 18,
    color: '#D4AF37',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    marginTop: 10,
  },
});

export default ConversationsScreen;
