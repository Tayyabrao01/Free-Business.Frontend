const gold = '#D4AF37';
const bgDark = '#0A0A0E';
const surfaceDark = '#141419';
const borderDark = '#22222E';
const textWhite = '#FFFFFF';
const textMuted = '#8A8A96';

export const streamTheme = {
  dark: {
    colors: {
      accent_blue: gold,
      accent_green: '#10B981',
      accent_red: '#FF6B6B',
      bg_gradient_end: bgDark,
      bg_gradient_start: bgDark,
      black: bgDark,
      blue_alice: surfaceDark,
      border: borderDark,
      grey: textMuted,
      grey_dark: '#5C5C6A',
      grey_gainsboro: '#252532',
      grey_whisper: '#1A1A24',
      icon_background: '#191924',
      light_gray: surfaceDark,
      light_grey: '#D0D0DC',
      modal_shadow: '#000000',
      overlay: '#000000CC',
      shadow_icon: '#000000',
      targetedMessageBackground: 'rgba(212, 175, 55, 0.12)',
      transparent: 'transparent',
      white: textWhite,
      static_white: textWhite,
      static_black: bgDark,
      white_smoke: surfaceDark,
      white_snow: bgDark,
    },
    messageInput: {
      container: {
        backgroundColor: bgDark,
        borderTopColor: '#1A1A24',
        borderTopWidth: 1,
        paddingHorizontal: 10,
        paddingVertical: 8,
      },
      inputBoxContainer: {
        backgroundColor: surfaceDark,
        borderColor: '#262634',
        borderWidth: 1,
        borderRadius: 22,
        paddingHorizontal: 12,
      },
      focusedInputBoxContainer: {
        borderColor: gold,
      },
      inputBox: {
        color: textWhite,
        fontSize: 14.5,
      },
      sendButtonIcon: {
        color: gold,
      },
      attachButtonContainer: {
        paddingRight: 4,
      },
    },
    messageList: {
      container: {
        backgroundColor: bgDark,
      },
    },
    channelListMessenger: {
      flatList: {
        backgroundColor: bgDark,
      },
      flatListContent: {
        backgroundColor: bgDark,
        paddingBottom: 24,
      },
    },
  },
};

export const streamChatStyle = {
  style: streamTheme,
};

export default streamTheme;
