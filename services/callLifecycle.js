import { CallingState } from '@stream-io/video-client';
import { stopCallAudio } from '../utils/callAudio';
import { stopIncomingRingtone } from '../utils/incomingRingtone';

export const findClientCall = (videoClient, callCid) => {
  if (!videoClient || !callCid) {
    return null;
  }
  return videoClient.state?.calls?.find((c) => c.cid === callCid) || null;
};

export const endActiveCall = async (call, options = {}) => {
  const { isIncoming = false, wasConnected = false } = options;

  stopIncomingRingtone();
  stopCallAudio();

  if (!call || typeof call.leave !== 'function') {
    return;
  }

  const state = call.state?.callingState;
  if (!state || state === CallingState.LEFT) {
    return;
  }

  try {
    if (state === CallingState.RINGING) {
      await call.leave({
        reject: true,
        reason: isIncoming && !wasConnected ? 'decline' : 'cancel',
      });
      return;
    }

    await call.leave();
  } catch (error) {
    const msg = String(error?.message || '');
    if (!msg.includes('already been left')) {
      console.warn('endActiveCall:', msg);
    }
  }
};
