import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const PasswordInput = ({ style, ...props }) => {
  const [visible, setVisible] = useState(false);

  return (
    <View style={[styles.wrap, style]}>
      <TextInput
        {...props}
        style={[styles.input, props.style]}
        secureTextEntry={!visible}
      />
      <TouchableOpacity
        style={styles.eyeBtn}
        onPress={() => setVisible((v) => !v)}
        accessibilityLabel={visible ? 'Hide password' : 'Show password'}
      >
        <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={22} color="#D4AF37" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D4AF37',
    padding: 15,
    paddingRight: 48,
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: '#1a1a1a',
    color: '#D4AF37',
    marginBottom: 0,
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    top: 14,
    padding: 4,
  },
});

export default PasswordInput;
