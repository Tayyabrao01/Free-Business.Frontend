import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { PERMISSIONS, request, check, RESULTS } from 'react-native-permissions';

export const requestCallPermissions = async (video = true) => {
  if (Platform.OS === 'android') {
    const permissions = [PermissionsAndroid.PERMISSIONS.RECORD_AUDIO];
    if (video) {
      permissions.push(PermissionsAndroid.PERMISSIONS.CAMERA);
    }
    const results = await PermissionsAndroid.requestMultiple(permissions);
    const audioOk =
      results[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] ===
      PermissionsAndroid.RESULTS.GRANTED;
    const cameraOk = video
      ? results[PermissionsAndroid.PERMISSIONS.CAMERA] ===
        PermissionsAndroid.RESULTS.GRANTED
      : true;
    return audioOk && cameraOk;
  }

  const mic = await request(PERMISSIONS.IOS.MICROPHONE);
  let camera = RESULTS.GRANTED;
  if (video) {
    camera = await request(PERMISSIONS.IOS.CAMERA);
  }
  return (
    (mic === RESULTS.GRANTED || mic === RESULTS.LIMITED) &&
    (camera === RESULTS.GRANTED || camera === RESULTS.LIMITED)
  );
};

export const ensureCallPermissions = async (video, t) => {
  const granted = await requestCallPermissions(video);
  if (!granted && t) {
    Alert.alert(t('common.error'), t('stream.permissionRequired'));
  }
  return granted;
};

export const checkCallPermissions = async (video = true) => {
  if (Platform.OS === 'android') {
    const audio = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
    );
    if (!video) return audio;
    const camera = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.CAMERA
    );
    return audio && camera;
  }

  const mic = await check(PERMISSIONS.IOS.MICROPHONE);
  if (!video) {
    return mic === RESULTS.GRANTED || mic === RESULTS.LIMITED;
  }
  const camera = await check(PERMISSIONS.IOS.CAMERA);
  return (
    (mic === RESULTS.GRANTED || mic === RESULTS.LIMITED) &&
    (camera === RESULTS.GRANTED || camera === RESULTS.LIMITED)
  );
};
