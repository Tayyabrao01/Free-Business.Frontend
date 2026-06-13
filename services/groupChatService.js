import { Alert } from 'react-native';
import { syncGroupChat } from './socialApi';
import { ensureChatClientReady } from './streamClientService';
import { getGroupChannelId } from '../utils/streamChannel';
import { getApiErrorMessage } from '../utils/apiError';

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
  try {
    await syncGroupChat(groupId);
  } catch (error) {
    const status = error?.response?.status;
    const msg = getApiErrorMessage(error, t('groups.chatSyncFailed'));
    if (status === 404) {
      Alert.alert(
        t('common.error'),
        `${msg}\n\nBackend chat fix not deployed. Upload backend v2.4.0 and run npm install + pm2 restart.`
      );
    } else {
      Alert.alert(t('common.error'), msg);
    }
    return false;
  }

  const client = await ensureChatClientReady(user, reconnect);
  if (!client) {
    Alert.alert(t('common.error'), t('stream.connectionFailed'));
    return false;
  }

  navigation.navigate('Chat', {
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
  user,
  reconnect,
  groupId,
  groupName,
  memberIds = [],
  video = true,
  t,
}) => {
  try {
    await syncGroupChat(groupId);
  } catch (error) {
    Alert.alert(
      t('common.error'),
      getApiErrorMessage(error, t('groups.chatSyncFailed'))
    );
    return false;
  }

  navigation.navigate('StreamCall', {
    isGroupCall: true,
    groupId: groupId.toString(),
    groupName: groupName || t('groups.groupChat'),
    groupMemberIds: memberIds.map((id) => id.toString()),
    video,
  });
  return true;
};
