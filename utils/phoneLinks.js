import { Linking, Alert } from 'react-native';

export const digitsOnly = (value) => String(value || '').replace(/\D/g, '');

export const openPhoneDialer = (phone) => {
  const digits = digitsOnly(phone);
  if (!digits) {
    return false;
  }
  Linking.openURL(`tel:${digits}`).catch(() => {
    Alert.alert('Cannot open phone app');
  });
  return true;
};

export const openWhatsApp = (whatsappNumber) => {
  const digits = digitsOnly(whatsappNumber);
  if (!digits) {
    return false;
  }
  Linking.openURL(`https://wa.me/${digits}`).catch(() => {
    Alert.alert('Cannot open WhatsApp');
  });
  return true;
};
