import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as Sentry from '@sentry/react-native';
import codePush from 'react-native-code-push';
import { AuthProvider } from './context/AuthContext';
import { StreamProvider } from './context/StreamProvider';
import { LanguageProvider } from './hooks/useTranslation';
import AppNavigator from './navigation/AppNavigator';
import StreamVideoShell from './components/StreamVideoShell';
import NotificationSetup from './components/NotificationSetup';
import ErrorBoundary from './components/ErrorBoundary';
import { SENTRY_DSN, isSentryEnabled } from './config/sentry';
import { navigationRef } from './navigation/navigationRef';
import { ensureNotificationsReady } from './services/NotificationService';

if (isSentryEnabled()) {
  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: 0.2,
    enableAutoSessionTracking: true,
  });
}

/**
 * App entry: LanguageProvider → AuthProvider → Navigation.
 * For logged-out users, AppNavigator checks OnboardingService and shows
 * RewardAnnouncementScreen once before Login/Register.
 */
const App = () => {
  useEffect(() => {
    if (isSentryEnabled()) {
      Sentry.setTag('environment', 'production');
    }
    ensureNotificationsReady().catch(() => {});
  }, []);

  return (
    <ErrorBoundary>
      <LanguageProvider>
        <AuthProvider>
          <StreamProvider>
            <SafeAreaProvider>
              <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
                <NavigationContainer ref={navigationRef}>
                  <StreamVideoShell>
                    <AppNavigator />
                  </StreamVideoShell>
                  <NotificationSetup />
                </NavigationContainer>
              </SafeAreaView>
            </SafeAreaProvider>
          </StreamProvider>
        </AuthProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
};

const codePushOptions = {
  checkFrequency: codePush.CheckFrequency.ON_APP_RESUME,
  installMode: codePush.InstallMode.ON_NEXT_RESTART,
  mandatoryInstallMode: codePush.InstallMode.IMMEDIATE,
};

const RootApp = isSentryEnabled() ? Sentry.wrap(App) : App;

export default codePush(codePushOptions)(RootApp);
