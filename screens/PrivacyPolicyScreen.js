import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useTranslation } from '../hooks/useTranslation';
import { PRIVACY_POLICY_URL, SUPPORT_EMAIL } from '../config/legal';

const PrivacyPolicyScreen = ({ navigation }) => {
  const { t } = useTranslation();

  const sections = [
    'intro',
    'dataWeCollect',
    'howWeUse',
    'sharing',
    'retention',
    'yourRights',
    'security',
    'children',
    'contact',
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>{t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('legal.privacyTitle')}</Text>
        <Text style={styles.updated}>{t('legal.lastUpdated')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {sections.map((key) => (
          <View key={key} style={styles.section}>
            <Text style={styles.sectionTitle}>{t(`legal.sections.${key}.title`)}</Text>
            <Text style={styles.sectionBody}>{t(`legal.sections.${key}.body`)}</Text>
          </View>
        ))}

        <TouchableOpacity
          style={styles.linkBtn}
          onPress={() => Linking.openURL(PRIVACY_POLICY_URL).catch(() => {})}
        >
          <Text style={styles.linkBtnText}>{t('legal.openWebVersion')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkBtn}
          onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`).catch(() => {})}
        >
          <Text style={styles.linkBtnText}>{SUPPORT_EMAIL}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  header: {
    backgroundColor: '#D4AF37',
    paddingTop: 50,
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  back: { color: '#000000', fontWeight: '600', marginBottom: 8 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#000000' },
  updated: { fontSize: 12, color: '#1a1a1a', marginTop: 6 },
  content: { padding: 20, paddingBottom: 40 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#D4AF37', marginBottom: 8 },
  sectionBody: { fontSize: 14, color: '#cccccc', lineHeight: 22 },
  linkBtn: {
    borderWidth: 1,
    borderColor: '#D4AF37',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  linkBtnText: { color: '#D4AF37', fontWeight: '600' },
});

export default PrivacyPolicyScreen;
