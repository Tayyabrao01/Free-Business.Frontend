import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { formatPkLocalDigits } from '../utils/pakistanPhone';

/**
 * Fixed +92 prefix; user types mobile digits starting with 3 (e.g. 3001234567).
 */
const PakistanPhoneInput = ({
  value,
  onChangeValue,
  placeholder = '3001234567',
  placeholderTextColor = '#888',
  style,
  inputStyle,
  testID,
}) => {
  const handleChange = (text) => {
    onChangeValue(formatPkLocalDigits(text));
  };

  return (
    <View style={[styles.row, style]}>
      <View style={styles.prefixBox}>
        <Text style={styles.prefixText}>+92</Text>
      </View>
      <TextInput
        testID={testID}
        style={[styles.input, inputStyle]}
        placeholder={placeholder}
        placeholderTextColor={placeholderTextColor}
        value={value}
        onChangeText={handleChange}
        keyboardType="phone-pad"
        maxLength={10}
        autoComplete="tel"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  prefixBox: {
    borderWidth: 1,
    borderColor: '#D4AF37',
    borderRightWidth: 0,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 15,
    backgroundColor: '#111111',
  },
  prefixText: {
    color: '#D4AF37',
    fontSize: 16,
    fontWeight: '700',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D4AF37',
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 15,
    fontSize: 16,
    backgroundColor: '#1a1a1a',
    color: '#D4AF37',
  },
});

export default PakistanPhoneInput;
