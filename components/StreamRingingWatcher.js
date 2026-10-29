import React, { useEffect, useRef, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { CallingState } from '@stream-io/video-client';
import { useCalls, useStreamVideoClient } from '@stream-io/video-react-bindings';
import { useAuth } from '../context/AuthContext';
import { startIncomingRingtone, stopIncomingRingtone } from '../utils/incomingRingtone';
import { findClientCall } from '../services/callLifecycle';
import { getGroupIdFromCallId, GROUP_CALL_PREFIX } from '../utils/streamChannel';
import {
  displayIncomingCallNotification,
  cancelIncomingCallNotification,
} from '../services/NotificationService';

const getRootNavigation = (navigation) => {
  let nav = navigation;
  while (nav?.getParent?.()) {
    nav = nav.getParent();
  }
  return nav;
};

const getPeerFromCall = (call, currentUserId) => {
  const members = call?.state?.members;
  const list = Array.isArray(members) ? members : Object.values(members || {});
  const myId = currentUserId?.toString();
  const peer = list.find((m) => {
    const id = (m?.userId || m?.user?.id || m?.user_id)?.toString();
    return id && id !== myId;
  });
  const name = peer?.user?.name || peer?.name;
  const image = peer?.user?.image || peer?.user?.avatar;
  return {
    id: peer?.userId || peer?.user?.id || peer?.user_id,
    name: name && name !== 'Member' ? name : 'User',
    avatar: image || null,
  };
};

const resolveVideoEnabled = (call) => {
  const custom = call?.state?.custom || {};
  if (typeof custom.videoEnabled === 'boolean') {
    return custom.videoEnabled;
  }
  if (typeof custom.video === 'boolean') {
    return custom.video;
  }
  const settingsVideo = call?.state?.settings?.video;
  if (settingsVideo && settingsVideo.camera_default_on === false) {
    return false;
  }
  if (settingsVideo && settingsVideo.enabled === false) {
    return false;
  }
  return true;
};

const buildIncomingParams = (call, userId) => {
  const cid = call?.cid;
  const peer = getPeerFromCall(call, userId);
  const callId = call?.id || cid?.split(':')?.[1] || '';
  const isGroupCall =
    call?.state?.custom?.isGroupCall || callId.startsWith(GROUP_CALL_PREFIX);
  const groupId = call?.state?.custom?.groupId || getGroupIdFromCallId(callId);
  const groupName = call?.state?.custom?.groupName;
  const video = resolveVideoEnabled(call);

  return {
    incomingCallCid: cid,
    isGroupCall,
    groupId,
    groupName: groupName || 'Group',
    otherUserId: peer.id,
    otherUserName: isGroupCall ? groupName || 'Group' : peer.name,
    otherUserAvatar: peer.avatar,
    video,
  };
};

const isIncomingRingingCall = (call, userId) => {
  if (!call?.cid || call.isCreatedByMe) {
    return false;
  }
  const createdBy = call?.state?.createdBy?.id?.toString();
  if (createdBy && createdBy === userId?.toString()) {
    return false;
  }
  return (
    call.state?.callingState === CallingState.RINGING ||
    Boolean(call.ringing)
  );
};

const resolveCallFromEvent = async (videoClient, event) => {
  const cid = event?.call_cid || event?.call?.cid;
  if (!cid || !videoClient) {
    return null;
  }

  let call = findClientCall(videoClient, cid);
  if (call) {
    return call;
  }

  const separator = cid.indexOf(':');
  const type =
    event?.call?.type || (separator >= 0 ? cid.slice(0, separator) : 'default');
  const id =
    event?.call?.id ||
    (separator >= 0 ? cid.slice(separator + 1) : cid);

  call = videoClient.call(type, id);
  try {
    await call.get();
  } catch (error) {
    console.warn('resolveCallFromEvent:', error?.message);
  }
  return call;
};

/**
 * Listens for Stream `call.ring` events and opens the incoming call screen with ringtone.
 */
const StreamRingingWatcher = () => {
  const navigation = useNavigation();
  const videoClient = useStreamVideoClient();
  const { user } = useAuth();
  const calls = useCalls();
  const openedCallsRef = useRef(new Set());
  const ringingCidRef = useRef(null);

  const openIncomingCall = useCallback(
    (call) => {
      const cid = call?.cid;
      const userId = user?._id?.toString();
      if (!cid || !userId || !navigation || call.isCreatedByMe) {
        return;
      }

      if (!isIncomingRingingCall(call, userId)) {
        return;
      }

      const params = buildIncomingParams(call, userId);

      if (ringingCidRef.current !== cid) {
        ringingCidRef.current = cid;
        startIncomingRingtone(cid);
        displayIncomingCallNotification({
          callerName: params.isGroupCall ? params.groupName : params.otherUserName,
          isGroupCall: params.isGroupCall,
          callCid: cid,
          video: params.video,
          otherUserId: params.otherUserId,
          groupId: params.groupId,
          groupName: params.groupName,
        }).catch(() => {});
      }

      const rootNav = getRootNavigation(navigation);
      const currentRoute = rootNav.getCurrentRoute?.();
      if (
        currentRoute?.name === 'StreamCall' &&
        currentRoute?.params?.incomingCallCid === cid
      ) {
        openedCallsRef.current.add(cid);
        return;
      }

      if (openedCallsRef.current.has(cid)) {
        return;
      }

      openedCallsRef.current.add(cid);
      rootNav.navigate('StreamCall', params);
    },
    [navigation, user?._id]
  );

  useEffect(() => {
    if (!videoClient || !user?._id) {
      return undefined;
    }

    const handleRing = async (event) => {
      const createdBy = event?.call?.created_by?.id?.toString();
      if (createdBy && createdBy === user._id.toString()) {
        return;
      }

      const call = await resolveCallFromEvent(videoClient, event);
      if (call) {
        openIncomingCall(call);
      }
    };

    const unsubRing = videoClient.on('call.ring', handleRing);
    const unsubCreated = videoClient.on('call.created', (event) => {
      if (event?.call?.ringing) {
        handleRing(event);
      }
    });
    const unsubNotification = videoClient.on('call.notification', (event) => {
      if (event?.call?.ringing) {
        handleRing(event);
      }
    });

    return () => {
      unsubRing?.();
      unsubCreated?.();
      unsubNotification?.();
    };
  }, [videoClient, user?._id, openIncomingCall]);

  useEffect(() => {
    if (!user?._id || !calls?.length) {
      return;
    }

    calls.forEach((call) => {
      const cid = call?.cid;
      const state = call?.state?.callingState;

      if (isIncomingRingingCall(call, user._id)) {
        openIncomingCall(call);
        return;
      }

      if (state === CallingState.LEFT || state === CallingState.IDLE) {
        openedCallsRef.current.delete(cid);
        if (ringingCidRef.current === cid) {
          stopIncomingRingtone();
          cancelIncomingCallNotification();
          ringingCidRef.current = null;
        }
      }

      if (state === CallingState.JOINED && ringingCidRef.current === cid) {
        stopIncomingRingtone();
        cancelIncomingCallNotification();
        ringingCidRef.current = null;
      }
    });
  }, [calls, openIncomingCall, user?._id]);

  useEffect(
    () => () => {
      stopIncomingRingtone();
      cancelIncomingCallNotification();
    },
    []
  );

  return null;
};

export default StreamRingingWatcher;
