import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from '../hooks/useTranslation';
import { listJobs } from '../services/jobsApi';
import { resolveMediaUrl } from '../utils/imageUrl';

const JobsScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [jobType, setJobType] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await listJobs({ search, category, jobType, location });
      setJobs(response.data?.jobs || []);
    } catch (error) {
      Alert.alert(t('common.error'), t('jobs.loadFailed'));
    } finally { setLoading(false); }
  }, [search, category, jobType, location, t]);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  const render = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('JobDetail', { job: item })} activeOpacity={0.88}>
      {item.images?.[0] ? <Image source={{ uri: resolveMediaUrl(item.images[0]) }} style={styles.image} /> : <View style={styles.placeholder}><Ionicons name="briefcase-outline" size={40} color="#3B3B48" /></View>}
      <View style={styles.body}><Text style={styles.title} numberOfLines={2}>{item.title}</Text><Text style={styles.company}>{item.companyName}</Text><View style={styles.meta}><Ionicons name="location-outline" size={14} color="#D4AF37" /><Text style={styles.metaText}>{item.location}</Text></View><View style={styles.footer}><Text style={styles.type}>{t(`jobs.types.${item.jobType}`)}</Text><Text style={styles.salary}>{item.salaryRange || t('jobs.salaryNotSpecified')}</Text></View></View>
    </TouchableOpacity>
  );
  return <View style={styles.container}><View style={styles.header}><Text style={styles.heading}>{t('jobs.browseJobs')}</Text><TouchableOpacity onPress={() => navigation.navigate('MyJobs')}><Text style={styles.myJobs}>{t('jobs.myJobs')}</Text></TouchableOpacity></View><TextInput value={search} onChangeText={setSearch} onSubmitEditing={load} placeholder={t('jobs.searchPlaceholder')} placeholderTextColor="#666675" style={styles.search} /><View style={styles.filters}><TextInput value={category} onChangeText={setCategory} onSubmitEditing={load} placeholder={t('jobs.category')} placeholderTextColor="#666675" style={styles.filter} /><TextInput value={jobType} onChangeText={setJobType} onSubmitEditing={load} placeholder={t('jobs.jobType')} placeholderTextColor="#666675" style={styles.filter} /><TextInput value={location} onChangeText={setLocation} onSubmitEditing={load} placeholder={t('jobs.location')} placeholderTextColor="#666675" style={styles.filter} /></View>{loading ? <ActivityIndicator color="#D4AF37" style={styles.loader} /> : <FlatList data={jobs} renderItem={render} keyExtractor={item => item._id} contentContainerStyle={styles.list} ListEmptyComponent={<Text style={styles.empty}>{t('jobs.none')}</Text>} />}</View>;
};
const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#0A0A0E' }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 }, heading: { color: '#FFF', fontSize: 22, fontWeight: '800' }, myJobs: { color: '#D4AF37', fontWeight: '700' }, search: { marginHorizontal: 16, backgroundColor: '#141419', borderRadius: 10, padding: 12, color: '#FFF', borderWidth: 1, borderColor: '#292936' }, filters: { flexDirection: 'row', gap: 7, padding: 16 }, filter: { flex: 1, minWidth: 0, backgroundColor: '#141419', borderRadius: 8, padding: 9, color: '#FFF', borderWidth: 1, borderColor: '#292936', fontSize: 11 }, list: { padding: 16, paddingTop: 0 }, card: { backgroundColor: '#141419', borderRadius: 14, marginBottom: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#242432' }, image: { width: '100%', height: 150 }, placeholder: { height: 150, alignItems: 'center', justifyContent: 'center', backgroundColor: '#101016' }, body: { padding: 14 }, title: { color: '#FFF', fontSize: 17, fontWeight: '800' }, company: { color: '#D4AF37', marginTop: 4, fontWeight: '700' }, meta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 9 }, metaText: { color: '#B0B0BB', fontSize: 12 }, footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }, type: { color: '#10B981', fontSize: 12, fontWeight: '700' }, salary: { color: '#FFF', fontSize: 12 }, loader: { marginTop: 30 }, empty: { color: '#8A8A96', textAlign: 'center', marginTop: 40 } });
export default JobsScreen;
