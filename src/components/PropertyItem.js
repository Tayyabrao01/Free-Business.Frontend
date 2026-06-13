import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { BASE_URL } from '../../services/api';

const PropertyItem = ({ property, onPress }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Image source={{ uri: `${BASE_URL.replace('/api', '')}${property.image}` }} style={styles.image} />
      <View style={styles.details}>
        <Text style={styles.title}>{property.title}</Text>
        <Text style={styles.price}>PKR {property.price}</Text>
        <Text style={styles.location}>{property.location}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: { flexDirection: 'row', padding: 10, borderBottomWidth: 1, borderBottomColor: '#ccc' },
  image: { width: 100, height: 100 },
  details: { flex: 1, marginLeft: 10 },
  title: { fontSize: 18, fontWeight: 'bold' },
  price: { fontSize: 16, color: 'green' },
  location: { fontSize: 14, color: 'gray' },
});

export default PropertyItem;