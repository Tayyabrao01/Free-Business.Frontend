import notifee, { AndroidCategory, AndroidImportance } from '@notifee/react-native';

const CHANNEL_ID = 'agora_call';
const NOTIFICATION_ID = 'agora_call_active';

export const registerAgoraForegroundService = () => {
  notifee.registerForegroundService(() => new Promise(() => {}));
};

export const startAgoraForegroundService = async video => {
  await notifee.createChannel({
    id: CHANNEL_ID,
    name: 'Calls',
    importance: AndroidImportance.LOW,
  });
  await notifee.displayNotification({
    id: NOTIFICATION_ID,
    title: video ? 'Video call in progress' : 'Voice call in progress',
    body: 'Tap to return to the call',
    android: {
      channelId: CHANNEL_ID,
      category: AndroidCategory.CALL,
      ongoing: true,
      asForegroundService: true,
      pressAction: { id: 'default' },
    },
  });
};

export const stopAgoraForegroundService = async () => {
  await notifee.stopForegroundService();
  await notifee.cancelNotification(NOTIFICATION_ID);
};
