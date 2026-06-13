/**
 * react-native-video 5.x pulls invalid com.android.support:appcompat-v7:31.0.0
 * via Android-ScalableVideoView. Exclude it and use AndroidX appcompat instead.
 */
const fs = require('fs');
const path = require('path');

const target = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-native-video',
  'android',
  'build.gradle'
);

if (!fs.existsSync(target)) {
  process.exit(0);
}

const patchedDeps = `dependencies {
    //noinspection GradleDynamicVersion
    implementation "com.facebook.react:react-native:\${safeExtGet('reactNativeVersion', '+')}"
    implementation('com.github.adityaxjha:Android-ScalableVideoView:10e7b4da8b') {
        exclude group: 'com.android.support', module: 'appcompat-v7'
    }
    implementation 'androidx.appcompat:appcompat:1.6.1'
}
`;

let source = fs.readFileSync(target, 'utf8');
const depsRegex = /dependencies\s*\{[\s\S]*?\n\}/m;

if (!depsRegex.test(source)) {
  process.exit(0);
}

const next = source.replace(depsRegex, patchedDeps);

if (next === source) {
  process.exit(0);
}

fs.writeFileSync(target, next, 'utf8');
console.log('Patched react-native-video android/build.gradle (AndroidX appcompat)');
