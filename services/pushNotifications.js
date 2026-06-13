import { Platform, PermissionsAndroid } from 'react-native';

/**
 * Request notification permission (required for incoming call ring when app is closed).
 */
export const requestNotificationPermission = async () => {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
    );
    return result === PermissionsAndroid.RESULTS.GRANTED;
  }

  try {
    const messaging = require('@react-native-firebase/messaging').default;
    const authStatus = await messaging().requestPermission();
    return (
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL
    );
  } catch (error) {
    console.warn('Firebase messaging not available:', error?.message);
    return false;
  }
};

export const registerPushBackgroundHandler = () => {
  if (Platform.OS !== 'android') {
    return;
  }

  try {
    const messaging = require('@react-native-firebase/messaging').default;
    messaging().setBackgroundMessageHandler(async () => {
      // Stream Video native layer handles ring push payloads when push config is set
    });
  } catch (error) {
    console.warn('Push background handler:', error?.message);
  }
};

export const isFirebaseConfigured = () => {
  try {
    const { NativeModules } = require('react-native');
    return Boolean(NativeModules.RNFBAppModule);
  } catch {
    return false;
  }
};
