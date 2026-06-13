import axios from 'axios';

export const isAbortError = (error) =>
  axios.isCancel(error) ||
  error?.code === 'ERR_CANCELED' ||
  error?.name === 'CanceledError' ||
  error?.message === 'canceled';

export const createAbortController = () => new AbortController();
