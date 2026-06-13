/**
 * @format
 * URL polyfill MUST load before any other imports (Stream, axios, Sentry use URLSearchParams.set).
 */
import 'react-native-url-polyfill/auto';
import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import { registerPushBackgroundHandler } from './services/pushNotifications';

registerPushBackgroundHandler();

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

import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
