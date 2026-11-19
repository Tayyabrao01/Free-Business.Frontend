/**
 * @format
 * URL polyfill MUST load before any other imports.
 */
import 'react-native-url-polyfill/auto';
import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, AndroidCategory } from '@notifee/react-native';
import App from './App';
import { name as appName } from './app.json';

// ✅ 1. REGISTER BACKGROUND MESSAGE HANDLER AT TOP LEVEL (For Messages & Calls)
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log('📩 Background message received:', remoteMessage);

  const data = remoteMessage.data || {};
  const isCall = data.type === 'call' || data.call_cid || data.call_type;

  if (isCall) {
    // ✅ Show Full Screen Call Notification with Ringtone
    await notifee.displayNotification({
      id: 'incoming_call',
      title: `${data.caller_name || 'Someone'} is calling...`,
      body: 'Tap to answer',
      data: data,
      android: {
        channelId: 'calls_v2', // Make sure this matches your pushNotifications.js
        importance: AndroidImportance.HIGH,
        category: AndroidCategory.CALL,
        sound: 'ringtone', // Your custom ringtone
        loopSound: true, // Loops until answered
        fullScreenAction: {
          id: 'default',
          launchActivity: 'default',
        },
        actions: [
          { title: 'Answer', pressAction: { id: 'answer' } },
          { title: 'Decline', pressAction: { id: 'decline' } },
        ],
      },
    });
  } else {
    // ✅ Show Message Notification
    await notifee.displayNotification({
      title: data.sender_name || remoteMessage.notification?.title || 'New Message',
      body: data.message || remoteMessage.notification?.body || 'You have a new message',
      data: data,
      android: {
        channelId: 'freebusiness_messages', // Matches your pushNotifications.js
        importance: AndroidImportance.HIGH,
        pressAction: { id: 'default' },
      },
    });
  }
});

// ✅ 2. Stream Video & Agora Setup (Your existing code)
try {
  const { registerAgoraForegroundService } = require('./services/agoraForegroundService');
  registerAgoraForegroundService();
} catch (error) {
  console.warn('Agora foreground service skipped:', error?.message);
}

try {
  const { register } = require('@stream-io/react-native-webrtc');
  register();
} catch (error) {
  // WebRTC not included in chat-only builds
}

try {
  const { StreamVideoRN } = require('@stream-io/video-react-native-sdk');
  const { buildStreamPushConfig } = require('./services/streamPushConfig');

  StreamVideoRN.updateConfig({
    foregroundService: {
      android: {
        notificationTexts: {
          title: 'Call in progress',
          body: 'Tap to return to the call',
        },
      },
    },
  });

  const pushConfig = buildStreamPushConfig();
  if (pushConfig) {
    StreamVideoRN.setPushConfig(pushConfig);
  }
} catch (error) {
  // Stream Video SDK not linked in this build
}

// ✅ 3. Register App
AppRegistry.registerComponent(appName, () => App);