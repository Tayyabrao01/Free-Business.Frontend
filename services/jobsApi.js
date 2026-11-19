import api from './api';

export const listJobs = (params = {}, config = {}) => api.get('/jobs', { params, ...config });
export const getJob = id => api.get(`/jobs/${id}`);
export const createJob = data => api.post('/jobs', data);
export const updateJob = (id, data) => api.put(`/jobs/${id}`, data);
export const deleteJob = id => api.delete(`/jobs/${id}`);
