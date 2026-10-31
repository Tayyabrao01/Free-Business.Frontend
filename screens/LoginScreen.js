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
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Svg, { Defs, LinearGradient as SvgGradient, Stop, Rect } from 'react-native-svg';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../hooks/useTranslation';
import LanguageToggle from '../components/LanguageToggle';
import { markHasRegistered } from '../services/OnboardingService';

const { width } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { t } = useTranslation();

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert(t('common.error'), t('login.fillAllFields'));
      return;
    }

    setLoading(true);
    const result = await login(email.trim(), password);
    setLoading(false);

    if (result.success) {
      await markHasRegistered().catch(() => {});
    } else {
      Alert.alert(t('login.loginFailed'), result.error);
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
            source={require('../assets/auth/auth_login_hero.jpg')}
            style={styles.heroImage}
            resizeMode="cover"
          />

          <Svg style={StyleSheet.absoluteFill}>
            <Defs>
              <SvgGradient id="loginFade" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#0A0A0E" stopOpacity="0.2" />
                <Stop offset="45%" stopColor="#0A0A0E" stopOpacity="0.5" />
                <Stop offset="75%" stopColor="#0A0A0E" stopOpacity="0.9" />
                <Stop offset="100%" stopColor="#0A0A0E" stopOpacity="1" />
              </SvgGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#loginFade)" />
          </Svg>

          {/* Top Bar with Language Toggle */}
          <View style={styles.topBar}>
            <View style={styles.portalPill}>
              <Ionicons name="sparkles" size={13} color="#D4AF37" />
              <Text style={styles.portalPillText}>EXECUTIVE PORTAL</Text>
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
          <Text style={styles.brandTitle}>{t('login.appTitle') || 'FREE BUSINESS'}</Text>
          <Text style={styles.brandTagline}>
            {t('login.subtitle') || 'Real Estate & Business Network'}
          </Text>
          <View style={styles.titleDivider}>
            <View style={styles.goldLine} />
            <Ionicons name="shield-checkmark" size={14} color="#D4AF37" />
            <View style={styles.goldLine} />
          </View>
        </View>

        {/* LOGIN INPUT CARD */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="log-in-outline" size={18} color="#D4AF37" />
            <Text style={styles.cardHeaderText}>SIGN IN TO YOUR ACCOUNT</Text>
          </View>

          {/* EMAIL INPUT */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('login.email').toUpperCase()}</Text>
            <View style={styles.inputBox}>
              <Ionicons name="mail-outline" size={18} color="#D4AF37" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder={t('login.email')}
                placeholderTextColor="#555566"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* PASSWORD INPUT */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('login.password').toUpperCase()}</Text>
            <View style={styles.inputBox}>
              <Ionicons name="lock-closed-outline" size={18} color="#D4AF37" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder={t('login.password')}
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

          {/* FORGOT PASSWORD LINK */}
          <TouchableOpacity
            style={styles.forgotPassBtn}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Ionicons name="key-outline" size={14} color="#8E8E9F" />
            <Text style={styles.forgotPassText}>{t('password.forgotLink')}</Text>
          </TouchableOpacity>

          {/* SIGN IN BUTTON */}
          <TouchableOpacity
            style={styles.signInButton}
            activeOpacity={0.8}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#0A0A0E" size="small" />
            ) : (
              <>
                <Ionicons name="log-in" size={18} color="#0A0A0E" />
                <Text style={styles.signInButtonText}>{t('login.loginButton')}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* SWITCH TO REGISTER CARD */}
        <View style={styles.registerPromptCard}>
          <Text style={styles.registerPromptText}>Don't have an account yet?</Text>
          <TouchableOpacity
            style={styles.registerButton}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Register')}
          >
            <Ionicons name="person-add-outline" size={16} color="#D4AF37" />
            <Text style={styles.registerButtonText}>
              {t('login.noAccount') || 'Create New Account'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* TRUST BADGE FOOTER */}
        <View style={styles.trustFooter}>
          <View style={styles.trustRow}>
            <Ionicons name="shield-checkmark-outline" size={13} color="#6B6B7F" />
            <Text style={styles.trustText}>Official Free Business IK App • 256-bit Encrypted</Text>
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
  portalPill: {
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
  portalPillText: {
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

  /* LOGIN CARD */
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
    marginBottom: 20,
  },
  cardHeaderText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: '#D4AF37',
  },
  inputGroup: {
    marginBottom: 16,
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
  forgotPassBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    marginTop: 2,
    marginBottom: 20,
  },
  forgotPassText: {
    fontSize: 13,
    color: '#8E8E9F',
    fontWeight: '600',
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#D4AF37',
    paddingVertical: 15,
    borderRadius: 16,
    elevation: 3,
  },
  signInButtonText: {
    color: '#0A0A0E',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  /* REGISTER SWITCH CARD */
  registerPromptCard: {
    backgroundColor: '#141419',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#23232C',
    alignItems: 'center',
  },
  registerPromptText: {
    fontSize: 13,
    color: '#8E8E9F',
    marginBottom: 12,
  },
  registerButton: {
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
  registerButtonText: {
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

export default LoginScreen;
