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

export const getDirectCallId = (userIdA, userIdB) =>
  getDirectMessageChannelId(userIdA, userIdB);

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

export const getChannelDisplayName = (channel, currentUserId) => {
  if (channel?.data?.name) {
    return channel.data.name;
  }
  if (isGroupChannelId(channel?.id)) {
    return 'Group';
  }
  const other = getOtherMemberFromChannel(channel, currentUserId);
  return other?.name || 'Chat';
};

export const getOtherMemberFromChannel = (channel, currentUserId) => {
  if (!channel?.state?.members) {
    return null;
  }
  const members = Object.values(channel.state.members);
  return members.find((m) => m.user?.id !== currentUserId?.toString())?.user || null;
};
