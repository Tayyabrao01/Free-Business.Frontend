/**
 * Fixes broken Kotlin casts in Stream Video SDK thermal-status helpers.
 * Some installs end up with invalid syntax:
 *   getSystemService(Context.POWER_SERVICE as PowerManager
 * instead of:
 *   getSystemService(Context.POWER_SERVICE) as PowerManager
 */
const fs = require('fs');
const path = require('path');

const target = path.join(
  __dirname,
  '..',
  'node_modules',
  '@stream-io',
  'video-react-native-sdk',
  'android',
  'src',
  'main',
  'java',
  'com',
  'streamvideo',
  'reactnative',
  'StreamVideoReactNativeModule.kt'
);

if (!fs.existsSync(target)) {
  process.exit(0);
}

let source = fs.readFileSync(target, 'utf8');
const broken = 'getSystemService(Context.POWER_SERVICE as PowerManager';
const fixed = 'getSystemService(Context.POWER_SERVICE) as PowerManager';

if (source.includes(broken)) {
  source = source.split(broken).join(fixed);
  fs.writeFileSync(target, source, 'utf8');
  console.log('Patched Stream Video Kotlin thermal-status casts');
}
