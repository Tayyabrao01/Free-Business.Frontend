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
} from 'react-native';
import { useTranslation } from '../hooks/useTranslation';
import { createGroup } from '../services/socialApi';
import { getApiErrorMessage } from '../utils/apiError';
import { useAuth } from '../context/AuthContext';
import { useStream } from '../context/StreamProvider';
import { navigateToGroupChat } from '../services/groupChatService';

const PRIVACY_OPTIONS = ['public', 'private', 'secret'];

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
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>{t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('groups.createGroup')}</Text>
      </View>

      <Text style={styles.label}>{t('groups.groupName')}</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder={t('groups.namePlaceholder')}
        placeholderTextColor="#666"
      />

      <Text style={styles.label}>{t('groups.description')}</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={description}
        onChangeText={setDescription}
        placeholder={t('groups.descriptionPlaceholder')}
        placeholderTextColor="#666"
        multiline
        numberOfLines={4}
      />

      <Text style={styles.label}>{t('groups.privacyLabel')}</Text>
      <View style={styles.privacyRow}>
        {PRIVACY_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option}
            style={[styles.privacyBtn, privacy === option && styles.privacyBtnActive]}
            onPress={() => setPrivacy(option)}
          >
            <Text style={[styles.privacyBtnText, privacy === option && styles.privacyBtnTextActive]}>
              {t(`groups.privacy.${option}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.createBtn} onPress={handleCreate} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#000000" />
        ) : (
          <Text style={styles.createBtnText}>{t('groups.createGroup')}</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000', padding: 20 },
  header: { paddingTop: 40, marginBottom: 24 },
  back: { color: '#D4AF37', marginBottom: 12 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#D4AF37' },
  label: { fontSize: 16, fontWeight: '600', color: '#D4AF37', marginBottom: 8, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#D4AF37',
    borderRadius: 8,
    padding: 12,
    color: '#D4AF37',
    backgroundColor: '#1a1a1a',
    fontSize: 16,
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  privacyRow: { flexDirection: 'row', marginTop: 8, marginBottom: 20 },
  privacyBtn: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#D4AF37',
    alignItems: 'center',
    marginHorizontal: 4,
    borderRadius: 8,
  },
  privacyBtnActive: { backgroundColor: '#D4AF37' },
  privacyBtnText: { color: '#D4AF37', fontSize: 12, fontWeight: '600' },
  privacyBtnTextActive: { color: '#000000' },
  createBtn: {
    backgroundColor: '#D4AF37',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 40,
  },
  createBtnText: { color: '#000000', fontSize: 18, fontWeight: 'bold' },
});

export default CreateGroupScreen;
