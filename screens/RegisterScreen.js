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
import { sendPhoneOtp, confirmPhoneOtp, normalizePhone } from '../services/phoneOtpService';

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [confirmation, setConfirmation] = useState(null);
  const [mode, setMode] = useState('otp');
  const [location, setLocation] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, loginWithOtp } = useAuth();
  const { t } = useTranslation();

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !phone.trim() || !whatsappNumber.trim() || !password) {
      Alert.alert(t('common.error'), t('register.fillAllFields'));
      return;
    }

    if (password.length < 6) {
      Alert.alert(t('common.error'), t('register.passwordMinLength'));
      return;
    }

    setLoading(true);
    const result = await register(
      name,
      email,
      phone,
      whatsappNumber,
      password,
      location.trim() || 'Not specified',
      referralCode
    );
    setLoading(false);

    if (!result.success) {
      Alert.alert(t('register.registrationFailed'), result.error);
    }
  };

  const handleSendOtp = async () => {
    if (!name.trim() || !phone.trim() || !whatsappNumber.trim()) {
      Alert.alert(t('common.error'), t('register.fillAllFieldsOtp'));
      return;
    }
    try {
      setLoading(true);
      const session = await sendPhoneOtp(normalizePhone(phone));
      setConfirmation(session);
      Alert.alert(t('common.success'), t('login.otpSent'));
    } catch (error) {
      Alert.alert(t('common.error'), error.message || t('login.otpSendFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterWithOtp = async () => {
    if (!confirmation) {
      Alert.alert(t('common.error'), t('login.otpSessionExpired'));
      return;
    }
    try {
      setLoading(true);
      const otpResult = await confirmPhoneOtp(confirmation, otpCode);
      const result = await loginWithOtp({
        idToken: otpResult.idToken,
        name,
        email,
        phone,
        whatsappNumber,
        location,
        referralCode,
      });
      if (!result.success) {
        Alert.alert(t('register.registrationFailed'), result.error);
      }
    } catch (error) {
      Alert.alert(t('common.error'), error.message || t('login.otpVerifyFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <LanguageToggle />

      <Text style={styles.title}>{t('register.title')}</Text>
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

      <TextInput
        style={styles.input}
        placeholder={t('register.fullName')}
        placeholderTextColor="#888"
        value={name}
        onChangeText={setName}
      />

      <TextInput
        style={styles.input}
        placeholder={t('register.email')}
        placeholderTextColor="#888"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder={t('register.phone')}
        placeholderTextColor="#888"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />

      <TextInput
        style={styles.input}
        placeholder={t('register.freeBusinessNumber')}
        placeholderTextColor="#888"
        value={whatsappNumber}
        onChangeText={setWhatsappNumber}
        keyboardType="phone-pad"
      />

      {mode === 'password' ? (
        <PasswordInput
          placeholder={t('register.passwordHint')}
          placeholderTextColor="#888"
          value={password}
          onChangeText={setPassword}
        />
      ) : null}

      <TextInput
        style={styles.input}
        placeholder={t('register.location')}
        placeholderTextColor="#888"
        value={location}
        onChangeText={setLocation}
      />

      <TextInput
        style={styles.input}
        placeholder={t('rewards.referralCodeOptional')}
        placeholderTextColor="#888"
        value={referralCode}
        onChangeText={setReferralCode}
        autoCapitalize="characters"
      />

      {mode === 'password' ? (
        <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#000000" />
          ) : (
            <Text style={styles.buttonText}>{t('register.registerButton')}</Text>
          )}
        </TouchableOpacity>
      ) : (
        <>
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
          <TouchableOpacity style={styles.button} onPress={handleRegisterWithOtp} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#000000" />
            ) : (
              <Text style={styles.buttonText}>{t('login.verifyOtp')}</Text>
            )}
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.linkText}>{t('register.hasAccount')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#000000',
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: '#000000',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#D4AF37',
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
  button: {
    backgroundColor: '#D4AF37',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '600',
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
  linkText: {
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 24,
    color: '#D4AF37',
    fontSize: 16,
  },
});

export default RegisterScreen;
