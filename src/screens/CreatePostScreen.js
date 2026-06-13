import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import api from '../services/api';

const CreatePostScreen = () => {
  const [text, setText] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const handleSubmit = async () => {
    try {
      await api.post('/posts', { text, imageUrl });
      Alert.alert('Success', 'Post created');
      setText('');
      setImageUrl('');
    } catch (err) {
      Alert.alert('Error', 'Failed to create post');
    }
  };

  return (
    <View style={styles.container}>
      <Text>Create Post</Text>
      <TextInput placeholder="Text" value={text} onChangeText={setText} style={styles.input} multiline />
      <TextInput placeholder="Image URL (optional)" value={imageUrl} onChangeText={setImageUrl} style={styles.input} />
      <Button title="Submit" onPress={handleSubmit} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  input: { borderWidth: 1, marginBottom: 10, padding: 10 },
});

export default CreatePostScreen;