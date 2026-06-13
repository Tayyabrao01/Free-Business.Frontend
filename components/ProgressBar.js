import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

const ProgressBar = ({ label, current = 0, target = 1, percentage, color = '#D4AF37' }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  const getPercent = () => {
    if (typeof percentage === 'number' && !Number.isNaN(percentage)) {
      return Math.min(100, Math.max(0, percentage));
    }
    const safeTarget = Number(target) || 1;
    const safeCurrent = Number(current) || 0;
    return Math.min(100, Math.round((safeCurrent / safeTarget) * 100));
  };

  const pct = getPercent();

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: pct,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [pct, animatedValue]);

  const fillWidth = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const displayCurrent = Number(current) || 0;
  const displayTarget = Number(target) || 0;

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>
          {String(displayCurrent)} / {String(displayTarget)} ({pct}%)
        </Text>
      </View>
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            {
              width: fillWidth,
              backgroundColor: color,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    color: '#cccccc',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  value: {
    color: '#888888',
    fontSize: 11,
  },
  track: {
    height: 10,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333333',
  },
  fill: {
    height: 10,
    borderRadius: 8,
  },
});

export default ProgressBar;
