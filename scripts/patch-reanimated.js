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

// 1. Ensure directory junction android/Common -> ../Common exists
if (!fs.existsSync(commonJunctionPath) && fs.existsSync(commonRealPath)) {
  try {
    if (process.platform === 'win32') {
      execSync(`cmd.exe /c mklink /J "${commonJunctionPath}" "${commonRealPath}"`, { stdio: 'ignore' });
      console.log('Created junction for reanimated/android/Common');
    }
  } catch (e) {
    console.warn('Could not create Common junction:', e.message);
  }
}

// 2. Patch CMakeLists.txt to handle Windows long paths and avoid infinite glob verification loop
let cmakeContent = fs.readFileSync(cmakeListsPath, 'utf8');

if (!cmakeContent.includes('CMAKE_OBJECT_PATH_MAX')) {
  cmakeContent = cmakeContent.replace(
    'cmake_minimum_required(VERSION 3.8)',
    'cmake_minimum_required(VERSION 3.8)\n\nset(CMAKE_OBJECT_PATH_MAX 1024)'
  );
}

// Update COMMON_SRC_DIR to point to local Common junction
if (cmakeContent.includes('set (COMMON_SRC_DIR ${CMAKE_SOURCE_DIR}/../Common)')) {
  cmakeContent = cmakeContent.replace(
    'set (COMMON_SRC_DIR ${CMAKE_SOURCE_DIR}/../Common)',
    'set (COMMON_SRC_DIR "${CMAKE_SOURCE_DIR}/Common")'
  );
}

// Remove CONFIGURE_DEPENDS which breaks on Windows CMake Ninja
if (cmakeContent.includes('file(GLOB_RECURSE SOURCES_COMMON CONFIGURE_DEPENDS "${COMMON_SRC_DIR}/cpp/**.cpp")')) {
  cmakeContent = cmakeContent.replace(
    'file(GLOB_RECURSE SOURCES_COMMON CONFIGURE_DEPENDS "${COMMON_SRC_DIR}/cpp/**.cpp")',
    'file(GLOB_RECURSE SOURCES_COMMON "${COMMON_SRC_DIR}/cpp/**.cpp")'
  );
}

// Avoid Ninja space-splitting bug in build.ninja by inlining folly-flags instead of including path with spaces
if (cmakeContent.includes('include("${REACT_NATIVE_DIR}/ReactAndroid/cmake-utils/folly-flags.cmake")')) {
  cmakeContent = cmakeContent.replace(
    'include("${REACT_NATIVE_DIR}/ReactAndroid/cmake-utils/folly-flags.cmake")',
    'set(folly_FLAGS -DFOLLY_NO_CONFIG=1 -DFOLLY_HAVE_CLOCK_GETTIME=1 -DFOLLY_USE_LIBCPP=1 -DFOLLY_MOBILE=1 -DFOLLY_HAVE_RECVMMSG=1 -DFOLLY_HAVE_PTHREAD=1 -DFOLLY_HAVE_XSI_STRERROR_R=1)'
  );
}

// Disable -Werror so Clang 19 / NDK 28 warnings like -Wvla-cxx-extension do not fail the build
if (cmakeContent.includes('-std=c++${CMAKE_CXX_STANDARD} -Wall -Werror')) {
  cmakeContent = cmakeContent.replace(
    '-std=c++${CMAKE_CXX_STANDARD} -Wall -Werror',
    '-std=c++${CMAKE_CXX_STANDARD} -Wall -Wno-error -Wno-vla-cxx-extension'
  );
}

fs.writeFileSync(cmakeListsPath, cmakeContent, 'utf8');
console.log('Patched react-native-reanimated CMakeLists.txt successfully');
