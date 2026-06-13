import { BASE_URL } from '../services/api';

export const resolveMediaUrl = (path) => {
  if (!path) {
    return null;
  }
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const origin = BASE_URL.replace('/api', '');
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
};

export default resolveMediaUrl;
