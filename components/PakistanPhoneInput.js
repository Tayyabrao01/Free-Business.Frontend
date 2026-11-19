import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import CountryPicker from 'react-native-country-picker-modal';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

const PAKISTAN = {
  cca2: 'PK',
  callingCode: ['92'],
  name: 'Pakistan',
};

export const getCountryPhoneNumber = (value, countryCode = 'PK') => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (raw.startsWith('+')) {
    return parsePhoneNumberFromString(raw)?.number || '';
  }
  return parsePhoneNumberFromString(raw, countryCode)?.number || '';
};

export const isValidCountryPhone = (value, countryCode = 'PK') => {
  const phone = getCountryPhoneNumber(value, countryCode);
  return Boolean(phone && parsePhoneNumberFromString(phone)?.isValid());
};

const PakistanPhoneInput = ({
  value,
  onChangeValue,
  onChangeCountry,
  country = PAKISTAN,
  placeholder = '3001234567',
  placeholderTextColor = '#888',
  style,
  inputStyle,
  testID,
}) => {
  const [pickerVisible, setPickerVisible] = useState(false);
  const selectedCountry = country || PAKISTAN;
  const callingCode = selectedCountry.callingCode?.[0] || '92';

  const handleChange = text => {
    onChangeValue(text.replace(/[^\d]/g, ''));
  };

  const handleCountrySelect = nextCountry => {
    setPickerVisible(false);
    onChangeCountry?.(nextCountry);
  };

  return (
    <View style={[styles.row, style]}>
      <TouchableOpacity
        style={styles.prefixBox}
        onPress={() => setPickerVisible(true)}
        activeOpacity={0.8}
      >
        <CountryPicker
          countryCode={selectedCountry.cca2}
          withFilter
          withFlag
          withCallingCode={false}
          visible={pickerVisible}
          onSelect={handleCountrySelect}
          onClose={() => setPickerVisible(false)}
        />
        <Text style={styles.prefixText}>+{callingCode}</Text>
      </TouchableOpacity>
      <TextInput
        testID={testID}
        style={[styles.input, inputStyle]}
        placeholder={placeholder}
        placeholderTextColor={placeholderTextColor}
        value={value}
        onChangeText={handleChange}
        keyboardType="phone-pad"
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
    flexDirection: 'row',
    alignItems: 'center',
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
    marginLeft: 6,
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
