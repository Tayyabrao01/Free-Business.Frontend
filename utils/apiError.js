export const CLOUDFLARE_USER_MESSAGE =
  'Server security check is blocking the app. Wait a minute and try again. If it keeps happening, ask admin to allow the mobile API in Cloudflare (disable Under Attack mode for /api).';

const NETWORK_USER_MESSAGE =
  'Network error. Check your internet connection and try again.';

const looksLikeHtml = (value) => {
  if (typeof value !== 'string') {
    return false;
  }
  const text = value.trim().toLowerCase();
  if (!text) {
    return false;
  }
  return (
    text.startsWith('<!doctype') ||
    text.startsWith('<html') ||
    text.includes('<html') ||
    text.includes('<head') ||
    text.includes('<title>') ||
    text.includes('checking your browser') ||
    text.includes('cf-browser-verification') ||
    text.includes('cloudflare') ||
    text.includes('just a moment') ||
    text.includes('attention required') ||
    text.includes('enable javascript and cookies')
  );
};

export const isCloudflareChallenge = (value, status) => {
  if (status === 403 || status === 503 || status === 520 || status === 521 || status === 522) {
    if (looksLikeHtml(value)) {
      return true;
    }
  }
  return looksLikeHtml(value);
};

export const isCloudflareBlockedError = (error) => {
  if (!error) {
    return false;
  }
  const status = error.response?.status;
  const data = error.response?.data;
  const contentType = String(
    error.response?.headers?.['content-type'] ||
      error.response?.headers?.['Content-Type'] ||
      ''
  ).toLowerCase();
  if (contentType.includes('text/html')) {
    return true;
  }
  if (isCloudflareChallenge(data, status)) {
    return true;
  }
  if (typeof data === 'object' && data) {
    const nested = data.message || data.error || '';
    if (nested === CLOUDFLARE_USER_MESSAGE || isCloudflareChallenge(nested, status)) {
      return true;
    }
  }
  return error.message === CLOUDFLARE_USER_MESSAGE;
};

/**
 * Strip HTML / Cloudflare challenge pages into a short user-facing message.
 * Never return raw HTML to Alerts or screens.
 */
export const sanitizeErrorText = (value, fallback = 'Something went wrong') => {
  if (value == null) {
    return fallback;
  }

  if (typeof value === 'object') {
    return sanitizeErrorText(
      value.message || value.error || value.msg || '',
      fallback
    );
  }

  const text = String(value).trim();
  if (!text) {
    return fallback;
  }

  if (isCloudflareChallenge(text)) {
    return CLOUDFLARE_USER_MESSAGE;
  }

  if (looksLikeHtml(text) || text.length > 280) {
    // Long blobs / HTML should never hit the UI
    if (
      text.toLowerCase().includes('network') ||
      text.toLowerCase().includes('timeout')
    ) {
      return NETWORK_USER_MESSAGE;
    }
    return fallback;
  }

  return text;
};

const extractResponsePayload = (error) => {
  const data = error?.response?.data;
  if (!data) {
    return null;
  }
  if (typeof data === 'string') {
    const trimmed = data.trim();
    if (!trimmed) {
      return null;
    }
    if (isCloudflareChallenge(trimmed, error?.response?.status)) {
      return { message: CLOUDFLARE_USER_MESSAGE, error: CLOUDFLARE_USER_MESSAGE };
    }
    if (looksLikeHtml(trimmed)) {
      return { message: CLOUDFLARE_USER_MESSAGE, error: CLOUDFLARE_USER_MESSAGE };
    }
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        return JSON.parse(trimmed);
      } catch (_) {
        return { message: sanitizeErrorText(trimmed), error: sanitizeErrorText(trimmed) };
      }
    }
    return {
      message: sanitizeErrorText(trimmed),
      error: sanitizeErrorText(trimmed),
    };
  }
  return data;
};

export const getApiErrorMessage = (error, fallback = 'Something went wrong') => {
  if (!error) {
    return fallback;
  }

  if (typeof error === 'string') {
    return sanitizeErrorText(error, fallback);
  }

  const status = error.response?.status;
  const payload = extractResponsePayload(error);
  const rawFromPayload = payload?.message || payload?.error || payload?.msg;
  const contentType = String(
    error.response?.headers?.['content-type'] ||
      error.response?.headers?.['Content-Type'] ||
      ''
  ).toLowerCase();

  if (
    contentType.includes('text/html') ||
    isCloudflareChallenge(rawFromPayload, status) ||
    isCloudflareChallenge(error.response?.data, status)
  ) {
    return CLOUDFLARE_USER_MESSAGE;
  }

  if (status === 403 && looksLikeHtml(String(error.response?.data || ''))) {
    return CLOUDFLARE_USER_MESSAGE;
  }

  const rawMessage = rawFromPayload || error.message;
  const serverMessage = sanitizeErrorText(
    normalizeServerMessage(rawMessage),
    ''
  );

  if (status === 404) {
    return (
      'Server API is out of date (missing routes). Upload the latest backend folder to Hostinger, run npm install, set .env (Mongo, JWT, Stream), then restart Node.'
    );
  }

  if (status === 401) {
    return 'Session expired. Please log out and log in again.';
  }

  if (status === 429) {
    return (
      serverMessage ||
      'Too many requests. Please wait a minute and try again.'
    );
  }

  if (status === 502 || status === 503 || status === 504) {
    return 'Server is temporarily unavailable. Please try again in a moment.';
  }

  if (!error.response && (error.message === 'Network Error' || error.code === 'ECONNABORTED')) {
    return NETWORK_USER_MESSAGE;
  }

  if (!error.response && error.message) {
    return sanitizeErrorText(error.message, fallback);
  }

  return serverMessage || fallback;
};

const normalizeServerMessage = (value) => {
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (isCloudflareChallenge(trimmed) || looksLikeHtml(trimmed)) {
      return CLOUDFLARE_USER_MESSAGE;
    }
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        return normalizeServerMessage(JSON.parse(trimmed));
      } catch (_) {
        // fall through
      }
    }

    const text = trimmed.toLowerCase();
    if (text.includes('unrecognised ip') || text.includes('unrecognized ip')) {
      return 'Email service blocked this server. Ask admin to authorize the Hostinger IP in Brevo security settings, then try again.';
    }
    if (text.includes('unauthorized') && text.includes('ip')) {
      return 'Email service blocked this server IP. Ask admin to authorize it in Brevo, then try again.';
    }
    if (
      text.includes('sender') ||
      text.includes('not verified') ||
      text.includes('not valid') ||
      text.includes('invalid_parameter')
    ) {
      return 'Email sender is not verified in Brevo. Ask admin to set noreply@freebusinessgip.com in email.config.js.';
    }

    return trimmed;
  }

  if (typeof value === 'object') {
    return normalizeServerMessage(value.message || value.error || '');
  }

  return String(value);
};

/** Normalize Stream / network / Cloudflare errors for display */
export const formatDisplayError = (error, fallback = 'Something went wrong') => {
  const msg = getApiErrorMessage(error, fallback);
  const clean = sanitizeErrorText(msg, fallback);
  if (clean.includes('URLSearchParams')) {
    return 'App needs an update. Reinstall the latest APK from your developer.';
  }
  return clean;
};

export default getApiErrorMessage;
