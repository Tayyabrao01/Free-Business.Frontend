import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Alert,
} from 'react-native';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const PropertyDetailsScreen = ({ route, navigation }) => {
  const { property } = route.params;
  const { userId } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  const images = Array.isArray(property.images) && property.images.length > 0 ? property.images : property.image ? [property.image] : [];
  const currentUserIsOwner = userId && property.owner?._id === userId;

  const startConversation = async () => {
    if (!property.owner?._id) {
      Alert.alert('Agent not available', 'This property does not have an assigned agent.');
      return;
    }

    if (currentUserIsOwner) {
      Alert.alert('Notice', 'You are the owner of this property.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/conversations', {
        participantId: property.owner._id,
        propertyId: property._id,
      });
      const conversation = response.data.conversation || response.data;
      navigation.navigate('Tab', {
        screen: 'Chat',
        params: {
          conversationId: conversation._id,
          partner: property.owner,
          property,
        },
      });
    } catch (error) {
      console.error('Failed to start conversation', error);
      Alert.alert('Error', 'Could not start chat with the agent.');
    } finally {
      setLoading(false);
    }
  };

  const renderImage = ({ item }) => <Image source={{ uri: item }} style={styles.galleryImage} />;

  return (
    <ScrollView style={styles.container}>
      {images.length > 0 ? (
        <FlatList
          data={images}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, index) => `${item}-${index}`}
          renderItem={renderImage}
          style={styles.imageGallery}
        />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.placeholderText}>No images available</Text>
        </View>
      )}
      <View style={styles.content}>
        <Text style={styles.title}>{property.title}</Text>
        <Text style={styles.location}>{property.city ?? property.address}</Text>
        <Text style={styles.price}>${property.price}</Text>
        <Text style={styles.meta}>{`${property.propertyType ?? 'Property'} · ${property.purpose ?? ''} · ${property.status ?? ''}`}</Text>

        <View style={styles.detailsRow}>
          <Text style={styles.detailLabel}>Bedrooms</Text>
          <Text style={styles.detailValue}>{property.bedrooms ?? 0}</Text>
        </View>
        <View style={styles.detailsRow}>
          <Text style={styles.detailLabel}>Bathrooms</Text>
          <Text style={styles.detailValue}>{property.bathrooms ?? 0}</Text>
        </View>
        {property.area ? (
          <View style={styles.detailsRow}>
            <Text style={styles.detailLabel}>Area</Text>
            <Text style={styles.detailValue}>{property.area} sqft</Text>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{property.description}</Text>

        {property.owner ? (
          <View style={styles.agentCard}>
            <Text style={styles.agentTitle}>Contact Agent</Text>
            <Text style={styles.agentName}>{property.owner.name}</Text>
            <Text style={styles.agentEmail}>{property.owner.email}</Text>
          </View>
        ) : null}

        <TouchableOpacity style={styles.button} onPress={startConversation} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>{currentUserIsOwner ? 'This is your property' : 'Message Agent'}</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  imageGallery: { height: 280, backgroundColor: '#EFF6FF' },
  galleryImage: { width: 320, height: 280, resizeMode: 'cover', marginRight: 12, borderRadius: 18 },
  imagePlaceholder: { height: 280, justifyContent: 'center', alignItems: 'center', backgroundColor: '#E2E8F0' },
  placeholderText: { color: '#64748B' },
  content: { padding: 16 },
  title: { fontSize: 26, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
  location: { fontSize: 16, color: '#475569', marginBottom: 6 },
  price: { fontSize: 24, fontWeight: '800', color: '#16A34A', marginBottom: 4 },
  meta: { fontSize: 14, color: '#64748B', marginBottom: 12 },
  detailsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  detailLabel: { fontSize: 14, color: '#475569', fontWeight: '600' },
  detailValue: { fontSize: 14, color: '#0F172A', fontWeight: '700' },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginTop: 18, marginBottom: 8, color: '#0F172A' },
  description: { fontSize: 15, lineHeight: 22, color: '#334155' },
  agentCard: { marginTop: 22, padding: 16, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  agentTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 6 },
  agentName: { fontSize: 15, color: '#1E293B' },
  agentEmail: { fontSize: 14, color: '#475569', marginTop: 2 },
  button: { backgroundColor: '#2563EB', borderRadius: 999, paddingVertical: 14, alignItems: 'center', marginTop: 24 },
  buttonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
});

export default PropertyDetailsScreen;