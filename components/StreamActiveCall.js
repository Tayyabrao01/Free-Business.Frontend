import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';
import { CallingState } from '@stream-io/video-client';
import { configureJoinedCallAudio } from '../utils/callAudio';
import { stopIncomingRingtone } from '../utils/incomingRingtone';
import { endActiveCall } from '../services/callLifecycle';
import { cancelIncomingCallNotification } from '../services/NotificationService';
import { getStreamCallUi } from '../services/streamVideoOptional';
import IncomingCallScreen from '../screens/IncomingCallScreen';
import ActiveCallScreen from '../screens/ActiveCallScreen';
import CustomOutgoingCallView from './CustomOutgoingCallView';
import CallEndedOverlay from './CallEndedOverlay';

const CallPhase = ({
  video,
  isGroupCall,
  callerName,
  callerAvatar,
  onHangup,
  onCallJoined,
}) => {
  const call = useCall();
  const { useCallCallingState, useParticipants } = useCallStateHooks();
  const callingState = useCallCallingState();
  const participants = useParticipants();
  const [showEnded, setShowEnded] = useState(false);
  const [connectedAt, setConnectedAt] = useState(null);

  const isOutgoing = Boolean(call?.isCreatedByMe);
  const myId = call?.currentUserId?.toString();
  const remoteJoined = participants.some(
    (participant) => participant?.userId?.toString() !== myId
  );

  const finishCall = useCallback(
    async (options = {}) => {
      stopIncomingRingtone();
      await cancelIncomingCallNotification();
      await endActiveCall(call, {
        isIncoming: !isOutgoing,
        wasConnected: options.wasConnected,
      });
      if (options.showEnded) {
        setShowEnded(true);
        setTimeout(() => onHangup?.(), 900);
      } else {
        onHangup?.();
      }
    },
    [call, isOutgoing, onHangup]
  );

  useEffect(() => {
    if (callingState === CallingState.JOINED) {
      onCallJoined?.();
      setConnectedAt((prev) => prev || Date.now());
      configureJoinedCallAudio(call, video);
    }
  }, [callingState, onCallJoined, call, video]);

  useEffect(() => {
    if (callingState === CallingState.LEFT) {
      setShowEnded(true);
      const timer = setTimeout(() => onHangup?.(), 900);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [callingState, onHangup]);

  if (showEnded) {
    return <CallEndedOverlay message="Call ended" />;
  }

  if (callingState === CallingState.RINGING && !isOutgoing) {
    return (
      <IncomingCallScreen
        callerName={callerName}
        callerAvatar={callerAvatar}
        isGroupCall={isGroupCall}
        videoEnabled={video}
        onAccept={() => {
          stopIncomingRingtone();
          cancelIncomingCallNotification();
          onCallJoined?.();
        }}
        onDecline={() => finishCall({ wasConnected: false })}
      />
    );
  }

  if (
    isOutgoing &&
    !remoteJoined &&
    callingState !== CallingState.LEFT &&
    callingState !== CallingState.IDLE
  ) {
    return (
      <CustomOutgoingCallView
        calleeName={callerName}
        isGroupCall={isGroupCall}
        onCancel={() => finishCall({ wasConnected: false })}
      />
    );
  }

  if (callingState === CallingState.JOINED || remoteJoined) {
    return (
      <ActiveCallScreen
        videoEnabled={video}
        isGroupCall={isGroupCall}
        participantName={callerName}
        connectedAt={connectedAt}
        onHangup={() => finishCall({ wasConnected: true, showEnded: true })}
      />
    );
  }

  return (
    <CustomOutgoingCallView
      calleeName={callerName}
      isGroupCall={isGroupCall}
      onCancel={() => finishCall({ wasConnected: false })}
    />
  );
};

const StreamActiveCall = ({
  call,
  video,
  isGroupCall,
  callerName,
  callerAvatar,
  onHangup,
  onCallJoined,
}) => {
  const callUi = getStreamCallUi();

  if (!callUi || !call) {
    return null;
  }

  const { StreamCall } = callUi;

  return (
    <View style={styles.root}>
      <StreamCall call={call}>
        <CallPhase
          video={video}
          isGroupCall={isGroupCall}
          callerName={callerName}
          callerAvatar={callerAvatar}
          onHangup={onHangup}
          onCallJoined={onCallJoined}
        />
      </StreamCall>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0a0a' },
});

export default StreamActiveCall;
