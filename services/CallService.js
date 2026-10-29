import {
  joinDirectCall,
  joinGroupCall,
  prepareIncomingCall,
  ensureVideoClientReady,
} from './streamClientService';
import { endActiveCall, findClientCall } from './callLifecycle';
import {
  configureJoinedCallAudio,
  setCallSpeakerphone,
  stopCallAudio,
} from '../utils/callAudio';
import {
  startIncomingRingtone,
  stopIncomingRingtone,
} from '../utils/incomingRingtone';
import { cancelIncomingCallNotification } from './NotificationService';

/**
 * High-level call helpers used by screens (wraps Stream Video + audio routing).
 */
export const CallService = {
  ensureVideoClientReady,
  joinDirectCall,
  joinGroupCall,
  prepareIncomingCall,
  findClientCall,
  endActiveCall,

  startRingtone: startIncomingRingtone,
  stopRingtone: stopIncomingRingtone,

  configureAudio: configureJoinedCallAudio,
  setSpeaker: setCallSpeakerphone,
  stopAudio: stopCallAudio,

  async acceptCall(call) {
    stopIncomingRingtone();
    await cancelIncomingCallNotification();
    if (typeof call?.join === 'function') {
      await call.join();
    }
    return call;
  },

  async declineCall(call, { isIncoming = true } = {}) {
    stopIncomingRingtone();
    await cancelIncomingCallNotification();
    await endActiveCall(call, { isIncoming, wasConnected: false });
  },

  async hangup(call, { isIncoming = false, wasConnected = true } = {}) {
    stopIncomingRingtone();
    await cancelIncomingCallNotification();
    await endActiveCall(call, { isIncoming, wasConnected });
  },
};

export default CallService;
