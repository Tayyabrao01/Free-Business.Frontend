import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Share,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from '../hooks/useTranslation';
import { getReferralEarnings, applyReferral } from '../services/rewardsApi';
import { getApiErrorMessage } from '../utils/apiError';

const ReferralScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [referralInput, setReferralInput] = useState('');
  const [applying, setApplying] = useState(false);

  const loadReferrals = async () => {
    try {
      const response = await getReferralEarnings();
      setData(response.data);
    } catch (error) {
      console.error('Referral load error:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadReferrals();
    }, [])
  );

  const handleShare = async () => {
    if (!data?.referralCode) return;
    try {
      await Share.share({
        message: t('rewards.shareMessage', { code: data.referralCode }),
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleApplyReferral = async () => {
    if (!referralInput.trim()) {
      Alert.alert(t('common.error'), t('rewards.enterReferralCode'));
      return;
    }
    setApplying(true);
    try {
      await applyReferral(referralInput.trim().toUpperCase());
      Alert.alert(t('common.success'), t('rewards.referralApplied'));
      setReferralInput('');
      loadReferrals();
    } catch (error) {
      Alert.alert(t('common.error'), getApiErrorMessage(error, t('rewards.referralFailed')));
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>{t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('rewards.referralProgram')}</Text>
      </View>

      <View style={styles.codeCard}>
        <Text style={styles.codeLabel}>{t('rewards.yourReferralCode')}</Text>
        <Text style={styles.code}>{data?.referralCode || '---'}</Text>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Text style={styles.shareButtonText}>{t('rewards.shareCode')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>PKR {(data?.referralEarnings || 0).toLocaleString()}</Text>
          <Text style={styles.statLabel}>{t('rewards.referralEarnings')}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{data?.totalReferrals || 0}</Text>
          <Text style={styles.statLabel}>{t('rewards.totalReferrals')}</Text>
        </View>
      </View>

      {!data?.referredBy && (
        <View style={styles.applySection}>
          <Text style={styles.applyTitle}>{t('rewards.haveReferralCode')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('rewards.referralCodePlaceholder')}
            placeholderTextColor="#666"
            value={referralInput}
            onChangeText={setReferralInput}
            autoCapitalize="characters"
          />
          <TouchableOpacity style={styles.applyButton} onPress={handleApplyReferral} disabled={applying}>
            {applying ? (
              <ActivityIndicator color="#000000" />
            ) : (
              <Text style={styles.applyButtonText}>{t('rewards.applyReferral')}</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.listTitle}>{t('rewards.yourReferrals')}</Text>
      {(data?.referrals || []).length === 0 ? (
        <Text style={styles.empty}>{t('rewards.noReferralsYet')}</Text>
      ) : (
        data.referrals.map((ref, index) => (
          <View key={index} style={styles.referralRow}>
            <Text style={styles.referralName}>{ref.user?.name || t('common.user')}</Text>
            <Text style={styles.referralDate}>
              {new Date(ref.joinedAt).toLocaleDateString()}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingTop: 50, padding: 20, backgroundColor: '#D4AF37', borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  back: { color: '#000000', marginBottom: 8, fontSize: 14, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#000000' },
  codeCard: { margin: 16, padding: 20, backgroundColor: '#1a1a1a', borderRadius: 12, borderWidth: 1, borderColor: '#D4AF37', alignItems: 'center' },
  codeLabel: { color: '#888888', fontSize: 14, marginBottom: 8 },
  code: { color: '#D4AF37', fontSize: 32, fontWeight: 'bold', letterSpacing: 4 },
  shareButton: { marginTop: 16, backgroundColor: '#D4AF37', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  shareButtonText: { color: '#000000', fontWeight: 'bold', fontSize: 16 },
  statsCard: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 16 },
  statItem: { flex: 1, backgroundColor: '#1a1a1a', padding: 16, borderRadius: 10, marginHorizontal: 4, alignItems: 'center', borderWidth: 1, borderColor: '#333333' },
  statValue: { color: '#D4AF37', fontSize: 18, fontWeight: 'bold' },
  statLabel: { color: '#888888', fontSize: 12, marginTop: 4, textAlign: 'center' },
  applySection: { margin: 16, padding: 16, backgroundColor: '#1a1a1a', borderRadius: 10, borderWidth: 1, borderColor: '#333333' },
  applyTitle: { color: '#D4AF37', fontSize: 16, fontWeight: '600', marginBottom: 10 },
  input: { borderWidth: 1, borderColor: '#D4AF37', borderRadius: 8, padding: 12, color: '#D4AF37', backgroundColor: '#000000', marginBottom: 12 },
  applyButton: { backgroundColor: '#D4AF37', padding: 14, borderRadius: 8, alignItems: 'center' },
  applyButtonText: { color: '#000000', fontWeight: 'bold' },
  listTitle: { marginHorizontal: 16, marginBottom: 10, color: '#D4AF37', fontSize: 18, fontWeight: 'bold' },
  referralRow: { marginHorizontal: 16, marginBottom: 8, padding: 14, backgroundColor: '#1a1a1a', borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between' },
  referralName: { color: '#ffffff', fontSize: 15, fontWeight: '600' },
  referralDate: { color: '#888888', fontSize: 13 },
  empty: { color: '#888888', textAlign: 'center', marginHorizontal: 16, marginBottom: 30 },
});

export default ReferralScreen;
