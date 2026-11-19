import Sound from 'react-native-sound';

let ringbackSound = null;

export const playRingbackTone = () => {
  // Prevent playing multiple times if already playing
  if (ringbackSound) return;

  Sound.setCategory('Playback');

  // ✅ Use require so Android absolutely finds the file inside android/app/src/main/res/raw/
  const soundFile = require('../../android/app/src/main/res/raw/ringtone.mp3');

  ringbackSound = new Sound(soundFile, (error) => {
    if (error) {
      console.log('Failed to load ringback tone', error);
      return;
    }

    // -1 means loop forever
    ringbackSound.setNumberOfLoops(-1);
    ringbackSound.setVolume(0.8);
    ringbackSound.play();
  });
};

export const stopRingbackTone = () => {
  if (ringbackSound) {
    ringbackSound.stop(() => {
      ringbackSound.release();
      ringbackSound = null;
    });
  }
};