import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  StatusBar,
  Share,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from '../hooks/useTranslation';

const PLOT_IDS = ['marla5', 'marla10', 'kanal1'];

const PLOT_DATA = {
  marla5: {
    title: '5 Marla Plot',
    tag: 'Starter Plan',
    accent: '#D4AF37',
    soft: 'rgba(212, 175, 55, 0.08)',
    soil: '#5C4030',
    grass: '#2F6B3A',
    currentPrice: 3430000,
    monthlyRent: 34300,
    futureValue: 5000000,
    annualRent: 411600,
    savingsSale: 1570000,
    totalProfit: 1981400,
    appreciationPercent: '+45.8%',
  },
  marla10: {
    title: '10 Marla Plot',
    tag: 'High Yield',
    accent: '#3DB8A8',
    soft: 'rgba(61, 184, 168, 0.08)',
    soil: '#4A3428',
    grass: '#1F7A5A',
    currentPrice: 6290000,
    monthlyRent: 62900,
    futureValue: 10000000,
    annualRent: 754800,
    savingsSale: 3710000,
    totalProfit: 4464800,
    appreciationPercent: '+58.9%',
  },
  kanal1: {
    title: '1 Kanal Estate',
    tag: 'VIP Luxury',
    accent: '#E07A5F',
    soft: 'rgba(224, 122, 95, 0.08)',
    soil: '#6B3E2E',
    grass: '#8B5A2B',
    currentPrice: 10320000,
    monthlyRent: 103200,
    futureValue: 15000000,
    annualRent: 1238400,
    savingsSale: 4680000,
    totalProfit: 5938400,
    appreciationPercent: '+45.3%',
  },
};

const formatNumber = (value) => Number(value).toLocaleString('en-PK');

const PlotInformationScreen = ({ navigation }) => {
  const { t, isUrdu } = useTranslation();
  const [activeId, setActiveId] = useState('marla5');
  const fade = useRef(new Animated.Value(1)).current;
  const slide = useRef(new Animated.Value(0)).current;

  const plot = PLOT_DATA[activeId];

  const switchPlot = (id) => {
    if (id === activeId) return;
    Animated.parallel([
      Animated.timing(fade, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 10, duration: 120, useNativeDriver: true }),
    ]).start(() => {
      setActiveId(id);
      slide.setValue(-10);
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(slide, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    });
  };

  useEffect(() => {
    fade.setValue(1);
    slide.setValue(0);
  }, [fade, slide]);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${plot.title} Investment Plan:\nCurrent: PKR ${formatNumber(plot.currentPrice)}\nEstimated 1-Year Value: PKR ${formatNumber(plot.futureValue)}\nProjected Total Profit: PKR ${formatNumber(plot.totalProfit)}\nAvailable on Free Business App.`,
        title: plot.title,
      });
    } catch (err) {
      console.log('Share error', err);
    }
  };

  const rows = useMemo(
    () => [
      {
        icon: 'cash-outline',
        label: t('plotInformation.currentPrice'),
        value: `PKR ${formatNumber(plot.currentPrice)}`,
        sub: 'Current investment cost',
      },
      {
        icon: 'trending-up-outline',
        label: t('plotInformation.futureValue'),
        value: `PKR ${formatNumber(plot.futureValue)}`,
        sub: 'Value after 1 year (Est.)',
      },
      {
        icon: 'calendar-outline',
        label: t('plotInformation.annualRent'),
        value: `PKR ${formatNumber(plot.annualRent)}`,
        sub: 'Confirmed yearly returns',
      },
      {
        icon: 'pricetag-outline',
        label: t('plotInformation.savingsSale'),
        value: `PKR ${formatNumber(plot.savingsSale)}`,
        sub: 'Estimated capital growth',
      },
    ],
    [plot, t]
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0E" />

      {/* Top App Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.titleCol}>
          <View style={styles.statusBadgeRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.statusBadgeText}>INVESTMENT CALCULATOR</Text>
          </View>
          <Text style={styles.topTitle}>{t('plotInformation.title')}</Text>
        </View>

        <TouchableOpacity
          style={styles.actionIconBtn}
          onPress={handleShare}
          activeOpacity={0.7}
        >
          <Ionicons name="share-outline" size={20} color="#D4AF37" />
        </TouchableOpacity>
      </View>

      {/* Segmented Plot Size Selector */}
      <View style={styles.tabsWrap}>
        {PLOT_IDS.map((id) => {
          const selected = id === activeId;
          const accent = PLOT_DATA[id].accent;
          return (
            <TouchableOpacity
              key={id}
              style={[
                styles.tabChip,
                selected && { backgroundColor: accent, borderColor: accent },
              ]}
              onPress={() => switchPlot(id)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabChipText,
                  selected && styles.tabChipTextActive,
                ]}
              >
                {t(`plotInformation.sizes.${id}`)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.panel,
            {
              borderColor: `${plot.accent}40`,
              opacity: fade,
              transform: [{ translateY: slide }],
            },
          ]}
        >
          {/* Header Row */}
          <View style={styles.cardHeaderRow}>
            <View>
              <View style={[styles.planBadge, { backgroundColor: `${plot.accent}20` }]}>
                <Ionicons name="shield-checkmark" size={12} color={plot.accent} />
                <Text style={[styles.planBadgeText, { color: plot.accent }]}>
                  {plot.tag}
                </Text>
              </View>
              <Text style={[styles.panelTitle, isUrdu && styles.rtlText]}>
                {plot.title}
              </Text>
            </View>

            <View style={[styles.gainBadge, { backgroundColor: `${plot.accent}20` }]}>
              <Ionicons name="trending-up" size={14} color={plot.accent} />
              <Text style={[styles.gainBadgeText, { color: plot.accent }]}>
                {plot.appreciationPercent}
              </Text>
            </View>
          </View>

          {/* Monthly Rent Spotlight Card */}
          <View style={styles.rentSpotlight}>
            <View>
              <Text style={[styles.rentLabel, isUrdu && styles.rtlText]}>
                {t('plotInformation.monthlyRent')}
              </Text>
              <Text style={[styles.rentValue, { color: plot.accent }]}>
                PKR {formatNumber(plot.monthlyRent)}
                <Text style={styles.rentUnit}> / month</Text>
              </Text>
            </View>

            <View style={[styles.rentIconCircle, { backgroundColor: `${plot.accent}20` }]}>
              <Ionicons name="wallet-outline" size={22} color={plot.accent} />
            </View>
          </View>

          {/* Plot Visual Schematic */}
          <PlotVisual
            accent={plot.accent}
            soil={plot.soil}
            grass={plot.grass}
            badge={t(`plotInformation.sizes.${activeId}`)}
          />

          {/* Growth Projection Note */}
          <View style={styles.futureNoteCard}>
            <Ionicons name="information-circle-outline" size={18} color="#D4AF37" />
            <Text style={[styles.futureNoteText, isUrdu && styles.rtlText]}>
              {t(`plotInformation.${activeId}.futureNote`)}
            </Text>
          </View>

          {/* 4-Item Breakdown Grid */}
          <View style={styles.breakdownGrid}>
            {rows.map((row) => (
              <View key={row.label} style={styles.breakdownCard}>
                <View style={styles.breakdownIconWrap}>
                  <Ionicons name={row.icon} size={16} color={plot.accent} />
                </View>
                <Text style={[styles.breakdownLabel, isUrdu && styles.rtlText]}>
                  {row.label}
                </Text>
                <Text style={styles.breakdownValue}>{row.value}</Text>
                <Text style={styles.breakdownSub}>{row.sub}</Text>
              </View>
            ))}
          </View>

          {/* Total Profit Hero Banner */}
          <View style={[styles.profitBanner, { borderColor: plot.accent }]}>
            <View style={styles.profitTextCol}>
              <Text style={[styles.profitLabel, isUrdu && styles.rtlText]}>
                {t('plotInformation.totalProfit')}
              </Text>
              <Text style={[styles.profitHint, isUrdu && styles.rtlText]}>
                {t('plotInformation.profitHint')}
              </Text>
            </View>

            <View style={styles.profitValueCol}>
              <Text style={[styles.profitAmount, { color: plot.accent }]}>
                PKR {formatNumber(plot.totalProfit)}
              </Text>
              <Text style={styles.profitSub}>Rent + Appreciation</Text>
            </View>
          </View>
        </Animated.View>

        {/* Disclaimer */}
        <View style={styles.disclaimerCard}>
          <Ionicons name="shield-outline" size={16} color="#8A8A96" />
          <Text style={[styles.disclaimer, isUrdu && styles.rtlText]}>
            {t('plotInformation.disclaimer')}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const PlotVisual = ({ accent, soil, grass, badge }) => (
  <View style={styles.visualWrap}>
    <View style={[styles.plotShadow, { backgroundColor: `${accent}25` }]} />
    <View style={[styles.plotBase, { backgroundColor: soil }]}>
      <View style={[styles.plotTop, { backgroundColor: grass }]}>
        <View style={styles.gridLinesRow}>
          <View style={styles.gridLine} />
          <View style={styles.gridLine} />
          <View style={styles.gridLine} />
        </View>
      </View>
      <View style={[styles.plotSide, { backgroundColor: soil }]} />
    </View>
    <View style={[styles.visualBadge, { backgroundColor: accent }]}>
      <Text style={styles.visualBadgeText}>{badge}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0A0A0E',
  },
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
  },
  titleCol: {
    flex: 1,
    marginLeft: 12,
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
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  actionIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#161620',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#262634',
  },

  /* Selector Tabs */
  tabsWrap: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  tabChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#262634',
    backgroundColor: '#141419',
    alignItems: 'center',
  },
  tabChipText: {
    color: '#8A8A96',
    fontSize: 13,
    fontWeight: '700',
  },
  tabChipTextActive: {
    color: '#0A0A0E',
    fontWeight: '800',
  },

  /* Scrollable Content */
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  panel: {
    backgroundColor: '#141419',
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  planBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  panelTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  gainBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  gainBadgeText: {
    fontSize: 13,
    fontWeight: '800',
  },

  /* Rent Spotlight */
  rentSpotlight: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0E0E14',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#22222E',
    marginBottom: 16,
  },
  rentLabel: {
    fontSize: 12,
    color: '#8A8A96',
    marginBottom: 2,
  },
  rentValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  rentUnit: {
    fontSize: 12,
    color: '#8A8A96',
    fontWeight: '500',
  },
  rentIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Visual Schematic */
  visualWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 14,
    height: 110,
    position: 'relative',
  },
  plotShadow: {
    position: 'absolute',
    bottom: 12,
    width: 170,
    height: 50,
    borderRadius: 30,
    transform: [{ scaleY: 0.5 }],
  },
  plotBase: {
    width: 150,
    height: 70,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#0A0A0E',
  },
  plotTop: {
    height: 44,
    padding: 6,
    justifyContent: 'space-around',
  },
  plotSide: {
    height: 26,
    opacity: 0.85,
  },
  gridLinesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  gridLine: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  visualBadge: {
    position: 'absolute',
    bottom: 2,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  visualBadgeText: {
    color: '#0A0A0E',
    fontSize: 11,
    fontWeight: '800',
  },

  /* Future Note */
  futureNoteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#161622',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    gap: 10,
    marginBottom: 16,
  },
  futureNoteText: {
    flex: 1,
    color: '#C0C0CB',
    fontSize: 12.5,
    lineHeight: 18,
  },

  /* Breakdown Grid */
  breakdownGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  breakdownCard: {
    width: '48.5%',
    backgroundColor: '#0E0E14',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#20202A',
  },
  breakdownIconWrap: {
    marginBottom: 6,
  },
  breakdownLabel: {
    fontSize: 11,
    color: '#8A8A96',
    marginBottom: 2,
  },
  breakdownValue: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  breakdownSub: {
    fontSize: 10,
    color: '#656572',
  },

  /* Total Profit Banner */
  profitBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#181824',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  profitTextCol: {
    flex: 1,
  },
  profitLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profitHint: {
    fontSize: 11,
    color: '#8A8A96',
    marginTop: 2,
  },
  profitValueCol: {
    alignItems: 'flex-end',
  },
  profitAmount: {
    fontSize: 16,
    fontWeight: '800',
  },
  profitSub: {
    fontSize: 10,
    color: '#8A8A96',
    marginTop: 2,
  },

  /* Disclaimer */
  disclaimerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#141419',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#22222E',
    gap: 10,
  },
  disclaimer: {
    flex: 1,
    fontSize: 12,
    color: '#8A8A96',
    lineHeight: 18,
  },
  rtlText: {
    textAlign: 'right',
  },
});

export default PlotInformationScreen;
