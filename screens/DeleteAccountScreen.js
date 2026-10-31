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
  StatusBar,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
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
        <Text style={styles.headerTitle}>{t('legal.deleteAccountTitle')}</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.dangerBadge}>
          <View style={styles.dangerIconBox}>
            <Ionicons name="warning-outline" size={32} color="#EF4444" />
          </View>
          <Text style={styles.dangerTitle}>Permanent Account Deletion</Text>
          <Text style={styles.dangerWarning}>{t('legal.deleteAccountWarning')}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>{t('legal.enterPassword')}</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={18} color="#8E8E9F" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder={t('legal.passwordPlaceholder')}
              placeholderTextColor="#555566"
              autoCapitalize="none"
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.deleteBtn, loading && styles.disabled]}
          activeOpacity={0.8}
          onPress={handleDelete}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
              <Text style={styles.deleteBtnText}>{t('legal.deleteAccountAction')}</Text>
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
  dangerBadge: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 10,
  },
  dangerIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  dangerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#EF4444',
    letterSpacing: 0.3,
  },
  dangerWarning: {
    fontSize: 13,
    color: '#8E8E9F',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    maxWidth: 300,
  },
  card: {
    backgroundColor: '#141419',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8E8E9F',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E0E14',
    borderWidth: 1,
    borderColor: '#282834',
    borderRadius: 14,
    paddingHorizontal: 14,
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
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EF4444',
    paddingVertical: 15,
    borderRadius: 16,
    elevation: 3,
  },
  disabled: {
    opacity: 0.6,
  },
  deleteBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.3,
  },
});

export default DeleteAccountScreen;
