import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

class PostDetailErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[post-detail] render error:', {
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <View style={styles.container}>
        <Text style={styles.title}>Unable to open this post</Text>
        <Text style={styles.message}>
          This post contains data the app could not display. Please try again.
        </Text>
        <TouchableOpacity style={styles.button} onPress={this.handleRetry}>
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0A0E',
    padding: 24,
  },
  title: { color: '#D4AF37', fontSize: 20, fontWeight: '700', marginBottom: 10 },
  message: { color: '#8A8A96', textAlign: 'center', marginBottom: 20 },
  button: { backgroundColor: '#D4AF37', paddingHorizontal: 22, paddingVertical: 11, borderRadius: 8 },
  buttonText: { color: '#0A0A0E', fontWeight: '700' },
});

export default PostDetailErrorBoundary;
