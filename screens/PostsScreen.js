import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  Image,
  FlatList,
} from 'react-native';
import api, { isAbortError } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../hooks/useTranslation';
import { resolveMediaUrl } from '../utils/imageUrl';
import { downloadMedia, detectMediaType } from '../services/MediaService';
import MediaViewerModal from '../components/MediaViewerModal';

const PostsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPostText, setNewPostText] = useState('');
  const [activeCommentPostId, setActiveCommentPostId] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [downloadingPostId, setDownloadingPostId] = useState(null);
  const [viewerUri, setViewerUri] = useState(null);

  const fetchPosts = useCallback(async (signal) => {
    try {
      const response = await api.get('/posts', { signal });
      setPosts(response.data || []);
    } catch (error) {
      if (!isAbortError(error)) {
        console.error('Error:', error);
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    fetchPosts(controller.signal);
    return () => controller.abort();
  }, [fetchPosts]);

  const createPost = async () => {
    if (!newPostText.trim()) {
      Alert.alert(t('common.error'), t('posts.enterContent'));
      return;
    }

    try {
      const response = await api.post('/posts', { content: newPostText });
      setPosts([response.data, ...posts]);
      setNewPostText('');
    } catch (error) {
      Alert.alert(t('common.error'), t('posts.createFailed'));
    }
  };

  const handleLike = async (postId) => {
    try {
      const post = posts.find(p => p._id === postId);
      const isLiked = post.likes && post.likes.some(id => id === user?._id || id?._id === user?._id);

      if (isLiked) {
        const response = await api.post(`/posts/${postId}/unlike`);
        updatePostInState(postId, { likes: response.data.likes });
      } else {
        const response = await api.post(`/posts/${postId}/like`);
        updatePostInState(postId, { likes: response.data.likes });
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  const handleComment = async (postId) => {
    if (!commentText.trim()) return;
    try {
      const response = await api.post(`/posts/${postId}/comment`, { text: commentText });
      updatePostInState(postId, { comments: response.data.comments });
      setCommentText('');
    } catch (error) {
      Alert.alert(t('common.error'), t('posts.commentFailed'));
    }
  };

  const updatePostInState = (postId, updatedFields) => {
    setPosts(prevPosts =>
      prevPosts.map(p => (p._id === postId ? { ...p, ...updatedFields } : p))
    );
  };

  const handleDownloadMedia = async (post) => {
    const mediaUrl = resolveMediaUrl(post.imageUrl);
    if (!mediaUrl) {
      Alert.alert(t('common.error'), t('posts.noMedia'));
      return;
    }

    setDownloadingPostId(post._id);
    try {
      await downloadMedia(mediaUrl, detectMediaType(mediaUrl), {
        successTitle: t('common.success'),
        successMessage: t('posts.downloadSuccess'),
        errorTitle: t('common.error'),
        errorMessage: t('posts.downloadFailed'),
        permissionTitle: t('common.error'),
        permissionMessage: t('posts.permissionDenied'),
        invalidUrlMessage: t('posts.noMedia'),
      });
    } finally {
      setDownloadingPostId(null);
    }
  };

  const toggleCommentSection = (postId) => {
    if (activeCommentPostId === postId) {
      setActiveCommentPostId(null);
    } else {
      setActiveCommentPostId(postId);
      setCommentText('');
    }
  };

  const renderPost = ({ item }) => {
    if (!item) {
      return null;
    }

    const likes = Array.isArray(item.likes) ? item.likes : [];
    const isLiked = likes.some(
      (id) => id === user?._id || id?._id === user?._id || String(id) === String(user?._id)
    );
    const mediaUrl = resolveMediaUrl(item.imageUrl);
    const mediaType = mediaUrl ? detectMediaType(mediaUrl) : null;
    const isDownloading = downloadingPostId === item._id;
    const postDate = item.createdAt ? new Date(item.createdAt) : null;
    const dateLabel =
      postDate && !Number.isNaN(postDate.getTime())
        ? postDate.toLocaleDateString()
        : '';

    return (
      <View style={styles.postCard}>
        <Text style={styles.postAuthor}>{item.author?.name || t('common.user')}</Text>
        <Text style={styles.postContent}>{item.content || ''}</Text>

        {mediaUrl ? (
          <View style={styles.mediaContainer}>
            <TouchableOpacity activeOpacity={0.9} onPress={() => setViewerUri(mediaUrl)}>
              {mediaType === 'video' ? (
                <View style={styles.videoPlaceholder}>
                  <Text style={styles.videoPlaceholderText}>▶ {t('posts.tapToView')}</Text>
                </View>
              ) : (
                <Image source={{ uri: mediaUrl }} style={styles.postImage} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.downloadButton}
              onPress={() => handleDownloadMedia(item)}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <Text style={styles.downloadButtonText}>⬇ {t('posts.download')}</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : null}

        {dateLabel ? <Text style={styles.postDate}>{dateLabel}</Text> : null}

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleLike(item._id)}>
            <Text style={[styles.actionText, isLiked && styles.actionTextActive]}>
              👍 {t('posts.like')} ({likes.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => toggleCommentSection(item._id)}>
            <Text style={styles.actionText}>
              💬 {t('posts.comment')} ({item.comments ? item.comments.length : 0})
            </Text>
          </TouchableOpacity>
        </View>

        {activeCommentPostId === item._id && (
          <View style={styles.commentSection}>
            {item.comments && item.comments.map((comment, index) => (
              <View key={index} style={styles.commentItem}>
                <Text style={styles.commentAuthor}>{comment.user?.name || t('common.user')}</Text>
                <Text style={styles.commentText}>{comment.text}</Text>
              </View>
            ))}

            <View style={styles.commentInputRow}>
              <TextInput
                style={styles.commentInput}
                placeholder={t('posts.writeComment')}
                placeholderTextColor="#888"
                value={commentText}
                onChangeText={setCommentText}
              />
              <TouchableOpacity style={styles.sendCommentButton} onPress={() => handleComment(item._id)}>
                <Text style={styles.sendCommentText}>{t('posts.send')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  const listHeader = (
    <View style={styles.createPostContainer}>
      <TextInput
        style={styles.postInput}
        placeholder={t('posts.whatsOnMind')}
        placeholderTextColor="#888"
        value={newPostText}
        onChangeText={setNewPostText}
        multiline
      />
      <TouchableOpacity style={styles.postButton} onPress={createPost}>
        <Text style={styles.postButtonText}>{t('posts.postButton')}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item, index) => item._id?.toString() || `post-${index}`}
        contentContainerStyle={styles.list}
        ListHeaderComponent={listHeader}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddPost')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

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
    backgroundColor: '#000000',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  createPostContainer: {
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#D4AF37',
  },
  postInput: {
    borderWidth: 1,
    borderColor: '#D4AF37',
    padding: 10,
    borderRadius: 8,
    minHeight: 60,
    textAlignVertical: 'top',
    backgroundColor: '#000000',
    color: '#D4AF37',
  },
  postButton: {
    backgroundColor: '#D4AF37',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  postButtonText: {
    color: '#000000',
    fontWeight: '600',
  },
  list: {
    padding: 15,
  },
  postCard: {
    backgroundColor: '#1a1a1a',
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  postAuthor: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#D4AF37',
  },
  postContent: {
    fontSize: 16,
    marginBottom: 10,
    color: '#ddd',
  },
  mediaContainer: {
    marginBottom: 10,
    position: 'relative',
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  videoPlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#111111',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  videoPlaceholderText: {
    color: '#D4AF37',
    fontSize: 18,
    fontWeight: 'bold',
  },
  downloadButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: '#D4AF37',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  downloadButtonText: {
    color: '#000000',
    fontWeight: 'bold',
    fontSize: 13,
  },
  postDate: {
    fontSize: 12,
    color: '#888',
    marginBottom: 10,
  },
  actionRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 10,
    marginTop: 5,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 5,
  },
  actionText: {
    color: '#888',
    fontWeight: 'bold',
  },
  actionTextActive: {
    color: '#D4AF37',
  },
  commentSection: {
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 10,
  },
  commentItem: {
    backgroundColor: '#000000',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  commentAuthor: {
    color: '#D4AF37',
    fontWeight: 'bold',
    fontSize: 12,
    marginBottom: 2,
  },
  commentText: {
    color: '#ddd',
    fontSize: 14,
  },
  commentInputRow: {
    flexDirection: 'row',
    marginTop: 5,
    alignItems: 'center',
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D4AF37',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    color: '#D4AF37',
    backgroundColor: '#000000',
  },
  sendCommentButton: {
    marginLeft: 10,
    backgroundColor: '#D4AF37',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
  },
  sendCommentText: {
    color: '#000000',
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#D4AF37',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  fabText: {
    color: '#000000',
    fontSize: 30,
    fontWeight: 'bold',
  },
});

export default PostsScreen;
