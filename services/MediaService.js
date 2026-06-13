import { Platform, Alert, PermissionsAndroid } from 'react-native';
import RNFS from 'react-native-fs';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

const VIDEO_EXTENSIONS = /\.(mp4|mov|webm|mkv|avi|m4v|3gp)(\?|$)/i;

export const detectMediaType = (url, explicitType) => {
  if (explicitType === 'image' || explicitType === 'video') {
    return explicitType;
  }
  if (url && VIDEO_EXTENSIONS.test(url)) {
    return 'video';
  }
  return 'image';
};

const getExtension = (url, type) => {
  const path = (url || '').split('?')[0];
  const match = path.match(/\.([a-zA-Z0-9]+)$/);
  if (match) {
    return match[1].toLowerCase();
  }
  return type === 'video' ? 'mp4' : 'jpg';
};

const requestAndroidStoragePermission = async () => {
  if (Platform.OS !== 'android') {
    return true;
  }

  if (Platform.Version >= 33) {
    const results = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
      PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
    ]);
    const imagesGranted =
      results[PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES] ===
      PermissionsAndroid.RESULTS.GRANTED;
    const videoGranted =
      results[PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO] ===
      PermissionsAndroid.RESULTS.GRANTED;
    return imagesGranted || videoGranted;
  }

  const readGranted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
  );
  const writeGranted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
  );
  return (
    readGranted === PermissionsAndroid.RESULTS.GRANTED &&
    writeGranted === PermissionsAndroid.RESULTS.GRANTED
  );
};

const requestIOSPhotoPermission = async () => {
  if (Platform.OS !== 'ios') {
    return true;
  }

  const permission = PERMISSIONS.IOS.PHOTO_LIBRARY_ADD_ONLY;
  const current = await check(permission);
  if (current === RESULTS.GRANTED || current === RESULTS.LIMITED) {
    return true;
  }

  const result = await request(permission);
  return result === RESULTS.GRANTED || result === RESULTS.LIMITED;
};

const requestStoragePermission = async () => {
  if (Platform.OS === 'android') {
    return requestAndroidStoragePermission();
  }
  return requestIOSPhotoPermission();
};

/**
 * Download remote image/video and save to device gallery.
 * @param {string} url - Full media URL
 * @param {'image'|'video'} type - Media type (auto-detected from URL if omitted)
 * @param {object} messages - Localized alert strings from useTranslation
 */
export const downloadMedia = async (url, type, messages = {}) => {
  const {
    successTitle = 'Success',
    successMessage = 'Saved to gallery',
    errorTitle = 'Error',
    errorMessage = 'Download failed',
    permissionTitle = 'Permission required',
    permissionMessage = 'Storage permission is required to save media',
    invalidUrlMessage = 'Invalid media URL',
  } = messages;

  if (!url) {
    Alert.alert(errorTitle, invalidUrlMessage);
    return { success: false };
  }

  const mediaType = detectMediaType(url, type);
  const hasPermission = await requestStoragePermission();

  if (!hasPermission) {
    Alert.alert(permissionTitle, permissionMessage);
    return { success: false };
  }

  const extension = getExtension(url, mediaType);
  const localPath = `${RNFS.CachesDirectoryPath}/freebusiness_${Date.now()}.${extension}`;

  try {
    const downloadResult = await RNFS.downloadFile({
      fromUrl: url,
      toFile: localPath,
    }).promise;

    if (downloadResult.statusCode && downloadResult.statusCode >= 400) {
      throw new Error(`HTTP ${downloadResult.statusCode}`);
    }

    const fileExists = await RNFS.exists(localPath);
    if (!fileExists) {
      throw new Error('Downloaded file not found');
    }

    await CameraRoll.save(localPath, {
      type: mediaType === 'video' ? 'video' : 'photo',
    });

    await RNFS.unlink(localPath).catch(() => {});

    Alert.alert(successTitle, successMessage);
    return { success: true };
  } catch (error) {
    await RNFS.unlink(localPath).catch(() => {});
    console.error('downloadMedia error:', error);
    Alert.alert(errorTitle, errorMessage);
    return { success: false, error };
  }
};

export default downloadMedia;
