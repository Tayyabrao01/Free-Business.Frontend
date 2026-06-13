import api from './api';

export const getAdminStats = () => api.get('/admin/stats');
export const getAdminUsers = () => api.get('/admin/users');
export const getAdminActivities = (limit = 50) =>
  api.get('/admin/activities', { params: { limit } });
export const deleteAdminUser = (userId) => api.delete(`/admin/users/${userId}`);
export const deleteAdminPost = (postId) => api.delete(`/admin/posts/${postId}`);
