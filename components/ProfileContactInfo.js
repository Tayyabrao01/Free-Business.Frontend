import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
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
      <View style={styles.headerRow}>
        <Ionicons name="shield-checkmark" size={14} color="#10B981" />
        <Text style={styles.sectionTitle}>VERIFIED CONTACTS</Text>
      </View>

      {hasPhone ? (
        <TouchableOpacity
          style={styles.cardRow}
          activeOpacity={0.7}
          onPress={() => openPhoneDialer(phone)}
        >
          <View style={styles.iconCircle}>
            <Ionicons name="call-outline" size={18} color="#D4AF37" />
          </View>
          <View style={styles.textGroup}>
            <Text style={styles.label}>{t('profile.phone')}</Text>
            <Text style={styles.value}>{phone}</Text>
          </View>
          <View style={styles.actionPill}>
            <Ionicons name="call" size={12} color="#D4AF37" />
            <Text style={styles.actionText}>{t('profile.tapPhoneToCall') || 'Call'}</Text>
          </View>
        </TouchableOpacity>
      ) : null}

      {hasFreeBusinessNumber ? (
        <TouchableOpacity
          style={[styles.cardRow, hasPhone && styles.dividerTop]}
          activeOpacity={0.7}
          onPress={() => openPhoneDialer(whatsappNumber)}
        >
          <View style={[styles.iconCircle, styles.goldIconCircle]}>
            <Ionicons name="business-outline" size={18} color="#D4AF37" />
          </View>
          <View style={styles.textGroup}>
            <Text style={styles.label}>{t('profile.freeBusinessNumber')}</Text>
            <Text style={[styles.value, styles.goldValue]}>{whatsappNumber}</Text>
          </View>
          <View style={[styles.actionPill, styles.goldActionPill]}>
            <Ionicons name="headset" size={12} color="#0A0A0E" />
            <Text style={styles.goldActionText}>Helpline</Text>
          </View>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#141419',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#23232C',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#8E8E9F',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  dividerTop: {
    borderTopWidth: 1,
    borderTopColor: '#1E1E26',
    marginTop: 6,
    paddingTop: 14,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  goldIconCircle: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderColor: 'rgba(212, 175, 55, 0.35)',
  },
  textGroup: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: '#8E8E9F',
    fontWeight: '500',
    marginBottom: 2,
  },
  value: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  goldValue: {
    color: '#D4AF37',
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  actionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D4AF37',
  },
  goldActionPill: {
    backgroundColor: '#D4AF37',
    borderColor: '#D4AF37',
  },
  goldActionText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0A0A0E',
  },
});

export default ProfileContactInfo;
