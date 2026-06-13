import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
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
      <Text style={styles.title}>{t('password.changeTitle')}</Text>

      <PasswordInput
        placeholder={t('password.currentPassword')}
        placeholderTextColor="#888"
        value={currentPassword}
        onChangeText={setCurrentPassword}
      />
      <PasswordInput
        placeholder={t('password.newPassword')}
        placeholderTextColor="#888"
        value={newPassword}
        onChangeText={setNewPassword}
      />
      <PasswordInput
        placeholder={t('password.confirmPassword')}
        placeholderTextColor="#888"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.buttonText}>{t('password.changeButton')}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#000' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#D4AF37', marginBottom: 24 },
  button: {
    backgroundColor: '#D4AF37',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: { color: '#000', fontWeight: '700', fontSize: 16 },
});

export default ChangePasswordScreen;
