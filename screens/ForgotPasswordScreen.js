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
  StatusBar,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0E" />

      {/* TOP HEADER */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={20} color="#D4AF37" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('password.forgotTitle')}</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroBadge}>
          <View style={styles.iconBox}>
            <Ionicons name="key-outline" size={36} color="#D4AF37" />
          </View>
          <Text style={styles.badgeTitle}>Password Recovery</Text>
          <Text style={styles.badgeSubtitle}>{t('password.forgotHint')}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>{t('login.email').toUpperCase()}</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={18} color="#D4AF37" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={t('login.email')}
              placeholderTextColor="#555566"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.8}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#0A0A0E" size="small" />
            ) : (
              <>
                <Ionicons name="paper-plane-outline" size={18} color="#0A0A0E" />
                <Text style={styles.buttonText}>{t('password.sendResetCode')}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.backLink}
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back-outline" size={16} color="#D4AF37" />
          <Text style={styles.backLinkText}>{t('common.back')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0E',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A22',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#141419',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  heroBadge: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 10,
  },
  iconBox: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    marginBottom: 12,
  },
  badgeTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  badgeSubtitle: {
    fontSize: 13,
    color: '#8E8E9F',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
    maxWidth: 290,
  },
  card: {
    backgroundColor: '#141419',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#23232C',
    marginBottom: 20,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8E8E9F',
    marginBottom: 8,
    letterSpacing: 0.8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E0E14',
    borderWidth: 1,
    borderColor: '#282834',
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 13,
    color: '#FFFFFF',
    fontSize: 15,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#D4AF37',
    paddingVertical: 15,
    borderRadius: 16,
    elevation: 3,
  },
  buttonText: {
    color: '#0A0A0E',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  backLinkText: {
    color: '#D4AF37',
    fontWeight: '700',
    fontSize: 14,
  },
});

export default ForgotPasswordScreen;
