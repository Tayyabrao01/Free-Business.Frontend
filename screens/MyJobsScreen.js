import React, { useCallback, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from '../hooks/useTranslation';
import { deleteJob, listJobs } from '../services/jobsApi';

const MyJobsScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [jobs, setJobs] = useState([]);
  const load = useCallback(async () => { try { const response = await listJobs({ status: 'all', mine: true }); setJobs(response.data?.jobs || []); } catch (error) { Alert.alert(t('common.error'), t('jobs.loadFailed')); } }, [t]);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  return <View style={styles.container}><View style={styles.header}><Text style={styles.heading}>{t('jobs.myJobs')}</Text><TouchableOpacity onPress={() => navigation.navigate('PostJob')}><Text style={styles.add}>{t('jobs.postJob')}</Text></TouchableOpacity></View><FlatList data={jobs} keyExtractor={item => item._id} contentContainerStyle={styles.list} renderItem={({ item }) => <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('JobDetail', { job: item })}><Text style={styles.title}>{item.title}</Text><Text style={styles.company}>{item.companyName} • {item.location}</Text><Text style={[styles.status, item.status === 'closed' && styles.closed]}>{item.status === 'closed' ? t('jobs.closed') : t('jobs.open')}</Text><TouchableOpacity onPress={() => Alert.alert(t('jobs.deleteTitle'), t('jobs.deleteConfirm'), [{ text: t('common.cancel') }, { text: t('common.delete'), onPress: async () => { await deleteJob(item._id); load(); } }])}><Text style={styles.delete}>{t('common.delete')}</Text></TouchableOpacity></TouchableOpacity>} ListEmptyComponent={<Text style={styles.empty}>{t('jobs.noneMine')}</Text>} /></View>;
};
const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#0A0A0E' }, header: { padding: 16, flexDirection: 'row', justifyContent: 'space-between' }, heading: { color: '#FFF', fontSize: 22, fontWeight: '800' }, add: { color: '#D4AF37', fontWeight: '700' }, list: { padding: 16 }, card: { backgroundColor: '#141419', borderColor: '#242432', borderWidth: 1, borderRadius: 12, padding: 15, marginBottom: 12 }, title: { color: '#FFF', fontSize: 17, fontWeight: '800' }, company: { color: '#B0B0BB', marginTop: 5 }, status: { color: '#10B981', marginTop: 10, fontWeight: '700' }, closed: { color: '#FF6B6B' }, delete: { color: '#FF6B6B', marginTop: 10 }, empty: { color: '#8A8A96', textAlign: 'center', marginTop: 40 } });
export default MyJobsScreen;
