import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../hooks/useTranslation';
import { getApiErrorMessage } from '../utils/apiError';

const DeleteAccountScreen = ({ navigation }) => {
  const { logout } = useAuth();
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDelete = () => {
    Alert.alert(t('legal.deleteAccountTitle'), t('legal.deleteAccountConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('legal.deleteAccountAction'),
        style: 'destructive',
        onPress: async () => {
          if (!password.trim()) {
            Alert.alert(t('common.error'), t('legal.passwordRequired'));
            return;
          }

          setLoading(true);
          try {
            await api.delete('/users/account', { data: { password } });
            await logout();
            Alert.alert(t('common.success'), t('legal.deleteAccountSuccess'));
          } catch (error) {
            Alert.alert(t('common.error'), getApiErrorMessage(error, t('legal.deleteAccountFailed')));
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.back}>{t('common.back')}</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{t('legal.deleteAccountTitle')}</Text>
      <Text style={styles.warning}>{t('legal.deleteAccountWarning')}</Text>

      <Text style={styles.label}>{t('legal.enterPassword')}</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder={t('legal.passwordPlaceholder')}
        placeholderTextColor="#666"
        autoCapitalize="none"
      />

      <TouchableOpacity
        style={[styles.deleteBtn, loading && styles.disabled]}
        onPress={handleDelete}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.deleteBtnText}>{t('legal.deleteAccountAction')}</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  content: { padding: 20, paddingTop: 50 },
  back: { color: '#D4AF37', fontWeight: '600', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#ff6b6b', marginBottom: 12 },
  warning: { fontSize: 15, color: '#cccccc', lineHeight: 22, marginBottom: 24 },
  label: { color: '#D4AF37', fontWeight: '600', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#D4AF37',
    borderRadius: 8,
    padding: 12,
    color: '#ffffff',
    backgroundColor: '#1a1a1a',
    marginBottom: 24,
  },
  deleteBtn: {
    backgroundColor: '#c0392b',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabled: { opacity: 0.7 },
  deleteBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
});

export default DeleteAccountScreen;
