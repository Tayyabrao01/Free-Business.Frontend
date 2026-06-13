import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { startCallAudio, stopCallAudio, boostCallSpeaker } from '../utils/callAudio';
import {
  getStreamCallUi,
  getStreamVideo,
} from '../services/streamVideoOptional';

const StreamActiveCall = ({ call, videoClient, video, onHangup }) => {
  const StreamVideo = getStreamVideo();
  const callUi = getStreamCallUi();

  if (!StreamVideo || !callUi || !videoClient || !call) {
    return null;
  }

  const { StreamCall, RingingCallContent, CallContent } = callUi;

  useEffect(() => {
    startCallAudio(video);
    const boostTimer = setTimeout(() => {
      boostCallSpeaker(call, video);
    }, 1200);
    return () => {
      clearTimeout(boostTimer);
      stopCallAudio();
    };
  }, [video, call]);

  const hangup = () => {
    if (typeof call?.leave === 'function') {
      call.leave().finally(onHangup);
    } else {
      onHangup();
    }
  };

  const AcceptedCallContent = (props) => (
    <CallContent
      {...props}
      disablePictureInPicture
      initialInCallManagerAudioMode={video ? 'video' : 'audio'}
      onHangupCallHandler={hangup}
    />
  );

  return (
    <StreamVideo client={videoClient}>
      <StreamCall call={call}>
        <View style={styles.container}>
          {RingingCallContent ? (
            <RingingCallContent onBackPress={onHangup} CallContent={AcceptedCallContent} />
          ) : (
            <AcceptedCallContent />
          )}
        </View>
      </StreamCall>
    </StreamVideo>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
});

export default StreamActiveCall;
