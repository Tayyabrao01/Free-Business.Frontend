import { StreamChat } from 'stream-chat';
import { getStreamVideoClientClass, isStreamVideoAvailable } from './streamVideoOptional';
import {
  fetchStreamChatToken,
  syncStreamUser,
  openChatSession,
} from './streamApi';
import { mapStreamChatError, delay, isMembersFieldError, isChannelNotFoundError } from '../utils/streamChatErrors';
import { getApiErrorMessage } from '../utils/apiError';

const shouldRebuildChat = (error) => isMembersFieldError(error) || isChannelNotFoundError(error);
import {
  getDirectMessageChannelId,
  getDirectCallId,
  getGroupChannelId,
  getGroupCallId,
  getGroupIdFromChannelId,
  isGroupChannelId,
} from '../utils/streamChannel';
import { resolveMediaUrl } from '../utils/imageUrl';
import { findClientCall } from './callLifecycle';

const CONNECT_TIMEOUT_MS = 12000;
const WATCH_TIMEOUT_MS = 12000;

let chatClientInstance = null;
let videoClientInstance = null;

const waitForVideoConnection = (client, timeoutMs = 20000) =>
  new Promise((resolve, reject) => {
    if (client?.state?.connectedUser?.id) {
      resolve(client);
      return;
    }

    const started = Date.now();
    const interval = setInterval(() => {
      if (client?.state?.connectedUser?.id) {
        clearInterval(interval);
        resolve(client);
      } else if (Date.now() - started > timeoutMs) {
        clearInterval(interval);
        reject(new Error('Video connection timed out'));
      }
    }, 250);
  });

export const getChatClient = () => chatClientInstance;
export const getVideoClient = () => videoClientInstance;

export const isChatClientReady = (expectedUserId) => {
  const expected = expectedUserId?.toString();
  return Boolean(
    chatClientInstance &&
    expected &&
    chatClientInstance.userID === expected
  );
};

const waitForChatConnection = (client, timeoutMs = 15000) =>
  new Promise((resolve, reject) => {
    if (client?.userID) {
      resolve(client);
      return;
    }

    const started = Date.now();
    const interval = setInterval(() => {
      if (client?.userID) {
        clearInterval(interval);
        resolve(client);
      } else if (Date.now() - started > timeoutMs) {
        clearInterval(interval);
        reject(new Error('Chat connection timed out'));
      }
    }, 200);
  });

export const ensureChatClientReady = async (appUser, reconnectFn) => {
  const userId = appUser?._id?.toString();
  if (!userId) {
    return null;
  }

  if (isChatClientReady(userId)) {
    return chatClientInstance;
  }

  if (reconnectFn) {
    await Promise.race([
      reconnectFn(),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Messaging connection timed out')), CONNECT_TIMEOUT_MS);
      }),
    ]).catch((error) => {
      console.warn('Stream reconnect:', error?.message);
    });
  }

  if (isChatClientReady(userId)) {
    return chatClientInstance;
  }

  try {
    await connectStreamClients(appUser);
  } catch (error) {
    console.warn('connectStreamClients:', error?.message);
  }

  return isChatClientReady(userId) ? chatClientInstance : null;
};

export const disconnectStreamClients = async () => {
  try {
    if (chatClientInstance) {
      await chatClientInstance.disconnectUser();
    }
  } catch (error) {
    console.warn('Stream chat disconnect:', error?.message);
  }
  try {
    if (videoClientInstance) {
      await videoClientInstance.disconnectUser();
    }
  } catch (error) {
    console.warn('Stream video disconnect:', error?.message);
  }
  chatClientInstance = null;
  videoClientInstance = null;
};

export const connectStreamClients = async (appUser) => {
  if (!appUser?._id) {
    throw new Error('User is required to connect Stream');
  }

  const userId = appUser._id.toString();

  if (isChatClientReady(userId)) {
    if (!isVideoClientReady(userId)) {
      const StreamVideoClient = getStreamVideoClientClass();
      if (StreamVideoClient && isStreamVideoAvailable()) {
        try {
          const streamUser = {
            id: userId,
            name: appUser.name || 'User',
            image: resolveMediaUrl(appUser.avatar || appUser.profileImage) || undefined,
          };
          const { data } = await fetchStreamChatToken(userId, appUser.name || 'User');
          if (data?.token && data?.apiKey) {
            videoClientInstance = StreamVideoClient.getOrCreateInstance({
              apiKey: data.apiKey,
              user: streamUser,
              token: data.token,
            });
            if (!videoClientInstance?.state?.connectedUser?.id) {
              await videoClientInstance.connectUser(streamUser, data.token);
            }
            await waitForVideoConnection(videoClientInstance);
          }
        } catch (videoError) {
          console.warn('Stream video reconnect:', videoError?.message);
          videoClientInstance = null;
        }
      }
    }
    return {
      chatClient: chatClientInstance,
      videoClient: videoClientInstance,
      userId,
    };
  }

  const differentUser =
    chatClientInstance?.userID && chatClientInstance.userID !== userId;
  if (differentUser) {
    await disconnectStreamClients();
  }

  if (chatClientInstance?.userID === userId) {
    await waitForChatConnection(chatClientInstance);
    if (!isVideoClientReady(userId)) {
      const StreamVideoClient = getStreamVideoClientClass();
      if (StreamVideoClient && isStreamVideoAvailable()) {
        try {
          const streamUser = {
            id: userId,
            name: appUser.name || 'User',
            image: resolveMediaUrl(appUser.avatar || appUser.profileImage) || undefined,
          };
          const { data } = await fetchStreamChatToken(userId, appUser.name || 'User');
          if (data?.token && data?.apiKey) {
            videoClientInstance = StreamVideoClient.getOrCreateInstance({
              apiKey: data.apiKey,
              user: streamUser,
              token: data.token,
            });
            if (!videoClientInstance?.state?.connectedUser?.id) {
              await videoClientInstance.connectUser(streamUser, data.token);
            }
            await waitForVideoConnection(videoClientInstance);
          }
        } catch (videoError) {
          console.warn('Stream video reconnect:', videoError?.message);
          videoClientInstance = null;
        }
      }
    }
    return {
      chatClient: chatClientInstance,
      videoClient: videoClientInstance,
      userId,
    };
  }

  const userName = appUser.name || 'User';
  const { data } = await fetchStreamChatToken(userId, userName);

  if (!data?.token || !data?.apiKey) {
    throw new Error(data?.message || 'Invalid Stream token response from server');
  }

  const token = data.token;
  const apiKey = data.apiKey;
  const avatar = resolveMediaUrl(appUser.avatar || appUser.profileImage);

  const streamUser = {
    id: userId,
    name: appUser.name || 'User',
    image: avatar || undefined,
  };

  chatClientInstance = StreamChat.getInstance(apiKey);
  await chatClientInstance.connectUser(streamUser, token);
  await waitForChatConnection(chatClientInstance);

  const StreamVideoClient = getStreamVideoClientClass();
  if (StreamVideoClient && isStreamVideoAvailable()) {
    try {
      videoClientInstance = StreamVideoClient.getOrCreateInstance({
        apiKey,
        user: streamUser,
        token,
      });
      if (!videoClientInstance?.state?.connectedUser?.id) {
        await videoClientInstance.connectUser(streamUser, token);
      }
      await waitForVideoConnection(videoClientInstance);
    } catch (videoError) {
      console.warn('Stream video client unavailable:', videoError?.message);
      videoClientInstance = null;
    }
  }

  return {
    chatClient: chatClientInstance,
    videoClient: videoClientInstance,
    userId,
  };
};

export const isVideoClientReady = (expectedUserId) => {
  const expected = expectedUserId?.toString();
  return Boolean(
    videoClientInstance?.state?.connectedUser?.id &&
    expected &&
    videoClientInstance.state.connectedUser.id === expected
  );
};

export const ensureVideoClientReady = async (appUser, reconnectFn) => {
  const userId = appUser?._id?.toString();
  if (!userId) {
    return null;
  }

  if (isVideoClientReady(userId)) {
    return videoClientInstance;
  }

  if (reconnectFn) {
    await reconnectFn();
  }

  if (isVideoClientReady(userId)) {
    return videoClientInstance;
  }

  await connectStreamClients(appUser);
  return isVideoClientReady(userId) ? videoClientInstance : null;
};

export const ensureStreamUserExists = async (userId, userName) => {
  if (!userId) {
    return;
  }
  try {
    await syncStreamUser(userId, userName || 'User');
  } catch (error) {
    console.warn('Stream user sync failed:', error?.message);
  }
};

const withTimeout = (promise, ms, message) =>
  Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms);
    }),
  ]);

const subscribeToChannel = async (chatClient, channelType, channelId) => {
  const channel = chatClient.channel(channelType, channelId);
  await withTimeout(
    channel.query({ watch: true, state: true }),
    WATCH_TIMEOUT_MS,
    'Chat load timed out. Tap Retry.'
  );
  return channel;
};

export const loadChatChannel = async (chatClient, appUser, reconnectFn, params = {}) => {
  if (!chatClient?.userID) {
    throw new Error('Chat client not connected');
  }

  const userId = appUser._id.toString();
  const {
    otherUserId,
    otherUserName,
    groupId,
    channelId,
    channelType = 'messaging',
    forceRebuild = false,
  } = params;

  let openPayload = { channelType };
  if (groupId) {
    openPayload = { groupId: groupId.toString(), channelType };
  } else if (otherUserId) {
    openPayload = {
      otherUserId: otherUserId.toString(),
      otherUserName,
      channelType,
    };
  } else if (channelId) {
    openPayload = {
      channelId,
      channelType,
      otherUserId: otherUserId?.toString(),
    };
  } else {
    throw new Error('Missing chat target');
  }

  const knownChannelId =
    channelId ||
    (groupId ? getGroupChannelId(groupId) : null) ||
    (otherUserId ? getDirectMessageChannelId(userId, otherUserId) : null);

  // Never auto-rebuild group channels — that hard-deletes message history.
  const allowRebuild = Boolean(forceRebuild) && !groupId && !isGroupChannelId(knownChannelId);

  if (knownChannelId && !allowRebuild) {
    try {
      return await subscribeToChannel(chatClient, channelType, knownChannelId);
    } catch (watchError) {
      // Fall through to soft open (membership sync) only — still no forceRebuild for groups.
      if (!shouldRebuildChat(watchError) && !isChannelNotFoundError(watchError)) {
        throw new Error(mapStreamChatError(watchError));
      }
    }
  }

  let openData;
  try {
    const response = await openChatSession({
      ...openPayload,
      forceRebuild: allowRebuild,
    });
    openData = response.data;
  } catch (error) {
    const status = error?.response?.status;
    if (status === 404) {
      throw new Error('Chat API missing. Deploy backend v2.7.0 and restart server.');
    }
    throw new Error(getApiErrorMessage(error, 'Could not prepare chat'));
  }

  const resolvedType = openData?.channelType || channelType;
  const resolvedId = openData?.channelId;
  if (!resolvedId) {
    throw new Error('Server did not return a chat channel id');
  }

  await delay(100);

  try {
    return await subscribeToChannel(chatClient, resolvedType, resolvedId);
  } catch (error) {
    if (shouldRebuildChat(error)) {
      await delay(800);
      try {
        return await subscribeToChannel(chatClient, resolvedType, resolvedId);
      } catch (retryError) {
        throw new Error(mapStreamChatError(retryError));
      }
    }
    throw new Error(mapStreamChatError(error));
  }
};

export const watchExistingChannel = async (
  chatClient,
  channelType,
  channelId,
  currentUserId,
  otherUserId,
  otherUserName,
  groupId
) =>
  loadChatChannel(
    chatClient,
    { _id: currentUserId || chatClient.userID },
    null,
    { channelId, channelType, otherUserId, otherUserName, groupId }
  );

export const openDirectMessageChannel = async (
  chatClient,
  currentUserId,
  otherUserId,
  otherUserName
) =>
  loadChatChannel(chatClient, { _id: currentUserId }, null, {
    otherUserId,
    otherUserName,
  });

export const openGroupChannel = async (chatClient, groupId) =>
  loadChatChannel(chatClient, { _id: chatClient.userID }, null, { groupId });

const buildVideoCallMembers = (userIds, adminUserId) =>
  userIds.map((user_id) => ({
    user_id: user_id.toString(),
    role: user_id.toString() === adminUserId?.toString() ? 'admin' : 'user',
  }));

export const joinGroupCall = async (
  videoClient,
  currentUserId,
  groupId,
  groupName,
  memberIds,
  videoEnabled
) => {
  if (!videoClient) {
    throw new Error('Video client not connected');
  }

  const uniqueMembers = Array.from(
    new Set(
      [...(memberIds || []), currentUserId.toString()]
        .filter(Boolean)
        .map((id) => id.toString())
    )
  );

  await Promise.all(
    uniqueMembers
      .filter((id) => id !== currentUserId.toString())
      .map((id) => ensureStreamUserExists(id))
  );

  const callId = getGroupCallId(groupId);
  const call = videoClient.call('default', callId);
  const streamMembers = buildVideoCallMembers(uniqueMembers, currentUserId);

  const createPayload = {
    ring: true,
    video: videoEnabled,
    data: {
      custom: {
        groupId: groupId.toString(),
        groupName: groupName || 'Group',
        isGroupCall: true,
        videoEnabled: Boolean(videoEnabled),
      },
      members: streamMembers,
    },
  };

  try {
    await withTimeout(call.create(createPayload), 20000, 'Group call setup timed out');
  } catch (createError) {
    const exists = String(createError?.message || '')
      .toLowerCase()
      .includes('already exists');
    if (!exists) {
      await withTimeout(
        call.getOrCreate(createPayload),
        20000,
        'Group call setup timed out'
      );
    } else {
      await withTimeout(call.get(), 15000, 'Could not load group call');
    }
    try {
      await withTimeout(call.ring(), 10000, 'Could not ring group members');
    } catch (ringError) {
      console.warn('group call.ring:', ringError?.message);
    }
  }

  let lastJoinError;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await withTimeout(call.join({ create: true }), 20000, 'Could not join group call');
      lastJoinError = null;
      break;
    } catch (joinError) {
      lastJoinError = joinError;
      if (attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
      }
    }
  }
  if (lastJoinError) {
    throw lastJoinError;
  }

  if (!videoEnabled) {
    try {
      await call.camera.disable();
    } catch (cameraError) {
      console.warn('Disable camera:', cameraError?.message);
    }
  }

  // Audio routing is applied once the active call UI mounts (avoids echo).
  return call;
};

/** Load incoming call without joining — Accept button calls join(). */
export const prepareIncomingCall = async (videoClient, callCid) => {
  if (!videoClient || !callCid) {
    throw new Error('Missing call information');
  }

  const existing = findClientCall(videoClient, callCid);
  if (existing) {
    return existing;
  }

  const separator = callCid.indexOf(':');
  const type = separator >= 0 ? callCid.slice(0, separator) : 'default';
  const id = separator >= 0 ? callCid.slice(separator + 1) : callCid;

  const call = videoClient.call(type, id);
  await withTimeout(call.get(), 20000, 'Could not load incoming call');
  return call;
};

export const attachToIncomingCall = prepareIncomingCall;

export const joinDirectCall = async (
  videoClient,
  currentUserId,
  otherUserId,
  otherUserName,
  videoEnabled
) => {
  if (!videoClient) {
    throw new Error('Video client not connected');
  }

  await ensureStreamUserExists(otherUserId, otherUserName);

  const callId = getDirectCallId(currentUserId, otherUserId);
  const call = videoClient.call('default', callId);
  const streamMembers = buildVideoCallMembers(
    [currentUserId.toString(), otherUserId.toString()],
    currentUserId
  );

  const createPayload = {
    ring: true,
    video: videoEnabled,
    data: {
      custom: {
        videoEnabled: Boolean(videoEnabled),
      },
      members: streamMembers,
    },
  };

  try {
    await withTimeout(call.create(createPayload), 20000, 'Call setup timed out');
  } catch (createError) {
    const exists = String(createError?.message || '')
      .toLowerCase()
      .includes('already exists');
    if (!exists) {
      await withTimeout(
        call.getOrCreate(createPayload),
        20000,
        'Call setup timed out'
      );
    } else {
      await withTimeout(call.get(), 15000, 'Could not load call');
    }
    try {
      await withTimeout(call.ring(), 10000, 'Could not ring callee');
    } catch (ringError) {
      console.warn('call.ring:', ringError?.message);
    }
  }

  let lastJoinError;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await withTimeout(call.join({ create: true }), 20000, 'Could not join call');
      lastJoinError = null;
      break;
    } catch (joinError) {
      lastJoinError = joinError;
      if (attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
      }
    }
  }
  if (lastJoinError) {
    throw lastJoinError;
  }

  if (!videoEnabled) {
    try {
      await call.camera.disable();
    } catch (cameraError) {
      console.warn('Disable camera:', cameraError?.message);
    }
  }

  // Audio routing is applied once the active call UI mounts (avoids echo).
  return call;
};
