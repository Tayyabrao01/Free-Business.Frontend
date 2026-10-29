import { Alert } from 'react-native';
import { syncGroupChat } from './socialApi';
import { ensureChatClientReady } from './streamClientService';
import { getGroupChannelId } from '../utils/streamChannel';
import { getApiErrorMessage } from '../utils/apiError';

const getRootNavigation = (navigation) => {
  let nav = navigation;
  while (nav?.getParent?.()) {
    nav = nav.getParent();
  }
  return nav;
};

/**
 * Soft-sync group members into Stream. Never force-rebuilds (that would wipe history).
 */
const softSyncGroupChat = async (groupId) => {
  await syncGroupChat(groupId, { forceRebuild: false });
};

/**
 * Prefer watching an existing channel so message history is preserved.
 */
const warmGroupChannel = async (chatClient, groupId) => {
  const channelId = getGroupChannelId(groupId);
  const channel = chatClient.channel('messaging', channelId);
  try {
    await channel.watch();
    return channel;
  } catch (error) {
    console.warn('warmGroupChannel:', error?.message);
    return null;
  }
};

export const navigateToGroupChat = async ({
  navigation,
  user,
  reconnect,
  groupId,
  groupName,
  memberIds = [],
  isGroupOwner = false,
  t,
}) => {
  const client = await ensureChatClientReady(user, reconnect);
  if (!client) {
    Alert.alert(t('common.error'), t('stream.connectionFailed'));
    return false;
  }

  // Soft membership sync only — never hard-delete / rebuild the channel.
  try {
    await softSyncGroupChat(groupId);
  } catch (error) {
    const status = error?.response?.status;
    const msg = getApiErrorMessage(error, t('groups.chatSyncFailed'));
    // If sync fails but channel already exists, still try to open it.
    const warmed = await warmGroupChannel(client, groupId);
    if (!warmed) {
      if (status === 404) {
        Alert.alert(
          t('common.error'),
          `${msg}\n\nBackend chat fix not deployed. Upload backend v2.7.0 and run npm install + pm2 restart.`
        );
      } else {
        Alert.alert(t('common.error'), msg);
      }
      return false;
    }
  }

  await warmGroupChannel(client, groupId);

  getRootNavigation(navigation).navigate('Chat', {
    channelId: getGroupChannelId(groupId),
    channelType: 'messaging',
    isGroupChat: true,
    isGroupOwner: Boolean(isGroupOwner),
    groupId: groupId.toString(),
    groupName: groupName || t('groups.groupChat'),
    groupMemberIds: memberIds.map((id) => id.toString()),
  });
  return true;
};

export const navigateToGroupCall = async ({
  navigation,
  groupId,
  groupName,
  memberIds = [],
  video = true,
}) => {
  getRootNavigation(navigation).navigate('StreamCall', {
    isGroupCall: true,
    groupId: groupId.toString(),
    groupName: groupName || 'Group',
    groupMemberIds: memberIds.map((id) => id.toString()),
    video,
  });
  return true;
};
