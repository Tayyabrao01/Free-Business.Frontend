import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { configureJoinedCallAudio } from '../utils/callAudio';
import { stopIncomingRingtone } from '../utils/incomingRingtone';
import { stopRingbackTone } from '../utils/RingbackService';
import { endActiveCall } from '../services/callLifecycle';
import { cancelIncomingCallNotification } from '../services/NotificationService';
import {
  joinAgoraChannel,
  leaveAgoraChannel,
  renewAgoraToken,
} from '../services/agoraCallService';
import { fetchAgoraToken } from '../services/streamApi';
import {
  startAgoraForegroundService,
  stopAgoraForegroundService,
} from '../services/agoraForegroundService';
import IncomingCallScreen from '../screens/IncomingCallScreen';
import ActiveCallScreen from '../screens/ActiveCallScreen';
import CustomOutgoingCallView from './CustomOutgoingCallView';
import CallEndedOverlay from './CallEndedOverlay';

const StreamActiveCall = ({
  call,
  video,
  isGroupCall,
  callerName,
  callerAvatar,
  onHangup,
  onCallJoined,
  agoraConfig,
  isIncoming,
}) => {
  const [accepted, setAccepted] = useState(!isIncoming);
  const [engine, setEngine] = useState(null);
  const [remoteUid, setRemoteUid] = useState(null);
  const [remoteVideoMuted, setRemoteVideoMuted] = useState(true);
  const [joined, setJoined] = useState(false);
  const [showEnded, setShowEnded] = useState(false);
  const [error, setError] = useState(null);
  const [connectedAt, setConnectedAt] = useState(null);
  const [micMuted, setMicMuted] = useState(false);
  const [cameraMuted, setCameraMuted] = useState(!video);
  const [speakerOn, setSpeakerOn] = useState(Boolean(video));

  const finishCall = useCallback(async () => {
    stopIncomingRingtone();
    stopRingbackTone();
    await cancelIncomingCallNotification();
    await leaveAgoraChannel();
    await endActiveCall(call, {
      isIncoming,
      wasConnected: joined,
    });
    onHangup?.();
  }, [call, isIncoming, joined, onHangup]);

  useEffect(() => {
    if (!accepted || !agoraConfig) {
      return undefined;
    }

    let active = true;
    startAgoraForegroundService(video).catch(serviceError => {
      console.warn('[Agora] Foreground service start failed', serviceError);
    });
    const eventHandler = {
      onJoinChannelSuccess: () => {
        console.log('[Agora] Connection state: joined', {
          channelName: agoraConfig.channelName,
          uid: agoraConfig.uid,
          video,
        });
        if (!active) {
          return;
        }
        setJoined(true);
        setConnectedAt(Date.now());
        stopIncomingRingtone();
        stopRingbackTone();
        configureJoinedCallAudio(null, video);
        onCallJoined?.();
      },
      onUserJoined: (_connection, uid) => {
        console.log('[Agora] Remote user joined', { uid });
        if (active) {
          setRemoteUid(uid);
          setRemoteVideoMuted(true);
        }
      },
      onRemoteVideoStateChanged: (_connection, uid, state, reason) => {
        console.log('[Agora] Remote video state changed', {
          uid,
          state,
          reason,
        });
        if (!active) {
          return;
        }
        setRemoteVideoMuted(state !== 2);
      },
      onUserOffline: (_connection, uid, reason) => {
        console.log('[Agora] Remote user offline', { uid, reason });
        if (active) {
          setRemoteUid(null);
          setRemoteVideoMuted(true);
          setShowEnded(true);
          setTimeout(() => onHangup?.(), 900);
        }
      },
      onConnectionStateChanged: (_connection, state, reason) => {
        console.log('[Agora] Connection state changed', { state, reason });
      },
      onTokenPrivilegeWillExpire: async () => {
        try {
          console.log('[Agora] Token will expire; requesting a replacement');
          const response = await fetchAgoraToken(
            agoraConfig.channelName,
            agoraConfig.uid,
          );
          const nextToken = response.data?.token;
          if (!nextToken) {
            throw new Error('Replacement Agora token was empty');
          }
          await renewAgoraToken(nextToken);
          console.log('[Agora] Token renewed successfully');
        } catch (tokenError) {
          console.error('[Agora] Token renewal failed', tokenError);
        }
      },
      onError: (code, message) => {
        console.error('[Agora] Error', { code, message });
        if (active) {
          setError(
            `Agora error ${code}: ${message || 'Call connection failed'}`,
          );
        }
      },
      onLeaveChannel: stats => {
        console.log('[Agora] Local user left channel', { stats });
        if (active) {
          setJoined(false);
          setShowEnded(true);
        }
      },
    };

    joinAgoraChannel({
      ...agoraConfig,
      videoEnabled: video,
      eventHandler,
    })
      .then(nextEngine => {
        if (active) {
          setEngine(nextEngine);
        }
      })
      .catch(joinError => {
        if (active) {
          setError(joinError?.message || 'Call connection failed');
        }
      });

    return () => {
      active = false;
      stopAgoraForegroundService().catch(serviceError => {
        console.warn('[Agora] Foreground service stop failed', serviceError);
      });
      leaveAgoraChannel().catch(() => {});
    };
  }, [accepted, agoraConfig, onCallJoined, onHangup, video]);

  if (showEnded) {
    return <CallEndedOverlay message="Call ended" />;
  }

  if (error) {
    return <CallEndedOverlay message={error} />;
  }

  if (isIncoming && !accepted) {
    return (
      <IncomingCallScreen
        callerName={callerName}
        callerAvatar={callerAvatar}
        isGroupCall={isGroupCall}
        videoEnabled={video}
        callKey={call?.cid || call?.id}
        onAccept={() => {
          setAccepted(true);
          stopIncomingRingtone();
          stopRingbackTone();
          cancelIncomingCallNotification();
        }}
        onDecline={finishCall}
      />
    );
  }

  if (!joined) {
    return (
      <CustomOutgoingCallView
        calleeName={callerName}
        isGroupCall={isGroupCall}
        onCancel={finishCall}
      />
    );
  }

  return (
    <View style={styles.root}>
      <ActiveCallScreen
        videoEnabled={video}
        isGroupCall={isGroupCall}
        participantName={callerName}
        connectedAt={connectedAt}
        onHangup={finishCall}
        engine={engine}
        channelName={agoraConfig.channelName}
        uid={agoraConfig.uid}
        remoteUid={remoteUid}
        remoteVideoMuted={remoteVideoMuted}
        participantAvatar={callerAvatar}
        micMuted={micMuted}
        cameraMuted={cameraMuted}
        speakerOn={speakerOn}
        onToggleMute={() => setMicMuted(value => !value)}
        onToggleCamera={() => setCameraMuted(value => !value)}
        onSwitchCamera={() => {}}
        onToggleSpeaker={enabled => setSpeakerOn(enabled)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0a0a' },
});

export default StreamActiveCall;
