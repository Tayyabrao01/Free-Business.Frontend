import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const CallEndedOverlay = ({ message = 'Call ended' }) => (
  <View style={styles.screen}>
    <Ionicons name="call" size={48} color="#D4AF37" style={styles.icon} />
    <Text style={styles.text}>{message}</Text>
  </View>
);

const styles = StyleSheet.create({
  screen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0d0d0d',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  icon: {
    transform: [{ rotate: '135deg' }],
    marginBottom: 16,
  },
  text: {
    color: '#D4AF37',
    fontSize: 20,
    fontWeight: '700',
  },
});

export default CallEndedOverlay;
