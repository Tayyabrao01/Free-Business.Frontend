/**
 * Disable autolinking for react-native-code-push on Android —
 * it is linked manually (settings.gradle + implementation project)
 * because its Android sources live under android/app.
 */
module.exports = {
  dependencies: {
    'react-native-code-push': {
      platforms: {
        android: null,
      },
    },
  },
};
