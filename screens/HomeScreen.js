import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Svg, { Defs, LinearGradient as SvgGradient, Stop, Rect } from 'react-native-svg';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../hooks/useTranslation';
import api from '../services/api';
import Avatar from '../components/Avatar';
import LanguageToggle from '../components/LanguageToggle';
import { resolveMediaUrl } from '../utils/imageUrl';
import { getMyProgress } from '../services/rewardsApi';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.72;

// Custom 3D isometric luxury assets for the Services & Hub
const HUB_IMAGES = {
  properties: require('../assets/hub/hub_properties.jpg'),
  addProperty: require('../assets/hub/hub_add_property.jpg'),
  plotInfo: require('../assets/hub/hub_plot_info.jpg'),
  posts: require('../assets/hub/hub_community.jpg'),
  groups: require('../assets/hub/hub_groups.jpg'),
  messages: require('../assets/hub/hub_messages.jpg'),
  calls: require('../assets/hub/hub_calls.jpg'),
  rewards: require('../assets/hub/hub_rewards.jpg'),
  heroAdvisor: require('../assets/hub/hero_advisor.jpg'),
};

const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { t } = useTranslation();

  const [properties, setProperties] = useState([]);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [rewardsStats, setRewardsStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [propsRes, statsRes] = await Promise.allSettled([
        api.get('/properties'),
        getMyProgress(),
      ]);

      if (propsRes.status === 'fulfilled' && propsRes.value?.data) {
        setProperties(propsRes.value.data.slice(0, 8));
      }
      if (statsRes.status === 'fulfilled' && statsRes.value?.data) {
        setRewardsStats(statsRes.value.data);
      }
    } catch (err) {
      console.log('Error fetching home data:', err);
    } finally {
      setLoadingProperties(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Quick Action items configuration with 3D illustration images
  const quickActions = [
    {
      id: 'properties',
      image: HUB_IMAGES.properties,
      title: t('home.browseProperties') || 'Browse Properties',
      subtitle: 'Verified listings & plots',
      badge: 'Popular',
      onPress: () => navigation.navigate('Properties'),
    },
    {
      id: 'addProperty',
      image: HUB_IMAGES.addProperty,
      title: t('home.addProperty') || 'Add Property',
      subtitle: 'List for sale or rent',
      badge: 'Fast',
      onPress: () => navigation.navigate('AddProperty'),
    },
    {
      id: 'plotInfo',
      image: HUB_IMAGES.plotInfo,
      title: t('more.plotInformation') || 'Plot Maps & Info',
      subtitle: 'Societies & sector guides',
      badge: 'VIP Tool',
      onPress: () => navigation.navigate('PlotInformation'),
    },
    {
      id: 'posts',
      image: HUB_IMAGES.posts,
      title: t('home.createPost') || 'Community Feed',
      subtitle: 'Market updates & news',
      onPress: () => navigation.navigate('MainTabs', { screen: 'Posts' }),
    },
    {
      id: 'groups',
      image: HUB_IMAGES.groups,
      title: t('home.groups') || 'Business Groups',
      subtitle: 'Connect with investors',
      onPress: () => navigation.navigate('MainTabs', { screen: 'Groups' }),
    },
    {
      id: 'messages',
      image: HUB_IMAGES.messages,
      title: t('home.messages') || 'Direct Chats',
      subtitle: 'Client inquiries & leads',
      onPress: () => navigation.navigate('MainTabs', { screen: 'MessagesTab' }),
    },
    {
      id: 'calls',
      image: HUB_IMAGES.calls,
      title: t('tabs.calls') || 'Voice & Video',
      subtitle: 'Instant HD calls',
      onPress: () => navigation.navigate('MainTabs', { screen: 'CallsTab' }),
    },
    {
      id: 'rewards',
      image: HUB_IMAGES.rewards,
      title: t('tabs.rewards') || 'Rewards & Perks',
      subtitle: 'Earn points on deals',
      badge: 'Bonus',
      onPress: () => navigation.navigate('Rewards'),
    },
  ];

  const renderFeaturedProperty = ({ item }) => {
    const cover =
      resolveMediaUrl(item.images?.[0]) ||
      resolveMediaUrl(item.image) ||
      resolveMediaUrl(item.thumbnail);

    const isRent = item.type === 'rent' || item.purpose === 'rent';

    return (
      <TouchableOpacity
        style={styles.featuredCard}
        activeOpacity={0.88}
        onPress={() => navigation.navigate('PropertyDetail', { property: item })}
      >
        <View style={styles.imageContainer}>
          {cover ? (
            <Image source={{ uri: cover }} style={styles.propertyImage} />
          ) : (
            <View style={styles.propertyImagePlaceholder}>
              <Ionicons name="business-outline" size={44} color="#D4AF37" />
            </View>
          )}

          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>
              {isRent ? 'FOR RENT' : 'FOR SALE'}
            </Text>
          </View>

          <View style={styles.priceTag}>
            <Text style={styles.priceTagText}>
              PKR {item.price ? Number(item.price).toLocaleString() : 'N/A'}
            </Text>
          </View>
        </View>

        <View style={styles.propertyInfo}>
          <Text style={styles.propertyTitle} numberOfLines={1}>
            {item.title || 'Premium Property'}
          </Text>

          <View style={styles.locationRow}>
            <Ionicons name="location-sharp" size={13} color="#D4AF37" />
            <Text style={styles.locationText} numberOfLines={1}>
              {item.location || item.city || 'Pakistan'}
            </Text>
          </View>

          <View style={styles.propertyMetaRow}>
            {item.area ? (
              <View style={styles.metaBadge}>
                <Ionicons name="expand-outline" size={12} color="#D4AF37" />
                <Text style={styles.metaText}>{item.area}</Text>
              </View>
            ) : null}
            <View style={styles.viewDetailsBtn}>
              <Text style={styles.viewDetailsText}>View</Text>
              <Ionicons name="chevron-forward" size={12} color="#D4AF37" />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const userName = user?.name ? user.name.split(' ')[0] : 'Partner';

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0E" />

      {/* Top Luxury App Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.userInfoRow}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('MainTabs', { screen: 'Profile' })}
        >
          <Avatar
            uri={user?.profileImage || user?.avatar}
            name={user?.name}
            size={46}
          />
          <View style={styles.userTextCol}>
            <View style={styles.greetingBadgeRow}>
              <Text style={styles.greetingSub}>Welcome back</Text>
              <View style={styles.verifiedDot} />
            </View>
            <Text style={styles.userNameText} numberOfLines={1}>
              {userName}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.topActionsRow}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('UserSearch')}
            activeOpacity={0.7}
          >
            <Ionicons name="search-outline" size={20} color="#D4AF37" />
          </TouchableOpacity>

          <LanguageToggle style={styles.langToggleStyle} />
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#D4AF37"
            colors={['#D4AF37']}
          />
        }
      >
        {/* VIP Gold Gradient Showcase Hero */}
        <View style={styles.heroCard}>
          {/* Right-aligned Hero Advisor Image with Smooth Left Blend */}
          <View style={styles.heroImageWrapper}>
            <Image
              source={HUB_IMAGES.heroAdvisor}
              style={styles.heroAdvisorImage}
            />
            {/* SVG Horizontal Gradient overlay to blend the left side into the container */}
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              <Svg height="100%" width="100%">
                <Defs>
                  <SvgGradient id="heroBlend" x1="0%" y1="0%" x2="100%" y2="0%">
                    <Stop offset="0%" stopColor="#141419" stopOpacity="1" />
                    <Stop offset="25%" stopColor="#141419" stopOpacity="0.85" />
                    <Stop offset="60%" stopColor="#141419" stopOpacity="0.25" />
                    <Stop offset="100%" stopColor="#141419" stopOpacity="0" />
                  </SvgGradient>
                </Defs>
                <Rect x="0" y="0" width="100%" height="100%" fill="url(#heroBlend)" />
              </Svg>
            </View>
          </View>

          <View style={styles.heroContent}>
            <View style={styles.heroBadge}>
              <Ionicons name="shield-checkmark" size={12} color="#0A0A0E" />
              <Text style={styles.heroBadgeText}>PREMIUM REAL ESTATE</Text>
            </View>

            <Text style={styles.heroTitle}>Free Business Portal</Text>
            <Text style={styles.heroDesc}>
              Discover verified properties, direct owner connections & high-yield investments.
            </Text>

            <View style={styles.heroButtonRow}>
              <TouchableOpacity
                style={styles.heroPrimaryBtn}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('Properties')}
              >
                <Text style={styles.heroPrimaryBtnText}>Explore</Text>
                <Ionicons name="arrow-forward" size={14} color="#0A0A0E" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.heroSecondaryBtn}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('AddProperty')}
              >
                <Ionicons name="add" size={15} color="#D4AF37" />
                <Text style={styles.heroSecondaryBtnText}>List Free</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Quick Search Trigger Bar */}
        <TouchableOpacity
          style={styles.searchBarFake}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Properties')}
        >
          <Ionicons name="search" size={18} color="#D4AF37" />
          <Text style={styles.searchPlaceholder}>
            Search cities, societies, sectors, plots...
          </Text>
          <View style={styles.searchFilterPill}>
            <Ionicons name="options-outline" size={14} color="#D4AF37" />
          </View>
        </TouchableOpacity>

        {/* Categories Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryScrollContent}
        >
          <TouchableOpacity
            style={[styles.categoryChip, styles.categoryChipActive]}
            onPress={() => navigation.navigate('Properties')}
          >
            <Ionicons name="grid-outline" size={14} color="#0A0A0E" />
            <Text style={[styles.categoryChipText, styles.categoryChipTextActive]}>
              All Listings
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.categoryChip}
            onPress={() => navigation.navigate('Properties')}
          >
            <Ionicons name="home-outline" size={14} color="#D4AF37" />
            <Text style={styles.categoryChipText}>For Sale</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.categoryChip}
            onPress={() => navigation.navigate('Properties')}
          >
            <Ionicons name="key-outline" size={14} color="#D4AF37" />
            <Text style={styles.categoryChipText}>For Rent</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.categoryChip}
            onPress={() => navigation.navigate('PlotInformation')}
          >
            <Ionicons name="map-outline" size={14} color="#D4AF37" />
            <Text style={styles.categoryChipText}>Society Maps</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.categoryChip}
            onPress={() => navigation.navigate('MainTabs', { screen: 'Posts' })}
          >
            <Ionicons name="chatbubbles-outline" size={14} color="#D4AF37" />
            <Text style={styles.categoryChipText}>Market News</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Services & Hub Grid with 3D Illustration Cards */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>Services & Hub</Text>
            <Text style={styles.sectionSubtitle}>Professional business tools & features</Text>
          </View>
        </View>

        <View style={styles.gridContainer}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.gridCard}
              activeOpacity={0.85}
              onPress={action.onPress}
            >
              {/* 3D Illustration Banner */}
              <View style={styles.gridImageWrap}>
                <Image source={action.image} style={styles.gridCardImage} />
                <View style={styles.gridImageOverlay} />
                {action.badge ? (
                  <View style={styles.actionBadge}>
                    <Text style={styles.actionBadgeText}>{action.badge}</Text>
                  </View>
                ) : null}
              </View>

              {/* Card Details */}
              <View style={styles.gridCardBody}>
                <Text style={styles.gridCardTitle} numberOfLines={1}>
                  {action.title}
                </Text>
                <Text style={styles.gridCardSub} numberOfLines={2}>
                  {action.subtitle}
                </Text>

                <View style={styles.gridCardFooter}>
                  <Text style={styles.gridCardActionText}>Open</Text>
                  <Ionicons name="arrow-forward" size={11} color="#D4AF37" />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Featured Properties Section */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>Featured Properties</Text>
            <Text style={styles.sectionSubtitle}>Handpicked verified opportunities</Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('Properties')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.seeAllText}>View All →</Text>
          </TouchableOpacity>
        </View>

        {loadingProperties ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="small" color="#D4AF37" />
            <Text style={styles.loaderText}>Loading hot listings...</Text>
          </View>
        ) : properties.length > 0 ? (
          <FlatList
            data={properties}
            renderItem={renderFeaturedProperty}
            keyExtractor={(item) => item._id || Math.random().toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredList}
            snapToInterval={CARD_WIDTH + 14}
            decelerationRate="fast"
          />
        ) : (
          <TouchableOpacity
            style={styles.emptyFeaturedCard}
            onPress={() => navigation.navigate('AddProperty')}
          >
            <Ionicons name="add-circle-outline" size={36} color="#D4AF37" />
            <Text style={styles.emptyFeaturedTitle}>Be the first to list a property</Text>
            <Text style={styles.emptyFeaturedSub}>Reach verified buyers & investors</Text>
          </TouchableOpacity>
        )}

        {/* Community & Networking Banner */}
        <TouchableOpacity
          style={styles.communityBanner}
          activeOpacity={0.88}
          onPress={() => navigation.navigate('MainTabs', { screen: 'Posts' })}
        >
          <View style={styles.communityTextCol}>
            <View style={styles.liveTag}>
              <View style={styles.liveIndicator} />
              <Text style={styles.liveTagText}>COMMUNITY FEED</Text>
            </View>
            <Text style={styles.communityBannerTitle}>
              Real Estate News & Discussions
            </Text>
            <Text style={styles.communityBannerDesc}>
              Read market updates, rate changes, and connect with top Pakistan brokers.
            </Text>
          </View>
          <View style={styles.communityThumbWrap}>
            <Image
              source={HUB_IMAGES.posts}
              style={styles.communityThumbImage}
            />
          </View>
        </TouchableOpacity>

        {/* Trust Badges */}
        <View style={styles.trustRow}>
          <View style={styles.trustBadge}>
            <Ionicons name="shield-checkmark-outline" size={16} color="#D4AF37" />
            <Text style={styles.trustText}>Verified Listings</Text>
          </View>
          <View style={styles.trustBadge}>
            <Ionicons name="flash-outline" size={16} color="#D4AF37" />
            <Text style={styles.trustText}>Instant Contact</Text>
          </View>
          <View style={styles.trustBadge}>
            <Ionicons name="lock-closed-outline" size={16} color="#D4AF37" />
            <Text style={styles.trustText}>Direct Deals</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A0A0E',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: '#0A0A0E',
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A22',
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userTextCol: {
    marginLeft: 12,
  },
  greetingBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greetingSub: {
    fontSize: 12,
    color: '#8A8A93',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  verifiedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D4AF37',
    marginLeft: 6,
  },
  userNameText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  topActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#16161D',
    borderWidth: 1,
    borderColor: '#2A2A36',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  langToggleStyle: {
    position: 'relative',
    top: 0,
    right: 0,
    backgroundColor: '#16161D',
    borderColor: '#D4AF37',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  /* Hero Showcase */
  heroCard: {
    marginHorizontal: 18,
    marginTop: 16,
    marginBottom: 14,
    borderRadius: 20,
    backgroundColor: '#141419',
    borderWidth: 1,
    borderColor: '#383015',
    overflow: 'hidden',
    position: 'relative',
    minHeight: 180,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },
  heroImageWrapper: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: '56%',
    height: '100%',
  },
  heroAdvisorImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroContent: {
    width: '64%',
    padding: 18,
    zIndex: 2,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#D4AF37',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 10,
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0A0A0E',
    marginLeft: 4,
    letterSpacing: 0.6,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  heroDesc: {
    fontSize: 12,
    color: '#A0A0A8',
    lineHeight: 17,
    marginTop: 5,
    marginBottom: 14,
  },
  heroButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D4AF37',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginRight: 10,
  },
  heroPrimaryBtnText: {
    color: '#0A0A0E',
    fontWeight: '700',
    fontSize: 13,
    marginRight: 6,
  },
  heroSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E26',
    borderWidth: 1,
    borderColor: '#D4AF3750',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  heroSecondaryBtnText: {
    color: '#D4AF37',
    fontWeight: '600',
    fontSize: 13,
    marginLeft: 4,
  },

  /* Search Trigger */
  searchBarFake: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 18,
    marginBottom: 14,
    backgroundColor: '#141419',
    borderWidth: 1,
    borderColor: '#262630',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 13,
    color: '#6E6E78',
    marginLeft: 10,
  },
  searchFilterPill: {
    backgroundColor: '#1E1E28',
    borderRadius: 6,
    padding: 4,
  },

  /* Categories */
  categoryScroll: {
    marginBottom: 18,
  },
  categoryScrollContent: {
    paddingHorizontal: 18,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141419',
    borderWidth: 1,
    borderColor: '#262630',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#D4AF37',
    borderColor: '#D4AF37',
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D4AF37',
    marginLeft: 6,
  },
  categoryChipTextActive: {
    color: '#0A0A0E',
    fontWeight: '700',
  },

  /* Section Header */
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginHorizontal: 18,
    marginTop: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#7A7A85',
    marginTop: 2,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#D4AF37',
  },

  /* Featured Property Card */
  featuredList: {
    paddingLeft: 18,
    paddingRight: 6,
    paddingBottom: 8,
  },
  featuredCard: {
    width: CARD_WIDTH,
    backgroundColor: '#141419',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#262630',
    marginRight: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  imageContainer: {
    width: '100%',
    height: 140,
    backgroundColor: '#1E1E26',
    position: 'relative',
  },
  propertyImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  propertyImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#181820',
  },
  typeBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(10, 10, 14, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D4AF3750',
  },
  typeBadgeText: {
    color: '#D4AF37',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  priceTag: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: '#D4AF37',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priceTagText: {
    color: '#0A0A0E',
    fontSize: 12,
    fontWeight: '800',
  },
  propertyInfo: {
    padding: 12,
  },
  propertyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 12,
    color: '#8A8A95',
    marginLeft: 4,
    flex: 1,
  },
  propertyMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#202028',
    paddingTop: 8,
    marginTop: 2,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C24',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  metaText: {
    fontSize: 11,
    color: '#C0C0C8',
    marginLeft: 4,
    fontWeight: '500',
  },
  viewDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewDetailsText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D4AF37',
    marginRight: 2,
  },
  loaderWrap: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  loaderText: {
    color: '#7A7A85',
    fontSize: 12,
    marginTop: 8,
  },
  emptyFeaturedCard: {
    marginHorizontal: 18,
    padding: 24,
    backgroundColor: '#141419',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#262630',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyFeaturedTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 8,
  },
  emptyFeaturedSub: {
    fontSize: 12,
    color: '#7A7A85',
    marginTop: 2,
  },

  /* 3D Illustrated Grid Cards */
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    marginTop: 4,
  },
  gridCard: {
    width: (width - 48) / 2,
    backgroundColor: '#141419',
    borderWidth: 1,
    borderColor: '#262632',
    borderRadius: 18,
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  gridImageWrap: {
    width: '100%',
    height: 110,
    backgroundColor: '#0D0D12',
    position: 'relative',
    overflow: 'hidden',
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
    height: 30,
    backgroundColor: 'rgba(20, 20, 25, 0.4)',
  },
  actionBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(10, 10, 14, 0.82)',
    borderColor: '#D4AF37',
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  actionBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#D4AF37',
    letterSpacing: 0.4,
  },
  gridCardBody: {
    padding: 12,
    paddingTop: 10,
  },
  gridCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 3,
    letterSpacing: 0.1,
  },
  gridCardSub: {
    fontSize: 11,
    color: '#8A8A96',
    lineHeight: 15,
    marginBottom: 8,
  },
  gridCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  gridCardActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D4AF37',
    marginRight: 4,
    letterSpacing: 0.3,
  },

  /* Community Feed Banner */
  communityBanner: {
    marginHorizontal: 18,
    marginTop: 8,
    marginBottom: 16,
    backgroundColor: '#141419',
    borderWidth: 1,
    borderColor: '#383015',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  communityTextCol: {
    flex: 1,
    paddingRight: 12,
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  liveIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4ADE80',
    marginRight: 6,
  },
  liveTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D4AF37',
    letterSpacing: 0.5,
  },
  communityBannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  communityBannerDesc: {
    fontSize: 12,
    color: '#8A8A95',
    lineHeight: 16,
  },
  communityThumbWrap: {
    width: 60,
    height: 60,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#D4AF3750',
    backgroundColor: '#0D0D12',
  },
  communityThumbImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  /* Trust Badges */
  trustRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 18,
    marginTop: 8,
    paddingVertical: 14,
    backgroundColor: '#101014',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E1E26',
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trustText: {
    fontSize: 11,
    color: '#8A8A95',
    marginLeft: 6,
    fontWeight: '600',
  },
});

export default HomeScreen;
