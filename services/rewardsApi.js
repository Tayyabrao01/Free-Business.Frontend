import api from './api';

export const getMyProgress = (config) => api.get('/rewards/my-progress', config);
export const claimReward = (tier) => api.post('/rewards/claim', { tier });
export const getMyClaims = (config) => api.get('/rewards/my-claims', config);
export const getLeaderboard = (config) => api.get('/rewards/leaderboard', config);
export const applyReferral = (referralCode) => api.post('/rewards/referral', { referralCode });
export const getReferralEarnings = () => api.get('/rewards/referral-earnings');

export default {
  getMyProgress,
  claimReward,
  getMyClaims,
  getLeaderboard,
  applyReferral,
  getReferralEarnings,
};
