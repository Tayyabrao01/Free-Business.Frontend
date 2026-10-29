import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Vibration,
  Animated,
  Image,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useCall } from '@stream-io/video-react-bindings';
import { startIncomingRingtone, stopIncomingRingtone } from '../utils/incomingRingtone';
import { cancelIncomingCallNotification } from '../services/NotificationService';

/**
 * Full-screen incoming call UI: avatar, name, Accept / Decline, ringtone + vibrate.
 */
const IncomingCallScreen = ({
  callerName = 'User',
  callerAvatar = null,
  isGroupCall = false,
  videoEnabled = true,
  onAccept,
  onDecline,
}) => {
  const call = useCall();
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const callKey = call?.cid || call?.id || 'incoming';
    startIncomingRingtone(callKey);
    const pattern = [0, 1000, 800, 1000, 800];
    Vibration.vibrate(pattern, true);

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.12,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();

    return () => {
      loop.stop();
      Vibration.cancel();
    };
  }, [call?.cid, call?.id, pulse]);

  const accept = async () => {
    Vibration.cancel();
    stopIncomingRingtone();
    await cancelIncomingCallNotification();
    try {
      if (typeof call?.join === 'function') {
        await call.join();
      }
      onAccept?.();
    } catch (error) {
      console.warn('accept call:', error?.message);
    }
  };

  const decline = async () => {
    Vibration.cancel();
    stopIncomingRingtone();
    await cancelIncomingCallNotification();
    onDecline?.();
  };

  const initial = (callerName || 'U').trim().charAt(0).toUpperCase();

  return (
    <View style={styles.screen}>
      <View style={styles.center}>
        <Animated.View style={[styles.avatarRing, { transform: [{ scale: pulse }] }]}>
          {callerAvatar ? (
            <Image source={{ uri: callerAvatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarLetter}>{initial}</Text>
            </View>
          )}
        </Animated.View>

        <Text style={styles.title}>
          {isGroupCall
            ? 'Incoming group call'
            : videoEnabled
              ? 'Incoming video call'
              : 'Incoming voice call'}
        </Text>
        <Text style={styles.subtitle}>{callerName}</Text>
        <Text style={styles.hint}>Ringing…</Text>
      </View>

      <View style={styles.actions}>
        <View style={styles.actionItem}>
          <TouchableOpacity style={styles.declineBtn} onPress={decline} activeOpacity={0.85}>
            <Ionicons name="close" size={32} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.actionLabel}>Decline</Text>
        </View>

        <View style={styles.actionItem}>
          <TouchableOpacity style={styles.acceptBtn} onPress={accept} activeOpacity={0.85}>
            <Ionicons name={videoEnabled ? 'videocam' : 'call'} size={30} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.actionLabel}>Accept</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0d0d0d',
    justifyContent: 'space-between',
    paddingBottom: 56,
    paddingTop: 64,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  avatarRing: {
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 3,
    borderColor: '#D4AF37',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 118,
    height: 118,
    borderRadius: 59,
  },
  avatarFallback: {
    width: 118,
    height: 118,
    borderRadius: 59,
    backgroundColor: '#1f1f1f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    color: '#D4AF37',
    fontSize: 48,
    fontWeight: '700',
  },
  title: {
    color: '#D4AF37',
    fontSize: 22,
    fontWeight: '700',
    marginTop: 24,
    textAlign: 'center',
  },
  subtitle: {
    color: '#fff',
    fontSize: 20,
    marginTop: 10,
    textAlign: 'center',
    fontWeight: '600',
  },
  hint: {
    color: '#888',
    fontSize: 14,
    marginTop: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
  },
  actionItem: {
    alignItems: 'center',
  },
  declineBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#2ecc71',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: {
    color: '#fff',
    fontSize: 12,
    marginTop: 10,
    fontWeight: '600',
  },
});

export default IncomingCallScreen;
