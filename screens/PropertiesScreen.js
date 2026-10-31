import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  Image,
  FlatList,
  StatusBar,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Svg, {
  Defs,
  LinearGradient as SvgGradient,
  Stop,
  Rect,
  Circle as SvgCircle,
} from 'react-native-svg';
import { useFocusEffect } from '@react-navigation/native';
import api, { isAbortError } from '../services/api';
import { useTranslation } from '../hooks/useTranslation';
import { resolveMediaUrl } from '../utils/imageUrl';
import MediaViewerModal from '../components/MediaViewerModal';

const FILTER_TABS = [
  { id: 'all', label: 'All Listings', icon: 'grid-outline' },
  { id: 'sale', label: 'For Sale', icon: 'pricetag-outline' },
  { id: 'rent', label: 'For Rent', icon: 'key-outline' },
];

const PropertiesScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLocation, setSearchLocation] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [viewerUri, setViewerUri] = useState(null);

  const loadProperties = useCallback(async (signal, showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      }
      const response = await api.get('/properties', { signal });
      if (response?.data) {
        setProperties(response.data);
      }
    } catch (error) {
      if (!isAbortError(error)) {
        console.log('Error loading properties:', error);
        Alert.alert(t('common.error'), t('properties.failedToLoad'));
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController();
      loadProperties(controller.signal, properties.length === 0);
      return () => controller.abort();
    }, [loadProperties, properties.length])
  );

  const filteredData = useMemo(() => {
    if (!properties?.length) return [];

    return properties.filter((property) => {
      if (!property) return false;

      const searchLower = searchLocation.toLowerCase().trim();
      const locationText = property.location || property.city || property.address || '';
      const matchesSearch =
        searchLower === '' ||
        locationText.toLowerCase().includes(searchLower) ||
        (property.title && property.title.toLowerCase().includes(searchLower));

      const propertyType = property.purpose || property.type;
      const matchesType = filterType === 'all' || propertyType === filterType;

      return matchesSearch && matchesType;
    });
  }, [properties, searchLocation, filterType]);

  const renderPropertyCard = ({ item }) => {
    const cover =
      resolveMediaUrl(item.images?.[0]) ||
      resolveMediaUrl(item.image) ||
      resolveMediaUrl(item.thumbnail);

    const isRent = item.type === 'rent' || item.purpose === 'rent';
    const typeLabel = item.propertyType ? item.propertyType.toUpperCase() : 'PROPERTY';

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.88}
        onPress={() => navigation.navigate('PropertyDetail', { property: item })}
      >
        {/* Cover Image Container */}
        <View style={styles.cardImageContainer}>
          {cover ? (
            <Image source={{ uri: cover }} style={styles.cardImage} resizeMode="cover" />
          ) : (
            <View style={styles.cardPlaceholderImage}>
              <Ionicons name="home-outline" size={48} color="#3B3B48" />
            </View>
          )}

          {/* Floating Purpose Badge (Sale / Rent) */}
          <View style={[styles.purposeBadge, isRent && styles.rentBadge]}>
            <Ionicons
              name={isRent ? 'key' : 'pricetag'}
              size={11}
              color={isRent ? '#FFFFFF' : '#0A0A0E'}
            />
            <Text style={[styles.purposeBadgeText, isRent && styles.rentBadgeText]}>
              {isRent ? 'FOR RENT' : 'FOR SALE'}
            </Text>
          </View>

          {/* Floating Property Type Chip */}
          <View style={styles.typeChip}>
            <Text style={styles.typeChipText}>{typeLabel}</Text>
          </View>

          {/* Zoom Image Shortcut */}
          {cover ? (
            <TouchableOpacity
              style={styles.zoomButton}
              activeOpacity={0.7}
              onPress={(e) => {
                e?.stopPropagation?.();
                setViewerUri(cover);
              }}
            >
              <Ionicons name="expand-outline" size={15} color="#FFFFFF" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Card Body Details */}
        <View style={styles.cardBody}>
          {/* Price Header */}
          <View style={styles.priceRow}>
            <Text style={styles.cardPrice}>
              PKR {item.price ? Number(item.price).toLocaleString() : '0'}
              {isRent ? <Text style={styles.rentUnit}> / mo</Text> : null}
            </Text>
            <View style={styles.verifiedPill}>
              <Ionicons name="shield-checkmark" size={12} color="#10B981" />
              <Text style={styles.verifiedPillText}>Verified</Text>
            </View>
          </View>

          {/* Title */}
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.title || t('properties.defaultTitle')}
          </Text>

          {/* Location with Icon */}
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color="#D4AF37" />
            <Text style={styles.cardLocation} numberOfLines={1}>
              {item.location || item.city || item.address || t('properties.locationNotSpecified')}
            </Text>
          </View>

          {/* Footer Action */}
          <View style={styles.cardFooter}>
            <View style={styles.metaFeaturePill}>
              <Ionicons name="business-outline" size={12} color="#8E8E9F" />
              <Text style={styles.metaFeatureText}>{typeLabel}</Text>
            </View>

            <View style={styles.viewDetailsRow}>
              <Text style={styles.viewDetailsText}>View Details</Text>
              <Ionicons name="chevron-forward" size={14} color="#D4AF37" />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0E" />

      {/* TOP LUXURY HERO COVER & BRAND BAR */}
      <View style={styles.heroCover}>
        <Svg style={StyleSheet.absoluteFill}>
          <Defs>
            <SvgGradient id="propsHeroGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#2A2210" stopOpacity="1" />
              <Stop offset="50%" stopColor="#141419" stopOpacity="1" />
              <Stop offset="100%" stopColor="#0A0A0E" stopOpacity="1" />
            </SvgGradient>
            <SvgGradient id="propsGoldMesh" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#D4AF37" stopOpacity="0.25" />
              <Stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
            </SvgGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#propsHeroGrad)" />
          <SvgCircle cx="85%" cy="30%" r="85" fill="url(#propsGoldMesh)" />
          <SvgCircle cx="12%" cy="85%" r="65" fill="rgba(212, 175, 55, 0.08)" />
        </Svg>

        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={20} color="#D4AF37" />
          </TouchableOpacity>

          <View style={styles.brandTitleGroup}>
            <View style={styles.brandBadge}>
              <Ionicons name="sparkles" size={11} color="#D4AF37" />
              <Text style={styles.brandBadgeText}>REAL ESTATE HUB</Text>
            </View>
            <Text style={styles.pageTitle}>{t('tabs.properties') || 'Properties'}</Text>
          </View>

          <TouchableOpacity
            style={styles.addPropertyTopBtn}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('AddProperty')}
          >
            <Ionicons name="add" size={16} color="#0A0A0E" />
            <Text style={styles.addPropertyTopBtnText}>List</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* SEARCH SECTION */}
      <View style={styles.searchSection}>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search-outline" size={18} color="#D4AF37" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('properties.searchPlaceholder') || 'Search location or title...'}
            placeholderTextColor="#555566"
            value={searchLocation}
            onChangeText={setSearchLocation}
          />
          {searchLocation ? (
            <TouchableOpacity
              onPress={() => setSearchLocation('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle" size={18} color="#8E8E9F" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* SEGMENTED FILTER TABS */}
      <View style={styles.filterTabsRow}>
        {FILTER_TABS.map((tab) => {
          const isActive = filterType === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.filterTab, isActive && styles.filterTabActive]}
              activeOpacity={0.75}
              onPress={() => setFilterType(tab.id)}
            >
              <Ionicons
                name={tab.icon}
                size={13}
                color={isActive ? '#0A0A0E' : '#8E8E9F'}
              />
              <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* LIST HEADER SUMMARY */}
      <View style={styles.listHeaderRow}>
        <Text style={styles.listHeaderTitle}>
          VERIFIED LISTINGS ({filteredData.length})
        </Text>
        <Text style={styles.listHeaderSubtitle}>Tap to inspect details & broker contact</Text>
      </View>

      {/* PROPERTIES LIST OR EMPTY / LOADING STATES */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#D4AF37" />
          <Text style={styles.loadingText}>{t('properties.loading') || 'Loading Properties...'}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredData}
          renderItem={renderPropertyCard}
          keyExtractor={(item, index) => item._id?.toString() || index.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBox}>
                <Ionicons name="home-outline" size={42} color="#D4AF37" />
              </View>
              <Text style={styles.emptyText}>
                {t('properties.noProperties') || 'No Properties Found'}
              </Text>
              <Text style={styles.emptySubtitle}>
                Try adjusting your search criteria or be the first to list a verified property.
              </Text>
              <TouchableOpacity
                style={styles.emptyAddBtn}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('AddProperty')}
              >
                <Ionicons name="add-circle-outline" size={18} color="#0A0A0E" />
                <Text style={styles.emptyAddBtnText}>
                  {t('properties.addFirst') || 'Add New Property'}
                </Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* LUXURY FLOATING ACTION BUTTON (FAB) */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('AddProperty')}
      >
        <Ionicons name="add" size={28} color="#0A0A0E" />
      </TouchableOpacity>

      <MediaViewerModal
        visible={Boolean(viewerUri)}
        uri={viewerUri}
        onClose={() => setViewerUri(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0E',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#0A0A0E',
  },
  loadingText: {
    color: '#8E8E9F',
    fontSize: 14,
    fontWeight: '500',
  },

  /* HERO BANNER */
  heroCover: {
    height: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 70 : 94,
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 16,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(10, 10, 14, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
  },
  brandTitleGroup: {
    alignItems: 'center',
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    marginBottom: 3,
  },
  brandBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#D4AF37',
    letterSpacing: 1,
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  addPropertyTopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D4AF37',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    elevation: 3,
  },
  addPropertyTopBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0A0A0E',
    letterSpacing: 0.3,
  },

  /* SEARCH SECTION */
  searchSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141419',
    borderRadius: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#23232C',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 14,
  },

  /* FILTER TABS */
  filterTabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#141419',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#23232C',
  },
  filterTabActive: {
    backgroundColor: '#D4AF37',
    borderColor: '#D4AF37',
  },
  filterTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E8E9F',
  },
  filterTabTextActive: {
    color: '#0A0A0E',
    fontWeight: '800',
  },

  /* LIST HEADER SUMMARY */
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  listHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#8E8E9F',
  },
  listHeaderSubtitle: {
    fontSize: 10,
    color: '#555566',
  },

  /* CARD STYLING */
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 90,
  },
  card: {
    backgroundColor: '#141419',
    borderRadius: 22,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#23232C',
    overflow: 'hidden',
    elevation: 4,
  },
  cardImageContainer: {
    height: 190,
    width: '100%',
    position: 'relative',
    backgroundColor: '#0E0E14',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardPlaceholderImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#121218',
  },
  purposeBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D4AF37',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    elevation: 3,
  },
  purposeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0A0A0E',
    letterSpacing: 0.5,
  },
  rentBadge: {
    backgroundColor: '#10B981',
  },
  rentBadgeText: {
    color: '#FFFFFF',
  },
  typeChip: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(10, 10, 14, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
  },
  typeChipText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D4AF37',
    letterSpacing: 0.5,
  },
  zoomButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(10, 10, 14, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },

  /* CARD BODY */
  cardBody: {
    padding: 16,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: '#D4AF37',
    letterSpacing: 0.3,
  },
  rentUnit: {
    fontSize: 12,
    color: '#8E8E9F',
    fontWeight: '500',
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  verifiedPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 22,
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 14,
  },
  cardLocation: {
    fontSize: 13,
    color: '#8E8E9F',
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1E1E26',
  },
  metaFeaturePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#0E0E14',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#23232C',
  },
  metaFeatureText: {
    fontSize: 11,
    color: '#8E8E9F',
    fontWeight: '600',
  },
  viewDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  viewDetailsText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#D4AF37',
  },

  /* EMPTY STATE */
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    marginBottom: 16,
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  emptySubtitle: {
    color: '#8E8E9F',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
    maxWidth: 280,
    marginBottom: 20,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#D4AF37',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    elevation: 3,
  },
  emptyAddBtnText: {
    color: '#0A0A0E',
    fontWeight: '800',
    fontSize: 14,
  },

  /* FAB */
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#D4AF37',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
});

export default PropertiesScreen;
