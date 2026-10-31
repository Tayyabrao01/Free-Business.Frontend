import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  StatusBar,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from '../hooks/useTranslation';
import { PRIVACY_POLICY_URL, SUPPORT_EMAIL } from '../config/legal';

const SECTION_ICONS = {
  intro: 'shield-checkmark-outline',
  dataWeCollect: 'file-tray-full-outline',
  howWeUse: 'cog-outline',
  sharing: 'people-outline',
  retention: 'time-outline',
  yourRights: 'hand-left-outline',
  security: 'lock-closed-outline',
  children: 'heart-outline',
  contact: 'mail-outline',
};

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
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0E" />

      {/* Top App Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.titleCol}>
          <View style={styles.statusBadgeRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.statusBadgeText}>SECURITY & COMPLIANCE</Text>
          </View>
          <Text style={styles.topTitle}>{t('legal.privacyTitle') || 'Privacy Policy'}</Text>
        </View>

        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Trust Banner Card */}
        <View style={styles.trustCard}>
          <Ionicons name="shield-checkmark" size={28} color="#D4AF37" />
          <View style={styles.trustTextCol}>
            <Text style={styles.trustTitle}>Your Privacy Is Protected</Text>
            <Text style={styles.trustSub}>
              We adhere strictly to secure data processing, encrypted communications, and transparent user controls.
            </Text>
            <Text style={styles.updatedText}>{t('legal.lastUpdated')}</Text>
          </View>
        </View>

        {/* Policy Sections */}
        {sections.map((key) => {
          const icon = SECTION_ICONS[key] || 'document-text-outline';
          return (
            <View key={key} style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionIconWrap}>
                  <Ionicons name={icon} size={18} color="#D4AF37" />
                </View>
                <Text style={styles.sectionTitle}>
                  {t(`legal.sections.${key}.title`)}
                </Text>
              </View>
              <Text style={styles.sectionBody}>
                {t(`legal.sections.${key}.body`)}
              </Text>
            </View>
          );
        })}

        {/* Action Buttons */}
        <View style={styles.actionsWrap}>
          <TouchableOpacity
            style={styles.primaryLinkBtn}
            onPress={() => Linking.openURL(PRIVACY_POLICY_URL).catch(() => {})}
            activeOpacity={0.85}
          >
            <Ionicons name="globe-outline" size={17} color="#0A0A0E" />
            <Text style={styles.primaryLinkBtnText}>{t('legal.openWebVersion')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryLinkBtn}
            onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`).catch(() => {})}
            activeOpacity={0.8}
          >
            <Ionicons name="mail-outline" size={17} color="#D4AF37" />
            <Text style={styles.secondaryLinkBtnText}>Contact Legal Support ({SUPPORT_EMAIL})</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0E',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A22',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#161620',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#262634',
  },
  titleCol: {
    flex: 1,
    marginLeft: 12,
  },
  statusBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4ADE80',
    marginRight: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D4AF37',
    letterSpacing: 0.6,
  },
  topTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  content: {
    padding: 16,
    paddingBottom: 50,
  },
  trustCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#141419',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    marginBottom: 16,
    gap: 12,
  },
  trustTextCol: {
    flex: 1,
  },
  trustTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  trustSub: {
    fontSize: 12.5,
    color: '#8A8A96',
    lineHeight: 17,
  },
  updatedText: {
    fontSize: 11,
    color: '#D4AF37',
    marginTop: 6,
    fontWeight: '600',
  },
  sectionCard: {
    backgroundColor: '#141419',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#22222E',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  sectionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#1C1C28',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
  sectionBody: {
    fontSize: 13,
    color: '#B0B0BE',
    lineHeight: 19,
  },
  actionsWrap: {
    marginTop: 10,
    gap: 10,
  },
  primaryLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D4AF37',
    paddingVertical: 13,
    borderRadius: 10,
    gap: 8,
  },
  primaryLinkBtnText: {
    color: '#0A0A0E',
    fontSize: 13.5,
    fontWeight: '700',
  },
  secondaryLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#161622',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    paddingVertical: 13,
    borderRadius: 10,
    gap: 8,
  },
  secondaryLinkBtnText: {
    color: '#D4AF37',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default PrivacyPolicyScreen;
