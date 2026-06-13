import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../hooks/useTranslation';

const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { t } = useTranslation();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>
          {t('home.welcome', { name: user?.name || t('common.user') })}
        </Text>
        <Text style={styles.subtitle}>{t('home.subtitle')}</Text>
      </View>

      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>{t('home.quickActions')}</Text>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('Properties')}
        >
          <Text style={styles.actionTitle}>{t('home.browseProperties')}</Text>
          <Text style={styles.actionSubtitle}>{t('home.browsePropertiesDesc')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('AddProperty')}
        >
          <Text style={styles.actionTitle}>{t('home.addProperty')}</Text>
          <Text style={styles.actionSubtitle}>{t('home.addPropertyDesc')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('AddPost')}
        >
          <Text style={styles.actionTitle}>{t('home.createPost')}</Text>
          <Text style={styles.actionSubtitle}>{t('home.createPostDesc')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('Messages')}
        >
          <Text style={styles.actionTitle}>{t('home.messages')}</Text>
          <Text style={styles.actionSubtitle}>{t('home.messagesDesc')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('MainTabs', { screen: 'Groups' })}
        >
          <Text style={styles.actionTitle}>{t('home.groups')}</Text>
          <Text style={styles.actionSubtitle}>{t('home.groupsDesc')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('MainTabs', { screen: 'CallsTab' })}
        >
          <Text style={styles.actionTitle}>{t('calls.title')}</Text>
          <Text style={styles.actionSubtitle}>{t('calls.subtitle')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('MainTabs', { screen: 'MoreTab' })}
        >
          <Text style={styles.actionTitle}>{t('home.more')}</Text>
          <Text style={styles.actionSubtitle}>{t('home.moreDesc')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    backgroundColor: '#D4AF37',
    padding: 30,
    paddingTop: 50,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
  },
  subtitle: {
    fontSize: 16,
    color: '#1a1a1a',
    marginTop: 10,
  },
  statsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#D4AF37',
  },
  moreSectionTitle: {
    marginTop: 10,
  },
  actionCard: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#D4AF37',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D4AF37',
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 5,
  },
});

export default HomeScreen;
