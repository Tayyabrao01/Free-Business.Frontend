import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import api from './api';
import { STREAM_ANDROID_PUSH_PROVIDER, STREAM_API_KEY } from '../config/streamConfig';

const buildStreamUser = (user) => ({
  id: user._id?.toString(),
  name: user.name || 'User',
});

/**
 * Push config for Stream Video (must be set in index.js before AppRegistry).
 * Requires @react-native-firebase/messaging + google-services.json on Android.
 */
export const buildStreamPushConfig = () => {
  let StreamVideoClient;
  try {
    ({ StreamVideoClient } = require('@stream-io/video-react-native-sdk'));
  } catch {
    return null;
  }

  if (!StreamVideoClient || Platform.OS !== 'android') {
    return null;
  }

  if (!STREAM_ANDROID_PUSH_PROVIDER) {
    return null;
  }

  return {
    android: {
      pushProviderName: STREAM_ANDROID_PUSH_PROVIDER,
      smallIcon: 'ic_launcher',
      incomingCallChannel: {
        id: 'freebusiness_incoming_call',
        name: 'Incoming calls',
        importance: 4,
        sound: 'default',
      },
      incomingCallNotificationTextGetters: {
        getTitle: (name) => (name ? `${name} is calling` : 'Incoming call'),
        getBody: () => 'Tap to answer',
        getAcceptButtonTitle: () => 'Answer',
        getDeclineButtonTitle: () => 'Decline',
      },
    },
    ios: {
      pushProviderName: undefined,
    },
    createStreamVideoClient: async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const userJson = await AsyncStorage.getItem('user');
        if (!token || !userJson) {
          return undefined;
        }

        api.defaults.headers.Authorization = `Bearer ${token}`;
        const user = JSON.parse(userJson);
        const response = await api.post('/stream/token', { userName: user.name });
        const data = response?.data;
        if (!data?.token) {
          return undefined;
        }

        const streamUser = buildStreamUser(user);
        const apiKey = data.apiKey || STREAM_API_KEY;
        const client = StreamVideoClient.getOrCreateInstance({
          apiKey,
          user: streamUser,
          token: data.token,
        });

        if (!client?.state?.connectedUser?.id) {
          await client.connectUser(streamUser, data.token);
        }

        return client;
      } catch (error) {
        console.warn('createStreamVideoClient for push:', error?.message);
        return undefined;
      }
    },
  };
};
