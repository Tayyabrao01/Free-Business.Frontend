import React, { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';
import { useTranslation } from '../hooks/useTranslation';
import { uploadImageAsset } from '../services/uploadImageService';
import { createJob, updateJob } from '../services/jobsApi';
import { getApiErrorMessage } from '../utils/apiError';
import { resolveMediaUrl } from '../utils/imageUrl';

const TYPES = ['full-time', 'part-time', 'contract', 'remote'];
const PostJobScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const existing = route.params?.job;
  const [form, setForm] = useState({
    title: '', companyName: '', category: '', jobType: 'full-time', location: '',
    salaryRange: '', description: '', requirements: '', contactPreference: '',
  });
  const [images, setImages] = useState([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (existing) {
      setForm({ ...form, ...existing });
      setImages(existing.images || []);
    }
  }, [existing]);

  const setField = (key, value) => setForm(current => ({ ...current, [key]: value }));
  const pickImages = () => launchImageLibrary({ mediaType: 'photo', selectionLimit: 5 }, async response => {
    if (response.didCancel) return;
    if (response.errorCode) {
      Alert.alert(t('common.error'), response.errorMessage || t('jobs.uploadFailed'));
      return;
    }
    setUploading(true);
    try {
      const urls = [];
      for (const asset of (response.assets || []).slice(0, 5 - images.length)) {
        const uploaded = await uploadImageAsset(asset);
        urls.push(uploaded.url);
      }
      setImages(current => [...current, ...urls].slice(0, 5));
    } catch (error) {
      Alert.alert(t('common.error'), getApiErrorMessage(error, t('jobs.uploadFailed')));
    } finally {
      setUploading(false);
    }
  });
  const submit = async () => {
    const required = ['title', 'companyName', 'category', 'location', 'description', 'requirements', 'contactPreference'];
    if (required.some(key => !String(form[key] || '').trim())) {
      Alert.alert(t('common.error'), t('jobs.requiredFields'));
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, images };
      if (existing?._id) await updateJob(existing._id, payload);
      else await createJob(payload);
      Alert.alert(t('common.success'), existing ? t('jobs.updated') : t('jobs.created'));
      navigation.goBack();
    } catch (error) {
      Alert.alert(t('common.error'), getApiErrorMessage(error, t('jobs.saveFailed')));
    } finally {
      setSaving(false);
    }
  };
  const input = (key, label, multiline = false) => (
    <View style={styles.group} key={key}>
      <Text style={styles.label}>{label} *</Text>
      <TextInput value={form[key]} onChangeText={value => setField(key, value)} style={[styles.input, multiline && styles.textArea]} multiline={multiline} placeholderTextColor="#666675" />
    </View>
  );
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.header}><Ionicons name="briefcase-outline" size={22} color="#D4AF37" /><Text style={styles.title}>{existing ? t('jobs.editJob') : t('jobs.postJob')}</Text></View>
      {input('title', t('jobs.title'))}
      {input('companyName', t('jobs.company'))}
      {input('category', t('jobs.category'))}
      <Text style={styles.label}>{t('jobs.jobType')} *</Text>
      <View style={styles.chips}>{TYPES.map(type => <TouchableOpacity key={type} onPress={() => setField('jobType', type)} style={[styles.chip, form.jobType === type && styles.chipActive]}><Text style={styles.chipText}>{t(`jobs.types.${type}`)}</Text></TouchableOpacity>)}</View>
      {input('location', t('jobs.location'))}
      <View style={styles.group}><Text style={styles.label}>{t('jobs.salary')}</Text><TextInput value={form.salaryRange} onChangeText={value => setField('salaryRange', value)} style={styles.input} placeholderTextColor="#666675" /></View>
      {input('description', t('jobs.description'), true)}
      {input('requirements', t('jobs.requirements'), true)}
      {input('contactPreference', t('jobs.contactPreference'))}
      <Text style={styles.label}>{t('jobs.images')}</Text>
      <TouchableOpacity style={styles.upload} onPress={pickImages} disabled={uploading}>{uploading ? <ActivityIndicator color="#000" /> : <Text style={styles.uploadText}>{t('jobs.addImages')}</Text>}</TouchableOpacity>
      <View style={styles.imageRow}>{images.map((uri, index) => <Image key={`${uri}-${index}`} source={{ uri: resolveMediaUrl(uri) }} style={styles.thumb} />)}</View>
      <TouchableOpacity style={styles.submit} onPress={submit} disabled={saving}><Text style={styles.submitText}>{saving ? t('jobs.saving') : t('jobs.save')}</Text></TouchableOpacity>
    </ScrollView>
  );
};
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0E' }, content: { padding: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 }, title: { color: '#FFF', fontSize: 22, fontWeight: '800' },
  group: { marginBottom: 13 }, label: { color: '#D4AF37', fontSize: 12, fontWeight: '700', marginBottom: 6 },
  input: { backgroundColor: '#141419', borderWidth: 1, borderColor: '#292936', borderRadius: 10, color: '#FFF', padding: 12 }, textArea: { minHeight: 100, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }, chip: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, backgroundColor: '#161620', borderWidth: 1, borderColor: '#292936' }, chipActive: { backgroundColor: '#D4AF37', borderColor: '#D4AF37' }, chipText: { color: '#FFF', fontSize: 12 },
  upload: { backgroundColor: '#D4AF37', borderRadius: 9, padding: 13, alignItems: 'center' }, uploadText: { color: '#0A0A0E', fontWeight: '700' }, imageRow: { flexDirection: 'row', gap: 8, marginVertical: 12 }, thumb: { width: 62, height: 62, borderRadius: 8 }, submit: { backgroundColor: '#D4AF37', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 12 }, submitText: { color: '#0A0A0E', fontWeight: '800' },
});
export default PostJobScreen;
