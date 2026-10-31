import React, { useEffect, useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../hooks/useTranslation';
import { getTabIconName } from './tabIcons';

// Auth Screens
import RewardAnnouncementScreen from '../screens/RewardAnnouncementScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import { checkIfHasRegistered } from '../services/OnboardingService';

// Main tab screens
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PropertiesScreen from '../screens/PropertiesScreen';
import PostsScreen from '../screens/PostsScreen';
import GroupsScreen from '../screens/GroupsScreen';
import RewardsScreen from '../screens/RewardsScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import CallLogsScreen from '../screens/CallLogsScreen';
import MoreTabScreen from '../screens/MoreTabScreen';

// Stack screens (modals / detail flows)
import EditProfileScreen from '../screens/EditProfileScreen';
import PropertyDetailScreen from '../screens/PropertyDetailScreen';
import AddPropertyScreen from '../screens/AddPropertyScreen';
import AddPostScreen from '../screens/AddPostScreen';
import StreamMessagesScreen from '../screens/stream/StreamMessagesScreen';
import StreamChatScreen from '../screens/stream/StreamChatScreen';
import StreamCallScreen from '../screens/stream/StreamCallScreen';
import CallErrorBoundary from '../components/CallErrorBoundary';
import RewardHistoryScreen from '../screens/RewardHistoryScreen';
import ReferralScreen from '../screens/ReferralScreen';
import UserSearchScreen from '../screens/UserSearchScreen';
import FollowersScreen from '../screens/FollowersScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import CreateGroupScreen from '../screens/CreateGroupScreen';
import GroupDetailScreen from '../screens/GroupDetailScreen';
import MoreScreen from '../screens/MoreScreen';
import PlotInformationScreen from '../screens/PlotInformationScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import DeleteAccountScreen from '../screens/DeleteAccountScreen';

const SafeStreamCallScreen = (props) => (
  <CallErrorBoundary navigation={props.navigation}>
    <StreamCallScreen {...props} />
  </CallErrorBoundary>
);

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const stackScreenOptions = {
  headerShown: false,
  cardStyle: { backgroundColor: '#000000' },
};

const headerScreenOptions = {
  headerShown: true,
  headerStyle: {
    backgroundColor: '#000000',
    borderBottomWidth: 1,
    borderBottomColor: '#D4AF37',
  },
  headerTintColor: '#D4AF37',
  headerTitleStyle: { fontWeight: '700' },
  cardStyle: { backgroundColor: '#000000' },
};

function MainTabs() {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, focused }) => (
          <Ionicons
            name={getTabIconName(route.name, focused)}
            size={22}
            color={color}
          />
        ),
        tabBarActiveTintColor: '#D4AF37',
        tabBarInactiveTintColor: '#666666',
        tabBarStyle: {
          backgroundColor: '#000000',
          borderTopColor: '#333333',
          height: 62,
          paddingBottom: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          paddingBottom: 2,
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: t('tabs.home') }} />
      <Tab.Screen name="Posts" component={PostsScreen} options={{ tabBarLabel: t('tabs.posts') }} />
      <Tab.Screen name="Groups" component={GroupsScreen} options={{ tabBarLabel: t('tabs.groups') }} />
      <Tab.Screen
        name="MessagesTab"
        component={StreamMessagesScreen}
        options={{ tabBarLabel: t('tabs.messages') }}
      />
      <Tab.Screen
        name="CallsTab"
        component={CallLogsScreen}
        options={{ tabBarLabel: t('tabs.calls') }}
      />
      <Tab.Screen name="MoreTab" component={MoreTabScreen} options={{ tabBarLabel: t('tabs.more') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: t('tabs.profile') }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();
  const [onboardingReady, setOnboardingReady] = useState(false);
  const [hasRegistered, setHasRegistered] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    let isMounted = true;

    const loadOnboardingStatus = async () => {
      if (user) {
        if (isMounted) {
          setOnboardingReady(true);
        }
        return;
      }

      const registered = await checkIfHasRegistered();
      if (isMounted) {
        setHasRegistered(registered);
        setOnboardingReady(true);
      }
    };

    if (!loading) {
      loadOnboardingStatus();
    }

    return () => {
      isMounted = false;
    };
  }, [user, loading]);

  if (loading || (!user && !onboardingReady)) {
    return null;
  }

  const authInitialRoute = hasRegistered ? 'Login' : 'Register';

  return (
    <Stack.Navigator
      screenOptions={stackScreenOptions}
      initialRouteName={!user ? authInitialRoute : 'MainTabs'}
    >
      {!user ? (
        hasRegistered ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen
              name="ForgotPassword"
              component={ForgotPasswordScreen}
              options={{ ...headerScreenOptions, title: 'Forgot password' }}
            />
            <Stack.Screen
              name="ResetPassword"
              component={ResetPasswordScreen}
              options={{ ...headerScreenOptions, title: 'Reset password' }}
            />
          </>
        ) : (
          <>
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen
              name="ForgotPassword"
              component={ForgotPasswordScreen}
              options={{ ...headerScreenOptions, title: 'Forgot password' }}
            />
            <Stack.Screen
              name="ResetPassword"
              component={ResetPasswordScreen}
              options={{ ...headerScreenOptions, title: 'Reset password' }}
            />
          </>
        )
      ) : (
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen
            name="Messages"
            component={StreamMessagesScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen name="More" component={MoreScreen} />
          <Stack.Screen
            name="Properties"
            component={PropertiesScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Rewards"
            component={RewardsScreen}
            options={{ ...headerScreenOptions, title: t('tabs.rewards') }}
          />
          <Stack.Screen
            name="Admin"
            component={AdminDashboardScreen}
            options={{ ...headerScreenOptions, title: t('tabs.admin') }}
          />
          <Stack.Screen name="PlotInformation" component={PlotInformationScreen} />
          <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
          <Stack.Screen
            name="DeleteAccount"
            component={DeleteAccountScreen}
            options={{ ...headerScreenOptions, title: t('legal.deleteAccountTitle') }}
          />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} />
          <Stack.Screen
            name="ChangePassword"
            component={ChangePasswordScreen}
            options={{ ...headerScreenOptions, title: 'Change password' }}
          />
          <Stack.Screen name="PropertyDetail" component={PropertyDetailScreen} />
          <Stack.Screen name="AddProperty" component={AddPropertyScreen} />
          <Stack.Screen name="AddPost" component={AddPostScreen} />
          <Stack.Screen name="RewardHistory" component={RewardHistoryScreen} />
          <Stack.Screen name="Referral" component={ReferralScreen} />
          <Stack.Screen name="UserSearch" component={UserSearchScreen} />
          <Stack.Screen name="Followers" component={FollowersScreen} />
          <Stack.Screen name="UserProfile" component={UserProfileScreen} />
          <Stack.Screen name="CreateGroup" component={CreateGroupScreen} />
          <Stack.Screen name="GroupDetail" component={GroupDetailScreen} />
          <Stack.Screen
            name="Chat"
            component={StreamChatScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="StreamCall"
            component={SafeStreamCallScreen}
            options={{ headerShown: false, presentation: 'fullScreenModal' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
