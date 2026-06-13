import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from '../hooks/useTranslation';
import { openPhoneDialer } from '../utils/phoneLinks';

const ProfileContactInfo = ({ phone, whatsappNumber, style }) => {
  const { t } = useTranslation();
  const hasPhone = Boolean(phone?.trim());
  const hasFreeBusinessNumber = Boolean(whatsappNumber?.trim());

  if (!hasPhone && !hasFreeBusinessNumber) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      {hasPhone ? (
        <TouchableOpacity style={styles.row} onPress={() => openPhoneDialer(phone)}>
          <Text style={styles.label}>{t('profile.phone')}</Text>
          <Text style={styles.value}>{phone}</Text>
        </TouchableOpacity>
      ) : null}
      {hasFreeBusinessNumber ? (
        <TouchableOpacity style={styles.row} onPress={() => openPhoneDialer(whatsappNumber)}>
          <Text style={styles.label}>{t('profile.freeBusinessNumber')}</Text>
          <Text style={styles.value}>{whatsappNumber}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  row: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  label: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#D4AF37',
    fontWeight: '600',
  },
});

export default ProfileContactInfo;
