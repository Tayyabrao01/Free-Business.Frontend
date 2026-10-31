import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  StatusBar,
  ScrollView,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from '../hooks/useTranslation';
import PasswordInput from '../components/PasswordInput';
import { changePassword } from '../services/authApi';
import { getApiErrorMessage } from '../utils/apiError';

const ChangePasswordScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert(t('common.error'), t('common.fillAllFields'));
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert(t('common.error'), t('password.mismatch'));
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert(t('common.error'), t('register.passwordMinLength'));
      return;
    }

    setLoading(true);
    try {
      const response = await changePassword(currentPassword, newPassword);
      Alert.alert(t('common.success'), response.data.message || t('password.changeSuccess'));
      navigation.goBack();
    } catch (error) {
      Alert.alert(t('common.error'), getApiErrorMessage(error, t('password.changeFailed')));
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
        <Text style={styles.headerTitle}>{t('password.changeTitle')}</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.heroBadge}>
          <Ionicons name="shield-checkmark-outline" size={48} color="#D4AF37" />
          <Text style={styles.badgeTitle}>Account Security</Text>
          <Text style={styles.badgeSubtitle}>
            Update your login credentials. Your new password must be at least 6 characters long.
          </Text>
        </View>

        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('password.currentPassword')}</Text>
            <PasswordInput
              placeholder={t('password.currentPassword')}
              placeholderTextColor="#555566"
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('password.newPassword')}</Text>
            <PasswordInput
              placeholder={t('password.newPassword')}
              placeholderTextColor="#555566"
              value={newPassword}
              onChangeText={setNewPassword}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('password.confirmPassword')}</Text>
            <PasswordInput
              placeholder={t('password.confirmPassword')}
              placeholderTextColor="#555566"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>
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
              <Ionicons name="key-outline" size={18} color="#0A0A0E" />
              <Text style={styles.buttonText}>{t('password.changeButton')}</Text>
            </>
          )}
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
  badgeTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 10,
    letterSpacing: 0.3,
  },
  badgeSubtitle: {
    fontSize: 12,
    color: '#8E8E9F',
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 280,
    lineHeight: 18,
  },
  formCard: {
    backgroundColor: '#141419',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#23232C',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8E8E9F',
    marginBottom: 8,
    letterSpacing: 0.5,
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
});

export default ChangePasswordScreen;
