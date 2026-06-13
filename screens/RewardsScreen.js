import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  FlatList,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from '../hooks/useTranslation';
import { isAbortError } from '../services/api';
import ProgressBar from '../components/ProgressBar';
import { getMyProgress, claimReward, getLeaderboard } from '../services/rewardsApi';
import { getApiErrorMessage } from '../utils/apiError';
import { REFERRAL_ENABLED } from '../config/features';

const TIER_COLORS = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#D4AF37',
};

const RewardsScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [progress, setProgress] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [claimingTier, setClaimingTier] = useState(null);
  const [loadError, setLoadError] = useState(null);

  const loadData = useCallback(async (signal) => {
    try {
      setLoadError(null);
      const [progressRes, leaderboardRes] = await Promise.all([
        getMyProgress({ signal }),
        getLeaderboard({ signal }),
      ]);
      if (!signal?.aborted) {
        setProgress(progressRes.data);
        setLeaderboard(leaderboardRes.data || []);
      }
    } catch (error) {
      if (!isAbortError(error)) {
        console.error('Rewards load error:', error);
        setLoadError(getApiErrorMessage(error, t('rewards.loadFailed')));
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController();
      setLoading(true);
      loadData(controller.signal);
      return () => controller.abort();
    }, [loadData])
  );

  const handleClaim = async (tier) => {
    setClaimingTier(tier);
    try {
      await claimReward(tier);
      Alert.alert(t('common.success'), t('rewards.claimSubmitted'));
      const controller = new AbortController();
      await loadData(controller.signal);
    } catch (error) {
      Alert.alert(
        t('common.error'),
        error.response?.data?.message || t('rewards.claimFailed')
      );
    } finally {
      setClaimingTier(null);
    }
  };

  const formatAmount = (amount) => `PKR ${Number(amount).toLocaleString()}`;

  const renderLeaderboardItem = ({ item }) => (
    <View style={styles.leaderRow}>
      <Text style={styles.leaderRank}>#{item.rank}</Text>
      <View style={styles.leaderInfo}>
        <Text style={styles.leaderName}>{item.name}</Text>
        <Text style={styles.leaderMeta}>
          {t('rewards.totalSales')}: {item.totalSales} • {formatAmount(item.totalCommission)}
        </Text>
      </View>
    </View>
  );

  const listHeader = (
    <>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('rewards.title')}</Text>
        <Text style={styles.headerSubtitle}>{t('rewards.earnPoints')}</Text>
        {progress?.currentTier && progress.currentTier !== 'none' && (
          <View style={styles.currentTierBadge}>
            <Text style={styles.currentTierText}>
              {t('rewards.currentTier')}: {t(`rewards.${progress.currentTier}`)}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{formatAmount(progress?.totalCommission || 0)}</Text>
          <Text style={styles.statLabel}>{t('rewards.totalCommission')}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{progress?.totalSales || 0}</Text>
          <Text style={styles.statLabel}>{t('rewards.totalSales')}</Text>
        </View>
      </View>

      {progress?.tiers?.map((tierData) => (
        <View
          key={tierData.tier}
          style={[styles.tierCard, { borderColor: TIER_COLORS[tierData.tier] }]}
        >
          <View style={styles.tierHeader}>
            <Ionicons name="trophy-outline" size={24} color={TIER_COLORS[tierData.tier]} />
            <View style={styles.tierHeaderText}>
              <Text style={[styles.tierName, { color: TIER_COLORS[tierData.tier] }]}>
                {t(`rewards.${tierData.tier}`)}
              </Text>
              <Text style={styles.tierPrize}>{formatAmount(tierData.rewardAmount)}</Text>
            </View>
          </View>

          <ProgressBar
            label={t('rewards.followers')}
            current={tierData.progress.followers}
            target={tierData.requirements.followers}
            percentage={tierData.percentages.followers}
            color={TIER_COLORS[tierData.tier]}
          />
          <ProgressBar
            label={t('rewards.posts')}
            current={tierData.progress.posts}
            target={tierData.requirements.posts}
            percentage={tierData.percentages.posts}
            color={TIER_COLORS[tierData.tier]}
          />
          <ProgressBar
            label={t('rewards.salesRents')}
            current={tierData.progress.sales}
            target={tierData.requirements.sales}
            percentage={tierData.percentages.sales}
            color={TIER_COLORS[tierData.tier]}
          />

          <TouchableOpacity
            style={[
              styles.claimButton,
              { backgroundColor: tierData.eligible ? TIER_COLORS[tierData.tier] : '#333333' },
            ]}
            disabled={!tierData.eligible || claimingTier === tierData.tier}
            onPress={() => handleClaim(tierData.tier)}
          >
            {claimingTier === tierData.tier ? (
              <ActivityIndicator color="#000000" />
            ) : (
              <Text style={styles.claimButtonText}>
                {tierData.eligible ? t('rewards.claimReward') : t('rewards.notEligible')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      ))}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('rewards.leaderboard')}</Text>
      </View>
    </>
  );

  const listFooter = (
    <>
      <TouchableOpacity
        style={styles.linkButton}
        onPress={() => navigation.navigate('RewardHistory')}
      >
        <Text style={styles.linkButtonText}>{t('rewards.viewHistory')}</Text>
      </TouchableOpacity>

      {REFERRAL_ENABLED ? (
        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.navigate('Referral')}
        >
          <Text style={styles.linkButtonText}>{t('rewards.referralProgram')}</Text>
        </TouchableOpacity>
      ) : null}
      <View style={styles.bottomPad} />
    </>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{loadError}</Text>
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={() => {
            setLoading(true);
            const controller = new AbortController();
            loadData(controller.signal);
          }}
        >
          <Text style={styles.retryBtnText}>{t('stream.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.list}
      data={leaderboard.slice(0, 10)}
      renderItem={renderLeaderboardItem}
      keyExtractor={(item) => `${item.rank}-${item.name}`}
      ListHeaderComponent={listHeader}
      ListFooterComponent={listFooter}
      contentContainerStyle={styles.listContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            const controller = new AbortController();
            loadData(controller.signal);
          }}
          tintColor="#D4AF37"
        />
      }
    />
  );
};

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: '#000000' },
  listContent: { paddingBottom: 24 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    padding: 24,
  },
  errorText: { color: '#ff6b6b', fontSize: 14, textAlign: 'center', marginBottom: 16, lineHeight: 22 },
  retryBtn: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryBtnText: { color: '#000000', fontWeight: '700', fontSize: 15 },
  header: {
    backgroundColor: '#D4AF37',
    padding: 24,
    paddingTop: 50,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#000000' },
  headerSubtitle: { fontSize: 14, color: '#1a1a1a', marginTop: 6 },
  currentTierBadge: {
    marginTop: 12,
    backgroundColor: '#000000',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  currentTierText: { color: '#D4AF37', fontWeight: '600', fontSize: 12 },
  statsRow: { flexDirection: 'row', padding: 16 },
  statCard: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D4AF37',
    marginHorizontal: 4,
  },
  statValue: { color: '#D4AF37', fontSize: 16, fontWeight: 'bold' },
  statLabel: { color: '#888888', fontSize: 12, marginTop: 4 },
  tierCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
  },
  tierHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  tierHeaderText: { marginLeft: 12, flex: 1 },
  tierName: { fontSize: 20, fontWeight: 'bold' },
  tierPrize: { color: '#ffffff', fontSize: 16, fontWeight: '600', marginTop: 2 },
  claimButton: { marginTop: 8, padding: 14, borderRadius: 8, alignItems: 'center' },
  claimButtonText: { color: '#000000', fontWeight: 'bold', fontSize: 15 },
  section: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 16,
    paddingBottom: 0,
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: '#333333',
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#D4AF37' },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    backgroundColor: '#1a1a1a',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#333333',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  leaderRank: { color: '#D4AF37', fontWeight: 'bold', width: 36, fontSize: 16 },
  leaderInfo: { flex: 1 },
  leaderName: { color: '#ffffff', fontSize: 15, fontWeight: '600' },
  leaderMeta: { color: '#888888', fontSize: 12, marginTop: 2 },
  linkButton: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D4AF37',
    alignItems: 'center',
  },
  linkButtonText: { color: '#D4AF37', fontSize: 16, fontWeight: '600' },
  bottomPad: { height: 16, backgroundColor: '#000000' },
});

export default RewardsScreen;
