import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_USER_AGENT, BASE_URL } from './api';
import { buildImageFormData } from '../utils/prepareImageUpload';
import { getApiErrorMessage, sanitizeErrorText } from '../utils/apiError';

export const uploadImageAsset = async (asset, onUploadProgress) => {
  const token = await AsyncStorage.getItem('token');
  const formData = await buildImageFormData(asset, 'media');
  const response = await fetch(`${BASE_URL}/images/upload-media`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      Accept: 'application/json',
      'User-Agent': APP_USER_AGENT,
      'X-FB-Client': 'FreeBusinessMobile',
    },
    body: formData,
  });
  const rawText = await response.text();
  let body = {};
  try {
    body = rawText ? JSON.parse(rawText) : {};
  } catch {
    throw new Error(sanitizeErrorText(rawText, `Upload failed (${response.status})`));
  }
  if (!response.ok) {
    throw new Error(
      sanitizeErrorText(body.message || body.error || `Upload failed (${response.status})`),
    );
  }
  if (!body.url) throw new Error('Upload response missing media URL');
  if (onUploadProgress) onUploadProgress(1);
  return { url: body.url, mediaType: body.mediaType || (asset.type || '').split('/')[0] || 'image', thumbnailUrl: body.thumbnailUrl || null, data: body };
};

export const getUploadErrorMessage = error =>
  getApiErrorMessage(error, 'Media upload failed. Please try again.');

export default uploadImageAsset;
