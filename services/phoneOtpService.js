import auth from '@react-native-firebase/auth';

/**
 * Maps Firebase Auth errors to short, actionable messages for users.
 */
export const mapFirebaseOtpError = (error) => {
  const code = error?.code || '';
  const message = String(error?.message || '');

  if (code === 'auth/operation-not-allowed' || message.includes('operation-not-allowed')) {
    return (
      'Phone OTP is not enabled in Firebase yet. In Firebase Console: enable Phone sign-in, ' +
      'add Pakistan (PK) under Authentication → Settings → SMS region policy, add your app SHA-1, ' +
      'then download a new google-services.json and reinstall the app. See FIREBASE_OTP_SETUP.md'
    );
  }
  if (message.includes('region enabled') || message.includes('SMS unable')) {
    return (
      'SMS to Pakistan (+92) is blocked in Firebase. Open Firebase Console → Authentication → ' +
      'Settings → SMS region policy → Allow → add Pakistan (PK). See FIREBASE_OTP_SETUP.md'
    );
  }
  if (code === 'auth/invalid-phone-number') {
    return 'Invalid phone number. Use format +923001234567 (country code + number).';
  }
  if (code === 'auth/missing-phone-number') {
    return 'Phone number is required.';
  }
  if (code === 'auth/too-many-requests') {
    return 'Too many OTP attempts. Please wait 15–30 minutes and try again.';
  }
  if (code === 'auth/quota-exceeded') {
    return 'SMS quota exceeded on Firebase. Try again later or use Password login.';
  }
  if (code === 'auth/invalid-verification-code') {
    return 'Wrong OTP code. Check the SMS and try again.';
  }
  if (code === 'auth/code-expired' || code === 'auth/session-expired') {
    return 'OTP expired. Tap Send OTP again.';
  }
  if (code === 'auth/app-not-authorized') {
    return (
      'This app is not authorized for Firebase Phone Auth. Add SHA-1/SHA-256 in Firebase ' +
      'project settings for com.freebusinessapp. See FIREBASE_OTP_SETUP.md'
    );
  }

  return message || 'Failed to send or verify OTP';
};

export const normalizePhone = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const withPlus = raw.startsWith('+') ? raw : `+${raw}`;
  return withPlus.replace(/(?!^\+)[^\d]/g, '');
};

export const sendPhoneOtp = async (phone) => {
  const normalized = normalizePhone(phone);
  if (!normalized) {
    throw new Error('Phone number is required');
  }
  if (!/^\+92\d{10}$/.test(normalized) && !/^\+\d{8,15}$/.test(normalized)) {
    throw new Error('Use international format, e.g. +923001234567');
  }
  try {
    return await auth().signInWithPhoneNumber(normalized);
  } catch (error) {
    const friendly = mapFirebaseOtpError(error);
    const wrapped = new Error(friendly);
    wrapped.code = error?.code;
    throw wrapped;
  }
};

export const confirmPhoneOtp = async (confirmation, code) => {
  if (!confirmation) {
    throw new Error('OTP session expired. Please resend code.');
  }
  if (!code || String(code).trim().length < 4) {
    throw new Error('Please enter a valid OTP code');
  }
  try {
    const credential = await confirmation.confirm(String(code).trim());
    const idToken = await credential.user.getIdToken(true);
    return {
      idToken,
      phoneNumber: credential.user.phoneNumber,
      uid: credential.user.uid,
    };
  } catch (error) {
    const friendly = mapFirebaseOtpError(error);
    const wrapped = new Error(friendly);
    wrapped.code = error?.code;
    throw wrapped;
  }
};
