import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useTranslation } from '../hooks/useTranslation';
import PasswordInput from '../components/PasswordInput';
import { resetPassword } from '../services/authApi';
import { getApiErrorMessage } from '../utils/apiError';

const ResetPasswordScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState(route.params?.email || '');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !code || !newPassword) {
      Alert.alert(t('common.error'), t('common.fillAllFields'));
      return;
    }
    setLoading(true);
    try {
      const response = await resetPassword(email.trim().toLowerCase(), code.trim(), newPassword);
      Alert.alert(t('common.success'), response.data.message || t('password.resetSuccess'));
      navigation.navigate('Login');
    } catch (error) {
      Alert.alert(t('common.error'), getApiErrorMessage(error, t('password.resetFailed')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>{t('password.resetTitle')}</Text>
      <Text style={styles.subtitle}>{t('password.resetHint')}</Text>

      <TextInput
        style={styles.input}
        placeholder={t('login.email')}
        placeholderTextColor="#888"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder={t('password.resetCode')}
        placeholderTextColor="#888"
        value={code}
        onChangeText={setCode}
        keyboardType="number-pad"
        maxLength={6}
      />
      <PasswordInput
        placeholder={t('password.newPassword')}
        placeholderTextColor="#888"
        value={newPassword}
        onChangeText={setNewPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.buttonText}>{t('password.resetButton')}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>{t('login.loginButton')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, backgroundColor: '#000', justifyContent: 'center' },
  title: { fontSize: 26, fontWeight: 'bold', color: '#D4AF37', marginBottom: 10 },
  subtitle: { color: '#888', marginBottom: 24, lineHeight: 22 },
  input: {
    borderWidth: 1,
    borderColor: '#D4AF37',
    borderRadius: 8,
    padding: 14,
    color: '#D4AF37',
    backgroundColor: '#1a1a1a',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#D4AF37',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: '#000', fontWeight: '700', fontSize: 16 },
  link: { color: '#D4AF37', textAlign: 'center', marginTop: 20 },
});

export default ResetPasswordScreen;
