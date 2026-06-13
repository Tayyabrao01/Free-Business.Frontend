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
import { forgotPassword } from '../services/authApi';
import { getApiErrorMessage } from '../utils/apiError';

const ForgotPasswordScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      Alert.alert(t('common.error'), t('login.fillAllFields'));
      return;
    }
    setLoading(true);
    try {
      const response = await forgotPassword(email.trim().toLowerCase());
      Alert.alert(t('common.success'), response.data.message || t('password.resetEmailSent'));
      navigation.navigate('ResetPassword', { email: email.trim().toLowerCase() });
    } catch (error) {
      Alert.alert(t('common.error'), getApiErrorMessage(error, t('password.resetRequestFailed')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>{t('password.forgotTitle')}</Text>
      <Text style={styles.subtitle}>{t('password.forgotHint')}</Text>

      <TextInput
        style={styles.input}
        placeholder={t('login.email')}
        placeholderTextColor="#888"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.buttonText}>{t('password.sendResetCode')}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.link}>{t('common.back')}</Text>
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
  },
  buttonText: { color: '#000', fontWeight: '700', fontSize: 16 },
  link: { color: '#D4AF37', textAlign: 'center', marginTop: 20 },
});

export default ForgotPasswordScreen;
