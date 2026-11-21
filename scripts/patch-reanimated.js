const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const reanimatedDir = path.join(__dirname, '..', 'node_modules', 'react-native-reanimated');
const androidDir = path.join(reanimatedDir, 'android');
const cmakeListsPath = path.join(androidDir, 'CMakeLists.txt');
const commonJunctionPath = path.join(androidDir, 'Common');
const commonRealPath = path.join(reanimatedDir, 'Common');

if (!fs.existsSync(cmakeListsPath)) {
  process.exit(0);
}

const applyObjectPathMax = (content) => {
  if (content.includes('CMAKE_OBJECT_PATH_MAX')) {
    return content.replace(
      /set\(CMAKE_OBJECT_PATH_MAX \d+\)/g,
      'set(CMAKE_OBJECT_PATH_MAX 50)'
    );
  }
  return content.replace(
    /cmake_minimum_required\(VERSION 3\.8\)/,
    'cmake_minimum_required(VERSION 3.8)\nset(CMAKE_OBJECT_PATH_MAX 50)'
  );
};

if (!fs.existsSync(commonJunctionPath) && fs.existsSync(commonRealPath)) {
  try {
    if (process.platform === 'win32') {
      execSync(`cmd.exe /c mklink /J "${commonJunctionPath}" "${commonRealPath}"`, {
        stdio: 'ignore',
      });
      console.log('Created junction for reanimated/android/Common');
    }
  } catch (e) {
    console.warn('Could not create Common junction:', e.message);
  }
}

const cmakeFiles = [];
const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (entry.name === 'CMakeLists.txt') {
      cmakeFiles.push(full);
    }
  }
};
walk(androidDir);

for (const filePath of cmakeFiles) {
  let cmakeContent = fs.readFileSync(filePath, 'utf8');
  cmakeContent = applyObjectPathMax(cmakeContent);
  cmakeContent = cmakeContent.replace(/ CONFIGURE_DEPENDS/g, '');
  fs.writeFileSync(filePath, cmakeContent, 'utf8');
}

let cmakeContent = fs.readFileSync(cmakeListsPath, 'utf8');

if (cmakeContent.includes('set (COMMON_SRC_DIR ${CMAKE_SOURCE_DIR}/../Common)')) {
  cmakeContent = cmakeContent.replace(
    'set (COMMON_SRC_DIR ${CMAKE_SOURCE_DIR}/../Common)',
    'set (COMMON_SRC_DIR "${CMAKE_SOURCE_DIR}/Common")'
  );
}

if (cmakeContent.includes('set(COMMON_CPP_DIR "${CMAKE_SOURCE_DIR}/../Common/cpp")')) {
  cmakeContent = cmakeContent.replace(
    'set(COMMON_CPP_DIR "${CMAKE_SOURCE_DIR}/../Common/cpp")',
    'set(COMMON_CPP_DIR "${CMAKE_SOURCE_DIR}/Common/cpp")'
  );
}

if (cmakeContent.includes('include("${REACT_NATIVE_DIR}/ReactAndroid/cmake-utils/folly-flags.cmake")')) {
  cmakeContent = cmakeContent.replace(
    'include("${REACT_NATIVE_DIR}/ReactAndroid/cmake-utils/folly-flags.cmake")',
    'set(folly_FLAGS -DFOLLY_NO_CONFIG=1 -DFOLLY_HAVE_CLOCK_GETTIME=1 -DFOLLY_USE_LIBCPP=1 -DFOLLY_MOBILE=1 -DFOLLY_HAVE_RECVMMSG=1 -DFOLLY_HAVE_PTHREAD=1 -DFOLLY_HAVE_XSI_STRERROR_R=1)'
  );
}

if (cmakeContent.includes('-std=c++${CMAKE_CXX_STANDARD} -Wall -Werror')) {
  cmakeContent = cmakeContent.replace(
    '-std=c++${CMAKE_CXX_STANDARD} -Wall -Werror',
    '-std=c++${CMAKE_CXX_STANDARD} -Wall -Wno-error -Wno-vla-cxx-extension'
  );
}

fs.writeFileSync(cmakeListsPath, cmakeContent, 'utf8');

const gradlePath = path.join(androidDir, 'build.gradle');
if (fs.existsSync(gradlePath)) {
  let gradle = fs.readFileSync(gradlePath, 'utf8');
  if (!gradle.includes('-DCMAKE_OBJECT_PATH_MAX=')) {
    gradle = gradle.replace(
      '"-DANDROID_SUPPORT_FLEXIBLE_PAGE_SIZES=ON"',
      '"-DANDROID_SUPPORT_FLEXIBLE_PAGE_SIZES=ON",\n                        "-DCMAKE_OBJECT_PATH_MAX=50"'
    );
  }
  fs.writeFileSync(gradlePath, gradle, 'utf8');
}

console.log('Patched react-native-reanimated CMakeLists.txt successfully');
