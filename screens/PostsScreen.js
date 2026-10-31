import React, { useState, useCallback } from 'react';
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
  RefreshControl,
  StatusBar,
  Share,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import api, { isAbortError } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../hooks/useTranslation';
import Avatar from '../components/Avatar';
import { resolveMediaUrl } from '../utils/imageUrl';
import { getApiErrorMessage } from '../utils/apiError';
import { downloadMedia, detectMediaType } from '../services/MediaService';
import MediaViewerModal from '../components/MediaViewerModal';

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

const ExpandableText = ({ text, maxLength = 160 }) => {
  const [expanded, setExpanded] = useState(false);

  if (!text) return null;

  const isLong = text.length > maxLength || text.split('\n').length > 3;

  const renderFormattedTokens = (rawText) => {
    const tokens = rawText.split(/(\s+)/);
    return tokens.map((token, idx) => {
      if (token.startsWith('#') && token.length > 1) {
        return (
          <Text key={idx} style={styles.hashtagText}>
            {token}
          </Text>
        );
      }
      return token;
    });
  };

  if (!isLong) {
    return (
      <View style={styles.contentWrap}>
        <Text style={styles.postContent}>{renderFormattedTokens(text)}</Text>
      </View>
    );
  }

  const truncated = text.slice(0, maxLength).trim();

  return (
    <View style={styles.contentWrap}>
      <Text style={styles.postContent}>
        {expanded ? renderFormattedTokens(text) : renderFormattedTokens(truncated)}
        {!expanded ? '... ' : ' '}
        <Text
          style={styles.readMoreText}
          onPress={() => setExpanded(!expanded)}
        >
          {expanded ? 'Show less' : 'Read more'}
        </Text>
      </Text>
    </View>
  );
};

const ExpandableComment = ({ text, maxLength = 95 }) => {
  const [expanded, setExpanded] = useState(false);

  if (!text) return null;
  const isLong = text.length > maxLength;

  if (!isLong) {
    return <Text style={styles.commentText}>{text}</Text>;
  }

  return (
    <Text style={styles.commentText}>
      {expanded ? text : `${text.slice(0, maxLength).trim()}... `}
      <Text
        style={styles.commentReadMore}
        onPress={() => setExpanded(!expanded)}
      >
        {expanded ? 'Less' : 'More'}
      </Text>
    </Text>
  );
};

const PostsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { t } = useTranslation();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newPostText, setNewPostText] = useState('');
  const [creatingPost, setCreatingPost] = useState(false);
  const [activeCommentPostId, setActiveCommentPostId] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [downloadingPostId, setDownloadingPostId] = useState(null);
  const [viewerUri, setViewerUri] = useState(null);

  const fetchPosts = useCallback(async (signal, showLoader = true) => {
    if (showLoader) {
      setLoading(true);
    }
    try {
      const response = await api.get('/posts', { signal });
      setPosts(response.data || []);
    } catch (error) {
      if (!isAbortError(error)) {
        console.error('Error fetching posts:', error);
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController();
      fetchPosts(controller.signal, posts.length === 0);
      return () => controller.abort();
    }, [fetchPosts, posts.length])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchPosts(null, false);
  };

  const createPost = async () => {
    if (!newPostText.trim()) {
      Alert.alert(t('common.error'), t('posts.enterContent'));
      return;
    }

    setCreatingPost(true);
    try {
      const response = await api.post('/posts', { content: newPostText.trim() });
      setPosts([response.data, ...posts]);
      setNewPostText('');
    } catch (error) {
      Alert.alert(t('common.error'), t('posts.createFailed'));
    } finally {
      setCreatingPost(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      const post = posts.find((p) => p._id === postId);
      const isLiked =
        post.likes &&
        post.likes.some(
          (id) => id === user?._id || id?._id === user?._id || String(id) === String(user?._id)
        );

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

    setSubmittingComment(true);
    try {
      const response = await api.post(`/posts/${postId}/comment`, { text: commentText.trim() });
      updatePostInState(postId, { comments: response.data.comments });
      setCommentText('');
    } catch (error) {
      Alert.alert(t('common.error'), t('posts.commentFailed'));
    } finally {
      setSubmittingComment(false);
    }
  };

  const updatePostInState = (postId, updatedFields) => {
    setPosts((prevPosts) =>
      prevPosts.map((p) => (p._id === postId ? { ...p, ...updatedFields } : p))
    );
  };

  const handleShare = async (post) => {
    try {
      const shareMessage = `${post.author?.name || 'Free Business Partner'}: "${post.content}"\n\nShared via Free Business App`;
      await Share.share({
        message: shareMessage,
      });
    } catch (err) {
      console.log('Share error:', err);
    }
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

  const isPostAuthor = (post) => {
    const authorId = post.author?._id || post.author;
    return authorId && user?._id && String(authorId) === String(user._id);
  };

  const confirmDeletePost = (post) => {
    Alert.alert(t('posts.deletePostTitle'), t('posts.deletePostConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('posts.deletePost'),
        style: 'destructive',
        onPress: () => handleDeletePost(post._id),
      },
    ]);
  };

  const handleDeletePost = async (postId) => {
    try {
      await api.delete(`/posts/${postId}`);
      setPosts((prev) => prev.filter((p) => p._id !== postId));
      Alert.alert(t('common.success'), t('posts.postDeleted'));
    } catch (error) {
      Alert.alert(t('common.error'), getApiErrorMessage(error, t('posts.deleteFailed')));
    }
  };

  const renderPost = ({ item }) => {
    if (!item) return null;

    const likes = Array.isArray(item.likes) ? item.likes : [];
    const isLiked = likes.some(
      (id) => id === user?._id || id?._id === user?._id || String(id) === String(user?._id)
    );
    const mediaUrl = resolveMediaUrl(item.imageUrl);
    const mediaType = mediaUrl ? detectMediaType(mediaUrl) : null;
    const isDownloading = downloadingPostId === item._id;
    const timeAgo = formatRelativeTime(item.createdAt);

    const authorId = item.author?._id || item.author;
    const authorName = item.author?.name || t('common.user');
    const authorAvatar = item.author?.avatar || item.author?.profileImage;

    return (
      <View style={styles.postCard}>
        {/* Post Header */}
        <View style={styles.postHeader}>
          <TouchableOpacity
            style={styles.authorRow}
            activeOpacity={0.8}
            onPress={() => {
              if (authorId) {
                navigation.navigate('UserProfile', { userId: authorId.toString() });
              }
            }}
            disabled={!authorId}
          >
            <Avatar uri={authorAvatar} name={authorName} size={42} />
            <View style={styles.authorMeta}>
              <View style={styles.nameRow}>
                <Text style={styles.postAuthor} numberOfLines={1}>
                  {authorName}
                </Text>
                <Ionicons
                  name="shield-checkmark"
                  size={14}
                  color="#D4AF37"
                  style={styles.verifiedIcon}
                />
              </View>
              <Text style={styles.postDate}>{timeAgo || 'Recently'}</Text>
            </View>
          </TouchableOpacity>

          {isPostAuthor(item) ? (
            <TouchableOpacity
              onPress={() => confirmDeletePost(item)}
              style={styles.deleteButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="trash-outline" size={17} color="#FF6B6B" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Post Body Content with Expandable Read More & Hashtags */}
        <ExpandableText text={item.content} maxLength={160} />

        {/* Media Container */}
        {mediaUrl ? (
          <View style={styles.mediaContainer}>
            <TouchableOpacity
              activeOpacity={0.92}
              onPress={() => setViewerUri(mediaUrl)}
            >
              {mediaType === 'video' ? (
                <View style={styles.videoPlaceholder}>
                  <Ionicons name="play-circle" size={54} color="#D4AF37" />
                  <Text style={styles.videoPlaceholderText}>{t('posts.tapToView')}</Text>
                </View>
              ) : (
                <View style={styles.imageWrapper}>
                  <Image source={{ uri: mediaUrl }} style={styles.postImage} />
                  <View style={styles.expandBadge}>
                    <Ionicons name="scan-outline" size={13} color="#FFFFFF" />
                    <Text style={styles.expandBadgeText}>Tap to zoom</Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.downloadButton}
              onPress={() => handleDownloadMedia(item)}
              disabled={isDownloading}
              activeOpacity={0.8}
            >
              {isDownloading ? (
                <ActivityIndicator size="small" color="#0A0A0E" />
              ) : (
                <View style={styles.downloadInner}>
                  <Ionicons name="cloud-download-outline" size={15} color="#0A0A0E" />
                  <Text style={styles.downloadButtonText}>Save</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Modern Action Bar */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleLike(item._id)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={19}
              color={isLiked ? '#D4AF37' : '#8A8A96'}
            />
            <Text style={[styles.actionText, isLiked && styles.actionTextActive]}>
              {likes.length > 0 ? likes.length : ''} {t('posts.like')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => toggleCommentSection(item._id)}
            activeOpacity={0.7}
          >
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={18}
              color={activeCommentPostId === item._id ? '#D4AF37' : '#8A8A96'}
            />
            <Text
              style={[
                styles.actionText,
                activeCommentPostId === item._id && styles.actionTextActive,
              ]}
            >
              {item.comments?.length > 0 ? item.comments.length : ''}{' '}
              {t('posts.comment')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleShare(item)}
            activeOpacity={0.7}
          >
            <Ionicons name="share-social-outline" size={18} color="#8A8A96" />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
        </View>

        {/* Comment Thread Drawer */}
        {activeCommentPostId === item._id && (
          <View style={styles.commentSection}>
            {item.comments && item.comments.length > 0 ? (
              item.comments.map((comment, index) => (
                <View key={index} style={styles.commentItem}>
                  <View style={styles.commentAvatarMini}>
                    <Text style={styles.commentInitial}>
                      {(comment.user?.name || 'U').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.commentBubble}>
                    <Text style={styles.commentAuthor} numberOfLines={1}>
                      {comment.user?.name || t('common.user')}
                    </Text>
                    <ExpandableComment text={comment.text} maxLength={95} />
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.noCommentsText}>
                No comments yet. Start the conversation!
              </Text>
            )}

            <View style={styles.commentInputRow}>
              <TextInput
                style={styles.commentInput}
                placeholder={t('posts.writeComment')}
                placeholderTextColor="#666672"
                value={commentText}
                onChangeText={setCommentText}
              />
              <TouchableOpacity
                style={[
                  styles.sendCommentButton,
                  !commentText.trim() && styles.sendCommentButtonDisabled,
                ]}
                onPress={() => handleComment(item._id)}
                disabled={submittingComment || !commentText.trim()}
              >
                {submittingComment ? (
                  <ActivityIndicator size="small" color="#0A0A0E" />
                ) : (
                  <Ionicons name="send" size={16} color="#0A0A0E" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  // Header with Top Luxury Bar & Interactive Post Composer
  const listHeader = (
    <View style={styles.headerContainer}>
      {/* Top Banner */}
      <View style={styles.topFeedBar}>
        <View>
          <View style={styles.feedStatusRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.feedStatusText}>BUSINESS COMMUNITY</Text>
          </View>
          <Text style={styles.feedTitle}>Market Updates & Deals</Text>
        </View>
        <TouchableOpacity
          style={styles.addMediaPostBtn}
          onPress={() => navigation.navigate('AddPost')}
          activeOpacity={0.8}
        >
          <Ionicons name="image-outline" size={18} color="#D4AF37" />
          <Text style={styles.addMediaPostBtnText}>Add Media</Text>
        </TouchableOpacity>
      </View>

      {/* Interactive Quick Composer */}
      <View style={styles.composerCard}>
        <View style={styles.composerTopRow}>
          <Avatar
            uri={user?.profileImage || user?.avatar}
            name={user?.name}
            size={38}
          />
          <TextInput
            style={styles.composerInput}
            placeholder="Share a property update, deal, or market insight..."
            placeholderTextColor="#686875"
            value={newPostText}
            onChangeText={setNewPostText}
            multiline
          />
        </View>

        <View style={styles.composerBottomRow}>
          <TouchableOpacity
            style={styles.composerActionChip}
            onPress={() => navigation.navigate('AddPost')}
          >
            <Ionicons name="camera-outline" size={16} color="#D4AF37" />
            <Text style={styles.composerActionText}>Photo/Video</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.composerActionChip}
            onPress={() => navigation.navigate('AddProperty')}
          >
            <Ionicons name="business-outline" size={16} color="#D4AF37" />
            <Text style={styles.composerActionText}>List Property</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.composerSubmitBtn,
              !newPostText.trim() && styles.composerSubmitBtnDisabled,
            ]}
            onPress={createPost}
            disabled={creatingPost || !newPostText.trim()}
            activeOpacity={0.8}
          >
            {creatingPost ? (
              <ActivityIndicator size="small" color="#0A0A0E" />
            ) : (
              <Text style={styles.composerSubmitText}>Post</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0E" />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#D4AF37" />
          <Text style={styles.loadingText}>Loading community feed...</Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={(item, index) => item._id?.toString() || `post-${index}`}
          contentContainerStyle={styles.list}
          ListHeaderComponent={listHeader}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#D4AF37"
              colors={['#D4AF37']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="chatbubbles-outline" size={48} color="#D4AF37" />
              <Text style={styles.emptyTitle}>No posts yet</Text>
              <Text style={styles.emptySubtitle}>
                Be the first to share a property deal, society update, or question!
              </Text>
            </View>
          }
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('AddPost')}
      >
        <Ionicons name="add" size={28} color="#0A0A0E" />
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
    backgroundColor: '#0A0A0E',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0A0E',
  },
  loadingText: {
    color: '#8A8A96',
    fontSize: 13,
    marginTop: 10,
  },
  list: {
    paddingBottom: 85,
  },

  /* Header & Composer */
  headerContainer: {
    marginBottom: 8,
  },
  topFeedBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: '#0A0A0E',
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A22',
  },
  feedStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4ADE80',
    marginRight: 6,
  },
  feedStatusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D4AF37',
    letterSpacing: 0.6,
  },
  feedTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  addMediaPostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16161E',
    borderWidth: 1,
    borderColor: '#D4AF3750',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  addMediaPostBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D4AF37',
    marginLeft: 6,
  },

  /* Quick Composer */
  composerCard: {
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 8,
    backgroundColor: '#141419',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#262632',
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  composerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  composerInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#FFFFFF',
    minHeight: 48,
    maxHeight: 120,
    textAlignVertical: 'top',
    paddingTop: 6,
  },
  composerBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#202028',
    paddingTop: 10,
    marginTop: 8,
  },
  composerActionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C24',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  composerActionText: {
    fontSize: 11,
    color: '#C0C0C8',
    fontWeight: '600',
    marginLeft: 5,
  },
  composerSubmitBtn: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 8,
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
    backgroundColor: '#141419',
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#242430',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  authorMeta: {
    marginLeft: 12,
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    marginRight: 6,
  },
  postAuthor: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.1,
    flexShrink: 1,
  },
  verifiedIcon: {
    marginLeft: 5,
  },
  postDate: {
    fontSize: 11,
    color: '#7A7A88',
    marginTop: 2,
  },
  deleteButton: {
    padding: 4,
  },
  contentWrap: {
    marginBottom: 12,
  },
  postContent: {
    fontSize: 14.5,
    color: '#E2E2EA',
    lineHeight: 21,
  },
  readMoreText: {
    color: '#D4AF37',
    fontWeight: '700',
    fontSize: 14,
  },
  hashtagText: {
    color: '#E0B548',
    fontWeight: '600',
  },
  commentReadMore: {
    color: '#D4AF37',
    fontWeight: '700',
    fontSize: 12,
  },

  /* Media Display */
  mediaContainer: {
    marginBottom: 12,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#0D0D12',
    borderWidth: 1,
    borderColor: '#20202A',
  },
  imageWrapper: {
    position: 'relative',
  },
  expandBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 10, 14, 0.72)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  expandBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  postImage: {
    width: '100%',
    height: 220,
    resizeMode: 'cover',
  },
  videoPlaceholder: {
    width: '100%',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121218',
  },
  videoPlaceholderText: {
    color: '#D4AF37',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 8,
  },
  downloadButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: '#D4AF37',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  downloadInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  downloadButtonText: {
    color: '#0A0A0E',
    fontWeight: '700',
    fontSize: 11,
    marginLeft: 4,
  },

  /* Actions Bar */
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#202028',
    paddingTop: 12,
    marginTop: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  actionText: {
    color: '#8A8A96',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  actionTextActive: {
    color: '#D4AF37',
    fontWeight: '700',
  },

  /* Comments Drawer */
  commentSection: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#202028',
    paddingTop: 12,
  },
  commentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  commentAvatarMini: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D4AF37',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginTop: 2,
  },
  commentInitial: {
    color: '#0A0A0E',
    fontSize: 12,
    fontWeight: '800',
  },
  commentBubble: {
    flex: 1,
    backgroundColor: '#0D0D12',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E1E26',
  },
  commentAuthor: {
    color: '#D4AF37',
    fontWeight: '700',
    fontSize: 11,
    marginBottom: 2,
  },
  commentText: {
    color: '#D8D8E0',
    fontSize: 13,
    lineHeight: 18,
  },
  noCommentsText: {
    fontSize: 12,
    color: '#686875',
    textAlign: 'center',
    marginVertical: 8,
  },
  commentInputRow: {
    flexDirection: 'row',
    marginTop: 8,
    alignItems: 'center',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#0D0D12',
    borderWidth: 1,
    borderColor: '#262632',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    color: '#FFFFFF',
    fontSize: 13,
  },
  sendCommentButton: {
    marginLeft: 8,
    backgroundColor: '#D4AF37',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendCommentButtonDisabled: {
    opacity: 0.4,
  },

  /* Empty State */
  emptyWrap: {
    paddingVertical: 50,
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#7A7A88',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },

  /* Floating Action Button */
  fab: {
    position: 'absolute',
    bottom: 22,
    right: 20,
    backgroundColor: '#D4AF37',
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
});

export default PostsScreen;
