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
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../hooks/useTranslation';
import LanguageToggle from '../components/LanguageToggle';
import PasswordInput from '../components/PasswordInput';
import PakistanPhoneInput from '../components/PakistanPhoneInput';
import { sendPhoneOtp, confirmPhoneOtp, normalizePhone } from '../services/phoneOtpService';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [confirmation, setConfirmation] = useState(null);
  const [mode, setMode] = useState('otp');
  const [loading, setLoading] = useState(false);
  const { login, loginWithOtp } = useAuth();
  const { t } = useTranslation();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t('common.error'), t('login.fillAllFields'));
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (!result.success) {
      Alert.alert(t('login.loginFailed'), result.error);
    }
  };

  const handleSendOtp = async () => {
    const normalized = normalizePhone(phone);
    if (!normalized) {
      Alert.alert(t('common.error'), t('login.phoneRequired'));
      return;
    }

    try {
      setLoading(true);
      const session = await sendPhoneOtp(phone);
      setConfirmation(session);
      Alert.alert(t('common.success'), t('login.otpSent'));
    } catch (error) {
      Alert.alert(t('common.error'), error.message || t('login.otpSendFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!confirmation) {
      Alert.alert(t('common.error'), t('login.otpSessionExpired'));
      return;
    }
    const normalized = normalizePhone(phone);
    try {
      setLoading(true);
      const result = await confirmPhoneOtp(confirmation, otpCode);
      const backendLogin = await loginWithOtp({
        idToken: result.idToken,
        phone: normalized,
        whatsappNumber: normalized,
      });
      if (!backendLogin.success) {
        Alert.alert(t('common.error'), backendLogin.error);
      }
    } catch (error) {
      Alert.alert(t('common.error'), error.message || t('login.otpVerifyFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <LanguageToggle />

      <Text style={styles.title}>{t('login.appTitle')}</Text>
      <Text style={styles.subtitle}>{t('login.subtitle')}</Text>

      <View style={styles.modeRow}>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'otp' && styles.modeBtnActive]}
          onPress={() => setMode('otp')}
        >
          <Text style={[styles.modeText, mode === 'otp' && styles.modeTextActive]}>
            {t('login.otpMode')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'password' && styles.modeBtnActive]}
          onPress={() => setMode('password')}
        >
          <Text style={[styles.modeText, mode === 'password' && styles.modeTextActive]}>
            {t('login.passwordMode')}
          </Text>
        </TouchableOpacity>
      </View>

      {mode === 'password' ? (
        <>
          <TextInput
            style={styles.input}
            placeholder={t('login.email')}
            placeholderTextColor="#888"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <PasswordInput
            placeholder={t('login.password')}
            placeholderTextColor="#888"
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#000000" />
            ) : (
              <Text style={styles.buttonText}>{t('login.loginButton')}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={styles.forgotLink}>{t('password.forgotLink')}</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <PakistanPhoneInput
            value={phone}
            onChangeValue={setPhone}
            placeholder={t('login.phoneLocalPlaceholder')}
          />
          <Text style={styles.hint}>{t('login.phonePkHint')}</Text>
          <TouchableOpacity style={styles.buttonSecondary} onPress={handleSendOtp} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#D4AF37" />
            ) : (
              <Text style={styles.buttonSecondaryText}>{t('login.sendOtp')}</Text>
            )}
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder={t('login.otpCode')}
            placeholderTextColor="#888"
            value={otpCode}
            onChangeText={setOtpCode}
            keyboardType="number-pad"
          />

          <TouchableOpacity style={styles.button} onPress={handleVerifyOtp} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#000000" />
            ) : (
              <Text style={styles.buttonText}>{t('login.verifyOtp')}</Text>
            )}
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.linkText}>{t('login.noAccount')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#000000',
  },
  modeRow: {
    flexDirection: 'row',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 10,
    overflow: 'hidden',
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
  },
  modeBtnActive: { backgroundColor: '#D4AF37' },
  modeText: { color: '#D4AF37', fontWeight: '600' },
  modeTextActive: { color: '#000' },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#D4AF37',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#888',
  },
  hint: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 12,
    marginTop: -6,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D4AF37',
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: '#1a1a1a',
    color: '#D4AF37',
  },
  button: {
    backgroundColor: '#D4AF37',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonSecondary: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D4AF37',
    marginBottom: 15,
    alignItems: 'center',
  },
  buttonSecondaryText: { color: '#D4AF37', fontWeight: '700' },
  buttonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '600',
  },
  linkText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#D4AF37',
    fontSize: 16,
  },
  forgotLink: {
    textAlign: 'center',
    marginTop: 14,
    color: '#888888',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;
