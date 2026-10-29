import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getStreamCallUi } from '../services/streamVideoOptional';

const CustomOutgoingCallView = ({ calleeName = 'User', isGroupCall = false, onCancel }) => {
  const callUi = getStreamCallUi();
  const UserInfo = callUi?.UserInfo;

  return (
    <View style={styles.screen}>
      <View style={styles.center}>
        {UserInfo ? <UserInfo /> : null}
        <Text style={styles.title}>
          {isGroupCall ? 'Calling group…' : 'Calling…'}
        </Text>
        <Text style={styles.subtitle}>{calleeName}</Text>
        <Text style={styles.hint}>Waiting for answer</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} activeOpacity={0.85}>
          <Ionicons name="call" size={28} color="#fff" style={styles.hangupIcon} />
          <Text style={styles.actionLabel}>Cancel</Text>
        </TouchableOpacity>
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
    paddingTop: 48,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    color: '#D4AF37',
    fontSize: 22,
    fontWeight: '700',
    marginTop: 24,
  },
  subtitle: {
    color: '#fff',
    fontSize: 18,
    marginTop: 10,
    fontWeight: '600',
  },
  hint: {
    color: '#888',
    fontSize: 14,
    marginTop: 12,
  },
  actions: {
    alignItems: 'center',
  },
  cancelBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hangupIcon: {
    transform: [{ rotate: '135deg' }],
  },
  actionLabel: {
    color: '#fff',
    fontSize: 12,
    marginTop: 8,
    fontWeight: '600',
  },
});

export default CustomOutgoingCallView;
