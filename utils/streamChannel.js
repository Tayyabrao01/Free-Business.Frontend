/**
 * Deterministic 1:1 channel id so both users always land in the same conversation.
 */
export const isDirectMessageChannelId = (channelId) =>
  Boolean(channelId?.toString().startsWith('dm-'));

export const getPeerIdFromDmChannelId = (channelId, currentUserId) => {
  if (!isDirectMessageChannelId(channelId)) {
    return null;
  }
  const rest = channelId.toString().slice(3);
  const parts = rest.split('-');
  if (parts.length !== 2) {
    return null;
  }
  const myId = currentUserId?.toString();
  if (parts[0] === myId) {
    return parts[1];
  }
  if (parts[1] === myId) {
    return parts[0];
  }
  return parts[1];
};

export const getDirectMessageChannelId = (userIdA, userIdB) => {
  const a = userIdA?.toString();
  const b = userIdB?.toString();
  if (!a || !b) {
    throw new Error('Both user ids are required for a direct channel');
  }
  return `dm-${[a, b].sort().join('-')}`;
};

export const DIRECT_CALL_PREFIX = 'call-dm-';

export const getDirectCallId = (userIdA, userIdB) => {
  const a = userIdA?.toString();
  const b = userIdB?.toString();
  if (!a || !b) {
    throw new Error('Both user ids are required for a call');
  }
  return `${DIRECT_CALL_PREFIX}${[a, b].sort().join('-')}`;
};

export const GROUP_CHANNEL_PREFIX = 'group-';
export const GROUP_CALL_PREFIX = 'group-call-';

export const getGroupChannelId = (groupId) => {
  const id = groupId?.toString();
  if (!id) {
    throw new Error('Group id is required');
  }
  return `${GROUP_CHANNEL_PREFIX}${id}`;
};

export const getGroupCallId = (groupId) => {
  const id = groupId?.toString();
  if (!id) {
    throw new Error('Group id is required');
  }
  return `${GROUP_CALL_PREFIX}${id}`;
};

export const isGroupChannelId = (channelId) =>
  Boolean(channelId?.toString().startsWith(GROUP_CHANNEL_PREFIX));

export const getGroupIdFromChannelId = (channelId) => {
  const id = channelId?.toString();
  if (!isGroupChannelId(id)) {
    return null;
  }
  return id.slice(GROUP_CHANNEL_PREFIX.length);
};

export const getGroupIdFromCallId = (callId) => {
  const id = callId?.toString();
  if (!id?.startsWith(GROUP_CALL_PREFIX)) {
    return null;
  }
  return id.slice(GROUP_CALL_PREFIX.length);
};

export const getChannelMemberIds = (channel) => {
  if (!channel?.state?.members) {
    return [];
  }
  return Object.values(channel.state.members)
    .map((member) => member.user?.id || member.user_id)
    .filter(Boolean)
    .map((id) => id.toString());
};

export const getOtherMemberFromChannel = (channel, currentUserId) => {
  const members = channel?.state?.members;
  if (!members) {
    return null;
  }
  const myId = currentUserId?.toString();
  const list = Array.isArray(members) ? members : Object.values(members);
  const match = list.find((m) => {
    const memberId = (m.user?.id || m.user_id)?.toString();
    return memberId && memberId !== myId;
  });
  return match?.user || (match?.user_id ? { id: match.user_id, name: match.name } : null);
};

const isGenericMemberLabel = (name) =>
  !name || name === 'Member' || name === 'User' || name === 'Chat';

export const getChannelDisplayName = (channel, currentUserId) => {
  if (isGroupChannelId(channel?.id)) {
    return (
      channel?.data?.name ||
      channel?.state?.channelData?.name ||
      channel?.data?.group_name ||
      'Group'
    );
  }
  const other = getOtherMemberFromChannel(channel, currentUserId);
  const otherName = other?.name;
  if (!isGenericMemberLabel(otherName)) {
    return otherName;
  }
  return channel?.data?.name || otherName || 'Chat';
};

export const getChannelDisplayAvatar = (channel, currentUserId) => {
  if (isGroupChannelId(channel?.id)) {
    return channel?.data?.image || null;
  }
  const other = getOtherMemberFromChannel(channel, currentUserId);
  return other?.image || null;
};
