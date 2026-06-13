import { Platform } from 'react-native';
import InCallManager from 'react-native-incall-manager';

/**
 * Route call audio to loudspeaker and max volume (closer to WhatsApp loudness).
 */
export const startCallAudio = (videoEnabled = true) => {
  try {
    InCallManager.start({
      media: videoEnabled ? 'video' : 'audio',
      auto: false,
      ringback: '',
    });

    if (videoEnabled) {
      InCallManager.setForceSpeakerphoneOn(true);
      InCallManager.setSpeakerphoneOn(true);
    } else {
      InCallManager.setForceSpeakerphoneOn(false);
      InCallManager.setSpeakerphoneOn(false);
    }

    if (Platform.OS === 'android') {
      InCallManager.setKeepScreenOn(true);
      try {
        InCallManager.chooseAudioRoute(videoEnabled ? 'SPEAKER_PHONE' : 'EARPIECE');
      } catch (routeError) {
        console.warn('chooseAudioRoute:', routeError?.message);
      }
    }
  } catch (error) {
    console.warn('startCallAudio:', error?.message);
  }
};

export const stopCallAudio = () => {
  try {
    InCallManager.setKeepScreenOn(false);
    InCallManager.stop();
  } catch (error) {
    console.warn('stopCallAudio:', error?.message);
  }
};

export const boostCallSpeaker = async (call, videoEnabled = true) => {
  if (!call?.speaker) {
    return;
  }

  try {
    const devices = await call.speaker.listDevices();
    const preferred = devices.find((d) => {
      const id = (d.deviceId || '').toLowerCase();
      if (videoEnabled) {
        return id.includes('speaker') || d.type === 'speaker';
      }
      return id.includes('earpiece') || id.includes('phone') || d.type === 'earpiece';
    });

    const fallback = devices.find((d) => {
      const id = (d.deviceId || '').toLowerCase();
      return id.includes('speaker');
    });

    const device = preferred || fallback || devices[0];
    if (device?.deviceId) {
      call.speaker.select(device.deviceId);
    }
    call.speaker.setVolume(1);
  } catch (error) {
    console.warn('boostCallSpeaker:', error?.message);
  }
};
