import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useStream } from '../context/StreamProvider';
import {
  attachNotificationOpenHandlers,
  ensureNotificationsReady,
  registerPushForegroundHandler,
  registerUserPushDevices,
  subscribeToTokenRefresh,
  isFirebaseConfigured,
} from '../services/NotificationService';
import { attachChatMessageNotifications } from '../services/chatNotificationListener';
import { ensureVideoClientReady } from '../services/streamClientService';

/**
 * After login: notification permission, FCM token → Stream (calls + chat on lock screen),
 * and notification tap → Chat / StreamCall navigation.
 */
const NotificationSetup = () => {
  const { user } = useAuth();
  const { chatClient, isReady, reconnect } = useStream();
  const registeredRef = useRef(false);

  useEffect(() => {
    const removeOpenHandlers = attachNotificationOpenHandlers();
    return () => {
      removeOpenHandlers();
    };
  }, []);

  useEffect(() => {
    if (!user?._id) {
      registeredRef.current = false;
      return undefined;
    }

    let removeForegroundHandler = () => {};

    const setup = async () => {
      if (!isFirebaseConfigured()) {
        console.warn(
          'Add google-services.json + rebuild for lock-screen calls/messages. See RINGING_CALLS_SETUP.md'
        );
        return;
      }

      await ensureNotificationsReady();
      removeForegroundHandler = registerPushForegroundHandler();
    };

    setup();

    return () => {
      removeForegroundHandler();
    };
  }, [user?._id]);

  useEffect(() => {
    if (!user?._id || !isReady || !chatClient) {
      return undefined;
    }

    const removeChatListener = attachChatMessageNotifications(chatClient, user._id);

    return () => {
      removeChatListener();
    };
  }, [user?._id, isReady, chatClient]);

  useEffect(() => {
    if (!user?._id || !isReady || !chatClient || registeredRef.current) {
      return undefined;
    }

    let removeTokenListener = () => {};

    const register = async () => {
      await ensureVideoClientReady(user, reconnect);
      const result = await registerUserPushDevices(user._id, chatClient);
      if (result.ok) {
        registeredRef.current = true;
      }

      removeTokenListener = subscribeToTokenRefresh(async () => {
        registeredRef.current = false;
        await ensureVideoClientReady(user, reconnect);
        await registerUserPushDevices(user._id, chatClient);
        registeredRef.current = true;
      });
    };

    register();

    return () => {
      removeTokenListener();
    };
  }, [user?._id, isReady, chatClient, reconnect, user]);

  return null;
};

export default NotificationSetup;
