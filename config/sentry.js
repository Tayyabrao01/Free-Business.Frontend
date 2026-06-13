/** Set your Sentry DSN for production crash reporting */
export const SENTRY_DSN = '';

export const isSentryEnabled = () => !__DEV__ && Boolean(SENTRY_DSN);
