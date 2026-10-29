import api from './api';
import { multipartUploadConfig } from '../utils/multipartUpload';

export const getUsers = (search) =>
  api.get('/social/users', { params: search ? { search } : {} });

export const getUserProfile = (userId) => api.get(`/social/profile/${userId}`);

export const followUser = (userId) => api.post(`/social/follow/${userId}`);

export const unfollowUser = (userId) => api.post(`/social/unfollow/${userId}`);

export const getFollowers = (userId, config) =>
  api.get(`/social/${userId}/followers`, config);

export const getFollowing = (userId, config) =>
  api.get(`/social/${userId}/following`, config);

export const updateSocialProfile = (data) => api.put('/social/profile', data);

export const uploadAvatar = (formData) =>
  api.post('/social/profile/avatar', formData, multipartUploadConfig);

export const createGroup = (data) => api.post('/social/groups', data);
export const getGroups = (config) => api.get('/social/groups', config);
export const getGroupDetails = (groupId) => api.get(`/social/groups/${groupId}`);
export const joinGroup = (groupId) => api.post(`/social/groups/${groupId}/join`);
export const leaveGroup = (groupId) => api.post(`/social/groups/${groupId}/leave`);
export const deleteGroup = (groupId) => api.delete(`/social/groups/${groupId}`);
export const removeGroupMember = (groupId, memberId) =>
  api.delete(`/social/groups/${groupId}/members/${memberId}`);
export const approveGroupMember = (groupId, memberId) =>
  api.post(`/social/groups/${groupId}/members/${memberId}/approve`);
export const rejectGroupMember = (groupId, memberId) =>
  api.post(`/social/groups/${groupId}/members/${memberId}/reject`);
export const createGroupPost = (groupId, data) =>
  api.post(`/social/groups/${groupId}/posts`, data);
export const getGroupPosts = (groupId) => api.get(`/social/groups/${groupId}/posts`);
export const syncGroupChat = (groupId, options = {}) =>
  api.post(`/social/groups/${groupId}/sync-chat`, {
    forceRebuild: Boolean(options.forceRebuild),
  });

export default {
  getUsers,
  getUserProfile,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  updateSocialProfile,
  uploadAvatar,
  createGroup,
  getGroups,
  getGroupDetails,
  joinGroup,
  leaveGroup,
  deleteGroup,
  removeGroupMember,
  approveGroupMember,
  rejectGroupMember,
  createGroupPost,
  getGroupPosts,
  syncGroupChat,
};
