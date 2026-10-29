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
} from 'react-native';
import { FlatList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api, { isAbortError } from '../services/api';
import { useTranslation } from '../hooks/useTranslation';
import { resolveMediaUrl } from '../utils/imageUrl';
import MediaViewerModal from '../components/MediaViewerModal';

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

      const searchLower = searchLocation.toLowerCase();
      const locationText = property.location || property.city || '';
      const matchesSearch =
        searchLocation === '' ||
        locationText.toLowerCase().includes(searchLower) ||
        (property.title && property.title.toLowerCase().includes(searchLower));

      const propertyType = property.type || property.purpose;
      const matchesType = filterType === 'all' || propertyType === filterType;

      return matchesSearch && matchesType;
    });
  }, [properties, searchLocation, filterType]);

  const renderItem = ({ item }) => {
    const cover =
      resolveMediaUrl(item.images?.[0]) ||
      resolveMediaUrl(item.image) ||
      resolveMediaUrl(item.thumbnail);

    return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('PropertyDetail', { property: item })}
    >
      {cover ? (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={(e) => {
            e?.stopPropagation?.();
            setViewerUri(cover);
          }}
        >
          <Image source={{ uri: cover }} style={styles.cardImage} />
        </TouchableOpacity>
      ) : null}
      <Text style={styles.cardTitle}>{item.title || t('properties.defaultTitle')}</Text>
      <Text style={styles.cardPrice}>PKR {item.price || 0}</Text>
      <Text style={styles.cardLocation}>
        {item.location || t('properties.locationNotSpecified')}
      </Text>
      <View style={styles.cardType}>
        <Text style={styles.cardTypeText}>
          {item.type === 'sale' ? t('properties.forSale') : t('properties.forRent')}
        </Text>
      </View>
    </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#D4AF37" />
        <Text style={styles.loadingText}>{t('properties.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchSection}>
        <TextInput
          style={styles.searchInput}
          placeholder={t('properties.searchPlaceholder')}
          placeholderTextColor="#666"
          value={searchLocation}
          onChangeText={setSearchLocation}
        />

        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterBtn, filterType === 'all' && styles.filterBtnActive]}
            onPress={() => setFilterType('all')}
          >
            <Text style={[styles.filterBtnText, filterType === 'all' && styles.filterBtnTextActive]}>
              {t('properties.all')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterBtn, filterType === 'sale' && styles.filterBtnActive]}
            onPress={() => setFilterType('sale')}
          >
            <Text style={[styles.filterBtnText, filterType === 'sale' && styles.filterBtnTextActive]}>
              {t('properties.forSale')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterBtn, filterType === 'rent' && styles.filterBtnActive]}
            onPress={() => setFilterType('rent')}
          >
            <Text style={[styles.filterBtnText, filterType === 'rent' && styles.filterBtnTextActive]}>
              {t('properties.forRent')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.listWrap}>
        <FlatList
          data={filteredData}
          renderItem={renderItem}
          keyExtractor={(item, index) => item._id?.toString() || index.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{t('properties.noProperties')}</Text>
              <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddProperty')}>
                <Text style={styles.addBtnText}>{t('properties.addFirst')}</Text>
              </TouchableOpacity>
            </View>
          }
        />
      </View>

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddProperty')}>
        <Text style={styles.fabText}>+</Text>
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
    backgroundColor: '#000000',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  loadingText: {
    marginTop: 10,
    color: '#D4AF37',
    fontSize: 16,
  },
  searchSection: {
    padding: 15,
    backgroundColor: '#000000',
    borderBottomWidth: 1,
    borderBottomColor: '#D4AF37',
  },
  searchInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    color: '#D4AF37',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#D4AF37',
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D4AF37',
    alignItems: 'center',
  },
  filterBtnActive: {
    backgroundColor: '#D4AF37',
  },
  filterBtnText: {
    color: '#D4AF37',
    fontSize: 12,
    fontWeight: '600',
  },
  filterBtnTextActive: {
    color: '#000000',
  },
  listWrap: {
    flex: 1,
  },
  listContent: {
    padding: 15,
    paddingBottom: 90,
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  cardImage: {
    width: '100%',
    height: 160,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#000',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginBottom: 5,
  },
  cardPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginBottom: 5,
  },
  cardLocation: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  cardType: {
    alignSelf: 'flex-start',
    backgroundColor: '#D4AF37',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cardTypeText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
    marginBottom: 20,
  },
  addBtn: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addBtnText: {
    color: '#000000',
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#D4AF37',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabText: {
    color: '#000000',
    fontSize: 30,
    fontWeight: 'bold',
  },
});

export default PropertiesScreen;
