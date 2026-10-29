import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  I18nManager,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from '../hooks/useTranslation';

const PLOT_IDS = ['marla5', 'marla10', 'kanal1'];

const PLOT_DATA = {
  marla5: {
    accent: '#D4AF37',
    soft: 'rgba(212, 175, 55, 0.14)',
    soil: '#5C4030',
    grass: '#2F6B3A',
    currentPrice: 3430000,
    monthlyRent: 34300,
    futureValue: 5000000,
    annualRent: 411600,
    savingsSale: 1570000,
    totalProfit: 1981400,
  },
  marla10: {
    accent: '#3DB8A8',
    soft: 'rgba(61, 184, 168, 0.14)',
    soil: '#4A3428',
    grass: '#1F7A5A',
    currentPrice: 6290000,
    monthlyRent: 62900,
    futureValue: 10000000,
    annualRent: 754800,
    savingsSale: 3710000,
    totalProfit: 4464800,
  },
  kanal1: {
    accent: '#E07A5F',
    soft: 'rgba(224, 122, 95, 0.14)',
    soil: '#6B3E2E',
    grass: '#8B5A2B',
    currentPrice: 10320000,
    monthlyRent: 103200,
    futureValue: 15000000,
    annualRent: 1238400,
    savingsSale: 4680000,
    totalProfit: 5938400,
  },
};

const formatNumber = (value) =>
  Number(value).toLocaleString('en-PK');

const PlotInformationScreen = ({ navigation }) => {
  const { t, isUrdu } = useTranslation();
  const [activeId, setActiveId] = useState('marla5');
  const fade = useRef(new Animated.Value(1)).current;
  const slide = useRef(new Animated.Value(0)).current;

  const plot = PLOT_DATA[activeId];

  const switchPlot = (id) => {
    if (id === activeId) return;
    Animated.parallel([
      Animated.timing(fade, { toValue: 0, duration: 140, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 12, duration: 140, useNativeDriver: true }),
    ]).start(() => {
      setActiveId(id);
      slide.setValue(-12);
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.timing(slide, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start();
    });
  };

  useEffect(() => {
    fade.setValue(1);
    slide.setValue(0);
  }, [fade, slide]);

  const rows = useMemo(
    () => [
      {
        icon: 'cash-outline',
        label: t('plotInformation.currentPrice'),
        value: formatNumber(plot.currentPrice),
      },
      {
        icon: 'trending-up-outline',
        label: t('plotInformation.futureValue'),
        value: formatNumber(plot.futureValue),
      },
      {
        icon: 'calendar-outline',
        label: t('plotInformation.annualRent'),
        value: formatNumber(plot.annualRent),
      },
      {
        icon: 'pricetag-outline',
        label: t('plotInformation.savingsSale'),
        value: formatNumber(plot.savingsSale),
      },
    ],
    [plot, t]
  );

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.back}>{t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={[styles.title, isUrdu && styles.rtlText]}>
          {t('plotInformation.title')}
        </Text>
        <Text style={[styles.subtitle, isUrdu && styles.rtlText]}>
          {t('plotInformation.subtitle')}
        </Text>
      </View>

      <View style={styles.tabs}>
        {PLOT_IDS.map((id) => {
          const selected = id === activeId;
          const accent = PLOT_DATA[id].accent;
          return (
            <TouchableOpacity
              key={id}
              style={[
                styles.tab,
                selected && { backgroundColor: accent, borderColor: accent },
              ]}
              onPress={() => switchPlot(id)}
              activeOpacity={0.85}
            >
              <Text style={[styles.tabText, selected && styles.tabTextActive]}>
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
              borderColor: plot.accent,
              backgroundColor: plot.soft,
              opacity: fade,
              transform: [{ translateY: slide }],
            },
          ]}
        >
          <Text style={[styles.sizeLabel, { color: plot.accent }, isUrdu && styles.rtlText]}>
            {t(`plotInformation.sizes.${activeId}`)}
          </Text>

          <Text style={[styles.priceLine, isUrdu && styles.rtlText]}>
            {t(`plotInformation.${activeId}.priceLine`)}
          </Text>

          <View style={styles.rentBlock}>
            <Text style={[styles.rentValue, { color: plot.accent }]}>
              {formatNumber(plot.monthlyRent)}
            </Text>
            <Text style={[styles.rentLabel, { color: plot.accent }, isUrdu && styles.rtlText]}>
              {t('plotInformation.monthlyRent')}
            </Text>
          </View>

          <PlotVisual
            accent={plot.accent}
            soil={plot.soil}
            grass={plot.grass}
            badge={t(`plotInformation.sizes.${activeId}`)}
          />

          <Text style={[styles.futureNote, isUrdu && styles.rtlText]}>
            {t(`plotInformation.${activeId}.futureNote`)}
          </Text>

          <View style={styles.breakdown}>
            {rows.map((row) => (
              <View key={row.label} style={styles.row}>
                <View style={styles.rowLeft}>
                  <Ionicons name={row.icon} size={18} color={plot.accent} />
                  <Text style={[styles.rowLabel, isUrdu && styles.rtlText]}>{row.label}</Text>
                </View>
                <Text style={styles.rowValue}>{row.value}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.profitBar, { backgroundColor: plot.accent }]}>
            <View>
              <Text style={[styles.profitLabel, isUrdu && styles.rtlText]}>
                {t('plotInformation.totalProfit')}
              </Text>
              <Text style={[styles.profitHint, isUrdu && styles.rtlText]}>
                {t('plotInformation.profitHint')}
              </Text>
            </View>
            <Text style={styles.profitValue}>{formatNumber(plot.totalProfit)}</Text>
          </View>
        </Animated.View>

        <Text style={[styles.disclaimer, isUrdu && styles.rtlText]}>
          {t('plotInformation.disclaimer')}
        </Text>
      </ScrollView>
    </View>
  );
};

const PlotVisual = ({ accent, soil, grass, badge }) => (
  <View style={styles.visualWrap}>
    <View style={[styles.plotShadow, { backgroundColor: `${accent}33` }]} />
    <View style={[styles.plotBase, { backgroundColor: soil }]}>
      <View style={[styles.plotTop, { backgroundColor: grass }]} />
      <View style={[styles.plotSide, { backgroundColor: soil }]} />
    </View>
    <View style={[styles.badge, { backgroundColor: accent }]}>
      <Text style={styles.badgeText}>{badge}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0B0B0B' },
  header: {
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#111111',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  back: { color: '#D4AF37', fontSize: 15, fontWeight: '700', marginBottom: 10 },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F5F1E8',
    letterSpacing: 0.3,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: '#9A9A9A',
    lineHeight: 20,
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  tab: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: '#151515',
    alignItems: 'center',
  },
  tabText: {
    color: '#BDBDBD',
    fontSize: 13,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#111',
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 36 },
  panel: {
    borderWidth: 1.5,
    borderRadius: 22,
    padding: 18,
    overflow: 'hidden',
  },
  sizeLabel: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  priceLine: {
    color: '#E8E8E8',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    marginBottom: 18,
  },
  rentBlock: {
    alignItems: 'center',
    marginBottom: 8,
  },
  rentValue: {
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: 1,
  },
  rentLabel: {
    marginTop: 2,
    fontSize: 18,
    fontWeight: '700',
  },
  visualWrap: {
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  plotShadow: {
    position: 'absolute',
    width: 150,
    height: 28,
    borderRadius: 80,
    bottom: 18,
    transform: [{ scaleX: 1.2 }],
  },
  plotBase: {
    width: 120,
    height: 78,
    borderRadius: 10,
    transform: [{ rotate: '45deg' }, { scaleY: 0.62 }],
    overflow: 'hidden',
  },
  plotTop: {
    flex: 1,
    opacity: 0.95,
  },
  plotSide: {
    height: 18,
    opacity: 0.85,
  },
  badge: {
    position: 'absolute',
    top: 18,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    transform: [{ rotate: '-8deg' }],
  },
  badgeText: {
    color: '#111',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.6,
  },
  futureNote: {
    color: '#C8C8C8',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 16,
    marginTop: 4,
  },
  breakdown: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 10,
  },
  rowLabel: {
    color: '#D0D0D0',
    fontSize: 13,
    marginLeft: 8,
    flexShrink: 1,
  },
  rowValue: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  profitBar: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profitLabel: {
    color: '#111',
    fontSize: 14,
    fontWeight: '900',
  },
  profitHint: {
    color: 'rgba(0,0,0,0.65)',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
  },
  profitValue: {
    color: '#111',
    fontSize: 22,
    fontWeight: '900',
  },
  disclaimer: {
    marginTop: 16,
    color: '#777',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  rtlText: {
    textAlign: I18nManager.isRTL ? 'right' : 'right',
    writingDirection: 'rtl',
  },
});

export default PlotInformationScreen;
