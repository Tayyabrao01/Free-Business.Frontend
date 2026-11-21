/**
 * @format
 * URL polyfill MUST load before any other imports.
 */
import 'react-native-url-polyfill/auto';
import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import { displayRemotePushNotification } from './services/pushNotifications';
import App from './App';
import { name as appName } from './app.json';

// ✅ 1. REGISTER BACKGROUND MESSAGE HANDLER AT TOP LEVEL (For Messages & Calls)
try {
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log('📩 Background message received:', remoteMessage);
    await displayRemotePushNotification(remoteMessage);
  });
} catch (error) {
  console.warn('Background message handler registration failed:', error?.message);
}

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