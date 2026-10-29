import { Platform } from 'react-native';
import notifee, { AndroidImportance, AndroidCategory } from '@notifee/react-native';

const MESSAGE_CHANNEL_ID = 'freebusiness_messages';
const CALL_CHANNEL_ID = 'freebusiness_incoming_call';

export const isFirebaseConfigured = () => {
  try {
    const firebase = require('@react-native-firebase/app').default;
    return Array.isArray(firebase.apps) && firebase.apps.length > 0;
  } catch {
    return false;
  }
};

const getMessaging = () => {
  if (!isFirebaseConfigured()) {
    return null;
  }
  try {
    return require('@react-native-firebase/messaging').default;
  } catch {
    return null;
  }
};

/**
 * Request notification permission (required for incoming call ring when app is closed).
 */
export const requestNotificationPermission = async () => {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    const { PermissionsAndroid } = require('react-native');
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
    );
    return result === PermissionsAndroid.RESULTS.GRANTED;
  }

  const messaging = getMessaging();
  if (!messaging) {
    return false;
  }
  try {
    const authStatus = await messaging().requestPermission();
    return (
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL
    );
  } catch (error) {
    console.warn('Firebase messaging permission:', error?.message);
    return false;
  }
};

export const createNotificationChannels = async () => {
  if (Platform.OS !== 'android') {
    return;
  }
  try {
    await notifee.createChannel({
      id: MESSAGE_CHANNEL_ID,
      name: 'Messages',
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibration: true,
    });
    await notifee.createChannel({
      id: CALL_CHANNEL_ID,
      name: 'Incoming calls',
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibration: true,
      bypassDnd: true,
    });
  } catch (error) {
    console.warn('Notification channels:', error?.message);
  }
};

export const getFcmToken = async () => {
  const messaging = getMessaging();
  if (!messaging) {
    return null;
  }
  try {
    return await messaging().getToken();
  } catch (error) {
    console.warn('FCM getToken failed:', error?.message);
    return null;
  }
};

const parsePushPayload = (remoteMessage) => {
  const data = remoteMessage?.data || {};
  const notification = remoteMessage?.notification || {};

  const type = String(
    data.type || data.notification_type || data.event_type || ''
  ).toLowerCase();

  const callCid = data.call_cid || data.call_id || data.stream?.call_cid;
  const isCall =
    type.includes('call') ||
    type.includes('ring') ||
    Boolean(callCid);

  const callerName =
    data.sender_name ||
    data.caller_name ||
    data.user_name ||
    data.name ||
    data.title ||
    notification.title ||
    'Someone';

  const title = isCall
    ? `${callerName} is calling`
    : data.channel_name ||
      data.sender_name ||
      notification.title ||
      'Free Business';

  const body = isCall
    ? notification.body || data.body || 'Tap to answer'
    : data.message ||
      data.body ||
      notification.body ||
      data.text ||
      'New message';

  return {
    title,
    body,
    isCall,
    callerName,
    data: {
      ...data,
      type: isCall ? 'call' : data.type || 'message',
      call_cid: callCid || data.call_cid || '',
      channelId: data.channel_id || data.channelId || '',
      channelType: data.channel_type || data.channelType || 'messaging',
      caller_name: callerName,
      video: String(data.video ?? data.video_enabled ?? 'true'),
      isGroupCall: String(data.isGroupCall || data.is_group_call || 'false'),
      isGroupChat: String(data.isGroupChat || data.is_group || 'false'),
    },
  };
};

export const displayIncomingCallNotification = async ({
  callerName = 'Someone',
  isGroupCall = false,
  callCid = '',
  video = true,
  otherUserId = '',
  groupId = '',
  groupName = '',
}) => {
  if (Platform.OS !== 'android') {
    return;
  }
  await createNotificationChannels();
  await notifee.displayNotification({
    id: 'incoming_call',
    title: isGroupCall ? `${callerName}` : `${callerName} is calling`,
    body: isGroupCall ? 'Incoming group call — tap to answer' : 'Tap to answer',
    data: {
      type: 'call',
      call_cid: callCid,
      incomingCallCid: callCid,
      caller_name: callerName,
      otherUserId: otherUserId || '',
      isGroupCall: String(isGroupCall),
      groupId: groupId || '',
      groupName: groupName || '',
      video: String(Boolean(video)),
    },
    android: {
      channelId: CALL_CHANNEL_ID,
      importance: AndroidImportance.HIGH,
      category: AndroidCategory.CALL,
      pressAction: { id: 'default' },
      sound: 'default',
      vibrationPattern: [300, 500, 300, 500, 300, 500],
      fullScreenAction: { id: 'default', launchActivity: 'default' },
      ongoing: true,
      loopSound: true,
      autoCancel: false,
    },
  });
};

export const displayRemotePushNotification = async (remoteMessage) => {
  if (Platform.OS !== 'android') {
    return;
  }

  const { title, body, isCall, data } = parsePushPayload(remoteMessage);

  await notifee.displayNotification({
    id: isCall ? 'incoming_call' : undefined,
    title,
    body,
    data,
    android: {
      channelId: isCall ? CALL_CHANNEL_ID : MESSAGE_CHANNEL_ID,
      importance: AndroidImportance.HIGH,
      category: isCall ? AndroidCategory.CALL : AndroidCategory.MESSAGE,
      pressAction: { id: 'default' },
      sound: 'default',
      vibrationPattern: isCall ? [300, 500, 300, 500, 300, 500] : [200, 300],
      fullScreenAction: isCall
        ? { id: 'default', launchActivity: 'default' }
        : undefined,
      ongoing: isCall,
      loopSound: isCall,
      autoCancel: !isCall,
    },
  });
};

export const registerPushBackgroundHandler = () => {
  if (Platform.OS !== 'android' || !isFirebaseConfigured()) {
    return;
  }

  const messaging = getMessaging();
  if (!messaging) {
    return;
  }

  try {
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      try {
        await createNotificationChannels();
        await displayRemotePushNotification(remoteMessage);
      } catch (error) {
        console.warn('Background push handler:', error?.message);
      }
    });
  } catch (error) {
    console.warn('registerPushBackgroundHandler:', error?.message);
  }
};

let foregroundUnsubscribe = null;

export const registerPushForegroundHandler = () => {
  if (Platform.OS !== 'android' || !isFirebaseConfigured()) {
    return () => {};
  }

  const messaging = getMessaging();
  if (!messaging) {
    return () => {};
  }

  if (foregroundUnsubscribe) {
    foregroundUnsubscribe();
  }

  try {
    foregroundUnsubscribe = messaging().onMessage(async (remoteMessage) => {
      try {
        await displayRemotePushNotification(remoteMessage);
      } catch (error) {
        console.warn('Foreground push handler:', error?.message);
      }
    });
  } catch (error) {
    console.warn('registerPushForegroundHandler:', error?.message);
  }

  return () => {
    if (foregroundUnsubscribe) {
      foregroundUnsubscribe();
      foregroundUnsubscribe = null;
    }
  };
};

export const subscribeToTokenRefresh = (onToken) => {
  const messaging = getMessaging();
  if (!messaging || !onToken) {
    return () => {};
  }
  try {
    return messaging().onTokenRefresh(onToken);
  } catch (error) {
    console.warn('onTokenRefresh:', error?.message);
    return () => {};
  }
};
