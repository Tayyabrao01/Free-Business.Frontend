import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from '../hooks/useTranslation';

const PlotInformationScreen = ({ navigation }) => {
  const { t } = useTranslation();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>{t('common.back')}</Text>
        </TouchableOpacity>
        <View style={styles.headerRow}>
          <Ionicons name="map-outline" size={32} color="#000000" />
          <Text style={styles.title}>{t('plotInformation.title')}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.body}>{t('plotInformation.comingSoon')}</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  header: {
    backgroundColor: '#D4AF37',
    paddingTop: 50,
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  back: { color: '#000000', fontSize: 16, fontWeight: '600', marginBottom: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 26, fontWeight: 'bold', color: '#000000', flex: 1, marginLeft: 12 },
  content: { padding: 20 },
  body: { fontSize: 16, color: '#888888', lineHeight: 24 },
});

export default PlotInformationScreen;
