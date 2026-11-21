import InCallManager from 'react-native-incall-manager';

let isRingbackPlaying = false;

/**
 * Start playing ringback tone when initiating an outgoing call.
 * Uses InCallManager's native voice communication audio session.
 * Loads 'incallmanager_ringback.mp3' from android/app/src/main/res/raw or iOS main bundle.
 * Falls back to default ringback if bundle sound is unavailable.
 */
export const playRingbackTone = () => {
  if (isRingbackPlaying) {
    return;
  }
  isRingbackPlaying = true;
  try {
    InCallManager.startRingback('_BUNDLE_');
  } catch (error) {
    console.warn('[RingbackService] _BUNDLE_ ringback failed, falling back to default:', error?.message);
    try {
      InCallManager.startRingback('_DEFAULT_');
    } catch (fallbackError) {
      console.warn('[RingbackService] fallback ringback failed:', fallbackError?.message);
    }
  }
};

/**
 * Stop playing ringback tone when call is connected, rejected, or canceled.
 */
export const stopRingbackTone = () => {
  if (!isRingbackPlaying) {
    return;
  }
  isRingbackPlaying = false;
  try {
    InCallManager.stopRingback();
  } catch (error) {
    console.warn('[RingbackService] stopRingback error:', error?.message);
  }
};
