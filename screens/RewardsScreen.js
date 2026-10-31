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
  StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from '../hooks/useTranslation';
import { isAbortError } from '../services/api';
import ProgressBar from '../components/ProgressBar';
import { getMyProgress, claimReward, getLeaderboard } from '../services/rewardsApi';
import { getApiErrorMessage } from '../utils/apiError';
import { REFERRAL_ENABLED, COMMISSION_ENABLED } from '../config/features';

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
  }, [t]);

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
        getApiErrorMessage(error, t('rewards.claimFailed'))
      );
    } finally {
      setClaimingTier(null);
    }
  };

  const formatAmount = (amount) => `PKR ${Number(amount).toLocaleString()}`;

  const renderLeaderboardItem = ({ item }) => (
    <View style={styles.leaderRow}>
      <View style={styles.rankBadge}>
        <Text style={styles.leaderRank}>#{item.rank}</Text>
      </View>
      <View style={styles.leaderInfo}>
        <Text style={styles.leaderName}>{item.name}</Text>
        <Text style={styles.leaderMeta}>
          {t('rewards.totalSales')}: {item.totalSales}
          {COMMISSION_ENABLED ? ` • ${formatAmount(item.totalCommission)}` : ''}
        </Text>
      </View>
      <Ionicons name="medal-outline" size={18} color="#D4AF37" />
    </View>
  );

  const listHeader = (
    <>
      {/* Top App Bar */}
      <View style={styles.topBar}>
        {navigation.canGoBack() ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        ) : null}

        <View style={styles.titleCol}>
          <View style={styles.statusBadgeRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.statusBadgeText}>OFFICIAL CASH REWARDS</Text>
          </View>
          <Text style={styles.topTitle}>{t('rewards.title')}</Text>
        </View>

        <TouchableOpacity
          style={styles.historyBtn}
          onPress={() => navigation.navigate('RewardHistory')}
          activeOpacity={0.8}
        >
          <Ionicons name="time-outline" size={16} color="#D4AF37" />
          <Text style={styles.historyBtnText}>History</Text>
        </TouchableOpacity>
      </View>

      {/* Program Announcement Banner */}
      <View style={styles.announcementCard}>
        <View style={styles.announcementTopRow}>
          <Ionicons name="trophy" size={22} color="#D4AF37" />
          <View style={styles.announcementTextCol}>
            <Text style={styles.announcementTitle}>Cash Milestones Program</Text>
            <Text style={styles.announcementSub}>{t('rewards.earnPoints')}</Text>
          </View>
        </View>

        {progress?.currentTier && progress.currentTier !== 'none' ? (
          <View style={styles.currentTierBadge}>
            <Ionicons name="star" size={12} color="#D4AF37" />
            <Text style={styles.currentTierText}>
              Current Tier: {t(`rewards.${progress.currentTier}`) || progress.currentTier}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Stats Counters */}
      <View style={styles.statsRow}>
        {COMMISSION_ENABLED ? (
          <View style={styles.statCard}>
            <Ionicons name="cash-outline" size={18} color="#D4AF37" style={{ marginBottom: 4 }} />
            <Text style={styles.statValue}>{formatAmount(progress?.totalCommission || 0)}</Text>
            <Text style={styles.statLabel}>{t('rewards.totalCommission')}</Text>
          </View>
        ) : null}
        <View style={styles.statCard}>
          <Ionicons name="checkmark-done-circle-outline" size={18} color="#10B981" style={{ marginBottom: 4 }} />
          <Text style={styles.statValue}>{progress?.totalSales || 0}</Text>
          <Text style={styles.statLabel}>{t('rewards.totalSales')}</Text>
        </View>
      </View>

      {/* Tier Milestone Cards */}
      <Text style={styles.sectionHeading}>Tier Cash Milestones</Text>
      {progress?.tiers?.map((tierData) => {
        const tierColor = TIER_COLORS[tierData.tier] || '#D4AF37';

        return (
          <View
            key={tierData.tier}
            style={[styles.tierCard, { borderColor: `${tierColor}50` }]}
          >
            <View style={styles.tierHeader}>
              <View style={[styles.tierIconWrap, { backgroundColor: `${tierColor}20` }]}>
                <Ionicons name="trophy" size={22} color={tierColor} />
              </View>
              <View style={styles.tierHeaderText}>
                <Text style={[styles.tierName, { color: tierColor }]}>
                  {t(`rewards.${tierData.tier}`) || tierData.tier} Tier
                </Text>
                <Text style={styles.tierPrize}>{formatAmount(tierData.rewardAmount)} Prize</Text>
              </View>
              {tierData.eligible ? (
                <View style={[styles.eligibleChip, { backgroundColor: `${tierColor}25` }]}>
                  <Text style={[styles.eligibleChipText, { color: tierColor }]}>Unlocked</Text>
                </View>
              ) : null}
            </View>

            <ProgressBar
              label={t('rewards.followers')}
              current={tierData.progress.followers}
              target={tierData.requirements.followers}
              percentage={tierData.percentages.followers}
              color={tierColor}
            />
            <ProgressBar
              label={t('rewards.posts')}
              current={tierData.progress.posts}
              target={tierData.requirements.posts}
              percentage={tierData.percentages.posts}
              color={tierColor}
            />
            <ProgressBar
              label={t('rewards.salesRents')}
              current={tierData.progress.sales}
              target={tierData.requirements.sales}
              percentage={tierData.percentages.sales}
              color={tierColor}
            />

            <TouchableOpacity
              style={[
                styles.claimButton,
                tierData.eligible
                  ? { backgroundColor: tierColor }
                  : styles.claimButtonLocked,
              ]}
              disabled={!tierData.eligible || claimingTier === tierData.tier}
              onPress={() => handleClaim(tierData.tier)}
              activeOpacity={0.85}
            >
              {claimingTier === tierData.tier ? (
                <ActivityIndicator color="#0A0A0E" />
              ) : (
                <Text
                  style={[
                    styles.claimButtonText,
                    !tierData.eligible && styles.claimButtonTextLocked,
                  ]}
                >
                  {tierData.eligible ? t('rewards.claimReward') : t('rewards.notEligible')}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        );
      })}

      <View style={styles.leaderboardSectionHeader}>
        <Ionicons name="podium-outline" size={18} color="#D4AF37" />
        <Text style={styles.sectionTitle}>{t('rewards.leaderboard')}</Text>
      </View>
    </>
  );

  const listFooter = (
    <View style={styles.footerWrap}>
      <TouchableOpacity
        style={styles.historyLinkButton}
        onPress={() => navigation.navigate('RewardHistory')}
        activeOpacity={0.8}
      >
        <Ionicons name="receipt-outline" size={17} color="#D4AF37" />
        <Text style={styles.historyLinkText}>{t('rewards.viewHistory')}</Text>
      </TouchableOpacity>

      {REFERRAL_ENABLED ? (
        <TouchableOpacity
          style={styles.referralLinkButton}
          onPress={() => navigation.navigate('Referral')}
          activeOpacity={0.8}
        >
          <Ionicons name="gift-outline" size={17} color="#0A0A0E" />
          <Text style={styles.referralLinkText}>{t('rewards.referralProgram')}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <StatusBar barStyle="light-content" backgroundColor="#0A0A0E" />
        <ActivityIndicator size="large" color="#D4AF37" />
        <Text style={styles.loadingText}>Loading rewards program...</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0E" />

      {loadError ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color="#D4AF37" />
          <Text style={styles.errorText}>{loadError}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => {
              setLoading(true);
              const controller = new AbortController();
              loadData(controller.signal);
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.retryBtnText}>{t('common.retry') || 'Retry'}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={leaderboard.slice(0, 10)}
          renderItem={renderLeaderboardItem}
          keyExtractor={(item) => `${item.rank}-${item.name}`}
          ListHeaderComponent={listHeader}
          ListFooterComponent={listFooter}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                const controller = new AbortController();
                loadData(controller.signal);
              }}
              tintColor="#D4AF37"
              colors={['#D4AF37']}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0A0A0E',
  },
  listContent: {
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0A0E',
    padding: 24,
  },
  loadingText: {
    color: '#8A8A96',
    marginTop: 12,
    fontSize: 13,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 16,
    lineHeight: 20,
  },
  retryBtn: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 10,
  },
  retryBtnText: {
    color: '#0A0A0E',
    fontWeight: '700',
    fontSize: 14,
  },

  /* Top Bar */
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A22',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#161620',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#262634',
    marginRight: 10,
  },
  titleCol: {
    flex: 1,
  },
  statusBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4ADE80',
    marginRight: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D4AF37',
    letterSpacing: 0.6,
  },
  topTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  historyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161620',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    gap: 4,
  },
  historyBtnText: {
    color: '#D4AF37',
    fontSize: 11.5,
    fontWeight: '700',
  },

  /* Announcement Card */
  announcementCard: {
    backgroundColor: '#141419',
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#242432',
  },
  announcementTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  announcementTextCol: {
    flex: 1,
  },
  announcementTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  announcementSub: {
    fontSize: 12,
    color: '#8A8A96',
    marginTop: 2,
    lineHeight: 16,
  },
  currentTierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C28',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    marginTop: 12,
    alignSelf: 'flex-start',
    gap: 6,
  },
  currentTierText: {
    color: '#D4AF37',
    fontSize: 11.5,
    fontWeight: '700',
  },

  /* Stats Row */
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 12,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#141419',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#22222E',
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  statLabel: {
    color: '#8A8A96',
    fontSize: 11.5,
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginHorizontal: 18,
    marginTop: 18,
    marginBottom: 10,
  },

  /* Tier Cards */
  tierCard: {
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 16,
    backgroundColor: '#141419',
    borderRadius: 16,
    borderWidth: 1,
  },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  tierIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tierHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  tierName: {
    fontSize: 17,
    fontWeight: '800',
  },
  tierPrize: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  eligibleChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  eligibleChipText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  claimButton: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  claimButtonLocked: {
    backgroundColor: '#1A1A24',
    borderWidth: 1,
    borderColor: '#262634',
  },
  claimButtonText: {
    color: '#0A0A0E',
    fontWeight: '700',
    fontSize: 14,
  },
  claimButtonTextLocked: {
    color: '#656575',
  },

  /* Leaderboard */
  leaderboardSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 18,
    marginTop: 18,
    marginBottom: 10,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  leaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#141419',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#20202A',
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#1C1C28',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  leaderRank: {
    color: '#D4AF37',
    fontWeight: '800',
    fontSize: 13,
  },
  leaderInfo: {
    flex: 1,
  },
  leaderName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  leaderMeta: {
    color: '#8A8A96',
    fontSize: 11.5,
    marginTop: 2,
  },

  /* Footer */
  footerWrap: {
    marginHorizontal: 16,
    marginTop: 12,
    gap: 10,
  },
  historyLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    backgroundColor: '#141419',
    gap: 6,
  },
  historyLinkText: {
    color: '#D4AF37',
    fontSize: 13.5,
    fontWeight: '700',
  },
  referralLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#D4AF37',
    gap: 6,
  },
  referralLinkText: {
    color: '#0A0A0E',
    fontSize: 13.5,
    fontWeight: '700',
  },
});

export default RewardsScreen;
