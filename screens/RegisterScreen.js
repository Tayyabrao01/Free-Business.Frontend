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
  Image,
  StatusBar,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Svg, { Defs, LinearGradient as SvgGradient, Stop, Rect } from 'react-native-svg';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../hooks/useTranslation';
import LanguageToggle from '../components/LanguageToggle';
import PakistanPhoneInput from '../components/PakistanPhoneInput';
import { normalizePhone } from '../services/phoneOtpService';
import { REFERRAL_ENABLED } from '../config/features';
import { markHasRegistered } from '../services/OnboardingService';

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

    if (result.success) {
      await markHasRegistered().catch(() => {});
    } else {
      Alert.alert(t('register.registrationFailed'), result.error);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0E" translucent />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* HERO IMAGE & FADE GRADIENT */}
        <View style={styles.heroContainer}>
          <Image
            source={require('../assets/auth/auth_register_hero.jpg')}
            style={styles.heroImage}
            resizeMode="cover"
          />

          <Svg style={StyleSheet.absoluteFill}>
            <Defs>
              <SvgGradient id="registerFade" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#0A0A0E" stopOpacity="0.2" />
                <Stop offset="45%" stopColor="#0A0A0E" stopOpacity="0.5" />
                <Stop offset="75%" stopColor="#0A0A0E" stopOpacity="0.9" />
                <Stop offset="100%" stopColor="#0A0A0E" stopOpacity="1" />
              </SvgGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#registerFade)" />
          </Svg>

          {/* Top Bar with Language Toggle */}
          <View style={styles.topBar}>
            <View style={styles.vipBadge}>
              <Ionicons name="key" size={13} color="#D4AF37" />
              <Text style={styles.vipBadgeText}>NEW MEMBERSHIP</Text>
            </View>

            <LanguageToggle style={styles.langToggleStyle} />
          </View>

          {/* Official Free Business Logo */}
          <View style={styles.logoWrapper}>
            <View style={styles.logoHalo}>
              <Image
                source={require('../assets/logo-free-business-ik.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
          </View>
        </View>

        {/* BRAND IDENTITY TITLES */}
        <View style={styles.brandTitleContainer}>
          <Text style={styles.brandTitle}>JOIN FREE BUSINESS</Text>
          <Text style={styles.brandTagline}>
            {t('register.title') || 'Create Your Executive Investor Account'}
          </Text>
          <View style={styles.titleDivider}>
            <View style={styles.goldLine} />
            <Ionicons name="sparkles" size={14} color="#D4AF37" />
            <View style={styles.goldLine} />
          </View>
        </View>

        {/* REGISTRATION FORM CARD */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="person-add-outline" size={18} color="#D4AF37" />
            <Text style={styles.cardHeaderText}>INVESTOR REGISTRATION</Text>
          </View>

          <View style={styles.infoNotice}>
            <Ionicons name="information-circle-outline" size={16} color="#D4AF37" />
            <Text style={styles.infoNoticeText}>
              {t('register.emailOtpHint') || 'Email verification OTP is required to activate your verified account.'}
            </Text>
          </View>

          {/* FULL NAME */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('register.fullName').toUpperCase()} *</Text>
            <View style={styles.inputBox}>
              <Ionicons name="person-outline" size={18} color="#D4AF37" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder={t('register.fullName')}
                placeholderTextColor="#555566"
                value={name}
                onChangeText={setName}
              />
            </View>
          </View>

          {/* EMAIL */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('register.email').toUpperCase()} *</Text>
            <View style={styles.inputBox}>
              <Ionicons name="mail-outline" size={18} color="#D4AF37" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder={t('register.email')}
                placeholderTextColor="#555566"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* PASSWORD */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('login.password').toUpperCase()} * (MIN. 6 CHARS)</Text>
            <View style={styles.inputBox}>
              <Ionicons name="lock-closed-outline" size={18} color="#D4AF37" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder={t('register.passwordHint')}
                placeholderTextColor="#555566"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword((v) => !v)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={19}
                  color="#8E8E9F"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* MOBILE NUMBER */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('register.phoneOptional').toUpperCase()}</Text>
            <PakistanPhoneInput
              value={phone}
              onChangeValue={setPhone}
              placeholder={t('login.phoneLocalPlaceholder') || '3001234567'}
              style={styles.phoneInputRow}
            />
          </View>

          {/* FREE BUSINESS NUMBER / WHATSAPP */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('register.freeBusinessNumberOptional').toUpperCase()}</Text>
            <PakistanPhoneInput
              value={whatsappNumber}
              onChangeValue={setWhatsappNumber}
              placeholder={t('login.phoneLocalPlaceholder') || '3001234567'}
              style={styles.phoneInputRow}
            />
          </View>

          {/* CITY / LOCATION */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('register.location').toUpperCase()}</Text>
            <View style={styles.inputBox}>
              <Ionicons name="location-outline" size={18} color="#D4AF37" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder={t('register.location')}
                placeholderTextColor="#555566"
                value={location}
                onChangeText={setLocation}
              />
            </View>
          </View>

          {/* REFERRAL CODE (IF ENABLED) */}
          {REFERRAL_ENABLED ? (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('rewards.referralCodeOptional').toUpperCase()}</Text>
              <View style={styles.inputBox}>
                <Ionicons name="gift-outline" size={18} color="#D4AF37" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder={t('rewards.referralCodeOptional')}
                  placeholderTextColor="#555566"
                  value={referralCode}
                  onChangeText={setReferralCode}
                  autoCapitalize="characters"
                />
              </View>
            </View>
          ) : null}

          {/* SEND OTP BUTTON */}
          <TouchableOpacity
            style={[styles.sendOtpButton, otpSent && styles.resendOtpButton]}
            activeOpacity={0.8}
            onPress={handleSendOtp}
            disabled={loading}
          >
            {loading && !otpSent ? (
              <ActivityIndicator color={otpSent ? '#D4AF37' : '#0A0A0E'} size="small" />
            ) : (
              <>
                <Ionicons
                  name={otpSent ? 'refresh-outline' : 'paper-plane-outline'}
                  size={16}
                  color={otpSent ? '#D4AF37' : '#0A0A0E'}
                />
                <Text style={[styles.sendOtpButtonText, otpSent && styles.resendOtpButtonText]}>
                  {otpSent ? t('register.resendEmailOtp') : t('register.sendEmailOtp')}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* OTP VERIFICATION SECTION */}
          {otpSent ? (
            <View style={styles.otpCardSection}>
              <View style={styles.otpHeader}>
                <Ionicons name="shield-checkmark" size={16} color="#10B981" />
                <Text style={styles.otpHeaderTitle}>ENTER 6-DIGIT VERIFICATION CODE</Text>
              </View>

              <View style={styles.inputBox}>
                <Ionicons name="keypad-outline" size={18} color="#10B981" style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, styles.otpTextInput]}
                  placeholder={t('register.emailOtpCode')}
                  placeholderTextColor="#555566"
                  value={otpCode}
                  onChangeText={setOtpCode}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </View>

              <TouchableOpacity
                style={styles.verifyButton}
                activeOpacity={0.8}
                onPress={handleVerifyAndRegister}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#0A0A0E" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={18} color="#0A0A0E" />
                    <Text style={styles.verifyButtonText}>
                      {t('register.verifyAndRegister')}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        {/* SWITCH TO LOGIN CARD */}
        <View style={styles.loginPromptCard}>
          <Text style={styles.loginPromptText}>Already have a registered account?</Text>
          <TouchableOpacity
            style={styles.loginButton}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Login')}
          >
            <Ionicons name="log-in-outline" size={16} color="#D4AF37" />
            <Text style={styles.loginButtonText}>
              {t('register.hasAccount') || 'Sign In to Your Account'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* TRUST BADGE FOOTER */}
        <View style={styles.trustFooter}>
          <View style={styles.trustRow}>
            <Ionicons name="shield-checkmark-outline" size={13} color="#6B6B7F" />
            <Text style={styles.trustText}>Official Free Business IK App • Verified Investor Network</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0E',
  },
  scrollContent: {
    paddingBottom: 40,
  },

  /* HERO BANNER */
  heroContainer: {
    height: 250,
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  topBar: {
    position: 'absolute',
    top: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : 20,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  vipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(10, 10, 14, 0.75)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
  },
  vipBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D4AF37',
    letterSpacing: 1,
  },
  langToggleStyle: {
    position: 'relative',
    top: 0,
    right: 0,
    backgroundColor: 'rgba(10, 10, 14, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },

  /* OFFICIAL LOGO BADGE */
  logoWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoHalo: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: '#0A0A0E',
    borderWidth: 2.5,
    borderColor: '#D4AF37',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 12,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  logoImage: {
    width: 82,
    height: 82,
    borderRadius: 41,
  },

  /* BRAND TITLES */
  brandTitleContainer: {
    alignItems: 'center',
    marginTop: 14,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 2,
    textAlign: 'center',
  },
  brandTagline: {
    fontSize: 13,
    color: '#8E8E9F',
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  titleDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
    width: 140,
  },
  goldLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(212, 175, 55, 0.35)',
  },

  /* REGISTRATION CARD */
  card: {
    backgroundColor: '#141419',
    marginHorizontal: 16,
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: '#23232C',
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  cardHeaderText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: '#D4AF37',
  },
  infoNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    marginBottom: 18,
  },
  infoNoticeText: {
    flex: 1,
    fontSize: 12,
    color: '#D4AF37',
    lineHeight: 17,
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8E8E9F',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E0E14',
    borderWidth: 1,
    borderColor: '#262632',
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    paddingVertical: 13,
    color: '#FFFFFF',
    fontSize: 15,
  },
  eyeBtn: {
    padding: 4,
  },
  phoneInputRow: {
    marginBottom: 0,
  },

  /* SEND OTP BUTTON */
  sendOtpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#D4AF37',
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 6,
    elevation: 3,
  },
  resendOtpButton: {
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    elevation: 0,
  },
  sendOtpButtonText: {
    color: '#0A0A0E',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  resendOtpButtonText: {
    color: '#D4AF37',
  },

  /* OTP SECTION */
  otpCardSection: {
    marginTop: 18,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: '#23232C',
  },
  otpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  otpHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 0.8,
  },
  otpTextInput: {
    letterSpacing: 4,
    fontWeight: '700',
    fontSize: 18,
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#D4AF37',
    paddingVertical: 15,
    borderRadius: 16,
    marginTop: 14,
    elevation: 4,
  },
  verifyButtonText: {
    color: '#0A0A0E',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  /* LOGIN PROMPT CARD */
  loginPromptCard: {
    backgroundColor: '#141419',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#23232C',
    alignItems: 'center',
  },
  loginPromptText: {
    fontSize: 13,
    color: '#8E8E9F',
    marginBottom: 12,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
    width: '100%',
  },
  loginButtonText: {
    color: '#D4AF37',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  /* FOOTER */
  trustFooter: {
    alignItems: 'center',
    marginTop: 24,
    paddingHorizontal: 20,
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trustText: {
    fontSize: 11,
    color: '#555566',
    fontWeight: '500',
  },
});

export default RegisterScreen;
