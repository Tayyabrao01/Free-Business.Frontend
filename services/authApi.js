import api from './api';

export const forgotPassword = (email) =>
  api.post('/auth/forgot-password', { email });

export const resetPassword = (email, code, newPassword) =>
  api.post('/auth/reset-password', { email, code, newPassword });

export const changePassword = (currentPassword, newPassword) =>
  api.put('/auth/change-password', { currentPassword, newPassword });

export const sendRegisterOtp = (payload) =>
  api.post('/otp/send-otp', {
    email: payload.email,
    purpose: 'register',
    payload,
  });

export const resendRegisterOtp = (payload) =>
  api.post('/otp/resend-otp', {
    email: payload.email,
    purpose: 'register',
    payload,
  });

export const sendOtp = (email, purpose = 'verification', payload) =>
  api.post('/otp/send-otp', { email, purpose, payload });

export const verifyOtp = (email, otp, purpose = 'verification') =>
  api.post('/otp/verify-otp', { email, otp, purpose });

export const resendOtp = (email, purpose = 'verification', payload) =>
  api.post('/otp/resend-otp', { email, purpose, payload });

export const verifyRegisterOtp = (email, code) =>
  api.post('/auth/register/verify', { email, code });

export default { forgotPassword, resetPassword, changePassword, sendRegisterOtp, verifyRegisterOtp };
