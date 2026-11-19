import { useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ShareMenu from 'react-native-share-menu';

const SUPPORTED_MIME = /^(image|video|audio)\//i;

const normalizeSharedAssets = share => {
  if (!share || !SUPPORTED_MIME.test(String(share.mimeType || ''))) {
    throw new Error(
      'Only image, video, and audio files can be shared to Free Business.',
    );
  }

  const paths = Array.isArray(share.data) ? share.data : [share.data];
  if (!paths.length || paths.some(path => typeof path !== 'string' || !path)) {
    throw new Error('The shared media could not be read.');
  }

  return paths.map((uri, index) => ({
    uri,
    type: share.mimeType,
    fileName: `shared-media-${Date.now()}-${index}`,
  }));
};

const ShareIntentHandler = () => {
  const navigation = useNavigation();

  const handleShare = useCallback(
    share => {
      if (!share) {
        return;
      }

      try {
        const sharedAssets = normalizeSharedAssets(share);
        navigation.navigate('AddPost', { sharedAssets });
      } catch (error) {
        Alert.alert('Unsupported media', error.message);
      }
    },
    [navigation],
  );

  useEffect(() => {
    ShareMenu.getInitialShare(handleShare);
    const listener = ShareMenu.addNewShareListener(handleShare);
    return () => listener.remove();
  }, [handleShare]);

  return null;
};

export default ShareIntentHandler;
