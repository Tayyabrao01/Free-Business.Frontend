const gold = '#D4AF37';
const black = '#000000';
const darkCard = '#1a1a1a';

export const streamTheme = {
  dark: {
    colors: {
      accent_blue: gold,
      accent_green: gold,
      accent_red: '#e74c3c',
      bg_gradient_end: black,
      bg_gradient_start: black,
      black,
      blue_alice: darkCard,
      border: '#333333',
      grey: '#888888',
      grey_dark: '#666666',
      grey_gainsboro: '#444444',
      grey_whisper: '#333333',
      icon_background: darkCard,
      light_gray: darkCard,
      light_grey: '#cccccc',
      modal_shadow: '#000000',
      overlay: '#000000CC',
      shadow_icon: '#000000',
      targetedMessageBackground: '#2a2a1a',
      transparent: 'transparent',
      white: gold,
      white_smoke: darkCard,
      white_snow: black,
    },
    messageInput: {
      container: {
        backgroundColor: darkCard,
        borderTopColor: gold,
        borderTopWidth: 1,
        paddingBottom: 4,
      },
      inputBoxContainer: {
        backgroundColor: black,
        borderColor: gold,
      },
      focusedInputBoxContainer: {
        borderColor: gold,
      },
      inputBox: {
        color: gold,
      },
      sendButtonIcon: {
        color: gold,
      },
      attachButtonContainer: {},
      composerContainer: {},
    },
    messageList: {
      container: {
        backgroundColor: black,
      },
    },
    channelListMessenger: {
      flatList: {
        backgroundColor: black,
      },
      flatListContent: {
        backgroundColor: black,
      },
    },
  },
};

export const streamChatStyle = {
  style: streamTheme,
};

export default streamTheme;
