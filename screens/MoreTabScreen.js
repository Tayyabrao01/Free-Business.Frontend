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
import { useAuth } from '../context/AuthContext';

const MoreTabScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const options = useMemo(() => {
    const items = [
      {
        id: 'properties',
        icon: 'business-outline',
        title: t('tabs.properties'),
        description: t('home.browsePropertiesDesc'),
        screen: 'Properties',
      },
      {
        id: 'rewards',
        icon: 'trophy-outline',
        title: t('tabs.rewards'),
        description: t('rewards.earnPoints'),
        screen: 'Rewards',
      },
      {
        id: 'plotInformation',
        icon: 'map-outline',
        title: t('more.plotInformation'),
        description: t('more.plotInformationDesc'),
        screen: 'PlotInformation',
      },
      {
        id: 'privacyPolicy',
        icon: 'shield-checkmark-outline',
        title: t('more.privacyPolicy'),
        description: t('more.privacyPolicyDesc'),
        screen: 'PrivacyPolicy',
      },
    ];

    if (isAdmin) {
      items.unshift({
        id: 'admin',
        icon: 'shield-outline',
        title: t('tabs.admin'),
        description: t('admin.userManagement'),
        screen: 'Admin',
      });
    }

    return items;
  }, [isAdmin, t]);

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

export default MoreTabScreen;
