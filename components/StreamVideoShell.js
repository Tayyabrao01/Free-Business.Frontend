import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useStream } from '../context/StreamProvider';
import { getStreamVideo } from '../services/streamVideoOptional';
import StreamRingingWatcher from './StreamRingingWatcher';

/**
 * Keeps Stream Video connected while logged in and listens for incoming rings.
 */
const StreamVideoShell = () => {
  const { user } = useAuth();
  const { videoClient, reconnect } = useStream();
  const StreamVideo = getStreamVideo();

  useEffect(() => {
    if (user?._id) {
      reconnect();
    }
  }, [user?._id, reconnect]);

  if (!user?._id || !StreamVideo || !videoClient) {
    return null;
  }

  return (
    <StreamVideo client={videoClient}>
      <StreamRingingWatcher />
    </StreamVideo>
  );
};

export default StreamVideoShell;
