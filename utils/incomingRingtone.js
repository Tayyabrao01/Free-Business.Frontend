import InCallManager from 'react-native-incall-manager';

let ringingCallId = null;

export const startIncomingRingtone = (callId) => {
  if (!callId || ringingCallId === callId) {
    return;
  }
  stopIncomingRingtone();
  ringingCallId = callId;
  try {
    InCallManager.startRingtone('_DEFAULT_', [1000, 1000], 'playback', 45);
  } catch (error) {
    console.warn('startIncomingRingtone:', error?.message);
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
