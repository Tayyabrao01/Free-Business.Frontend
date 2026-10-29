import { Platform } from 'react-native';
import { STREAM_ANDROID_PUSH_PROVIDER } from '../config/streamConfig';
import {
  createNotificationChannels,
  getFcmToken,
  isFirebaseConfigured,
  requestNotificationPermission,
} from './pushNotifications';
import { getVideoClient } from './streamClientService';

const PUSH_PROVIDER_CANDIDATES = [
  STREAM_ANDROID_PUSH_PROVIDER,
  'firebase',
  'freebusiness-fcm',
].filter(Boolean);

const uniqueProviders = [...new Set(PUSH_PROVIDER_CANDIDATES)];

const registerChatDevice = async (chatClient, token, userId) => {
  let lastError = null;
  for (const provider of uniqueProviders) {
    try {
      await chatClient.addDevice(token, provider, userId.toString(), provider);
      return provider;
    } catch (error) {
      lastError = error;
      console.warn(`Stream Chat addDevice failed (${provider}):`, error?.message);
    }
  }
  throw lastError || new Error('Stream Chat push registration failed');
};

/**
 * Register this device with Stream Chat + Video for FCM push (messages + calls on lock screen).
 */
export const registerStreamPushDevices = async (userId, chatClient) => {
  if (Platform.OS !== 'android' || !userId || !chatClient) {
    return { ok: false, reason: 'missing_client' };
  }
  if (!isFirebaseConfigured()) {
    return { ok: false, reason: 'firebase_not_configured' };
  }

  const granted = await requestNotificationPermission();
  if (!granted) {
    console.warn('Notification permission denied — calls/messages may not show on lock screen');
  }

  await createNotificationChannels();

  const token = await getFcmToken();
  if (!token) {
    return { ok: false, reason: 'no_fcm_token' };
  }

  try {
    const provider = await registerChatDevice(chatClient, token, userId);
    const videoClient = getVideoClient();
    if (videoClient?.registerDevice) {
      try {
        await videoClient.registerDevice(token, provider);
      } catch (error) {
        console.warn('Stream Video registerDevice failed:', error?.message);
      }
    }
    return { ok: true, token, provider };
  } catch (error) {
    console.warn('Stream Chat addDevice failed:', error?.message);
    return { ok: false, reason: 'chat_device_failed', error };
  }
};

export default registerStreamPushDevices;
