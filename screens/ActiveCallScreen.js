import { stopRingbackTone } from '../utils/RingbackService';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { configureJoinedCallAudio, stopCallAudio } from '../utils/callAudio';
import { stopIncomingRingtone } from '../utils/incomingRingtone';
import CallControls from '../components/CallControls';
import { RtcSurfaceView } from 'react-native-agora';
import Avatar from '../components/Avatar';

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
  engine,
  channelName,
  uid,
  remoteUid,
  remoteVideoMuted = true,
  participantAvatar,
  micMuted,
  cameraMuted,
  speakerOn,
  onToggleMute,
  onToggleCamera,
  onSwitchCamera,
  onToggleSpeaker,
}) => {
  const [joinedAt] = useState(() => connectedAt || Date.now());

  const displayName = participantName || 'User';

useEffect(() => {
  stopIncomingRingtone();
  stopRingbackTone(); // ✅ Also stop ringback just in case
  configureJoinedCallAudio(null, videoEnabled);
  return () => {
    stopCallAudio();
  };
}, [videoEnabled]);

  if (!videoEnabled) {
    return (
      <View style={styles.root}>
        <View style={styles.audioCenter}>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.kind}>
            {isGroupCall ? 'Group voice call' : 'Voice call'}
          </Text>
        </View>
        <CallControls
          videoEnabled={false}
          connectedAt={joinedAt}
          onHangup={onHangup}
          micMuted={micMuted}
          cameraMuted={cameraMuted}
          speakerOn={speakerOn}
          onToggleMute={onToggleMute}
          onToggleSpeaker={onToggleSpeaker}
        />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.videoArea}>
        {engine && remoteUid ? (
          remoteVideoMuted ? (
            <View style={styles.remoteAvatarCenter}>
              <Avatar uri={participantAvatar} name={displayName} size={112} />
            </View>
          ) : (
            <RtcSurfaceView
              style={styles.remoteVideo}
              canvas={{ uid: remoteUid }}
              connection={{ channelId: channelName, localUid: uid }}
            />
          )
        ) : null}
        {engine ? (
          <RtcSurfaceView
            style={styles.localVideo}
            canvas={{ uid: 0 }}
            connection={{ channelId: channelName, localUid: uid }}
            zOrderMediaOverlay
          />
        ) : null}
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
          micMuted={micMuted}
          cameraMuted={cameraMuted}
          speakerOn={speakerOn}
          onToggleMute={onToggleMute}
          onToggleCamera={onToggleCamera}
          onSwitchCamera={onSwitchCamera}
          onToggleSpeaker={onToggleSpeaker}
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
  remoteVideo: {
    ...StyleSheet.absoluteFillObject,
  },
  remoteAvatarCenter: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
  },
  localVideo: {
    position: 'absolute',
    top: 24,
    right: 16,
    width: 112,
    height: 168,
    zIndex: 2,
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
