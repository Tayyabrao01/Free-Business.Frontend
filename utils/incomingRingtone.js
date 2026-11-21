import InCallManager from 'react-native-incall-manager';

let ringingCallId = null;

export const startIncomingRingtone = (callId) => {
  if (!callId || ringingCallId === callId) {
    return;
  }
  stopIncomingRingtone();
  ringingCallId = callId;
  try {
    // '_BUNDLE_' plays incallmanager_ringtone.mp3 from android/app/src/main/res/raw or iOS bundle.
    // If unavailable, InCallManager automatically falls back to system ringtone.
    InCallManager.startRingtone('_BUNDLE_', [800, 1200], 'playback', 45);
  } catch (error) {
    console.warn('[incomingRingtone] _BUNDLE_ ringtone failed, trying fallback:', error?.message);
    try {
      InCallManager.startRingtone('_DEFAULT_', [800, 1200], 'playback', 45);
    } catch (fallbackError) {
      console.warn('[incomingRingtone] fallback ringtone failed:', fallbackError?.message);
    }
  }
};

export const stopIncomingRingtone = () => {
  if (!ringingCallId) {
    return;
  }
  ringingCallId = null;
  try {
    InCallManager.stopRingtone();
  } catch (error) {
    console.warn('stopIncomingRingtone:', error?.message);
  }
};
