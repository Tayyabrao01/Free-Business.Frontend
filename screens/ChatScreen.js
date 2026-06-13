import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import api, { isAbortError } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../hooks/useTranslation';

const ChatScreen = ({ route }) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { receiverId, receiverName } = route.params;

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);
  const pollControllerRef = useRef(null);

  const fetchMessages = useCallback(async (signal) => {
    try {
      const response = await api.get(`/conversations?with=${receiverId}`, { signal });
      if (response.data?.messages) {
        setMessages(response.data.messages);
      }
    } catch (error) {
      if (!isAbortError(error)) {
        setMessages([]);
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, [receiverId]);

  useEffect(() => {
    const controller = new AbortController();
    pollControllerRef.current = controller;

    setLoading(true);
    fetchMessages(controller.signal);

    const interval = setInterval(() => {
      const pollController = new AbortController();
      pollControllerRef.current = pollController;
      fetchMessages(pollController.signal);
    }, 5000);

    return () => {
      clearInterval(interval);
      controller.abort();
      pollControllerRef.current?.abort();
    };
  }, [fetchMessages]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      await api.post('/messages', {
        receiverId,
        content: newMessage.trim(),
      });
      setNewMessage('');
      fetchMessages();
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (error) {
      Alert.alert(t('common.error'), t('chat.sendFailed'));
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }) => {
    const isMyMessage = item.sender?._id === user?._id;

    return (
      <View style={[
        styles.messageWrapper,
        isMyMessage ? styles.myMessageWrapper : styles.otherMessageWrapper,
      ]}>
        <View style={[
          styles.messageBubble,
          isMyMessage ? styles.myBubble : styles.otherBubble,
        ]}>
          <Text style={[
            styles.messageText,
            isMyMessage ? styles.myMessageText : styles.otherMessageText,
          ]}>
            {item.content}
          </Text>
          <Text style={styles.messageTime}>
            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          <View style={[
            styles.bubbleTail,
            isMyMessage ? styles.myBubbleTail : styles.otherBubbleTail,
          ]} />
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlashList
        ref={listRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item._id}
        estimatedItemSize={72}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder={t('chat.messagePlaceholder', {
            name: receiverName || t('common.user'),
          })}
          placeholderTextColor="#888888"
          color="#D4AF37"
          fontSize={16}
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage} disabled={sending}>
          <Text style={styles.sendButtonText}>
            {sending ? t('chat.sending') : t('chat.send')}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000000' },
  messagesList: { paddingHorizontal: 16, paddingVertical: 14 },
  messageWrapper: { marginVertical: 6, maxWidth: '80%' },
  myMessageWrapper: { alignSelf: 'flex-end' },
  otherMessageWrapper: { alignSelf: 'flex-start' },
  messageBubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 1,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  myBubble: { backgroundColor: '#D4AF37', borderBottomRightRadius: 4 },
  otherBubble: { backgroundColor: '#1a1a1a', borderBottomLeftRadius: 4 },
  bubbleTail: {
    position: 'absolute',
    bottom: -1,
    width: 14,
    height: 14,
    borderRadius: 8,
  },
  myBubbleTail: {
    right: -6,
    backgroundColor: '#D4AF37',
    borderBottomRightRadius: 0,
    borderWidth: 1,
    borderColor: '#D4AF37',
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  otherBubbleTail: {
    left: -6,
    backgroundColor: '#1a1a1a',
    borderBottomLeftRadius: 0,
    borderWidth: 1,
    borderColor: '#D4AF37',
    borderTopWidth: 0,
    borderRightWidth: 0,
  },
  messageText: { fontSize: 16, marginBottom: 4 },
  myMessageText: { color: '#000000' },
  otherMessageText: { color: '#D4AF37' },
  messageTime: { fontSize: 10, alignSelf: 'flex-end', color: '#888888' },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#D4AF37',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D4AF37',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 10,
    backgroundColor: '#000000',
    color: '#D4AF37',
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: { color: '#000000', fontWeight: 'bold', fontSize: 16 },
});

export default ChatScreen;
