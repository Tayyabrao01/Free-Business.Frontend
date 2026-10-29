import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';
import { useAuth } from './AuthContext';
import {
  connectStreamClients,
  disconnectStreamClients,
  getChatClient,
  getVideoClient,
  isChatClientReady,
  isVideoClientReady,
} from '../services/streamClientService';
import { formatDisplayError } from '../utils/apiError';

const StreamContext = createContext({
  isReady: false,
  isConnecting: false,
  error: null,
  chatClient: null,
  videoClient: null,
  reconnect: () => {},
});

export const useStream = () => {
  const ctx = useContext(StreamContext);
  if (!ctx) {
    throw new Error('useStream must be used within StreamProvider');
  }
  return ctx;
};

export const StreamProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [isReady, setIsReady] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [chatClient, setChatClient] = useState(null);
  const [videoClient, setVideoClient] = useState(null);
  const connectInFlight = useRef(null);

  const connect = useCallback(async () => {
    if (!user?._id || !token) {
      await disconnectStreamClients();
      setChatClient(null);
      setVideoClient(null);
      setIsReady(false);
      setError(null);
      return;
    }

    if (isChatClientReady(user._id) && isVideoClientReady(user._id)) {
      setChatClient(getChatClient());
      setVideoClient(getVideoClient());
      setIsReady(true);
      setError(null);
      return;
    }

    if (connectInFlight.current) {
      return connectInFlight.current;
    }

    setIsConnecting(true);
    setError(null);

    const task = (async () => {
      try {
        const result = await connectStreamClients(user);
        setChatClient(result.chatClient);
        setVideoClient(result.videoClient);
        setIsReady(Boolean(result.chatClient));
      } catch (err) {
        console.error('Stream connect error:', err);
        const message = formatDisplayError(err, 'Failed to connect messaging');
        setError(message);
        setIsReady(false);
        setChatClient(null);
        setVideoClient(null);
      } finally {
        setIsConnecting(false);
        connectInFlight.current = null;
      }
    })();

    connectInFlight.current = task;
    return task;
  }, [user, token]);

  useEffect(() => {
    if (!user?._id) {
      disconnectStreamClients();
      setChatClient(null);
      setVideoClient(null);
      setIsReady(false);
      setError(null);
      return undefined;
    }

    const timer = setTimeout(() => {
      connect();
    }, 800);

    return () => clearTimeout(timer);
  }, [user?._id, token, connect]);

  useEffect(() => {
    if (!user?._id) {
      return undefined;
    }

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        // Don't spam reconnect while Cloudflare is blocking the API
        if (
          typeof error === 'string' &&
          (error.includes('security check') || error.includes('Cloudflare'))
        ) {
          return;
        }
        connect();
      }
    });

    return () => subscription.remove();
  }, [user?._id, connect, error]);

  useEffect(() => {
    return () => {
      disconnectStreamClients();
    };
  }, []);

  const value = useMemo(
    () => ({
      isReady,
      isConnecting,
      error,
      chatClient: chatClient || getChatClient(),
      videoClient: videoClient || getVideoClient(),
      reconnect: connect,
    }),
    [isReady, isConnecting, error, chatClient, videoClient, connect]
  );

  return <StreamContext.Provider value={value}>{children}</StreamContext.Provider>;
};

export default StreamProvider;
