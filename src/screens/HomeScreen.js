import React, { useEffect, useMemo, useState } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, TextInput } from 'react-native';
import api from '../services/api';
import PropertyItem from '../components/PropertyItem';

const HomeScreen = ({ navigation }) => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const res = await api.get('/properties');
        setProperties(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, []);

  const filteredProperties = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return properties;

    return properties.filter((property) => {
      const text = `${property.title ?? ''} ${property.description ?? ''} ${property.city ?? ''} ${property.address ?? ''} ${property.propertyType ?? ''} ${property.purpose ?? ''}`.toLowerCase();
      return text.includes(query);
    });
  }, [properties, searchText]);

  if (loading) {
    return <ActivityIndicator size="large" style={styles.loader} />;
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        value={searchText}
        onChangeText={setSearchText}
        placeholder="Search properties by title, city or type"
        placeholderTextColor="#94A3B8"
      />
      <FlatList
        data={filteredProperties}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <PropertyItem property={item} onPress={() => navigation.navigate('PropertyDetails', { property: item })} />
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { flex: 1, justifyContent: 'center' },
  searchInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    margin: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
});

export default HomeScreen;