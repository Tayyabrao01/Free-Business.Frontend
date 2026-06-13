import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from '../hooks/useTranslation';
import LanguageToggle from '../components/LanguageToggle';
import { markRewardScreenSeen } from '../services/OnboardingService';

const TIER_CONFIG = [
  {
    key: 'bronze',
    icon: 'medal-outline',
    accent: '#CD7F32',
    gradientTop: '#3d2814',
    gradientBottom: '#1a1208',
    prizeKey: 'rewards.bronzePrize',
    followersKey: 'rewards.bronzeFollowers',
    postsKey: 'rewards.bronzePosts',
    salesKey: 'rewards.bronzeSales',
  },
  {
    key: 'silver',
    icon: 'ribbon-outline',
    accent: '#C0C0C0',
    gradientTop: '#3a3a3a',
    gradientBottom: '#1a1a1a',
    prizeKey: 'rewards.silverPrize',
    followersKey: 'rewards.silverFollowers',
    postsKey: 'rewards.silverPosts',
    salesKey: 'rewards.silverSales',
  },
  {
    key: 'gold',
    icon: 'trophy-outline',
    accent: '#D4AF37',
    gradientTop: '#4a3a10',
    gradientBottom: '#1f1808',
    prizeKey: 'rewards.goldPrize',
    followersKey: 'rewards.goldFollowers',
    postsKey: 'rewards.goldPosts',
    salesKey: 'rewards.goldSales',
  },
];

const RequirementRow = ({ icon, label, value, accent }) => (
  <View style={styles.requirementRow}>
    <Ionicons name={icon} size={16} color={accent} style={styles.requirementIcon} />
    <Text style={styles.requirementLabel}>{label}</Text>
    <Text style={[styles.requirementValue, { color: accent }]}>{value}</Text>
  </View>
);

const TierCard = ({ tier, t }) => (
  <View style={[styles.tierCard, { borderColor: tier.accent }]}>
    <View style={[styles.tierGradientTop, { backgroundColor: tier.gradientTop }]} />
    <View style={[styles.tierGradientBottom, { backgroundColor: tier.gradientBottom }]} />

    <View style={styles.tierContent}>
      <View style={styles.tierHeader}>
        <View style={[styles.tierIconWrap, { backgroundColor: tier.accent }]}>
          <Ionicons name={tier.icon} size={28} color="#000000" />
        </View>
        <View style={styles.tierHeaderText}>
          <Text style={[styles.tierName, { color: tier.accent }]}>
            {t(`rewards.${tier.key}`)}
          </Text>
          <Text style={styles.tierPrize}>{t(tier.prizeKey)}</Text>
        </View>
      </View>

      <Text style={styles.requirementsTitle}>{t('rewards.requirementsLabel')}</Text>
      <RequirementRow
        icon="people-outline"
        label={t('rewards.followers')}
        value={t(tier.followersKey)}
        accent={tier.accent}
      />
      <RequirementRow
        icon="document-text-outline"
        label={t('rewards.posts')}
        value={t(tier.postsKey)}
        accent={tier.accent}
      />
      <RequirementRow
        icon="home-outline"
        label={t('rewards.salesRents')}
        value={t(tier.salesKey)}
        accent={tier.accent}
      />
    </View>
  </View>
);

const RewardAnnouncementScreen = ({ navigation }) => {
  const { t } = useTranslation();

  const handleUnderstand = async () => {
    await markRewardScreenSeen();
    navigation.replace('Login');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      <View style={styles.headerGradient}>
        <View style={styles.headerGlow} />
        <View style={styles.headerGlowSecondary} />
      </View>

      <LanguageToggle style={styles.languageToggle} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroSection}>
          <View style={styles.badge}>
            <Ionicons name="sparkles" size={14} color="#000000" style={styles.badgeIcon} />
            <Text style={styles.badgeText}>{t('rewards.announcementBadge')}</Text>
          </View>
          <Text style={styles.title}>{t('rewards.announcementTitle')}</Text>
          <Text style={styles.subtitle}>{t('rewards.announcementSubtitle')}</Text>
        </View>

        {TIER_CONFIG.map((tier) => (
          <TierCard key={tier.key} tier={tier} t={t} />
        ))}

        <View style={[styles.bonusCard, { borderColor: '#D4AF37' }]}>
          <View style={styles.bonusGradientTop} />
          <View style={styles.bonusContent}>
            <View style={styles.bonusHeader}>
              <Ionicons name="gift-outline" size={26} color="#D4AF37" style={styles.bonusHeaderIcon} />
              <Text style={styles.bonusTitle}>{t('rewards.bonusTitle')}</Text>
            </View>
            <View style={styles.bonusItem}>
              <Ionicons name="cash-outline" size={18} color="#D4AF37" style={styles.bonusItemIcon} />
              <Text style={styles.bonusText}>{t('rewards.bonusRent')}</Text>
            </View>
            <View style={styles.bonusItem}>
              <Ionicons name="share-social-outline" size={18} color="#D4AF37" style={styles.bonusItemIcon} />
              <Text style={styles.bonusText}>{t('rewards.bonusReferral')}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.footerNote}>{t('rewards.footerNote')}</Text>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.understandButton} onPress={handleUnderstand}>
          <Text style={styles.understandButtonText}>{t('rewards.understandButton')}</Text>
          <Ionicons name="arrow-forward-circle" size={22} color="#000000" style={styles.understandIcon} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 280,
    overflow: 'hidden',
  },
  headerGlow: {
    position: 'absolute',
    top: -80,
    left: -40,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#D4AF37',
    opacity: 0.18,
  },
  headerGlowSecondary: {
    position: 'absolute',
    top: 40,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#CD7F32',
    opacity: 0.12,
  },
  languageToggle: {
    top: 48,
  },
  scrollContent: {
    paddingTop: 100,
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D4AF37',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  badgeText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#D4AF37',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#aaaaaa',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  tierCard: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  tierGradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '55%',
    opacity: 0.9,
  },
  tierGradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '55%',
    opacity: 0.95,
  },
  tierContent: {
    padding: 18,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  tierIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  tierHeaderText: {
    flex: 1,
  },
  tierName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  tierPrize: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  requirementsTitle: {
    fontSize: 13,
    color: '#888888',
    fontWeight: '600',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  badgeIcon: {
    marginRight: 6,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  requirementIcon: {
    marginRight: 8,
  },
  requirementLabel: {
    flex: 1,
    color: '#cccccc',
    fontSize: 14,
  },
  requirementValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  bonusCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12,
  },
  bonusGradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '100%',
    backgroundColor: '#2a2208',
    opacity: 0.95,
  },
  bonusContent: {
    padding: 18,
  },
  bonusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  bonusHeaderIcon: {
    marginRight: 10,
  },
  bonusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D4AF37',
  },
  bonusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  bonusItemIcon: {
    marginRight: 10,
  },
  understandIcon: {
    marginLeft: 10,
  },
  bonusText: {
    flex: 1,
    color: '#dddddd',
    fontSize: 15,
    lineHeight: 22,
  },
  footerNote: {
    textAlign: 'center',
    color: '#666666',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 28,
    backgroundColor: 'rgba(0,0,0,0.92)',
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  understandButton: {
    backgroundColor: '#D4AF37',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  understandButtonText: {
    color: '#000000',
    fontSize: 17,
    fontWeight: '700',
  },
});

export default RewardAnnouncementScreen;
