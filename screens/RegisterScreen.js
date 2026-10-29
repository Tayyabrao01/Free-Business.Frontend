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
import { normalizePhone } from '../services/phoneOtpService';
import { REFERRAL_ENABLED } from '../config/features';

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [location, setLocation] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { sendRegisterOtp, verifyRegisterOtp } = useAuth();
  const { t } = useTranslation();

  const buildPayload = () => ({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password,
    phone: normalizePhone(phone) || '',
    whatsappNumber: normalizePhone(whatsappNumber || phone) || '',
    location: location.trim() || 'Not specified',
    referralCode,
  });

  const validateForm = () => {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert(t('common.error'), t('register.fillRequiredFields'));
      return false;
    }
    if (password.length < 6) {
      Alert.alert(t('common.error'), t('register.passwordMinLength'));
      return false;
    }
    return true;
  };

  const handleSendOtp = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    const result = await sendRegisterOtp(buildPayload());
    setLoading(false);

    if (result.success) {
      setOtpSent(true);
      Alert.alert(t('common.success'), t('register.emailOtpSent'));
    } else {
      Alert.alert(t('common.error'), result.error);
    }
  };

  const handleVerifyAndRegister = async () => {
    if (!otpSent) {
      Alert.alert(t('common.error'), t('register.sendOtpFirst'));
      return;
    }
    if (!otpCode.trim()) {
      Alert.alert(t('common.error'), t('register.enterOtpCode'));
      return;
    }

    setLoading(true);
    const result = await verifyRegisterOtp(email.trim().toLowerCase(), otpCode.trim());
    setLoading(false);

    if (!result.success) {
      Alert.alert(t('register.registrationFailed'), result.error);
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
      <Text style={styles.hint}>{t('register.emailOtpHint')}</Text>

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

      <PasswordInput
        placeholder={t('register.passwordHint')}
        placeholderTextColor="#888"
        value={password}
        onChangeText={setPassword}
      />

      <Text style={styles.fieldLabel}>{t('register.phoneOptional')}</Text>
      <PakistanPhoneInput
        value={phone}
        onChangeValue={setPhone}
        placeholder={t('login.phoneLocalPlaceholder')}
        style={styles.phoneField}
      />

      <Text style={styles.fieldLabel}>{t('register.freeBusinessNumberOptional')}</Text>
      <PakistanPhoneInput
        value={whatsappNumber}
        onChangeValue={setWhatsappNumber}
        placeholder={t('login.phoneLocalPlaceholder')}
        style={styles.phoneField}
      />

      <TextInput
        style={styles.input}
        placeholder={t('register.location')}
        placeholderTextColor="#888"
        value={location}
        onChangeText={setLocation}
      />

      {REFERRAL_ENABLED ? (
        <TextInput
          style={styles.input}
          placeholder={t('rewards.referralCodeOptional')}
          placeholderTextColor="#888"
          value={referralCode}
          onChangeText={setReferralCode}
          autoCapitalize="characters"
        />
      ) : null}

      <TouchableOpacity style={styles.buttonSecondary} onPress={handleSendOtp} disabled={loading}>
        {loading && !otpSent ? (
          <ActivityIndicator color="#D4AF37" />
        ) : (
          <Text style={styles.buttonSecondaryText}>
            {otpSent ? t('register.resendEmailOtp') : t('register.sendEmailOtp')}
          </Text>
        )}
      </TouchableOpacity>

      {otpSent ? (
        <>
          <TextInput
            style={styles.input}
            placeholder={t('register.emailOtpCode')}
            placeholderTextColor="#888"
            value={otpCode}
            onChangeText={setOtpCode}
            keyboardType="number-pad"
          />
          <TouchableOpacity style={styles.button} onPress={handleVerifyAndRegister} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#000000" />
            ) : (
              <Text style={styles.buttonText}>{t('register.verifyAndRegister')}</Text>
            )}
          </TouchableOpacity>
        </>
      ) : null}

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
    marginBottom: 8,
    color: '#D4AF37',
  },
  hint: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  fieldLabel: {
    color: '#D4AF37',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  phoneField: {
    marginBottom: 12,
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
