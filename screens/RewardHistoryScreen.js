import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from '../hooks/useTranslation';
import { getMyClaims } from '../services/rewardsApi';

const STATUS_COLORS = {
  pending: '#f39c12',
  approved: '#3498db',
  paid: '#2ecc71',
  rejected: '#e74c3c',
};

const RewardHistoryScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadClaims = async () => {
    try {
      const response = await getMyClaims();
      setClaims(response.data || []);
    } catch (error) {
      console.error('Claims load error:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadClaims();
    }, [])
  );

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.tier}>{t(`rewards.${item.tier}`)}</Text>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] || '#888' }]}>
          <Text style={styles.statusText}>{t(`rewards.status.${item.status}`)}</Text>
        </View>
      </View>
      <Text style={styles.amount}>PKR {Number(item.rewardAmount).toLocaleString()}</Text>
      <Text style={styles.date}>
        {t('rewards.requestedOn')}: {new Date(item.requestedAt).toLocaleDateString()}
      </Text>
      {item.adminNotes ? (
        <Text style={styles.notes}>{item.adminNotes}</Text>
      ) : null}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>{t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('rewards.claimHistory')}</Text>
      </View>

      <FlatList
        data={claims}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>{t('rewards.noClaims')}</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingTop: 50, paddingHorizontal: 20, paddingBottom: 16, backgroundColor: '#1a1a1a', borderBottomWidth: 1, borderBottomColor: '#D4AF37' },
  back: { color: '#D4AF37', marginBottom: 8, fontSize: 14 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#D4AF37' },
  list: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: '#1a1a1a', padding: 16, borderRadius: 10, marginBottom: 12, borderWidth: 1, borderColor: '#333333' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  tier: { fontSize: 18, fontWeight: 'bold', color: '#D4AF37', textTransform: 'capitalize' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: '#000000', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
  amount: { fontSize: 20, fontWeight: 'bold', color: '#ffffff', marginBottom: 6 },
  date: { color: '#888888', fontSize: 13 },
  notes: { color: '#aaaaaa', fontSize: 12, marginTop: 8, fontStyle: 'italic' },
  empty: { color: '#888888', textAlign: 'center', marginTop: 40, fontSize: 16 },
});

export default RewardHistoryScreen;
