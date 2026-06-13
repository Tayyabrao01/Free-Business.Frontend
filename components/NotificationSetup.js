import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useStream } from '../context/StreamProvider';
import {
  createNotificationChannels,
  isFirebaseConfigured,
  registerPushForegroundHandler,
  requestNotificationPermission,
  subscribeToTokenRefresh,
} from '../services/pushNotifications';
import { registerStreamPushDevices } from '../services/streamPushRegistration';

/**
 * After login: notification permission, FCM token → Stream (calls + chat on lock screen).
 */
const NotificationSetup = () => {
  const { user } = useAuth();
  const { chatClient, isReady } = useStream();
  const registeredRef = useRef(false);

  useEffect(() => {
    if (!user?._id) {
      registeredRef.current = false;
      return undefined;
    }

    let removeForegroundHandler = () => {};

    const setup = async () => {
      if (!isFirebaseConfigured()) {
        console.warn(
          'Add google-services.json + rebuild for OTP SMS and lock-screen calls/messages. See FIREBASE_OTP_SETUP.md'
        );
        return;
      }

      await createNotificationChannels();
      await requestNotificationPermission();
      removeForegroundHandler = registerPushForegroundHandler();
    };

    setup();

    return () => {
      removeForegroundHandler();
    };
  }, [user?._id]);

  useEffect(() => {
    if (!user?._id || !isReady || !chatClient || registeredRef.current) {
      return undefined;
    }

    let removeTokenListener = () => {};

    const register = async () => {
      const result = await registerStreamPushDevices(user._id, chatClient);
      if (result.ok) {
        registeredRef.current = true;
      }

      removeTokenListener = subscribeToTokenRefresh(async () => {
        registeredRef.current = false;
        await registerStreamPushDevices(user._id, chatClient);
        registeredRef.current = true;
      });
    };

    register();

    return () => {
      removeTokenListener();
    };
  }, [user?._id, isReady, chatClient]);

  return null;
};

export default NotificationSetup;
