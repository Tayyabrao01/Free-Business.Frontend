export const mapStreamChatError = (error) => {
  const code = error?.code;
  const message = String(error?.message || error || '');

  if (code === 9 || message.includes('Too many requests')) {
    return 'Chat server is busy. Wait a few seconds and tap Retry.';
  }
  if (code === 17 || message.includes('ReadChannel')) {
    return 'You are not a member of this chat yet. Go back, wait 5 seconds, and tap Retry. If it persists, log out and log in again.';
  }
  if (message.includes('404') || message.includes('Not Found')) {
    return 'Chat server route missing. Deploy backend v2.4.0 on Hostinger, run npm install, pm2 restart, then retry.';
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

  return message.replace(/^StreamChat error code \d+:\s*/i, '') || 'Could not open chat';
};

export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
