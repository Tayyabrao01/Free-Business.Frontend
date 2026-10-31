import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  ActivityIndicator,
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
import { launchImageLibrary } from 'react-native-image-picker';
import api from '../services/api';
import { useTranslation } from '../hooks/useTranslation';
import { uploadImageAsset } from '../services/uploadImageService';
import { getApiErrorMessage } from '../utils/apiError';
import { resolveMediaUrl } from '../utils/imageUrl';
import MediaViewerModal from '../components/MediaViewerModal';

const PROPERTY_TYPES = [
  { id: 'house', label: 'House', icon: 'home-outline' },
  { id: 'apartment', label: 'Apartment', icon: 'business-outline' },
  { id: 'villa', label: 'Villa', icon: 'cube-outline' },
  { id: 'office', label: 'Office', icon: 'briefcase-outline' },
  { id: 'shop', label: 'Shop', icon: 'storefront-outline' },
];

const AddPropertyScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [purpose, setPurpose] = useState('sale');
  const [propertyType, setPropertyType] = useState('house');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [viewerUri, setViewerUri] = useState(null);

  const pickImage = () => {
    const options = { mediaType: 'photo', quality: 0.8 };

    launchImageLibrary(options, async (response) => {
      if (response.didCancel) return;
      if (response.error) {
        Alert.alert(t('common.error'), t('properties.pickImageFailed'));
        return;
      }

      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        setUploading(true);

        try {
          const { url: uploadedUrl } = await uploadImageAsset(asset);
          setImages((prev) => [...prev, uploadedUrl]);
          Alert.alert(t('common.success'), t('properties.imageAdded'));
        } catch (error) {
          Alert.alert(t('common.error'), getApiErrorMessage(error, t('properties.uploadImageFailed')));
        } finally {
          setUploading(false);
        }
      }
    });
  };

  const removeImage = (index) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || !price || !location.trim()) {
      Alert.alert(t('common.error'), t('properties.fillRequired'));
      return;
    }
    if (isNaN(parseFloat(price))) {
      Alert.alert(t('common.error'), t('properties.invalidPrice'));
      return;
    }

    setLoading(true);
    try {
      const propertyData = {
        title: title.trim(),
        description: description.trim(),
        price: parseFloat(price),
        address: location.trim(),
        city: location.trim(),
        propertyType,
        purpose,
        images,
      };

      await api.post('/properties', propertyData);
      Alert.alert(t('common.success'), t('properties.addedSuccess'));
      navigation.goBack();
    } catch (error) {
      console.error('Add property error:', error);
      Alert.alert(t('common.error'), getApiErrorMessage(error, t('properties.addFailed')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0E" />

      {/* TOP LUXURY APP BAR WITH BACK NAVIGATION */}
      <View style={styles.topHeader}>
        <Svg style={StyleSheet.absoluteFill}>
          <Defs>
            <SvgGradient id="addPropHeaderGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#2A2210" stopOpacity="1" />
              <Stop offset="60%" stopColor="#141419" stopOpacity="1" />
              <Stop offset="100%" stopColor="#0A0A0E" stopOpacity="1" />
            </SvgGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#addPropHeaderGrad)" />
        </Svg>

        <View style={styles.topBarContent}>
          {/* Prominent Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={20} color="#D4AF37" />
          </TouchableOpacity>

          <View style={styles.headerTitleGroup}>
            <View style={styles.headerBadge}>
              <Ionicons name="sparkles" size={10} color="#D4AF37" />
              <Text style={styles.headerBadgeText}>PROPERTY CREATION</Text>
            </View>
            <Text style={styles.headerTitle}>{t('properties.addProperty') || 'List New Property'}</Text>
          </View>

          <View style={{ width: 38 }} />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* LISTING GUIDE BANNER */}
        <View style={styles.guideCard}>
          <View style={styles.guideIconBox}>
            <Ionicons name="home" size={22} color="#D4AF37" />
          </View>
          <View style={styles.guideTextCol}>
            <Text style={styles.guideTitle}>Showcase Your Real Estate</Text>
            <Text style={styles.guideSubtitle}>
              Publish verified properties to reach active investors, brokers, and buyers nationwide.
            </Text>
          </View>
        </View>

        {/* SECTION 1: BASIC INFORMATION */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="business-outline" size={16} color="#D4AF37" />
            <Text style={styles.sectionTitle}>BASIC INFORMATION</Text>
          </View>

          {/* TITLE INPUT */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('properties.titleLabel') || 'Property Title'} *</Text>
            <View style={styles.inputBox}>
              <Ionicons name="bookmark-outline" size={18} color="#D4AF37" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={title}
                onChangeText={setTitle}
                placeholder={t('properties.titlePlaceholder') || 'e.g. Luxury 1 Kanal Modern Villa in DHA'}
                placeholderTextColor="#555566"
              />
            </View>
          </View>

          {/* DESCRIPTION INPUT */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('properties.descriptionLabel') || 'Description'} *</Text>
            <View style={[styles.inputBox, styles.textAreaBox]}>
              <Ionicons name="document-text-outline" size={18} color="#D4AF37" style={[styles.inputIcon, styles.textAreaIcon]} />
              <TextInput
                style={[styles.textInput, styles.textAreaInput]}
                value={description}
                onChangeText={setDescription}
                placeholder={t('properties.descriptionPlaceholder') || 'Detail architectural design, room count, fittings, and perks...'}
                placeholderTextColor="#555566"
                multiline
                numberOfLines={4}
              />
            </View>
          </View>
        </View>

        {/* SECTION 2: PURPOSE & PRICING */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="pricetag-outline" size={16} color="#D4AF37" />
            <Text style={styles.sectionTitle}>TRANSACTION TYPE & PRICING</Text>
          </View>

          {/* PURPOSE SELECTOR (FOR SALE / FOR RENT) */}
          <Text style={styles.inputLabel}>{t('properties.purposeLabel') || 'Purpose'} *</Text>
          <View style={styles.purposeRow}>
            <TouchableOpacity
              style={[styles.purposeButton, purpose === 'sale' && styles.purposeButtonActive]}
              activeOpacity={0.8}
              onPress={() => setPurpose('sale')}
            >
              <Ionicons
                name="pricetag"
                size={16}
                color={purpose === 'sale' ? '#0A0A0E' : '#D4AF37'}
              />
              <Text style={[styles.purposeButtonText, purpose === 'sale' && styles.purposeButtonTextActive]}>
                {t('properties.forSale') || 'For Sale'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.purposeButton, purpose === 'rent' && styles.purposeButtonActive]}
              activeOpacity={0.8}
              onPress={() => setPurpose('rent')}
            >
              <Ionicons
                name="key"
                size={16}
                color={purpose === 'rent' ? '#0A0A0E' : '#D4AF37'}
              />
              <Text style={[styles.purposeButtonText, purpose === 'rent' && styles.purposeButtonTextActive]}>
                {t('properties.forRent') || 'For Rent'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* PRICE INPUT */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('properties.priceLabel') || 'Price (PKR)'} *</Text>
            <View style={styles.inputBox}>
              <View style={styles.currencyBadge}>
                <Text style={styles.currencyBadgeText}>PKR</Text>
              </View>
              <TextInput
                style={styles.textInput}
                value={price}
                onChangeText={setPrice}
                placeholder={t('properties.pricePlaceholder') || 'e.g. 35000000'}
                placeholderTextColor="#555566"
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* SECTION 3: SPECIFICATIONS & LOCATION */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cube-outline" size={16} color="#D4AF37" />
            <Text style={styles.sectionTitle}>PROPERTY TYPE & LOCATION</Text>
          </View>

          {/* PROPERTY TYPE PILLS */}
          <Text style={styles.inputLabel}>{t('properties.propertyTypeLabel') || 'Property Type'} *</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.typeScrollContent}
          >
            {PROPERTY_TYPES.map((typeItem) => {
              const isSelected = propertyType === typeItem.id;
              return (
                <TouchableOpacity
                  key={typeItem.id}
                  style={[styles.typePill, isSelected && styles.typePillActive]}
                  activeOpacity={0.75}
                  onPress={() => setPropertyType(typeItem.id)}
                >
                  <Ionicons
                    name={typeItem.icon}
                    size={16}
                    color={isSelected ? '#0A0A0E' : '#D4AF37'}
                  />
                  <Text style={[styles.typePillText, isSelected && styles.typePillTextActive]}>
                    {t(`properties.types.${typeItem.id}`) || typeItem.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* LOCATION INPUT */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('properties.locationLabel') || 'Location & City'} *</Text>
            <View style={styles.inputBox}>
              <Ionicons name="location-outline" size={18} color="#D4AF37" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={location}
                onChangeText={setLocation}
                placeholder={t('properties.locationPlaceholder') || 'e.g. DHA Phase 6, Lahore'}
                placeholderTextColor="#555566"
              />
            </View>
          </View>
        </View>

        {/* SECTION 4: MEDIA & PHOTOGRAPHS */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="images-outline" size={16} color="#D4AF37" />
            <Text style={styles.sectionTitle}>{t('properties.photosLabel') || 'PROPERTY PHOTOGRAPHS'}</Text>
          </View>

          {/* UPLOAD BUTTON CARD */}
          <TouchableOpacity
            style={styles.uploadCard}
            activeOpacity={0.8}
            onPress={pickImage}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color="#D4AF37" size="small" />
            ) : (
              <>
                <View style={styles.uploadIconCircle}>
                  <Ionicons name="camera-outline" size={24} color="#D4AF37" />
                </View>
                <Text style={styles.uploadCardText}>
                  {t('properties.addPhoto') || 'Add Photo from Gallery'}
                </Text>
                <Text style={styles.uploadCardSubtext}>
                  PNG, JPG supported (up to 10 photos)
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* PHOTO THUMBNAILS GALLERY */}
          {images.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.galleryScroll}
            >
              {images.map((img, index) => {
                const previewUri = resolveMediaUrl(img);
                return (
                  <View key={`${img}-${index}`} style={styles.thumbnailContainer}>
                    <TouchableOpacity
                      activeOpacity={0.88}
                      onPress={() => setViewerUri(previewUri)}
                    >
                      <Image source={{ uri: previewUri }} style={styles.thumbnailImage} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deletePhotoBtn}
                      activeOpacity={0.7}
                      onPress={() => removeImage(index)}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Ionicons name="close" size={14} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* HINT & PUBLISH BUTTON */}
        <Text style={styles.requiredHint}>{t('properties.requiredFields') || '* Required fields'}</Text>

        <TouchableOpacity
          style={styles.publishButton}
          activeOpacity={0.85}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#0A0A0E" size="small" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#0A0A0E" />
              <Text style={styles.publishButtonText}>
                {loading ? t('properties.adding') : (t('properties.addProperty') || 'Publish Property Listing')}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

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
  topHeader: {
    height: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 65 : 85,
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  topBarContent: {
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
  headerTitleGroup: {
    alignItems: 'center',
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    marginBottom: 3,
  },
  headerBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#D4AF37',
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  /* GUIDE CARD */
  guideCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141419',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#23232C',
    marginBottom: 16,
    gap: 12,
  },
  guideIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  guideTextCol: {
    flex: 1,
  },
  guideTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  guideSubtitle: {
    fontSize: 12,
    color: '#8E8E9F',
    lineHeight: 16,
  },

  /* SECTION CARDS */
  sectionCard: {
    backgroundColor: '#141419',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#23232C',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: '#D4AF37',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8E8E9F',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E0E14',
    borderWidth: 1,
    borderColor: '#262632',
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    paddingVertical: 13,
    color: '#FFFFFF',
    fontSize: 15,
  },
  textAreaBox: {
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  textAreaIcon: {
    marginTop: 4,
  },
  textAreaInput: {
    height: 80,
    textAlignVertical: 'top',
    paddingVertical: 0,
  },

  /* PURPOSE SELECTOR */
  purposeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  purposeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0E0E14',
    borderWidth: 1,
    borderColor: '#262632',
    paddingVertical: 13,
    borderRadius: 14,
  },
  purposeButtonActive: {
    backgroundColor: '#D4AF37',
    borderColor: '#D4AF37',
  },
  purposeButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D4AF37',
  },
  purposeButtonTextActive: {
    color: '#0A0A0E',
    fontWeight: '800',
  },
  currencyBadge: {
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  currencyBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#D4AF37',
  },

  /* PROPERTY TYPE PILLS */
  typeScrollContent: {
    gap: 8,
    paddingBottom: 16,
  },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0E0E14',
    borderWidth: 1,
    borderColor: '#262632',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },
  typePillActive: {
    backgroundColor: '#D4AF37',
    borderColor: '#D4AF37',
  },
  typePillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#D4AF37',
  },
  typePillTextActive: {
    color: '#0A0A0E',
    fontWeight: '800',
  },

  /* UPLOAD PHOTOS CARD */
  uploadCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0E0E14',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(212, 175, 55, 0.4)',
    borderRadius: 16,
    paddingVertical: 24,
    marginBottom: 14,
  },
  uploadIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  uploadCardText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#D4AF37',
    letterSpacing: 0.3,
  },
  uploadCardSubtext: {
    fontSize: 11,
    color: '#6B6B7F',
    marginTop: 4,
  },

  /* GALLERY THUMBNAILS */
  galleryScroll: {
    gap: 12,
    paddingVertical: 4,
  },
  thumbnailContainer: {
    position: 'relative',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#D4AF37',
  },
  thumbnailImage: {
    width: 90,
    height: 90,
    borderRadius: 12,
  },
  deletePhotoBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(239, 68, 68, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* SUBMIT BUTTON */
  requiredHint: {
    fontSize: 11,
    color: '#8E8E9F',
    textAlign: 'center',
    marginBottom: 12,
  },
  publishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#D4AF37',
    paddingVertical: 16,
    borderRadius: 18,
    elevation: 4,
    marginBottom: 20,
  },
  publishButtonText: {
    color: '#0A0A0E',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});

export default AddPropertyScreen;
