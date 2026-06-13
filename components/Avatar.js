import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { resolveMediaUrl } from '../utils/imageUrl';

const COLORS = ['#D4AF37', '#CD7F32', '#5DADE2', '#58D68D', '#AF7AC5', '#F5B041'];

const getPlaceholderColor = (name) => {
  const seed = name ? name.charCodeAt(0) : 0;
  return COLORS[seed % COLORS.length];
};

const Avatar = ({ uri, name, size = 48, style }) => {
  const imageUri = resolveMediaUrl(uri);
  const initial = name ? name.charAt(0).toUpperCase() : '?';
  const dimension = { width: size, height: size, borderRadius: size / 2 };

  if (imageUri) {
    return (
      <Image
        source={{ uri: imageUri }}
        style={[styles.image, dimension, style]}
      />
    );
  }

  return (
    <View
      style={[
        styles.placeholder,
        dimension,
        { backgroundColor: getPlaceholderColor(name) },
        style,
      ]}
    >
      <Text style={[styles.initial, { fontSize: size * 0.4 }]}>{initial}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    resizeMode: 'cover',
    borderWidth: 2,
    borderColor: '#D4AF37',
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#D4AF37',
  },
  initial: {
    color: '#000000',
    fontWeight: 'bold',
  },
});

export default Avatar;
