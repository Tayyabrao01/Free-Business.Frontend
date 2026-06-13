import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from '../hooks/useTranslation';

const MORE_OPTIONS = [
  {
    id: 'plotInformation',
    icon: 'map-outline',
    titleKey: 'more.plotInformation',
    descriptionKey: 'more.plotInformationDesc',
    screen: 'PlotInformation',
  },
  {
    id: 'privacyPolicy',
    icon: 'shield-checkmark-outline',
    titleKey: 'more.privacyPolicy',
    descriptionKey: 'more.privacyPolicyDesc',
    screen: 'PrivacyPolicy',
  },
];

const MoreScreen = ({ navigation }) => {
  const { t } = useTranslation();

  const options = useMemo(
    () =>
      MORE_OPTIONS.map((item) => ({
        ...item,
        title: t(item.titleKey),
        description: t(item.descriptionKey),
      })),
    [t]
  );

  const renderCard = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate(item.screen)}
      activeOpacity={0.8}
    >
      <View style={styles.iconWrap}>
        <Ionicons name={item.icon} size={28} color="#D4AF37" />
      </View>
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardDesc} numberOfLines={3}>
        {item.description}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>{t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('more.title')}</Text>
        <Text style={styles.subtitle}>{t('more.subtitle')}</Text>
      </View>

      <FlatList
        data={options}
        renderItem={renderCard}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
      />
    </View>
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
  back: { color: '#000000', fontSize: 16, fontWeight: '600', marginBottom: 8 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#000000' },
  subtitle: { fontSize: 14, color: '#1a1a1a', marginTop: 6 },
  list: { padding: 12, paddingBottom: 24 },
  row: { justifyContent: 'space-between' },
  card: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    margin: 6,
    minHeight: 160,
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#D4AF37', marginBottom: 6 },
  cardDesc: { fontSize: 12, color: '#888888', lineHeight: 18 },
});

export default MoreScreen;
