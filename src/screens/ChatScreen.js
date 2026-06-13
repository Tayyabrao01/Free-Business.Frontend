import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import CryptoJS from 'crypto-js';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const ChatScreen = ({ route }) => {
  const { userId } = useContext(AuthContext);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(route.params?.conversationId || null);
  const [partner, setPartner] = useState(route.params?.partner || null);
  const [property, setProperty] = useState(route.params?.property || null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    if (route.params?.conversationId) {
      fetchMessages(route.params.conversationId);
    } else {
      loadConversations();
    }
  }, [route.params?.conversationId, userId]);

  const getEncryptionKey = (conversationId) => CryptoJS.SHA256(conversationId).toString();

  const encryptText = (text, conversationId) => {
    const hash = getEncryptionKey(conversationId);
    const key = CryptoJS.enc.Hex.parse(hash);
    const iv = CryptoJS.enc.Hex.parse(hash.slice(0, 32));
    return CryptoJS.AES.encrypt(text, key, { iv }).toString();
  };

  const decryptText = (cipher, conversationId) => {
    try {
      const hash = getEncryptionKey(conversationId);
      const key = CryptoJS.enc.Hex.parse(hash);
      const iv = CryptoJS.enc.Hex.parse(hash.slice(0, 32));
      const bytes = CryptoJS.AES.decrypt(cipher, key, { iv });
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      return decrypted || '[Encrypted message]';
    } catch {
      return '[Unable to decrypt]';
    }
  };

  const loadConversations = async () => {
    setLoadingConversations(true);
    try {
      const response = await api.get('/conversations');
      setConversations(response.data);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoadingConversations(false);
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId) => {
    setLoading(true);
    try {
      const response = await api.get(`/conversations/${conversationId}/messages`);
      const { conversation, messages: serverMessages } = response.data;
      const friend = conversation.participants?.find((participant) => participant._id !== userId) || null;
      setPartner(friend);
      setProperty(conversation.property || null);
      const decryptedMessages = serverMessages.map((message) => ({
        ...message,
        decryptedContent: decryptText(message.content, conversationId),
      }));
      setMessages(decryptedMessages);
      setSelectedConversation(conversationId);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const openConversation = (conversation) => {
    if (!conversation || !conversation._id) return;
    fetchMessages(conversation._id);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;
    setSending(true);
    try {
      const encryptedText = encryptText(newMessage.trim(), selectedConversation);
      await api.post(`/conversations/${selectedConversation}/messages`, {
        content: encryptedText,
      });
      setNewMessage('');
      fetchMessages(selectedConversation);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }) => {
    const isMyMessage = item.author?._id === userId;
    const senderName = isMyMessage ? 'You' : item.author?.name || 'Agent';

    return (
      <View style={[styles.messageContainer, isMyMessage ? styles.myMessage : styles.otherMessage]}>
        <Text style={[styles.messageSender, isMyMessage && styles.myMessageSender]}>{senderName}</Text>
        <Text style={isMyMessage ? styles.myMessageText : styles.messageText}>{item.decryptedContent}</Text>
        <Text style={isMyMessage ? styles.myMessageTime : styles.messageTime}>{new Date(item.createdAt).toLocaleTimeString()}</Text>
      </View>
    );
  };

  const renderConversation = ({ item }) => {
    const friend = item.participants?.find((participant) => participant._id !== userId) || {};
    const preview = item.lastMessage?.content ? decryptText(item.lastMessage.content, item._id) : 'Start a new chat';
    return (
      <TouchableOpacity style={styles.conversationCard} onPress={() => openConversation(item)}>
        <Text style={styles.conversationTitle}>{friend.name || 'Agent'}</Text>
        <Text style={styles.conversationSubtitle}>{item.property?.title || 'Property Chat'}</Text>
        <Text style={styles.conversationPreview}>{preview}</Text>
      </TouchableOpacity>
    );
  };

  if (!selectedConversation) {
    return (
      <View style={styles.container}>
        <Text style={styles.listTitle}>Conversations</Text>
        {loadingConversations ? (
          <ActivityIndicator size="large" style={styles.loadingText} />
        ) : conversations.length === 0 ? (
          <Text style={styles.emptyText}>No conversations yet. Open a property and message the agent.</Text>
        ) : (
          <FlatList
            data={conversations}
            renderItem={renderConversation}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.conversationList}
          />
        )}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 100}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setSelectedConversation(null)}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.chatTitle}>{partner?.name || 'Agent Chat'}</Text>
          <Text style={styles.chatSubtitle}>{property?.title || 'Property conversation'}</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" style={styles.loadingText} />
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          placeholderTextColor="#64748B"
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage} disabled={sending || !newMessage.trim()}>
          <Text style={styles.sendButtonText}>{sending ? 'Sending...' : 'Send'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  listTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: 24,
    marginHorizontal: 16,
    color: '#0F172A',
  },
  loadingText: {
    marginTop: 32,
    textAlign: 'center',
    color: '#64748B',
    fontSize: 16,
  },
  emptyText: {
    marginTop: 32,
    textAlign: 'center',
    color: '#64748B',
    fontSize: 16,
  },
  conversationList: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  conversationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  conversationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  conversationSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 6,
  },
  conversationPreview: {
    fontSize: 14,
    color: '#334155',
  },
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    fontSize: 16,
    color: '#2563EB',
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  chatTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  chatSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 0,
  },
  messageContainer: {
    maxWidth: '80%',
    padding: 14,
    borderRadius: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#2563EB',
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  messageSender: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
    color: '#0F172A',
  },
  myMessageSender: {
    color: '#DDE9FF',
  },
  messageText: {
    fontSize: 16,
    marginBottom: 4,
    color: '#334155',
  },
  myMessageText: {
    fontSize: 16,
    marginBottom: 4,
    color: '#FFFFFF',
  },
  messageTime: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'right',
    marginTop: 2,
  },
  myMessageTime: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
    marginTop: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 16,
    color: '#0F172A',
  },
  sendButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
});
export default ChatScreen;