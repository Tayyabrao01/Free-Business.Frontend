import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'freebusiness_call_logs_v1';
const MAX_LOGS = 200;

/**
 * @typedef {'outgoing'|'incoming'|'missed'} CallDirection
 * @typedef {'audio'|'video'} CallKind
 */

export const addCallLogEntry = async (entry) => {
  const logs = await getCallLogs();
  const record = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    peerId: entry.peerId?.toString() || '',
    peerName: entry.peerName || 'User',
    direction: entry.direction || 'outgoing',
    kind: entry.kind || 'audio',
    status: entry.status || 'completed',
    startedAt: entry.startedAt || new Date().toISOString(),
    endedAt: entry.endedAt || new Date().toISOString(),
    durationSec: entry.durationSec || 0,
  };

  const next = [record, ...logs].slice(0, MAX_LOGS);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return record;
};

export const getCallLogs = async () => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const clearCallLogs = async () => {
  await AsyncStorage.removeItem(STORAGE_KEY);
};

export const formatCallDuration = (seconds) => {
  const sec = Math.max(0, Number(seconds) || 0);
  if (sec < 60) return `${sec}s`;
  const mins = Math.floor(sec / 60);
  const rem = sec % 60;
  return rem ? `${mins}m ${rem}s` : `${mins}m`;
};
