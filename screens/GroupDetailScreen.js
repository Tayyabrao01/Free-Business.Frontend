import React, { useState, useCallback } from 'react';
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
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from '../hooks/useTranslation';
import Avatar from '../components/Avatar';
import { resolveMediaUrl } from '../utils/imageUrl';
import { getApiErrorMessage } from '../utils/apiError';
import Ionicons from 'react-native-vector-icons/Ionicons';
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
        await leaveGroup(groupId);
        Alert.alert(t('common.success'), t('groups.leftSuccess'));
      } else {
        const res = await joinGroup(groupId);
        Alert.alert(t('common.success'), res.data.message);
      }
      await loadGroup();
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

  const renderPost = (item) => (
    <View key={item._id} style={styles.postCard}>
      <View style={styles.postHeader}>
        <Avatar uri={item.author?.avatar} name={item.author?.name} size={36} />
        <Text style={styles.postAuthor}>{item.author?.name || t('common.user')}</Text>
      </View>
      <Text style={styles.postContent}>{item.content}</Text>
      {item.imageUrl ? (
        <Image source={{ uri: resolveMediaUrl(item.imageUrl) }} style={styles.postImage} />
      ) : null}
      <Text style={styles.postDate}>
        {new Date(item.createdAt).toLocaleString()}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  if (!group) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{t('groups.notFound')}</Text>
      </View>
    );
  }

  const showJoinButton = !group.isOwner;
  const joinLabel = group.isMember
    ? t('groups.leave')
    : group.isPending
      ? t('groups.pending')
      : t('groups.join');

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.back}>{t('common.back')}</Text>
          </TouchableOpacity>
          <Text style={styles.groupName}>{group.name}</Text>
          <Text style={styles.privacy}>{t(`groups.privacy.${group.privacy}`)}</Text>
          <Text style={styles.description}>{group.description || t('groups.noDescription')}</Text>
          <Text style={styles.stats}>
            {group.membersCount} {t('groups.members')} · {group.postsCount || group.posts?.length || 0}{' '}
            {t('groups.posts')}
          </Text>
        </View>

        {showJoinButton && (
          <TouchableOpacity
            style={[
              styles.actionBtn,
              (group.isMember || group.isPending) && styles.leaveBtn,
              group.isPending && styles.pendingBtn,
            ]}
            onPress={handleJoinLeave}
            disabled={actionLoading || group.isPending}
          >
            {actionLoading ? (
              <ActivityIndicator color="#000000" />
            ) : (
              <Text style={styles.actionBtnText}>{joinLabel}</Text>
            )}
          </TouchableOpacity>
        )}

        {group.canChat ? (
          <View style={styles.chatSection}>
            <Text style={styles.sectionTitle}>{t('groups.groupChat')}</Text>
            <Text style={styles.chatHint}>{t('groups.groupChatHint')}</Text>
            <TouchableOpacity
              style={styles.chatPrimaryBtn}
              onPress={handleOpenGroupChat}
              disabled={chatLoading}
            >
              {chatLoading ? (
                <ActivityIndicator color="#000000" />
              ) : (
                <>
                  <Ionicons name="chatbubbles" size={22} color="#000000" />
                  <Text style={styles.chatPrimaryText}>{t('groups.openGroupChat')}</Text>
                </>
              )}
            </TouchableOpacity>
            <View style={styles.callRow}>
              <TouchableOpacity
                style={styles.callBtn}
                onPress={() => handleGroupCall(false)}
                disabled={chatLoading}
              >
                <Ionicons name="call" size={20} color="#D4AF37" />
                <Text style={styles.callBtnText}>{t('groups.groupAudioCall')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.callBtn}
                onPress={() => handleGroupCall(true)}
                disabled={chatLoading}
              >
                <Ionicons name="videocam" size={20} color="#D4AF37" />
                <Text style={styles.callBtnText}>{t('groups.groupVideoCall')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <Text style={styles.joinChatHint}>{t('groups.joinToChat')}</Text>
        )}

        {group.isOwner && group.pendingMembers?.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('groups.pendingRequests')}</Text>
            {group.pendingMembers.map((member) => (
              <View key={member._id} style={styles.pendingRow}>
                <Avatar uri={member.avatar} name={member.name} size={36} />
                <Text style={styles.pendingName}>{member.name}</Text>
                <TouchableOpacity
                  style={styles.approveBtn}
                  onPress={() => handleApproveMember(member._id)}
                >
                  <Text style={styles.approveBtnText}>{t('groups.approve')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.rejectBtn}
                  onPress={() => handleRejectMember(member._id)}
                >
                  <Text style={styles.rejectBtnText}>{t('groups.reject')}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : null}

        {group.members && group.members.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t('groups.members')}
              {group.isOwner ? ` (${t('groups.adminHint')})` : ''}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {group.members.map((member) => {
                const isAdmin = group.owner?._id === member._id;
                const canRemove =
                  group.isOwner && !isAdmin && member._id !== user?._id;
                return (
                  <TouchableOpacity
                    key={member._id}
                    style={styles.memberChip}
                    onPress={() => {
                      if (canRemove) {
                        handleRemoveMember(member);
                      } else {
                        navigation.navigate('UserProfile', { userId: member._id });
                      }
                    }}
                    onLongPress={() => canRemove && handleRemoveMember(member)}
                  >
                    <Avatar uri={member.avatar} name={member.name} size={40} />
                    <Text style={styles.memberName} numberOfLines={1}>
                      {isAdmin ? `★ ${member.name}` : member.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {group.isOwner ? (
          <TouchableOpacity
            style={styles.deleteGroupBtn}
            onPress={handleDeleteGroup}
            disabled={actionLoading}
          >
            <Text style={styles.deleteGroupText}>{t('groups.deleteGroup')}</Text>
          </TouchableOpacity>
        ) : null}

        {group.canPost && (
          <View style={styles.composeSection}>
            <TextInput
              style={styles.postInput}
              placeholder={t('groups.writePost')}
              placeholderTextColor="#666"
              value={postText}
              onChangeText={setPostText}
              multiline
            />
            <TouchableOpacity style={styles.postBtn} onPress={handleCreatePost} disabled={posting}>
              {posting ? (
                <ActivityIndicator color="#000000" />
              ) : (
                <Text style={styles.postBtnText}>{t('groups.post')}</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('groups.posts')}</Text>
          {group.posts && group.posts.length > 0 ? (
            group.posts.map((post) => renderPost(post))
          ) : (
            <Text style={styles.emptyPosts}>{t('groups.noPosts')}</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#D4AF37', fontSize: 16 },
  header: { backgroundColor: '#D4AF37', paddingTop: 50, padding: 20 },
  back: { color: '#000000', fontWeight: '600', marginBottom: 12 },
  groupName: { fontSize: 26, fontWeight: 'bold', color: '#000000' },
  privacy: { fontSize: 12, color: '#1a1a1a', marginTop: 4, fontWeight: '600' },
  description: { fontSize: 14, color: '#000000', marginTop: 10, lineHeight: 20 },
  stats: { fontSize: 13, color: '#1a1a1a', marginTop: 8 },
  actionBtn: {
    margin: 16,
    backgroundColor: '#D4AF37',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  leaveBtn: { backgroundColor: '#333333', borderWidth: 1, borderColor: '#D4AF37' },
  pendingBtn: { backgroundColor: '#555555' },
  actionBtnText: { color: '#000000', fontWeight: 'bold', fontSize: 16 },
  chatSection: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D4AF37',
    backgroundColor: '#1a1a1a',
  },
  chatHint: { color: '#888888', fontSize: 13, lineHeight: 20, marginBottom: 12 },
  chatPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D4AF37',
    padding: 14,
    borderRadius: 10,
  },
  chatPrimaryText: { color: '#000000', fontWeight: 'bold', fontSize: 16, marginLeft: 8 },
  callRow: { flexDirection: 'row', marginTop: 10 },
  callBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D4AF37',
    borderRadius: 10,
    paddingVertical: 12,
    marginRight: 5,
  },
  callBtnText: { color: '#D4AF37', fontWeight: '600', fontSize: 13, marginLeft: 6 },
  joinChatHint: {
    color: '#888888',
    textAlign: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    fontSize: 13,
  },
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#D4AF37', marginBottom: 12 },
  memberChip: { alignItems: 'center', marginRight: 14, width: 70 },
  memberName: { color: '#888888', fontSize: 11, marginTop: 4, textAlign: 'center' },
  composeSection: { padding: 16, borderTopWidth: 1, borderTopColor: '#333333' },
  postInput: {
    borderWidth: 1,
    borderColor: '#D4AF37',
    borderRadius: 8,
    padding: 12,
    color: '#D4AF37',
    backgroundColor: '#1a1a1a',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  postBtn: {
    backgroundColor: '#D4AF37',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  postBtnText: { color: '#000000', fontWeight: 'bold' },
  postCard: {
    backgroundColor: '#1a1a1a',
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#333333',
  },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  postAuthor: { color: '#D4AF37', fontWeight: 'bold', marginLeft: 10, fontSize: 15 },
  postContent: { color: '#dddddd', fontSize: 15, lineHeight: 22 },
  postImage: { width: '100%', height: 180, borderRadius: 8, marginTop: 10, resizeMode: 'cover' },
  postDate: { color: '#666666', fontSize: 11, marginTop: 8 },
  emptyPosts: { color: '#888888', textAlign: 'center', padding: 20 },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  pendingName: { flex: 1, color: '#D4AF37', marginLeft: 10, fontWeight: '600' },
  approveBtn: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 6,
  },
  approveBtnText: { color: '#000', fontWeight: '700', fontSize: 12 },
  rejectBtn: {
    borderWidth: 1,
    borderColor: '#D4AF37',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  rejectBtnText: { color: '#D4AF37', fontWeight: '600', fontSize: 12 },
  deleteGroupBtn: {
    margin: 16,
    marginTop: 0,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e74c3c',
    alignItems: 'center',
  },
  deleteGroupText: { color: '#e74c3c', fontWeight: '700', fontSize: 16 },
});

export default GroupDetailScreen;
