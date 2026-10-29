import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  FlatList,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../hooks/useTranslation';
import api from '../services/api';
import { resolveMediaUrl } from '../utils/imageUrl';
import { getApiErrorMessage } from '../utils/apiError';
import { COMMISSION_ENABLED } from '../config/features';
import MediaViewerModal from '../components/MediaViewerModal';

const PropertyDetailScreen = ({ route, navigation }) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [property, setProperty] = useState(route.params?.property || {});
  const [updating, setUpdating] = useState(false);
  const [viewerUri, setViewerUri] = useState(null);

  const galleryUris = useMemo(() => {
    const raw = Array.isArray(property.images) ? property.images : [];
    const single = property.image ? [property.image] : [];
    const combined = raw.length ? raw : single;
    return combined.map(resolveMediaUrl).filter(Boolean);
  }, [property.images, property.image]);

  const ownerId = property.owner?._id || property.owner;
  const isOwner = user?._id && ownerId && user._id.toString() === ownerId.toString();
  const isAvailable = property.status === 'available' || !property.status;
  const purpose = property.purpose || property.type;

  const handleContact = () => {
    if (property.owner?._id || property.owner) {
      navigation.navigate('Chat', {
        otherUserId: (property.owner?._id || property.owner)?.toString(),
        otherUserName: property.owner?.name || t('common.user'),
      });
    } else {
      Alert.alert(t('common.error'), t('properties.locationNotSpecified'));
    }
  };

  const markPropertyComplete = (newStatus) => {
    Alert.alert(
      newStatus === 'sold' ? t('rewards.markAsSold') : t('rewards.markAsRented'),
      t('rewards.dealCompleted'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.success'),
          onPress: async () => {
            setUpdating(true);
            try {
              const response = await api.put(`/properties/${property._id}`, {
                status: newStatus,
              });
              const updated = response.data.property || response.data;
              setProperty(updated);
              if (COMMISSION_ENABLED) {
                const commission = response.data.commission || 0;
                if (commission > 0) {
                  Alert.alert(
                    t('rewards.dealCompleted'),
                    t('rewards.commissionEarned', { amount: commission.toLocaleString() })
                  );
                }
              } else {
                Alert.alert(t('common.success'), t('rewards.dealCompleted'));
              }
            } catch (error) {
              Alert.alert(
                t('common.error'),
                getApiErrorMessage(error, t('common.updateFailed'))
              );
            } finally {
              setUpdating(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{property.title || t('properties.defaultTitle')}</Text>
        <Text style={styles.price}>PKR {property.price || 0}</Text>
        <View style={styles.typeBadge}>
          <Text style={styles.typeText}>
            {purpose === 'sale' || property.type === 'sale'
              ? t('properties.forSale')
              : t('properties.forRent')}
          </Text>
        </View>
        {property.status && property.status !== 'available' && (
          <Text style={styles.statusText}>{property.status.toUpperCase()}</Text>
        )}
      </View>

      {galleryUris.length > 0 ? (
        <View style={styles.gallerySection}>
          <Text style={styles.sectionTitle}>{t('properties.photos')}</Text>
          <FlatList
            horizontal
            data={galleryUris}
            keyExtractor={(uri, index) => `${uri}-${index}`}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item: uri }) => (
              <TouchableOpacity activeOpacity={0.9} onPress={() => setViewerUri(uri)}>
                <Image source={{ uri }} style={styles.galleryImage} />
              </TouchableOpacity>
            )}
          />
          <Text style={styles.tapHint}>{t('properties.tapToView')}</Text>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('properties.locationLabel')}</Text>
        <Text style={styles.sectionContent}>
          {property.location || property.city || property.address || t('properties.locationNotSpecified')}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('properties.descriptionLabel')}</Text>
        <Text style={styles.sectionContent}>
          {property.description || t('properties.descriptionPlaceholder')}
        </Text>
      </View>

      {isOwner && isAvailable && (
        <View style={styles.ownerActions}>
          {purpose === 'sale' || property.type === 'sale' ? (
            <TouchableOpacity
              style={styles.completeBtn}
              onPress={() => markPropertyComplete('sold')}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator color="#000000" />
              ) : (
                <Text style={styles.completeBtnText}>{t('rewards.markAsSold')}</Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.completeBtn}
              onPress={() => markPropertyComplete('rented')}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator color="#000000" />
              ) : (
                <Text style={styles.completeBtnText}>{t('rewards.markAsRented')}</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}

      <TouchableOpacity style={styles.contactBtn} onPress={handleContact}>
        <Text style={styles.contactBtnText}>{t('properties.contactAgent')}</Text>
      </TouchableOpacity>

      <MediaViewerModal
        visible={Boolean(viewerUri)}
        uri={viewerUri}
        onClose={() => setViewerUri(null)}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  header: {
    backgroundColor: '#D4AF37',
    padding: 25,
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#000000', textAlign: 'center', marginBottom: 10 },
  price: { fontSize: 28, fontWeight: 'bold', color: '#000000', marginBottom: 10 },
  typeBadge: { backgroundColor: '#000000', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 20 },
  typeText: { color: '#D4AF37', fontSize: 12, fontWeight: 'bold' },
  statusText: { color: '#000000', marginTop: 8, fontWeight: '600' },
  gallerySection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#D4AF37',
  },
  galleryImage: {
    width: 200,
    height: 140,
    borderRadius: 10,
    marginRight: 12,
    backgroundColor: '#1a1a1a',
  },
  tapHint: {
    color: '#888',
    fontSize: 12,
    marginTop: 8,
  },
  section: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#D4AF37' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#D4AF37', marginBottom: 10 },
  sectionContent: { fontSize: 16, color: '#ccc', lineHeight: 24 },
  ownerActions: { padding: 20 },
  completeBtn: {
    backgroundColor: '#2ecc71',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  completeBtnText: { color: '#000000', fontSize: 18, fontWeight: 'bold' },
  contactBtn: {
    backgroundColor: '#D4AF37',
    margin: 20,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  contactBtnText: { color: '#000000', fontSize: 18, fontWeight: 'bold' },
});

export default PropertyDetailScreen;
