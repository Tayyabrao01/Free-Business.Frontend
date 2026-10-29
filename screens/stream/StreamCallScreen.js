import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
} from 'react-native';
import { CallingState } from '@stream-io/video-client';
import { useAuth } from '../../context/AuthContext';
import { useStream } from '../../context/StreamProvider';
import { useTranslation } from '../../hooks/useTranslation';
import { endActiveCall, findClientCall } from '../../services/callLifecycle';
import {
  joinDirectCall,
  joinGroupCall,
  prepareIncomingCall,
  ensureVideoClientReady,
} from '../../services/streamClientService';
import { getGroupIdFromCallId } from '../../utils/streamChannel';
import { ensureCallPermissions } from '../../utils/callPermissions';
import {
  getStreamCallUi,
  isStreamVideoAvailable,
} from '../../services/streamVideoOptional';
import StreamActiveCall from '../../components/StreamActiveCall';
import { stopIncomingRingtone } from '../../utils/incomingRingtone';
import { addCallLogEntry } from '../../services/callLogService';
import { formatDisplayError } from '../../utils/apiError';

const StreamCallScreen = ({ route, navigation }) => {
  const {
    otherUserId,
    otherUserName,
    otherUserAvatar,
    video = true,
    incomingCallCid,
    isGroupCall = false,
    groupId,
    groupName,
    groupMemberIds = [],
  } = route.params || {};
  const { user } = useAuth();
  const { reconnect } = useStream();
  const { t } = useTranslation();
  const [call, setCall] = useState(null);
  const [error, setError] = useState(null);
  const [starting, setStarting] = useState(true);
  const activeCallRef = useRef(null);
  const mountedRef = useRef(true);
  const hungUpRef = useRef(false);
  const callStartedAtRef = useRef(null);
  const callConnectedRef = useRef(false);
  const peerRef = useRef({
    id: isGroupCall ? groupId : otherUserId,
    name: isGroupCall ? groupName : otherUserName,
  });
  const isIncoming = Boolean(incomingCallCid);

  const callUi = getStreamCallUi();
  const displayName =
    peerRef.current.name ||
    (isGroupCall ? groupName : otherUserName) ||
    t('common.user');

  const persistCallLog = useCallback(
    async (status = 'completed') => {
      const peer = peerRef.current;
      if (!peer?.id) return;

      const started = callStartedAtRef.current
        ? new Date(callStartedAtRef.current)
        : new Date();
      const ended = new Date();
      const durationSec = Math.max(
        0,
        Math.floor((ended.getTime() - started.getTime()) / 1000)
      );

      let direction = isIncoming ? 'incoming' : 'outgoing';
      if (status === 'missed') {
        direction = 'missed';
      }

      if (!isGroupCall) {
        await addCallLogEntry({
          peerId: peer.id,
          peerName: peer.name || 'User',
          direction,
          kind: video ? 'video' : 'audio',
          status,
          startedAt: started.toISOString(),
          endedAt: ended.toISOString(),
          durationSec: status === 'completed' ? durationSec : 0,
        });
      }
    },
    [isGroupCall, isIncoming, video]
  );

  const handleHangup = useCallback(async () => {
    hungUpRef.current = true;
    stopIncomingRingtone();
    await endActiveCall(activeCallRef.current, {
      isIncoming,
      wasConnected: callConnectedRef.current,
    });
    const status =
      isIncoming && !callConnectedRef.current ? 'missed' : 'completed';
    await persistCallLog(status);
    navigation.goBack();
  }, [isIncoming, navigation, persistCallLog]);

  const handleCallJoined = useCallback(() => {
    callConnectedRef.current = true;
    stopIncomingRingtone();
    if (!callStartedAtRef.current) {
      callStartedAtRef.current = Date.now();
    }
  }, []);

  const startCall = useCallback(async () => {
    if (!isStreamVideoAvailable() || !callUi) {
      setError(t('stream.callsUnavailableMessage'));
      setStarting(false);
      return;
    }

    if (!isIncoming && !isGroupCall && !otherUserId) {
      setError(t('stream.cannotCall'));
      setStarting(false);
      return;
    }

    if (!isIncoming && isGroupCall && !groupId) {
      setError(t('groups.callFailed'));
      setStarting(false);
      return;
    }

    setStarting(true);
    setError(null);
    callConnectedRef.current = false;
    hungUpRef.current = false;

    try {
      const permitted = await ensureCallPermissions(video);
      if (!permitted) {
        setError(t('stream.permissionRequired'));
        return;
      }

      const client = await ensureVideoClientReady(user, reconnect);
      if (!client) {
        setError(t('stream.videoNotReady'));
        return;
      }

      let activeCall;

      if (isIncoming) {
        activeCall = findClientCall(client, incomingCallCid);
        if (!activeCall) {
          activeCall = await prepareIncomingCall(client, incomingCallCid);
        }
      } else if (isGroupCall) {
        activeCall = await joinGroupCall(
          client,
          user._id,
          groupId,
          groupName,
          groupMemberIds,
          video
        );
        callStartedAtRef.current = Date.now();
      } else {
        activeCall = await joinDirectCall(
          client,
          user._id,
          otherUserId,
          otherUserName,
          video
        );
        callStartedAtRef.current = Date.now();
      }

      if (!mountedRef.current) {
        await endActiveCall(activeCall, { isIncoming, wasConnected: false });
        return;
      }

      activeCallRef.current = activeCall;

      if (isGroupCall) {
        const custom = activeCall?.state?.custom || activeCall?.state?.session?.custom;
        peerRef.current = {
          id: groupId || custom?.groupId || getGroupIdFromCallId(activeCall?.id),
          name: groupName || custom?.groupName || t('groups.groupChat'),
        };
      } else if (!peerRef.current.id || !peerRef.current.name) {
        const members = Object.values(activeCall?.state?.members || {});
        const peer = members.find(
          (m) => (m?.userId || m?.user?.id)?.toString() !== user._id?.toString()
        );
        peerRef.current = {
          id: peer?.userId || peer?.user?.id || otherUserId,
          name: peer?.user?.name || otherUserName || 'User',
        };
      }

      setCall(activeCall);
    } catch (err) {
      console.error('Call start error:', err);
      if (mountedRef.current) {
        setError(formatDisplayError(err, t('stream.callFailed')));
      }
    } finally {
      if (mountedRef.current) {
        setStarting(false);
      }
    }
  }, [
    callUi,
    groupId,
    groupMemberIds,
    groupName,
    incomingCallCid,
    isGroupCall,
    isIncoming,
    otherUserId,
    otherUserName,
    reconnect,
    t,
    user,
    video,
  ]);

  useEffect(() => {
    mountedRef.current = true;
    startCall();

    const connectTimeout = setTimeout(() => {
      if (mountedRef.current && starting) {
        setError(t('stream.callFailed'));
        setStarting(false);
      }
    }, 35000);

    return () => {
      mountedRef.current = false;
      clearTimeout(connectTimeout);
      if (!hungUpRef.current) {
        endActiveCall(activeCallRef.current, {
          isIncoming,
          wasConnected: callConnectedRef.current,
        }).catch(() => {});
      }
      activeCallRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isStreamVideoAvailable() || !callUi) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>{t('stream.callsUnavailableTitle')}</Text>
        <Text style={styles.message}>{t('stream.callsUnavailableMessage')}</Text>
        <TouchableOpacity style={styles.btn} onPress={handleHangup}>
          <Text style={styles.btnText}>{t('common.back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>{error}</Text>
        <TouchableOpacity style={styles.btn} onPress={startCall}>
          <Text style={styles.btnText}>{t('stream.retry')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backBtn} onPress={handleHangup}>
          <Text style={styles.backText}>{t('common.back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (starting && !call) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#D4AF37" />
        <Text style={styles.message}>
          {isIncoming
            ? isGroupCall
              ? t('groups.incomingGroupCall')
              : t('stream.incomingCall')
            : isGroupCall
              ? t('groups.startingGroupCall')
              : t('stream.callConnecting')}
        </Text>
      </View>
    );
  }

  if (!call) {
    return null;
  }

  return (
    <StreamActiveCall
      call={call}
      video={video}
      isGroupCall={isGroupCall}
      callerName={displayName}
      callerAvatar={otherUserAvatar}
      onHangup={handleHangup}
      onCallJoined={handleCallJoined}
    />
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 24,
  },
  title: {
    color: '#D4AF37',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: { color: '#ccc', textAlign: 'center', marginBottom: 20, lineHeight: 22 },
  btn: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  btnText: { color: '#000', fontWeight: '700' },
  backBtn: { padding: 12 },
  backText: { color: '#888' },
});

export default StreamCallScreen;
