import { Platform } from 'react-native';
import InCallManager from 'react-native-incall-manager';

let audioSessionActive = false;
let speakerForcedOn = false;

/**
 * Start WebRTC-friendly audio session.
 * Audio calls use earpiece by default (reduces echo); video uses loudspeaker.
 */
export const startCallAudio = (videoEnabled = true, speakerOn = null) => {
  const useSpeaker = speakerOn == null ? Boolean(videoEnabled) : Boolean(speakerOn);
  speakerForcedOn = useSpeaker;

  try {
    InCallManager.start({
      media: videoEnabled ? 'video' : 'audio',
      auto: true,
      ringback: '',
    });
    audioSessionActive = true;

    InCallManager.setForceSpeakerphoneOn(useSpeaker);
    InCallManager.setSpeakerphoneOn(useSpeaker);

    if (Platform.OS === 'android') {
      InCallManager.setKeepScreenOn(true);
      try {
        InCallManager.chooseAudioRoute(
          useSpeaker ? 'SPEAKER_PHONE' : 'EARPIECE'
        );
      } catch (routeError) {
        console.warn('chooseAudioRoute:', routeError?.message);
      }
    }
  } catch (error) {
    console.warn('startCallAudio:', error?.message);
  }
};

export const setCallSpeakerphone = async (call, enabled) => {
  speakerForcedOn = Boolean(enabled);

  try {
    InCallManager.setForceSpeakerphoneOn(speakerForcedOn);
    InCallManager.setSpeakerphoneOn(speakerForcedOn);
    if (Platform.OS === 'android') {
      try {
        InCallManager.chooseAudioRoute(
          speakerForcedOn ? 'SPEAKER_PHONE' : 'EARPIECE'
        );
      } catch (routeError) {
        console.warn('chooseAudioRoute:', routeError?.message);
      }
    }
  } catch (error) {
    console.warn('setCallSpeakerphone incall:', error?.message);
  }

  if (!call?.speaker) {
    return;
  }

  try {
    if (typeof call.speaker.enable === 'function' && speakerForcedOn) {
      await call.speaker.enable();
    } else if (typeof call.speaker.disable === 'function' && !speakerForcedOn) {
      await call.speaker.disable();
    }

    const devices = await call.speaker.listDevices();
    const match = devices.find((d) => {
      const id = String(d.deviceId || '').toLowerCase();
      const type = String(d.type || '').toLowerCase();
      if (speakerForcedOn) {
        return id.includes('speaker') || type.includes('speaker');
      }
      return (
        id.includes('earpiece') ||
        id.includes('receiver') ||
        type.includes('earpiece') ||
        type.includes('phone')
      );
    });
    const device = match || devices[0];
    if (device?.deviceId) {
      await call.speaker.select(device.deviceId);
    }
  } catch (error) {
    console.warn('setCallSpeakerphone stream:', error?.message);
  }
};

export const stopCallAudio = () => {
  try {
    InCallManager.setKeepScreenOn(false);
    InCallManager.setForceSpeakerphoneOn(false);
    InCallManager.setSpeakerphoneOn(false);
    InCallManager.stopRingtone();
    if (audioSessionActive) {
      InCallManager.stop();
      audioSessionActive = false;
    }
  } catch (error) {
    console.warn('stopCallAudio:', error?.message);
  }
  speakerForcedOn = false;
};

/**
 * Apply once when a call becomes JOINED. Avoid re-forcing speaker on a timer
 * (that caused echo / feedback loops).
 */
export const configureJoinedCallAudio = async (call, videoEnabled = true) => {
  startCallAudio(videoEnabled, Boolean(videoEnabled));

  if (!call) {
    return;
  }

  try {
    if (typeof call.microphone?.enable === 'function') {
      await call.microphone.enable();
    }
  } catch (error) {
    console.warn('configureJoinedCallAudio mic:', error?.message);
  }

  if (videoEnabled) {
    await setCallSpeakerphone(call, true);
  } else {
    await setCallSpeakerphone(call, false);
  }
};

/** @deprecated Use configureJoinedCallAudio — kept for older call sites */
export const boostCallSpeaker = async (call, videoEnabled = true) => {
  await configureJoinedCallAudio(call, videoEnabled);
};

export const isSpeakerForcedOn = () => speakerForcedOn;
