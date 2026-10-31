import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  StatusBar,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../context/AuthContext';

const HUB_IMAGES = {
  properties: require('../assets/hub/hub_properties.jpg'),
  rewards: require('../assets/hub/hub_rewards.jpg'),
  plotInfo: require('../assets/hub/hub_plot_info.jpg'),
  addProperty: require('../assets/hub/hub_add_property.jpg'),
  privacy: require('../assets/hub/hub_community.jpg'),
  admin: require('../assets/hub/hub_groups.jpg'),
};

const MoreTabScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const services = useMemo(() => {
    const items = [
      {
        id: 'properties',
        title: t('tabs.properties'),
        subtitle: 'Explore verified listings, houses, plots & commercial deals',
        image: HUB_IMAGES.properties,
        badge: 'Popular',
        screen: 'Properties',
      },
      {
        id: 'rewards',
        title: t('tabs.rewards'),
        subtitle: 'Unlock cash prize milestones from Bronze to Gold tier',
        image: HUB_IMAGES.rewards,
        badge: 'Cash Prizes',
        screen: 'Rewards',
      },
      {
        id: 'plotInformation',
        title: t('more.plotInformation') || 'Plot Info',
        subtitle: 'Compare 5 Marla, 10 Marla & 1 Kanal investment plans & returns',
        image: HUB_IMAGES.plotInfo,
        badge: 'VIP Tool',
        screen: 'PlotInformation',
      },
      {
        id: 'addProperty',
        title: 'List Property',
        subtitle: 'List your property for sale or rent to reach verified buyers',
        image: HUB_IMAGES.addProperty,
        badge: 'Fast',
        screen: 'AddProperty',
      },
      {
        id: 'privacyPolicy',
        title: t('more.privacyPolicy') || 'Privacy Policy',
        subtitle: 'Official data protection, security terms & user rights',
        image: HUB_IMAGES.privacy,
        badge: 'Security',
        screen: 'PrivacyPolicy',
      },
    ];

    if (isAdmin) {
      items.unshift({
        id: 'admin',
        title: t('tabs.admin') || 'Admin Hub',
        subtitle: 'Monitor users, verify property listings & platform growth',
        image: HUB_IMAGES.admin,
        badge: 'Admin Only',
        screen: 'Admin',
      });
    }

    return items;
  }, [isAdmin, t]);

  const renderServiceCard = ({ item }) => (
    <TouchableOpacity
      style={styles.gridCard}
      activeOpacity={0.85}
      onPress={() => navigation.navigate(item.screen)}
    >
      {/* 3D Illustration Banner */}
      <View style={styles.gridImageWrap}>
        <Image source={item.image} style={styles.gridCardImage} />
        <View style={styles.gridImageOverlay} />
        {item.badge ? (
          <View style={styles.actionBadge}>
            <Text style={styles.actionBadgeText}>{item.badge}</Text>
          </View>
        ) : null}
      </View>

      {/* Card Body */}
      <View style={styles.gridCardBody}>
        <Text style={styles.gridCardTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.gridCardSub} numberOfLines={2}>
          {item.subtitle}
        </Text>

        <View style={styles.gridCardFooter}>
          <Text style={styles.openText}>Open</Text>
          <Ionicons name="arrow-forward" size={13} color="#D4AF37" />
        </View>
      </View>
    </TouchableOpacity>
  );

  const listHeader = (
    <View style={styles.headerContainer}>
      {/* Top Banner */}
      <View style={styles.topBar}>
        <View>
          <View style={styles.statusBadgeRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.statusBadgeText}>BUSINESS ECOSYSTEM</Text>
          </View>
          <Text style={styles.screenTitle}>{t('more.title') || 'Services & Tools'}</Text>
        </View>

        <View style={styles.portalTag}>
          <Ionicons name="apps" size={16} color="#D4AF37" />
          <Text style={styles.portalTagText}>Portal Hub</Text>
        </View>
      </View>

      {/* Intro Description Banner */}
      <View style={styles.heroIntroCard}>
        <Ionicons name="sparkles" size={20} color="#D4AF37" />
        <View style={styles.heroIntroTextCol}>
          <Text style={styles.heroIntroTitle}>Explore Professional Tools</Text>
          <Text style={styles.heroIntroSub}>
            Access high-yield plot investment calculators, verified listings, prize programs, and compliance information.
          </Text>
        </View>
      </View>

      <Text style={styles.sectionHeading}>All Services</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0E" />

      <FlatList
        data={services}
        renderItem={renderServiceCard}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        ListHeaderComponent={listHeader}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0E',
  },
  list: {
    paddingBottom: 95,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },

  /* Header Section */
  headerContainer: {
    marginBottom: 8,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A22',
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
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  portalTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16161E',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 6,
  },
  portalTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D4AF37',
  },

  /* Intro Card */
  heroIntroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 14,
    backgroundColor: '#141419',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#242432',
    gap: 12,
  },
  heroIntroTextCol: {
    flex: 1,
  },
  heroIntroTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heroIntroSub: {
    fontSize: 12,
    color: '#8A8A96',
    marginTop: 2,
    lineHeight: 16,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginHorizontal: 18,
    marginBottom: 8,
  },

  /* 3D Isometric Grid Card */
  gridCard: {
    flex: 1,
    backgroundColor: '#141419',
    borderRadius: 18,
    marginHorizontal: 5,
    marginBottom: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#242432',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  gridImageWrap: {
    height: 110,
    width: '100%',
    position: 'relative',
    backgroundColor: '#0D0D12',
  },
  gridCardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gridImageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: 'rgba(20, 20, 25, 0.8)',
  },
  actionBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(10, 10, 14, 0.82)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
  },
  actionBadgeText: {
    color: '#D4AF37',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  gridCardBody: {
    padding: 12,
    paddingTop: 8,
    flex: 1,
    justifyContent: 'space-between',
  },
  gridCardTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.1,
  },
  gridCardSub: {
    fontSize: 11.5,
    color: '#8A8A96',
    marginTop: 4,
    lineHeight: 16,
    minHeight: 32,
  },
  gridCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1E1E28',
    gap: 4,
  },
  openText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D4AF37',
  },
});

export default MoreTabScreen;
