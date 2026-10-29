/**
 * Revopush OTA config for FreeBusiness_android.
 *
 * Client SDK: microsoft/react-native-code-push (required for RN 0.72).
 * Server: https://api.revopush.org
 * Keys are applied in android/app/build.gradle (debug=Staging, release=Production).
 */
export const REVOPUSH_APP_NAME = 'FreeBusiness_android';
export const REVOPUSH_SERVER_URL = 'https://api.revopush.org';

export const REVOPUSH_DEPLOYMENT_KEYS = {
  Production: 'DkGQISjhDL-VTNpLubx1rFvGYnMDVy6RKZ8QNx',
  Staging: 'Of6KOCSdCIcqvc5U83NA5a1KZu3BVy6RKZ8QNx',
};
