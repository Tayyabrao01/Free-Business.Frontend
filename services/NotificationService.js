import { Platform, AppState } from 'react-native';
import notifee, {
  AndroidImportance,
  AndroidCategory,
  EventType,
} from '@notifee/react-native';
import {
  createNotificationChannels,
  displayIncomingCallNotification as displayCallNotif,
  displayRemotePushNotification,
  getFcmToken,
  isFirebaseConfigured,
  registerPushBackgroundHandler,
  registerPushForegroundHandler,
  requestNotificationPermission,
  subscribeToTokenRefresh,
} from './pushNotifications';
import { registerStreamPushDevices } from './streamPushRegistration';
import { navigate, navigationRef } from '../navigation/navigationRef';
import { getGroupIdFromChannelId, isGroupChannelId } from '../utils/streamChannel';

const INCOMING_CALL_NOTIF_ID = 'incoming_call';

export {
  createNotificationChannels,
  getFcmToken,
  isFirebaseConfigured,
  registerPushBackgroundHandler,
  registerPushForegroundHandler,
  requestNotificationPermission,
  subscribeToTokenRefresh,
  displayRemotePushNotification,
};

export const displayIncomingCallNotification = async (options) => {
  await createNotificationChannels();
  return displayCallNotif(options);
};

export const cancelIncomingCallNotification = async () => {
  try {
    await notifee.cancelNotification(INCOMING_CALL_NOTIF_ID);
  } catch (error) {
    console.warn('cancelIncomingCallNotification:', error?.message);
  }
};

const openFromNotificationData = (data = {}) => {
  if (!navigationRef.isReady()) {
    return false;
  }

  const type = String(data.type || data.notification_type || '').toLowerCase();
  const callCid = data.call_cid || data.callCid || data.incomingCallCid;
  const isCall =
    type.includes('call') ||
    type.includes('ring') ||
    Boolean(callCid);

  if (isCall && callCid) {
    navigate('StreamCall', {
      incomingCallCid: callCid,
      otherUserId: data.otherUserId || data.caller_id,
      otherUserName: data.caller_name || data.sender_name || data.name || 'User',
      isGroupCall: data.isGroupCall === true || data.isGroupCall === 'true',
      groupId: data.groupId,
      groupName: data.groupName || 'Group',
      video: data.video !== 'false' && data.video !== false,
    });
    return true;
  }

  const channelId = data.channelId || data.channel_id;
  if (channelId) {
    const isGroup =
      data.isGroupChat === 'true' ||
      data.isGroupChat === true ||
      isGroupChannelId(channelId);
    navigate('Chat', {
      channelId,
      channelType: data.channelType || data.channel_type || 'messaging',
      isGroupChat: isGroup,
      groupId: data.groupId || (isGroup ? getGroupIdFromChannelId(channelId) : undefined),
      groupName: data.groupName || data.channel_name,
      otherUserId: data.otherUserId || data.sender_id,
      otherUserName: data.otherUserName || data.sender_name,
    });
    return true;
  }

  return false;
};

/**
 * Handle Notifee + FCM notification taps → Chat / StreamCall.
 */
export const attachNotificationOpenHandlers = () => {
  const unsubscribers = [];

  try {
    unsubscribers.push(
      notifee.onForegroundEvent(({ type, detail }) => {
        if (type === EventType.PRESS || type === EventType.ACTION_PRESS) {
          openFromNotificationData(detail?.notification?.data || {});
        }
      })
    );
  } catch (error) {
    console.warn('notifee onForegroundEvent:', error?.message);
  }

  try {
    notifee.onBackgroundEvent(async ({ type, detail }) => {
      if (type === EventType.PRESS || type === EventType.ACTION_PRESS) {
        openFromNotificationData(detail?.notification?.data || {});
      }
    });
  } catch (error) {
    console.warn('notifee onBackgroundEvent:', error?.message);
  }

  try {
    if (isFirebaseConfigured()) {
      const messaging = require('@react-native-firebase/messaging').default;
      unsubscribers.push(
        messaging().onNotificationOpenedApp((remoteMessage) => {
          openFromNotificationData(remoteMessage?.data || {});
        })
      );

      messaging()
        .getInitialNotification()
        .then((remoteMessage) => {
          if (remoteMessage?.data) {
            setTimeout(() => openFromNotificationData(remoteMessage.data), 800);
          }
        })
        .catch(() => {});
    }
  } catch (error) {
    console.warn('FCM open handlers:', error?.message);
  }

  try {
    notifee
      .getInitialNotification()
      .then((initial) => {
        if (initial?.notification?.data) {
          setTimeout(
            () => openFromNotificationData(initial.notification.data),
            800
          );
        }
      })
      .catch(() => {});
  } catch (error) {
    console.warn('notifee getInitialNotification:', error?.message);
  }

  return () => {
    unsubscribers.forEach((unsub) => {
      try {
        unsub?.();
      } catch {
        // ignore
      }
    });
  };
};

export const registerUserPushDevices = async (userId, chatClient) => {
  await createNotificationChannels();
  await requestNotificationPermission();
  return registerStreamPushDevices(userId, chatClient);
};

export const ensureNotificationsReady = async () => {
  if (Platform.OS !== 'android') {
    return;
  }
  await createNotificationChannels();
  if (AppState.currentState === 'active') {
    await requestNotificationPermission();
  }
};

export default {
  attachNotificationOpenHandlers,
  cancelIncomingCallNotification,
  displayIncomingCallNotification,
  registerUserPushDevices,
  ensureNotificationsReady,
};
