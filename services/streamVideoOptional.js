/** Stream Video is optional until Android SDK Platform 34 is installed and video packages are added back. */

let StreamVideo = null;
let StreamVideoClient = null;
let streamCallUi = null;

try {
  const videoSdk = require('@stream-io/video-react-native-sdk');
  StreamVideo = videoSdk.StreamVideo;
  StreamVideoClient = videoSdk.StreamVideoClient;
  streamCallUi = {
    StreamCall: videoSdk.StreamCall,
    CallContent: videoSdk.CallContent,
    RingingCallContent: videoSdk.RingingCallContent,
    IncomingCall: videoSdk.IncomingCall,
    OutgoingCall: videoSdk.OutgoingCall,
    IncomingCallControls: videoSdk.IncomingCallControls,
    UserInfo: videoSdk.UserInfo,
    CallControls: videoSdk.CallControls,
    CallingState: videoSdk.CallingState,
  };
} catch (error) {
  // Native video module not linked in this build
}

export const isStreamVideoAvailable = () => Boolean(StreamVideoClient);

export const getStreamVideo = () => StreamVideo;
export const getStreamVideoClientClass = () => StreamVideoClient;
export const getStreamCallUi = () => streamCallUi;
