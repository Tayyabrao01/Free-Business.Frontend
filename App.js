import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import * as Sentry from '@sentry/react-native';
import { AuthProvider } from './context/AuthContext';
import { StreamProvider } from './context/StreamProvider';
import { LanguageProvider } from './hooks/useTranslation';
import AppNavigator from './navigation/AppNavigator';
import StreamVideoShell from './components/StreamVideoShell';
import NotificationSetup from './components/NotificationSetup';
import ErrorBoundary from './components/ErrorBoundary';
import { SENTRY_DSN, isSentryEnabled } from './config/sentry';

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
  }, []);

  return (
    <ErrorBoundary>
      <LanguageProvider>
        <AuthProvider>
          <StreamProvider>
            <NavigationContainer>
              <AppNavigator />
              <StreamVideoShell />
              <NotificationSetup />
            </NavigationContainer>
          </StreamProvider>
        </AuthProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
};

export default isSentryEnabled() ? Sentry.wrap(App) : App;
