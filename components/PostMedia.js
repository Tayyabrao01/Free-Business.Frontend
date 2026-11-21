import React, { useEffect, useRef, useState } from 'react';
import { AppState, Image, Text, TouchableOpacity, View } from 'react-native';
import Video from 'react-native-video';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { resolveMediaUrl } from '../utils/imageUrl';

let activeVideo = null;

const PostMedia = ({
  media,
  style,
  onPress,
  isVisible = true,
  scrollOffset,
  viewportHeight,
  onPositionChange,
}) => {
  const [paused, setPaused] = useState(true);
  const player = useRef(null);
  const activeHandle = useRef(null);
  const isValidMedia = Boolean(
    media && typeof media === 'object' && typeof media.url === 'string'
  );
  const url = isValidMedia ? resolveMediaUrl(media.url) : null;
  const isVideo =
    media?.type === 'video' || media?.mimeType?.startsWith?.('video/');

  useEffect(() => {
    if (!isVideo) return undefined;
    const subscription = AppState.addEventListener('change', state => {
      if (state !== 'active') setPaused(true);
    });
    return () => {
      subscription.remove();
      if (activeVideo === activeHandle.current) activeVideo = null;
    };
  }, [isVideo]);

  useEffect(() => {
    if (isVideo && !isVisible) setPaused(true);
  }, [isVisible, isVideo]);

  if (!url) {
    console.warn('[post-detail] skipping invalid media:', media);
    return null;
  }

  const handlePlaybackRateChange = event => {
    if (event.playbackRate > 0) {
      if (activeVideo && activeVideo !== player.current) {
        activeVideo.pause?.();
      }
      activeHandle.current = {
        pause: () => setPaused(true),
      };
      activeVideo = activeHandle.current;
    } else if (activeVideo === activeHandle.current) {
      activeVideo = null;
    }
  };

  if (media.type === 'image') {
    return (
      <TouchableOpacity activeOpacity={0.92} onPress={onPress}>
        <Image source={{ uri: url }} style={style} />
      </TouchableOpacity>
    );
  }

  const mediaHeight = style?.height || 220;
  const visibleByScroll =
    scrollOffset == null || viewportHeight == null || onPositionChange == null
      ? true
      : isVisible;

  return (
    <View
      style={{
        width: '100%',
        height: mediaHeight,
        aspectRatio: style?.aspectRatio || 16 / 9,
        overflow: 'hidden',
      }}
      onLayout={event => onPositionChange?.(event.nativeEvent.layout.y, mediaHeight)}
    >
      <Video
        ref={player}
        source={{ uri: url }}
        style={[style, { width: '100%', height: '100%' }]}
        paused={paused || !visibleByScroll}
        controls
        resizeMode="contain"
        onPlaybackRateChange={handlePlaybackRateChange}
        onFullscreenPlayerDidDismiss={() => setPaused(true)}
      />
      {isVideo ? (
        <TouchableOpacity
          onPress={() => player.current?.presentFullscreenPlayer?.()}
          style={{
            position: 'absolute',
            right: 10,
            bottom: 10,
            padding: 6,
            backgroundColor: 'rgba(0,0,0,0.65)',
            borderRadius: 5,
          }}
          accessibilityLabel="Open video fullscreen"
        >
          <Ionicons name="expand-outline" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      ) : null}
      {media.type === 'audio' ? (
        <TouchableOpacity
          onPress={() => setPaused(current => !current)}
          style={{ alignItems: 'center', padding: 10 }}
        >
          <Ionicons name={paused ? 'play-circle' : 'pause-circle'} size={34} color="#D4AF37" />
          <Text style={{ color: '#D4AF37' }}>{paused ? 'Play audio' : 'Pause audio'}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

export default PostMedia;
