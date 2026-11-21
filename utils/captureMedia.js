import { Alert, Linking, PermissionsAndroid, Platform } from 'react-native';
import { launchCamera } from 'react-native-image-picker';
import { PERMISSIONS, RESULTS, request } from 'react-native-permissions';

const requestCameraPermissions = async mediaType => {
  const isVideo = mediaType === 'video';
  if (Platform.OS === 'android') {
    const permissions = [PermissionsAndroid.PERMISSIONS.CAMERA];
    if (isVideo) {
      permissions.push(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
      if (Platform.Version <= 28) {
        permissions.push(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE);
      }
    }

    console.log('[captureMedia] permission request start', { mediaType, permissions });
    const result = await PermissionsAndroid.requestMultiple(permissions);
    const cameraGranted =
      result[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED;
    const microphoneGranted =
      !isVideo ||
      result[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED;
    const storageGranted =
      !isVideo ||
      Platform.Version > 28 ||
      result[PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE] ===
        PermissionsAndroid.RESULTS.GRANTED;
    console.log('[captureMedia] permission request result', {
      mediaType,
      cameraGranted,
      microphoneGranted,
      storageGranted,
    });
    return cameraGranted && microphoneGranted && storageGranted;
  }

  console.log('[captureMedia] permission request start', { mediaType });
  const camera = await request(PERMISSIONS.IOS.CAMERA);
  const microphone = isVideo ? await request(PERMISSIONS.IOS.MICROPHONE) : RESULTS.GRANTED;
  const cameraGranted = camera === RESULTS.GRANTED || camera === RESULTS.LIMITED;
  const microphoneGranted =
    microphone === RESULTS.GRANTED || microphone === RESULTS.LIMITED;
  console.log('[captureMedia] permission request result', {
    mediaType,
    cameraGranted,
    microphoneGranted,
  });
  return cameraGranted && microphoneGranted;
};

export const captureMedia = async ({ mediaType = 'photo' } = {}) => {
  const granted = await requestCameraPermissions(mediaType);
  if (!granted) {
    Alert.alert(
      'Camera permission required',
      mediaType === 'video'
        ? 'Allow camera, microphone, and storage access in Settings to record videos.'
        : 'Allow camera access in Settings to take photos.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ],
    );
    return null;
  }

  console.log('[captureMedia] camera launch start', { mediaType });
  let result;
  try {
    result = await launchCamera({
      mediaType,
      ...(mediaType === 'video'
        ? { videoQuality: 'medium' }
        : { quality: 0.9 }),
      saveToPhotos: false,
    });
  } catch (error) {
    console.error('[captureMedia] camera launch failure', error);
    throw error;
  }

  if (result.didCancel) return null;
  if (result.errorCode) {
    console.error('[captureMedia] camera launch error', result.errorCode, result.errorMessage);
    throw new Error(result.errorMessage || 'Could not open the camera.');
  }
  const asset = result.assets?.[0] || null;
  console.log('[captureMedia] camera file received', {
    mediaType,
    uri: asset?.uri,
    type: asset?.type,
    fileName: asset?.fileName,
  });
  return asset;
};

export default captureMedia;
