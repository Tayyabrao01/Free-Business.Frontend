import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useTranslation } from '../hooks/useTranslation';
import { getApiErrorMessage } from '../utils/apiError';

const EditProfileScreen = ({ navigation }) => {
  const { user, setUser } = useAuth();
  const { t } = useTranslation();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    if (!name || !email) {
      Alert.alert(t('common.error'), t('common.fillAllFields'));
      return;
    }

    setLoading(true);
    try {
      const response = await api.put('/users/profile', { name, email });
      setUser(response.data.user);
      Alert.alert(t('common.success'), t('editProfile.updatedSuccess'));
      navigation.goBack();
    } catch (error) {
      Alert.alert(t('common.error'), getApiErrorMessage(error, t('common.updateFailed')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('editProfile.title')}</Text>

      <Text style={styles.label}>{t('editProfile.fullName')}</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder={t('editProfile.namePlaceholder')}
        placeholderTextColor="#888"
      />

      <Text style={styles.label}>{t('editProfile.email')}</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder={t('editProfile.emailPlaceholder')}
        placeholderTextColor="#888"
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TouchableOpacity style={styles.updateButton} onPress={handleUpdate} disabled={loading}>
        <Text style={styles.updateButtonText}>
          {loading ? t('editProfile.updating') : t('editProfile.updateButton')}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#000000' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 30, color: '#D4AF37' },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 5, color: '#D4AF37' },
  input: { borderWidth: 1, borderColor: '#D4AF37', padding: 12, marginBottom: 20, borderRadius: 8, fontSize: 16, backgroundColor: '#1a1a1a', color: '#D4AF37' },
  updateButton: { backgroundColor: '#D4AF37', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  updateButtonText: { color: '#000000', fontSize: 18, fontWeight: '600' },
});

export default EditProfileScreen;
