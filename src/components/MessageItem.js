import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const MessageItem = ({ message }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.sender}>{message.sender}: </Text>
      <Text style={styles.text}>{message.text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#ccc' },
  sender: { fontWeight: 'bold' },
  text: { fontSize: 16 },
});

export default MessageItem;