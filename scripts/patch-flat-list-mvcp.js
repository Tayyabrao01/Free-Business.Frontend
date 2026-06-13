/**
 * @stream-io/flat-list-mvcp ships an old android/build.gradle that uses jcenter (offline).
 * Patch it after npm install so Android builds succeed.
 */
const fs = require('fs');
const path = require('path');

const buildGradlePath = path.join(
  __dirname,
  '..',
  'node_modules',
  '@stream-io',
  'flat-list-mvcp',
  'android',
  'build.gradle'
);

if (!fs.existsSync(buildGradlePath)) {
  process.exit(0);
}

let content = fs.readFileSync(buildGradlePath, 'utf8');

if (content.includes('PATCHED_FOR_JCENTER')) {
  process.exit(0);
}

content = content.replace(/jcenter\(\)/g, 'mavenCentral()');
content = content.replace(
  /classpath\s+['"]com\.android\.tools\.build:gradle:3\.2\.1['"]/,
  "classpath 'com.android.tools.build:gradle:7.4.2' // PATCHED_FOR_JCENTER"
);

fs.writeFileSync(buildGradlePath, content, 'utf8');
console.log('Patched @stream-io/flat-list-mvcp/android/build.gradle');
