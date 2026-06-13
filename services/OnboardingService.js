import AsyncStorage from '@react-native-async-storage/async-storage';

const REWARD_SCREEN_SEEN_KEY = '@freebusiness_reward_screen_seen';

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

export default {
  checkIfRewardScreenSeen,
  markRewardScreenSeen,
};
