import { formatDisplayError, sanitizeErrorText } from './apiError';

export const isChannelNotFoundError = (error) => {
  const msg = String(
    error?.message || error?.response?.data?.message || error?.response?.data?.error || error || ''
  ).toLowerCase();
  return (
    msg.includes("can't find channel") ||
    msg.includes('channel not found') ||
    msg.includes('updatechannel failed')
  );
};

export const isMembersFieldError = (error) => {
  const msg = String(
    error?.message || error?.response?.data?.message || error?.response?.data?.error || error || ''
  ).toLowerCase();
  return (
    msg.includes('expected object for field "members"') ||
    msg.includes('getorcreatechannel') ||
    msg.includes('created_by_id must be provided') ||
    msg.includes('data.created_by')
  );
};

export const mapStreamChatError = (error) => {
  // Cloudflare / HTML API failures first
  const friendly = formatDisplayError(error, '');
  if (
    friendly &&
    (friendly.includes('Cloudflare') ||
      friendly.includes('security check') ||
      friendly.includes('Server is temporarily'))
  ) {
    return friendly;
  }

  const code = error?.code;
  const message = sanitizeErrorText(
    String(error?.message || error || ''),
    'Could not open chat'
  );

  if (message.includes('created_by_id must be provided') || message.includes('data.created_by')) {
    return 'Chat is being set up on the server. Tap Retry once.';
  }
  if (message.includes("Can't find channel") || message.includes('UpdateChannel failed')) {
    return 'Chat channel was removed. Tap Retry — the server will create it again.';
  }
  if (message.includes('expected object for field "members"')) {
    return 'Chat was reset on the server. Tap Retry once to open the conversation.';
  }
  if (message.includes('GetOrCreateChannel')) {
    return 'Could not open chat. Tap Retry once — the server will rebuild the channel.';
  }
  if (code === 9 || message.includes('Too many requests')) {
    return 'Chat server is busy. Wait a few seconds and tap Retry.';
  }
  if (code === 17 || message.includes('ReadChannel')) {
    return 'You are not a member of this chat yet. Go back, wait 5 seconds, and tap Retry. If it persists, log out and log in again.';
  }
  if (message.includes('404') || message.includes('Not Found')) {
    return 'Chat server route missing. Deploy backend v2.7.0 on Hostinger, then restart Node and retry.';
  }
  if (message.includes('not found') || code === 4) {
    return 'Conversation not found. Tap Retry to create it.';
  }
  if (message.includes('timed out') || message.includes('timeout')) {
    return 'Chat took too long to load. Check internet and tap Retry.';
  }
  if (message.includes('connection') || message.includes('network')) {
    return 'Network error. Check internet and try again.';
  }
  if (message.includes('Request failed with status code')) {
    return friendly || 'Could not reach the chat server. Tap Retry.';
  }

  return (
    message.replace(/^StreamChat error code \d+:\s*/i, '') ||
    friendly ||
    'Could not open chat'
  );
};

export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
