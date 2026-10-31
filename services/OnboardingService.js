import AsyncStorage from '@react-native-async-storage/async-storage';

const REWARD_SCREEN_SEEN_KEY = '@freebusiness_reward_screen_seen';
const HAS_REGISTERED_KEY = '@freebusiness_has_registered';

export const checkIfRewardScreenSeen = async () => {
  try {
    const value = await AsyncStorage.getItem(REWARD_SCREEN_SEEN_KEY);
    return value === 'true';
  } catch (error) {
    console.error('Failed to read reward screen status:', error);
    return false;
  }
};

export const markRewardScreenSeen = async () => {
  try {
    await AsyncStorage.setItem(REWARD_SCREEN_SEEN_KEY, 'true');
    return true;
  } catch (error) {
    console.error('Failed to save reward screen status:', error);
    return false;
  }
};

export const checkIfHasRegistered = async () => {
  try {
    const value = await AsyncStorage.getItem(HAS_REGISTERED_KEY);
    return value === 'true';
  } catch (error) {
    console.error('Failed to read registration status:', error);
    return false;
  }
};

export const markHasRegistered = async () => {
  try {
    await AsyncStorage.setItem(HAS_REGISTERED_KEY, 'true');
    return true;
  } catch (error) {
    console.error('Failed to save registration status:', error);
    return false;
  }
};

export default {
  checkIfRewardScreenSeen,
  markRewardScreenSeen,
  checkIfHasRegistered,
  markHasRegistered,
};
