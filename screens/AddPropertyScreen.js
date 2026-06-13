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
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import api from '../services/api';
import { useTranslation } from '../hooks/useTranslation';
import { uploadImageAsset } from '../services/uploadImageService';
import { getApiErrorMessage } from '../utils/apiError';
import { resolveMediaUrl } from '../utils/imageUrl';
import MediaViewerModal from '../components/MediaViewerModal';

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

  const propertyTypes = ['house', 'apartment', 'villa', 'office', 'shop'];

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
      Alert.alert(t('common.error'), error.response?.data?.message || t('properties.addFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{t('properties.addProperty')}</Text>

      <Text style={styles.label}>{t('properties.titleLabel')} *</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder={t('properties.titlePlaceholder')}
        placeholderTextColor="#888"
      />

      <Text style={styles.label}>{t('properties.descriptionLabel')} *</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={description}
        onChangeText={setDescription}
        placeholder={t('properties.descriptionPlaceholder')}
        placeholderTextColor="#888"
        multiline
        numberOfLines={4}
      />

      <Text style={styles.label}>{t('properties.priceLabel')} *</Text>
      <TextInput
        style={styles.input}
        value={price}
        onChangeText={setPrice}
        placeholder={t('properties.pricePlaceholder')}
        placeholderTextColor="#888"
        keyboardType="numeric"
      />

      <Text style={styles.label}>{t('properties.locationLabel')} *</Text>
      <TextInput
        style={styles.input}
        value={location}
        onChangeText={setLocation}
        placeholder={t('properties.locationPlaceholder')}
        placeholderTextColor="#888"
      />

      <Text style={styles.label}>{t('properties.purposeLabel')} *</Text>
      <View style={styles.typeContainer}>
        <TouchableOpacity
          style={[styles.typeButton, purpose === 'sale' && styles.typeActive]}
          onPress={() => setPurpose('sale')}
        >
          <Text style={[styles.typeText, purpose === 'sale' && styles.typeTextActive]}>
            {t('properties.forSale')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeButton, purpose === 'rent' && styles.typeActive]}
          onPress={() => setPurpose('rent')}
        >
          <Text style={[styles.typeText, purpose === 'rent' && styles.typeTextActive]}>
            {t('properties.forRent')}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>{t('properties.propertyTypeLabel')} *</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.propertyTypeScroll}>
        {propertyTypes.map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.propTypeButton, propertyType === type && styles.typeActive]}
            onPress={() => setPropertyType(type)}
          >
            <Text style={[styles.propTypeText, propertyType === type && styles.typeTextActive]}>
              {t(`properties.types.${type}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.label}>{t('properties.photosLabel')}</Text>
      <TouchableOpacity style={styles.mediaButton} onPress={pickImage} disabled={uploading}>
        {uploading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.mediaButtonText}>📷 {t('properties.addPhoto')}</Text>
        )}
      </TouchableOpacity>

      {images.length > 0 && (
        <ScrollView horizontal style={styles.imagesScroll}>
          {images.map((img, index) => {
            const previewUri = resolveMediaUrl(img);
            return (
            <View key={`${img}-${index}`} style={styles.previewContainer}>
              <TouchableOpacity activeOpacity={0.9} onPress={() => setViewerUri(previewUri)}>
                <Image source={{ uri: previewUri }} style={styles.previewImage} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.removeButton} onPress={() => removeImage(index)}>
                <Text style={styles.removeText}>✕</Text>
              </TouchableOpacity>
            </View>
            );
          })}
        </ScrollView>
      )}

      <Text style={styles.requiredHint}>{t('properties.requiredFields')}</Text>

      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.submitButtonText}>
          {loading ? t('properties.adding') : t('properties.addProperty')}
        </Text>
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
  container: { flex: 1, padding: 20, backgroundColor: '#000000' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, color: '#D4AF37' },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 5, marginTop: 10, color: '#D4AF37' },
  requiredHint: { fontSize: 12, color: '#e74c3c', marginTop: 10, textAlign: 'right' },
  input: { borderWidth: 1, borderColor: '#D4AF37', padding: 12, borderRadius: 8, fontSize: 16, marginBottom: 10, backgroundColor: '#1a1a1a', color: '#D4AF37' },
  textArea: { height: 100, textAlignVertical: 'top' },
  typeContainer: { flexDirection: 'row', marginBottom: 10 },
  typeButton: { flex: 1, padding: 12, borderWidth: 1, borderColor: '#D4AF37', alignItems: 'center', marginHorizontal: 5, borderRadius: 8 },
  typeActive: { backgroundColor: '#D4AF37' },
  typeText: { color: '#D4AF37', fontSize: 16 },
  typeTextActive: { color: '#000000', fontWeight: 'bold' },
  propertyTypeScroll: { marginBottom: 20, flexDirection: 'row' },
  propTypeButton: { padding: 10, paddingHorizontal: 15, borderWidth: 1, borderColor: '#D4AF37', borderRadius: 20, marginRight: 10, height: 45, justifyContent: 'center' },
  propTypeText: { color: '#D4AF37', fontSize: 14 },
  mediaButton: { backgroundColor: '#D4AF37', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10, marginBottom: 10 },
  mediaButtonText: { color: '#000000', fontSize: 16, fontWeight: '600' },
  imagesScroll: { flexDirection: 'row', marginBottom: 10 },
  previewContainer: { marginRight: 10, position: 'relative' },
  previewImage: { width: 100, height: 100, borderRadius: 8, resizeMode: 'cover' },
  removeButton: { position: 'absolute', top: 5, right: 5, backgroundColor: 'rgba(0,0,0,0.7)', width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  removeText: { color: '#D4AF37', fontSize: 12, fontWeight: 'bold' },
  submitButton: { backgroundColor: '#D4AF37', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10, marginBottom: 40 },
  submitButtonText: { color: '#000000', fontSize: 18, fontWeight: 'bold' },
});

export default AddPropertyScreen;
