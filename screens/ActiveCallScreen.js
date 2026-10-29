import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';
import { configureJoinedCallAudio, stopCallAudio } from '../utils/callAudio';
import { stopIncomingRingtone } from '../utils/incomingRingtone';
import { getStreamCallUi } from '../services/streamVideoOptional';
import CallControls from '../components/CallControls';

/**
 * Active call UI: remote video / audio layout, local PiP via Stream CallContent,
 * custom controls (mute, camera, speaker, end), duration timer.
 */
const ActiveCallScreen = ({
  videoEnabled = true,
  isGroupCall = false,
  participantName = 'User',
  onHangup,
  connectedAt = null,
}) => {
  const call = useCall();
  const callUi = getStreamCallUi();
  const { useParticipants, useLocalParticipant } = useCallStateHooks();
  const participants = useParticipants();
  const localParticipant = useLocalParticipant();
  const [joinedAt] = useState(() => connectedAt || Date.now());

  const { CallContent, UserInfo } = callUi || {};
  const myId = call?.currentUserId?.toString();
  const remote = useMemo(
    () =>
      participants.find((p) => p?.userId?.toString() !== myId) ||
      participants.find((p) => p !== localParticipant),
    [participants, myId, localParticipant]
  );
  const displayName =
    remote?.name || remote?.userName || participantName || 'User';
  const useSpotlight = !isGroupCall && participants.length <= 2;

  useEffect(() => {
    stopIncomingRingtone();
    configureJoinedCallAudio(call, videoEnabled);
    return () => {
      // leave audio teardown to endActiveCall / hangup
    };
  }, [call, videoEnabled]);

  if (!videoEnabled && UserInfo) {
    return (
      <View style={styles.root}>
        <View style={styles.audioCenter}>
          <UserInfo />
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.kind}>
            {isGroupCall ? 'Group voice call' : 'Voice call'}
          </Text>
        </View>
        <CallControls
          videoEnabled={false}
          connectedAt={joinedAt}
          onHangup={onHangup}
        />
      </View>
    );
  }

  if (!CallContent) {
    return (
      <View style={styles.root}>
        <View style={styles.audioCenter}>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.kind}>Call in progress</Text>
        </View>
        <CallControls
          videoEnabled={videoEnabled}
          connectedAt={joinedAt}
          onHangup={onHangup}
        />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.videoArea}>
        <CallContent
          layout={useSpotlight ? 'spotlight' : 'grid'}
          CallControls={null}
          initialInCallManagerAudioMode={videoEnabled ? 'video' : 'audio'}
          onHangupCallHandler={onHangup}
        />
        <View style={styles.nameBanner} pointerEvents="none">
          <Text style={styles.bannerText} numberOfLines={1}>
            {displayName}
          </Text>
        </View>
      </View>
      <View style={styles.controlsOverlay}>
        <CallControls
          videoEnabled={videoEnabled}
          connectedAt={joinedAt}
          onHangup={() => {
            stopCallAudio();
            onHangup?.();
          }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  videoArea: {
    flex: 1,
  },
  nameBanner: {
    position: 'absolute',
    top: 48,
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  bannerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    overflow: 'hidden',
    borderRadius: 8,
  },
  controlsOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  audioCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  name: {
    color: '#D4AF37',
    fontSize: 22,
    fontWeight: '700',
    marginTop: 16,
    textAlign: 'center',
  },
  kind: {
    color: '#888',
    fontSize: 14,
    marginTop: 8,
  },
});

export default ActiveCallScreen;
