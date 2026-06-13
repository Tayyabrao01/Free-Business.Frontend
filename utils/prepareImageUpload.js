import { Platform } from 'react-native';
import RNFS from 'react-native-fs';
import ImageResizer from 'react-native-image-resizer';

const UPLOADABLE_URI = /^file:\/\//i;

/**
 * Copy content:// or bare paths to a cache file React Native can upload.
 */
const normalizeUriForUpload = async (uri) => {
  if (!uri) {
    throw new Error('Invalid image');
  }

  if (uri.startsWith('content://')) {
    const dest = `${RNFS.CachesDirectoryPath}/upload-${Date.now()}.jpg`;
    try {
      await RNFS.copyFile(uri, dest);
    } catch (copyError) {
      const base64 = await RNFS.readFile(uri, 'base64');
      await RNFS.writeFile(dest, base64, 'base64');
    }
    return `file://${dest}`;
  }

  if (Platform.OS === 'android' && !UPLOADABLE_URI.test(uri)) {
    return `file://${uri}`;
  }

  return uri;
};

const toFormDataUri = (uri) => {
  if (Platform.OS === 'ios') {
    return uri.replace(/^file:\/\//i, '');
  }
  if (Platform.OS === 'android' && !UPLOADABLE_URI.test(uri)) {
    return `file://${uri}`;
  }
  return uri;
};

/**
 * Resize and normalize an image picker asset for multipart upload.
 */
export const prepareImageForUpload = async (asset) => {
  if (!asset?.uri) {
    throw new Error('Invalid image');
  }

  let uploadUri = await normalizeUriForUpload(asset.uri);

  try {
    const resized = await ImageResizer.createResizedImage(
      uploadUri,
      800,
      800,
      'JPEG',
      85,
      0,
      undefined,
      false,
      { mode: 'contain', onlyScaleDown: true }
    );
    uploadUri = await normalizeUriForUpload(resized.uri);
  } catch (error) {
    console.warn('prepareImageForUpload resize skipped:', error?.message);
    if (asset.uri.startsWith('content://')) {
      throw new Error('Could not prepare photo for upload. Try another image.');
    }
  }

  if (!UPLOADABLE_URI.test(uploadUri) && Platform.OS === 'android') {
    throw new Error('Photo must be saved as a file before upload.');
  }

  const baseName = (asset.fileName || 'upload.jpg').replace(/\.[^.]+$/, '');
  const name = `${baseName}.jpg`;

  return {
    uri: toFormDataUri(uploadUri),
    type: 'image/jpeg',
    name,
  };
};

export const buildImageFormData = async (asset, fieldName = 'image') => {
  const filePart = await prepareImageForUpload(asset);
  const formData = new FormData();
  formData.append(fieldName, filePart);
  return formData;
};

export default prepareImageForUpload;
