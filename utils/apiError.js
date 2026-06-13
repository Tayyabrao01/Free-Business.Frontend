export const getApiErrorMessage = (error, fallback = 'Something went wrong') => {
  if (!error) {
    return fallback;
  }

  const status = error.response?.status;
  const serverMessage =
    error.response?.data?.message ||
    error.response?.data?.error ||
    error.message;

  if (status === 404) {
    return (
      'Server API is out of date (missing routes). Upload the latest backend folder to Hostinger, run npm install, set .env (Mongo, JWT, Stream), then restart Node.'
    );
  }

  if (status === 401) {
    return 'Session expired. Please log out and log in again.';
  }

  if (status === 429) {
    return 'Too many requests. Wait a minute and try again.';
  }

  if (!error.response && (error.message === 'Network Error' || error.code === 'ECONNABORTED')) {
    return 'Network error. Check internet, try a smaller photo, or ensure the latest backend is deployed on the server.';
  }

  return serverMessage || fallback;
};

/** Normalize Stream / network errors for display */
export const formatDisplayError = (error, fallback = 'Something went wrong') => {
  const msg = getApiErrorMessage(error, fallback);
  if (msg.includes('URLSearchParams')) {
    return 'App needs an update. Reinstall the latest APK from your developer.';
  }
  return msg;
};

export default getApiErrorMessage;
