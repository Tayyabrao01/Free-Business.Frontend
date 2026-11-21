module.exports = {
  presets: [
    'module:@react-native/babel-preset',
    '@babel/preset-typescript',
  ],
  overrides: [
    {
      test: /node_modules[\\/]stream-chat-react-native[\\/].*\.ts$/,
      presets: ['@babel/preset-typescript'],
    },
  ],
  plugins: ['react-native-reanimated/plugin'],
};
