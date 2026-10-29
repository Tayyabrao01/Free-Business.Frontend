import { Platform } from 'react-native';
import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_USER_AGENT, BASE_URL } from './api';
import api from './api';
import { buildImageFormData, prepareImageForUpload } from '../utils/prepareImageUpload';
import { multipartUploadConfig } from '../utils/multipartUpload';
import { getApiErrorMessage, sanitizeErrorText } from '../utils/apiError';

const stripFilePrefix = (uri) => uri.replace(/^file:\/\//i, '');

const readFileBase64 = async (uri) => {
  const path = stripFilePrefix(uri);
  return RNFS.readFile(path, 'base64');
};

/**
 * Upload a gallery asset; tries multipart (fetch), then axios, then base64 JSON.
 */
export const uploadImageAsset = async (asset) => {
  const token = await AsyncStorage.getItem('token');
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const parseUploadResponse = (data) => {
    const url = data?.image?.url || data?.imageUrl || data?.url;
    if (!url) {
      throw new Error('Upload response missing image URL');
    }
    return { url, data };
  };

  // 1) fetch + FormData (most reliable on React Native Android)
  try {
    const formData = await buildImageFormData(asset, 'image');
    const response = await fetch(`${BASE_URL}/images/upload`, {
      method: 'POST',
      headers: {
        ...authHeaders,
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
      throw new Error(
        sanitizeErrorText(rawText, `Upload failed (${response.status})`)
      );
    }
    if (!response.ok) {
      throw new Error(
        sanitizeErrorText(
          body.message || body.error || `Upload failed (${response.status})`
        )
      );
    }
    return parseUploadResponse(body);
  } catch (fetchError) {
    console.warn('uploadImageAsset fetch multipart failed:', fetchError?.message);
  }

  // 2) axios + FormData
  try {
    const formData = await buildImageFormData(asset, 'image');
    const response = await api.post('/images/upload', formData, multipartUploadConfig);
    return parseUploadResponse(response.data);
  } catch (axiosError) {
    console.warn(
      'uploadImageAsset axios multipart failed:',
      getApiErrorMessage(axiosError)
    );
  }

  // 3) base64 JSON fallback (works when multipart is blocked)
  const filePart = await prepareImageForUpload(asset);
  let readUri = filePart.uri;
  if (Platform.OS === 'android' && !readUri.startsWith('file://')) {
    readUri = `file://${readUri}`;
  }
  const base64 = await readFileBase64(readUri);
  const response = await api.post('/images/upload-base64', {
    image: base64,
    mimeType: filePart.type || 'image/jpeg',
  });
  return parseUploadResponse(response.data);
};

export default uploadImageAsset;
