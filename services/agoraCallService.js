import {
  ChannelProfileType,
  ClientRoleType,
  createAgoraRtcEngine,
} from 'react-native-agora';

let engine = null;
let registeredEventHandler = null;

export const getAgoraUid = value => {
  const input = String(value || '');
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 16777619 + input.charCodeAt(index)) % 4294967296;
  }
  return Math.floor(hash) || 1;
};

export const getAgoraChannelName = callId => {
  const channel = String(callId || '').replace(
    /[^a-zA-Z0-9!#$%&()+\-:;<=>?@[\]^_{|}~,.\s]/g,
    '_',
  );
  return `free-business-${channel}`.slice(0, 64);
};

export const getAgoraEngine = () => {
  if (!engine) {
    engine = createAgoraRtcEngine();
  }
  return engine;
};

export const initializeAgora = (appId, eventHandler) => {
  const rtcEngine = getAgoraEngine();
  rtcEngine.initialize({ appId });
  rtcEngine.setChannelProfile(ChannelProfileType.ChannelProfileCommunication);
  rtcEngine.setClientRole(ClientRoleType.ClientRoleBroadcaster);
  if (eventHandler) {
    registeredEventHandler = eventHandler;
    rtcEngine.registerEventHandler(eventHandler);
  }
  return rtcEngine;
};

export const joinAgoraChannel = async ({
  appId,
  token,
  channelName,
  uid,
  videoEnabled,
  eventHandler,
}) => {
  const rtcEngine = initializeAgora(appId, eventHandler);
  console.log('[Agora] Enabling audio', { channelName, uid, videoEnabled });
  rtcEngine.enableAudio();
  if (videoEnabled) {
    console.log('[Agora] Enabling video');
    rtcEngine.enableVideo();
    rtcEngine.startPreview();
  } else {
    console.log('[Agora] Audio call: disabling video');
    rtcEngine.disableVideo();
    rtcEngine.muteLocalVideoStream(true);
  }
  const joinResult = rtcEngine.joinChannel(token, channelName, uid, {
    publishCameraTrack: Boolean(videoEnabled),
    publishMicrophoneTrack: true,
    autoSubscribeAudio: true,
    autoSubscribeVideo: true,
  });
  if (joinResult < 0) {
    throw new Error(`Agora join failed with code ${joinResult}`);
  }
  return rtcEngine;
};

export const renewAgoraToken = token => {
  if (!engine || !token) {
    throw new Error('Agora engine or token is unavailable');
  }
  console.log('[Agora] Renewing token');
  return engine.renewToken(token);
};

export const leaveAgoraChannel = async () => {
  if (!engine) {
    return;
  }
  try {
    await engine.leaveChannel();
  } finally {
    engine.stopPreview();
    if (registeredEventHandler) {
      engine.unregisterEventHandler(registeredEventHandler);
    }
    engine.release();
    engine = null;
    registeredEventHandler = null;
  }
};

export const setAgoraMicrophoneEnabled = enabled =>
  getAgoraEngine().muteLocalAudioStream(!enabled);

export const setAgoraCameraEnabled = enabled =>
  getAgoraEngine().muteLocalVideoStream(!enabled);

export const switchAgoraCamera = () => {
  if (!engine) {
    throw new Error('Agora engine is unavailable');
  }
  console.log('[Agora] Switching camera');
  return engine.switchCamera();
};

export const setAgoraSpeakerEnabled = enabled =>
  getAgoraEngine().setEnableSpeakerphone(enabled);
