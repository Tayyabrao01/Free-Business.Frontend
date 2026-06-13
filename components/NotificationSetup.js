import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  isFirebaseConfigured,
  requestNotificationPermission,
} from '../services/pushNotifications';

/**
 * After login, ask for notifications so incoming calls can ring outside the app.
 */
const NotificationSetup = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?._id) {
      return;
    }

    const setup = async () => {
      if (!isFirebaseConfigured()) {
        console.warn(
          'Add google-services.json + rebuild for call ring when app is closed. See RINGING_CALLS_SETUP.md'
        );
        return;
      }
      await requestNotificationPermission();
    };

    setup();
  }, [user?._id]);

  return null;
};

export default NotificationSetup;
