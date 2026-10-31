import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StatusBar,
  ScrollView,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
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
    if (!name.trim() || !email.trim()) {
      Alert.alert(t('common.error'), t('common.fillAllFields'));
      return;
    }

    setLoading(true);
    try {
      const response = await api.put('/users/profile', {
        name: name.trim(),
        email: email.trim(),
      });
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
        <Text style={styles.headerTitle}>{t('editProfile.title')}</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.heroBadge}>
          <Ionicons name="person-circle-outline" size={48} color="#D4AF37" />
          <Text style={styles.badgeTitle}>Personal Information</Text>
          <Text style={styles.badgeSubtitle}>
            Update your public executive name and verified email address.
          </Text>
        </View>

        <View style={styles.formCard}>
          {/* FULL NAME */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('editProfile.fullName')}</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={18} color="#D4AF37" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder={t('editProfile.namePlaceholder')}
                placeholderTextColor="#555566"
              />
            </View>
          </View>

          {/* EMAIL */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('editProfile.email')}</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={18} color="#D4AF37" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder={t('editProfile.emailPlaceholder')}
                placeholderTextColor="#555566"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>
        </View>

        {/* SAVE BUTTON */}
        <TouchableOpacity
          style={styles.updateButton}
          activeOpacity={0.8}
          onPress={handleUpdate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#0A0A0E" size="small" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color="#0A0A0E" />
              <Text style={styles.updateButtonText}>
                {t('editProfile.updateButton')}
              </Text>
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
    marginBottom: 18,
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
    fontWeight: '500',
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#D4AF37',
    paddingVertical: 15,
    borderRadius: 16,
    elevation: 3,
  },
  updateButtonText: {
    color: '#0A0A0E',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});

export default EditProfileScreen;
