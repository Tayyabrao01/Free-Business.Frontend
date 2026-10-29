import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export const navigate = (name, params) => {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  }
};

export const getRootState = () => {
  if (!navigationRef.isReady()) {
    return null;
  }
  return navigationRef.getRootState();
};
