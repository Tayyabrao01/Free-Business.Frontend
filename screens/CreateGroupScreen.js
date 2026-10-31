import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from '../hooks/useTranslation';
import { createGroup } from '../services/socialApi';
import { getApiErrorMessage } from '../utils/apiError';
import { useAuth } from '../context/AuthContext';
import { useStream } from '../context/StreamProvider';
import { navigateToGroupChat } from '../services/groupChatService';

const PRIVACY_OPTIONS = [
  {
    id: 'public',
    label: 'Public',
    icon: 'globe-outline',
    desc: 'Anyone can discover, view listings, and join freely',
    color: '#10B981',
  },
  {
    id: 'private',
    label: 'Private',
    icon: 'lock-closed-outline',
    desc: 'Visible in search, but members require admin approval',
    color: '#F59E0B',
  },
  {
    id: 'secret',
    label: 'Secret',
    icon: 'eye-off-outline',
    desc: 'Hidden from search, strictly invite-only for VIP partners',
    color: '#8B5CF6',
  },
];

const CreateGroupScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { reconnect } = useStream();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState('public');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert(t('common.error'), t('groups.nameRequired'));
      return;
    }

    setLoading(true);
    try {
      const response = await createGroup({
        name: name.trim(),
        description: description.trim(),
        privacy,
      });
      const group = response.data.group;
      Alert.alert(t('common.success'), t('groups.createdSuccess'));
      await navigateToGroupChat({
        navigation,
        user,
        reconnect,
        groupId: group._id,
        groupName: group.name,
        memberIds: [user._id],
        isGroupOwner: true,
        t,
      });
    } catch (error) {
      Alert.alert(t('common.error'), getApiErrorMessage(error, t('groups.createFailed')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0E" />

      {/* Top Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('groups.createGroup')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.introCard}>
          <Ionicons name="people" size={24} color="#D4AF37" />
          <View style={styles.introTextCol}>
            <Text style={styles.introTitle}>Launch Your Community</Text>
            <Text style={styles.introDesc}>
              Connect with real estate buyers, investors, or regional agents in a dedicated collaborative hub.
            </Text>
          </View>
        </View>

        {/* Input Card */}
        <View style={styles.formCard}>
          <Text style={styles.fieldLabel}>{t('groups.groupName')} *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder={t('groups.namePlaceholder')}
            placeholderTextColor="#666675"
            maxLength={60}
          />

          <Text style={styles.fieldLabel}>{t('groups.description')}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="What is this group about? (e.g. Islamabad Commercial Deals, Lahore Plots)"
            placeholderTextColor="#666675"
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Privacy Selector Cards */}
        <Text style={styles.sectionHeading}>{t('groups.privacyLabel')}</Text>
        <View style={styles.privacyCardList}>
          {PRIVACY_OPTIONS.map((option) => {
            const isSelected = privacy === option.id;
            return (
              <TouchableOpacity
                key={option.id}
                style={[styles.privacyCard, isSelected && styles.privacyCardActive]}
                onPress={() => setPrivacy(option.id)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.privacyIconWrap,
                    { backgroundColor: isSelected ? 'rgba(212, 175, 55, 0.2)' : '#1B1B24' },
                  ]}
                >
                  <Ionicons
                    name={option.icon}
                    size={20}
                    color={isSelected ? '#D4AF37' : option.color}
                  />
                </View>

                <View style={styles.privacyTextCol}>
                  <Text style={[styles.privacyTitle, isSelected && styles.privacyTitleActive]}>
                    {t(`groups.privacy.${option.id}`) || option.label}
                  </Text>
                  <Text style={styles.privacySub}>{option.desc}</Text>
                </View>

                <View
                  style={[
                    styles.radioCircle,
                    isSelected && styles.radioCircleActive,
                  ]}
                >
                  {isSelected ? <View style={styles.radioInner} /> : null}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, (!name.trim() || loading) && styles.submitButtonDisabled]}
          onPress={handleCreate}
          disabled={loading || !name.trim()}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#0A0A0E" />
          ) : (
            <>
              <Ionicons name="sparkles" size={18} color="#0A0A0E" />
              <Text style={styles.submitButtonText}>{t('groups.createGroup')}</Text>
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
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A22',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#161620',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#262634',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 60,
  },
  introCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141419',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#22222E',
    gap: 12,
  },
  introTextCol: {
    flex: 1,
  },
  introTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  introDesc: {
    fontSize: 12,
    color: '#8A8A96',
    marginTop: 2,
    lineHeight: 16,
  },
  formCard: {
    backgroundColor: '#141419',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#22222E',
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#D4AF37',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#0E0E14',
    borderWidth: 1,
    borderColor: '#262634',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 14,
  },
  textArea: {
    minHeight: 85,
    textAlignVertical: 'top',
    marginBottom: 0,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 10,
    marginLeft: 4,
  },
  privacyCardList: {
    marginBottom: 24,
    gap: 10,
  },
  privacyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141419',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#22222E',
    padding: 14,
  },
  privacyCardActive: {
    borderColor: '#D4AF37',
    backgroundColor: '#171720',
  },
  privacyIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  privacyTextCol: {
    flex: 1,
    marginRight: 8,
  },
  privacyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  privacyTitleActive: {
    color: '#D4AF37',
  },
  privacySub: {
    fontSize: 11.5,
    color: '#8A8A96',
    marginTop: 2,
    lineHeight: 16,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#404050',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleActive: {
    borderColor: '#D4AF37',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#D4AF37',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D4AF37',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#0A0A0E',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default CreateGroupScreen;
