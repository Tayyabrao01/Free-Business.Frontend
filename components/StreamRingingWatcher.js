import React, { useEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import { CallingState } from '@stream-io/video-client';
import { useCalls } from '@stream-io/video-react-bindings';
import { useAuth } from '../context/AuthContext';
import { startIncomingRingtone, stopIncomingRingtone } from '../utils/incomingRingtone';
import { addCallLogEntry } from '../services/callLogService';
import { getGroupIdFromCallId, GROUP_CALL_PREFIX } from '../utils/streamChannel';

const getPeerFromCall = (call, currentUserId) => {
  const members = call?.state?.members || {};
  const list = Object.values(members);
  const myId = currentUserId?.toString();
  const peer = list.find((m) => {
    const id = m?.userId || m?.user?.id;
    return id && id !== myId;
  });
  return {
    id: peer?.userId || peer?.user?.id,
    name: peer?.user?.name || peer?.user?.name || 'User',
  };
};

/**
 * Opens the call screen when another user rings this device (app open / background with socket).
 */
const StreamRingingWatcher = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const calls = useCalls();
  const shownCallsRef = useRef(new Set());
  const ringingAudioRef = useRef(null);
  const openedIncomingRef = useRef(new Set());

  useEffect(() => {
    if (!user?._id || !navigation || !calls?.length) {
      stopIncomingRingtone();
      ringingAudioRef.current = null;
      return;
    }

    let hasIncomingRing = false;

    calls.forEach((call) => {
      const callingState = call?.state?.callingState;
      const cid = call?.cid;

      if (!cid || callingState !== CallingState.RINGING) {
        if (callingState === CallingState.LEFT || callingState === CallingState.IDLE) {
          const wasRinging = shownCallsRef.current.has(cid);
          const wasOpened = openedIncomingRef.current.has(cid);
          if (wasRinging && !wasOpened && !call.isCreatedByMe) {
            const peer = getPeerFromCall(call, user._id);
            addCallLogEntry({
              peerId: peer.id,
              peerName: peer.name,
              direction: 'missed',
              kind: 'video',
              status: 'missed',
              durationSec: 0,
            }).catch(() => {});
          }
          shownCallsRef.current.delete(cid);
          openedIncomingRef.current.delete(cid);
          if (ringingAudioRef.current === cid) {
            stopIncomingRingtone();
            ringingAudioRef.current = null;
          }
        }
        return;
      }

      if (call.isCreatedByMe) {
        return;
      }

      hasIncomingRing = true;
      if (ringingAudioRef.current !== cid) {
        ringingAudioRef.current = cid;
        startIncomingRingtone(cid);
      }

      if (shownCallsRef.current.has(cid)) {
        return;
      }

      const currentRoute = navigation.getCurrentRoute?.();
      if (
        currentRoute?.name === 'StreamCall' &&
        currentRoute?.params?.incomingCallCid === cid
      ) {
        return;
      }

      shownCallsRef.current.add(cid);
      const peer = getPeerFromCall(call, user._id);
      const callId = call?.id || cid?.split(':')?.[1] || '';
      const isGroupCall =
        call?.state?.custom?.isGroupCall ||
        callId.startsWith(GROUP_CALL_PREFIX);
      const groupId =
        call?.state?.custom?.groupId || getGroupIdFromCallId(callId);
      const groupName = call?.state?.custom?.groupName;

      openedIncomingRef.current.add(cid);
      navigation.navigate('StreamCall', {
        incomingCallCid: cid,
        isGroupCall,
        groupId,
        groupName: groupName || 'Group',
        otherUserId: peer.id,
        otherUserName: peer.name,
        video: true,
      });
    });

    if (!hasIncomingRing && ringingAudioRef.current) {
      stopIncomingRingtone();
      ringingAudioRef.current = null;
    }
  }, [calls, navigation, user?._id]);

  useEffect(() => () => stopIncomingRingtone(), []);

  return null;
};

export default StreamRingingWatcher;
