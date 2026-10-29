import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';
import { setCallSpeakerphone, isSpeakerForcedOn } from '../utils/callAudio';

const formatDuration = (totalSeconds) => {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

/**
 * Mute / camera / speaker / end controls + call duration timer.
 */
const CallControls = ({
  videoEnabled = true,
  onHangup,
  showTimer = true,
  connectedAt = null,
}) => {
  const call = useCall();
  const { useMicrophoneState, useCameraState } = useCallStateHooks();
  const { isMute: micMuted } = useMicrophoneState();
  const { isMute: camMuted, status: cameraStatus } = useCameraState();
  const [speakerOn, setSpeakerOn] = useState(
    () => isSpeakerForcedOn() || Boolean(videoEnabled)
  );
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!showTimer) {
      return undefined;
    }
    const started = connectedAt || Date.now();
    const tick = () => {
      setElapsed(Math.max(0, Math.floor((Date.now() - started) / 1000)));
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [connectedAt, showTimer]);

  const toggleMute = async () => {
    try {
      if (micMuted) {
        await call?.microphone?.enable?.();
      } else {
        await call?.microphone?.disable?.();
      }
    } catch (error) {
      console.warn('toggleMute:', error?.message);
    }
  };

  const toggleCamera = async () => {
    if (!videoEnabled) {
      return;
    }
    try {
      const off = camMuted || cameraStatus === 'disabled';
      if (off) {
        await call?.camera?.enable?.();
      } else {
        await call?.camera?.disable?.();
      }
    } catch (error) {
      console.warn('toggleCamera:', error?.message);
    }
  };

  const toggleSpeaker = async () => {
    const next = !speakerOn;
    setSpeakerOn(next);
    await setCallSpeakerphone(call, next);
  };

  const cameraOff = camMuted || cameraStatus === 'disabled';

  return (
    <View style={styles.wrap}>
      {showTimer ? (
        <Text style={styles.timer}>{formatDuration(elapsed)}</Text>
      ) : null}

      <View style={styles.row}>
        <ControlButton
          active={!micMuted}
          icon={micMuted ? 'mic-off' : 'mic'}
          label={micMuted ? 'Unmute' : 'Mute'}
          onPress={toggleMute}
        />

        {videoEnabled ? (
          <ControlButton
            active={!cameraOff}
            icon={cameraOff ? 'videocam-off' : 'videocam'}
            label={cameraOff ? 'Camera' : 'Camera'}
            onPress={toggleCamera}
          />
        ) : null}

        <ControlButton
          active={speakerOn}
          icon={speakerOn ? 'volume-high' : 'volume-mute'}
          label="Speaker"
          onPress={toggleSpeaker}
        />

        <ControlButton
          danger
          icon="call"
          iconStyle={styles.hangupIcon}
          label="End"
          onPress={onHangup}
        />
      </View>
    </View>
  );
};

const ControlButton = ({
  icon,
  label,
  onPress,
  active = false,
  danger = false,
  iconStyle,
}) => (
  <View style={styles.btnWrap}>
    <TouchableOpacity
      style={[
        styles.btn,
        active && !danger ? styles.btnActive : null,
        danger ? styles.btnDanger : null,
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Ionicons
        name={icon}
        size={26}
        color="#fff"
        style={iconStyle}
      />
    </TouchableOpacity>
    <Text style={styles.label}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    paddingBottom: 28,
    paddingTop: 12,
    alignItems: 'center',
  },
  timer: {
    color: '#D4AF37',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'flex-start',
    width: '100%',
    paddingHorizontal: 12,
  },
  btnWrap: {
    alignItems: 'center',
    minWidth: 64,
  },
  btn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnActive: {
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  btnDanger: {
    backgroundColor: '#e74c3c',
    width: 68,
    height: 68,
    borderRadius: 34,
  },
  hangupIcon: {
    transform: [{ rotate: '135deg' }],
  },
  label: {
    color: '#ccc',
    fontSize: 11,
    marginTop: 8,
    fontWeight: '600',
  },
});

export default CallControls;
