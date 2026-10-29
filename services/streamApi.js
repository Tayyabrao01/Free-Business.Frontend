import api from './api';

/** Token is issued for the logged-in user (JWT). userId in body is ignored by the server. */
export const fetchStreamChatToken = (_userId, userName) =>
  api.post('/stream/token', { userName });

export const fetchStreamVideoToken = (_userId, userName) =>
  api.post('/video/token', { userName });

export const syncStreamUser = (userId, userName) =>
  api.post('/stream/sync-user', { userId: userId?.toString(), userName });

/** Server creates DM channel with correct members (avoids permission / rate-limit errors). */
export const ensureDirectMessageChannel = (otherUserId, otherUserName) =>
  api.post('/stream/channel/direct', {
    otherUserId: otherUserId?.toString(),
    otherUserName,
  });

export const ensureChannelJoin = (channelId, channelType, otherUserId) =>
  api.post('/stream/channel/join', {
    channelId,
    channelType: channelType || 'messaging',
    otherUserId: otherUserId?.toString(),
  });

/** Single call: server prepares channel + returns channelId to open in the app. */
export const openChatSession = (payload) =>
  api.post('/stream/chat/open', payload, { timeout: 45000 });

export const rebuildChatSession = (payload) =>
  openChatSession({ ...payload, forceRebuild: true });
