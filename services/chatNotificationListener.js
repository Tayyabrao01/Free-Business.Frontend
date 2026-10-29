import notifee, { AndroidImportance, AndroidCategory } from '@notifee/react-native';
import { isGroupChannelId } from '../utils/streamChannel';

const MESSAGE_CHANNEL_ID = 'freebusiness_messages';

let activeChannelId = null;

export const setActiveChatChannelId = (channelId) => {
  activeChannelId = channelId ? channelId.toString() : null;
};

const getMessagePreview = (message) => {
  if (!message) {
    return 'New message';
  }
  if (message.text?.trim()) {
    return message.text.trim();
  }
  if (message.attachments?.length) {
    const type = message.attachments[0]?.type;
    if (type === 'image') return 'Sent a photo';
    if (type === 'video') return 'Sent a video';
    if (type === 'audio') return 'Sent a voice message';
    return 'Sent an attachment';
  }
  return 'New message';
};

const shouldNotifyForMessage = (event, currentUserId) => {
  const message = event?.message;
  const senderId = message?.user?.id?.toString();
  const myId = currentUserId?.toString();

  if (!message || !senderId || senderId === myId) {
    return false;
  }

  const channelId =
    event?.channel?.id ||
    event?.cid?.split(':')?.[1] ||
    message?.cid?.split(':')?.[1];

  if (channelId && activeChannelId && channelId === activeChannelId) {
    return false;
  }

  return true;
};

const showChatNotification = async (event) => {
  const message = event.message;
  const channel = event.channel;
  const channelId = channel?.id || event?.cid?.split(':')?.[1];
  const senderName = message?.user?.name || 'Someone';
  const isGroup = isGroupChannelId(channelId);
  const groupName = channel?.data?.name;

  const title = isGroup
    ? groupName || 'Group message'
    : senderName;

  const body = isGroup
    ? `${senderName}: ${getMessagePreview(message)}`
    : getMessagePreview(message);

  await notifee.displayNotification({
    title,
    body,
    data: {
      channelId: channelId || '',
      channelType: channel?.type || 'messaging',
      isGroupChat: String(isGroup),
      groupId: isGroup ? String(channelId || '').replace(/^group-/, '') : '',
      groupName: groupName || '',
      otherUserName: senderName,
      type: 'message',
    },
    android: {
      channelId: MESSAGE_CHANNEL_ID,
      importance: AndroidImportance.HIGH,
      category: AndroidCategory.MESSAGE,
      pressAction: { id: 'default' },
      sound: 'default',
      vibrationPattern: [200, 300],
    },
  });
};

export const attachChatMessageNotifications = (chatClient, currentUserId) => {
  if (!chatClient || !currentUserId) {
    return () => {};
  }

  const onMessage = async (event) => {
    try {
      if (!shouldNotifyForMessage(event, currentUserId)) {
        return;
      }
      await showChatNotification(event);
    } catch (error) {
      console.warn('chat notification:', error?.message);
    }
  };

  chatClient.on('message.new', onMessage);
  chatClient.on('notification.message_new', onMessage);

  return () => {
    chatClient.off('message.new', onMessage);
    chatClient.off('notification.message_new', onMessage);
  };
};
