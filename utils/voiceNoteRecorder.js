import { PermissionsAndroid, Platform } from 'react-native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import RNFS from 'react-native-fs';

const recorder = new AudioRecorderPlayer();

export const requestMicPermission = async () => {
  if (Platform.OS !== 'android') return true;
  const status = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
  );
  return status === PermissionsAndroid.RESULTS.GRANTED;
};

export const startVoiceRecording = async () => {
  const file = `${RNFS.CachesDirectoryPath}/voice-${Date.now()}.m4a`;
  await recorder.startRecorder(file, {
    AudioEncoderAndroid: 3,
    AudioSourceAndroid: 1,
    AVEncoderAudioQualityKeyIOS: 0,
    AVFormatIDKeyIOS: 'aac',
    AVNumberOfChannelsKeyIOS: 1,
  });
  return file;
};

export const stopVoiceRecording = async () => {
  const filePath = await recorder.stopRecorder();
  recorder.removeRecordBackListener();
  return filePath;
};
