import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { useTranslation } from '../hooks/useTranslation';

const LanguageToggle = ({ style }) => {
  const { language, setLanguage, t } = useTranslation();

  const showLanguagePicker = () => {
    Alert.alert(
      t('profile.selectLanguage'),
      '',
      [
        {
          text: t('common.english'),
          onPress: () => setLanguage('en'),
        },
        {
          text: t('common.urdu'),
          onPress: () => setLanguage('ur'),
        },
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <TouchableOpacity style={[styles.button, style]} onPress={showLanguagePicker}>
      <Text style={styles.buttonText}>
        {language === 'ur' ? 'EN' : 'اردو'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#D4AF37',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 10,
  },
  buttonText: {
    color: '#D4AF37',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default LanguageToggle;
