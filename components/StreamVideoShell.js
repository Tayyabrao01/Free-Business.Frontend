import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useStream } from '../context/StreamProvider';
import { getStreamVideo } from '../services/streamVideoOptional';
import { getChatClient } from '../services/streamClientService';
import { registerStreamPushDevices } from '../services/streamPushRegistration';
import StreamRingingWatcher from './StreamRingingWatcher';

/**
 * Keeps Stream Video connected while logged in and listens for incoming rings.
 */
const StreamVideoShell = ({ children }) => {
  const { user } = useAuth();
  const { videoClient, chatClient, reconnect, isReady } = useStream();
  const StreamVideo = getStreamVideo();

  useEffect(() => {
    if (user?._id) {
      reconnect();
    }
  }, [user?._id, reconnect]);

  useEffect(() => {
    if (!user?._id || !isReady) {
      return;
    }
    const chat = chatClient || getChatClient();
    if (chat) {
      registerStreamPushDevices(user._id, chat).catch(() => {});
    }
  }, [user?._id, isReady, chatClient]);

  if (!user?._id || !StreamVideo) {
    return children || null;
  }

  if (!videoClient) {
    return children || null;
  }

  return (
    <StreamVideo client={videoClient}>
      <StreamRingingWatcher />
      {children}
    </StreamVideo>
  );
};

export default StreamVideoShell;
