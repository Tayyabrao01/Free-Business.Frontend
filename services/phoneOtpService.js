import { isValidPkLocalPhone, toE164FromLocal } from '../utils/pakistanPhone';

const getAuth = () => {
  try {
    const firebase = require('@react-native-firebase/app').default;
    if (!firebase.apps?.length) {
      return null;
    }
    return require('@react-native-firebase/auth').default;
  } catch {
    return null;
  }
};

const firebaseNotReadyError = () =>
  new Error(
    'Firebase is not set up on this build. Add google-services.json for pk.freebusinessik.app, rebuild, and reinstall. See FIREBASE_OTP_SETUP.md'
  );

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
    return 'Invalid phone number. Enter 10 digits starting with 3, e.g. 3001234567';
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
      'project settings for pk.freebusinessik.app. See FIREBASE_OTP_SETUP.md'
    );
  }

  return message || 'Failed to send or verify OTP';
};

/**
 * Accepts local PK digits (3001234567), +923001234567, or 923001234567.
 */
export const normalizePhone = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return '';

  if (raw.startsWith('+')) {
    return raw.replace(/(?!^\+)[^\d]/g, '');
  }

  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';

  if (digits.startsWith('92') && digits.length >= 12) {
    return `+${digits.slice(0, 12)}`;
  }
  if (digits.startsWith('0') && digits.length === 11) {
    return `+92${digits.slice(1)}`;
  }

  return toE164FromLocal(digits);
};

export const validatePhoneForOtp = (value) => {
  const e164 = normalizePhone(value);
  if (!/^\+923\d{9}$/.test(e164)) {
    return {
      ok: false,
      error: 'Enter a valid Pakistani mobile number (10 digits starting with 3)',
    };
  }
  const local = e164.slice(3);
  if (!isValidPkLocalPhone(local)) {
    return { ok: false, error: 'Number must start with 3 and be 10 digits long' };
  }
  return { ok: true, e164 };
};

export const sendPhoneOtp = async (phone) => {
  const auth = getAuth();
  if (!auth) {
    throw firebaseNotReadyError();
  }

  const check = validatePhoneForOtp(phone);
  if (!check.ok) {
    throw new Error(check.error);
  }

  try {
    return await auth().signInWithPhoneNumber(check.e164);
  } catch (error) {
    const friendly = mapFirebaseOtpError(error);
    const wrapped = new Error(friendly);
    wrapped.code = error?.code;
    throw wrapped;
  }
};

export const confirmPhoneOtp = async (confirmation, code) => {
  const auth = getAuth();
  if (!auth) {
    throw firebaseNotReadyError();
  }

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
